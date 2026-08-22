import {randomUUID} from "node:crypto";
import type {Sql} from "postgres";
import {AuditService} from "./audit";
import {CustomerCommitmentService, type Actor} from "./customer-commitment";

const stages=["recorded","credit_review","approved","preparation","delivery_preparation","delivered","closed"] as const;
type Stage=typeof stages[number];
export const isOperationallyOpen=(order:{status:string})=>order.status!=="closed";

export class OrderLifecycleService {
 constructor(private readonly sql:Sql,private readonly audit:AuditService,private readonly commitments:CustomerCommitmentService){}
 private deny(message:string,statusCode=422):never { throw Object.assign(new Error(message),{statusCode}); }
 private async order(actor:Actor,id:string) {
  if(actor.role!=="sales_representative") this.deny("Representative role required.",403);
  const order=(await this.sql<any[]>`SELECT o.*,c.name AS "customerName",c.owner_employee_id AS "ownerId" FROM sales_orders o JOIN customers c ON c.id=o.customer_id WHERE o.id=${id} AND o.organization_id=${actor.organizationId}`)[0];
  if(!order||order.ownerId!==actor.id)this.deny("Order is not accessible.",404);
  return order;
 }
 async detail(actor:Actor,id:string) {
  const order=await this.order(actor,id);
  const history=await this.sql<any[]>`SELECT e.id,e.from_status AS "from",e.to_status AS "to",e.responsible_party AS "responsibleParty",e.evidence,e.follow_up_at AS "followUpAt",e.actor_employee_id AS "actorEmployeeId",employee.display_name AS "actorName",e.created_at AS "at" FROM order_lifecycle_events e JOIN employees employee ON employee.id=e.actor_employee_id WHERE e.order_id=${id} ORDER BY e.created_at,e.id`;
  const resultingWork=await this.sql<any[]>`SELECT id,title,status,due_at AS "dueAt",owner_employee_id AS "ownerEmployeeId",source_evidence AS "sourceEvidence",created_at AS "createdAt" FROM commitments WHERE organization_id=${actor.organizationId} AND source_type='order' AND source_id=${id} ORDER BY created_at,id`;
  const delivered=[...history].reverse().find((event)=>event.to==="delivered");
  const latest=history.at(-1)??null;
  return {order:{id:order.id,customer:{id:order.customer_id,name:order.customerName},status:order.status,requiresCreditReview:order.requires_credit_review,operationallyOpen:isOperationallyOpen(order),block:{active:!!order.blocked_reason,reason:order.blocked_reason,responsibleParty:order.blocked_reason?order.responsible_party:null,requiredNextAction:order.blocked_reason?order.required_next_action:null,followUpAt:order.blocked_reason?order.follow_up_at:null},responsibleParty:order.responsible_party,latestEvidence:latest?.evidence??null,version:order.version,delivered:delivered?{evidence:delivered.evidence,at:delivered.at,responsibleParty:delivered.responsibleParty,actorEmployeeId:delivered.actorEmployeeId}:null,closure:order.closed_at?{evidence:order.closure_evidence,responsibleParty:order.responsible_party,at:order.closed_at,actorEmployeeId:order.closed_by_employee_id}:null},history,resultingWork};
 }
 private expectedNext(order:any):Stage {
  if(order.status==="recorded")return order.requires_credit_review?"credit_review":"approved";
  const index=stages.indexOf(order.status as Stage);
  if(index<0||index>=stages.length-1)this.deny("Invalid order lifecycle transition.");
  return stages[index+1];
 }
 async transition(actor:Actor,id:string,input:{to:Stage;evidence:string;responsibleParty?:string;followUpAt?:string;version:number},correlationId:string) {
  const order=await this.order(actor,id);
  if(order.blocked_reason)this.deny("Clear the order block before advancing its lifecycle.",409);
  const expected=this.expectedNext(order);
  if(input.to!==expected||!input.evidence||(input.to==="closed"&&!input.responsibleParty))this.deny("Invalid order lifecycle transition.");
  await this.sql.begin(async tx=>{
   const updated=(await tx<any[]>`UPDATE sales_orders SET status=${input.to},responsible_party=${input.responsibleParty??order.responsible_party},follow_up_at=${input.followUpAt?new Date(input.followUpAt):order.follow_up_at},closure_evidence=${input.to==="closed"?input.evidence:order.closure_evidence},closed_at=${input.to==="closed"?new Date():order.closed_at},closed_by_employee_id=${input.to==="closed"?actor.id:order.closed_by_employee_id},version=version+1,updated_at=now() WHERE id=${id} AND version=${input.version} RETURNING id`)[0];
   if(!updated)this.deny("Order was updated by another user.",409);
   await tx`INSERT INTO order_lifecycle_events(id,order_id,organization_id,actor_employee_id,from_status,to_status,responsible_party,evidence,follow_up_at) VALUES(${randomUUID()},${id},${actor.organizationId},${actor.id},${order.status},${input.to},${input.responsibleParty??null},${input.evidence},${input.followUpAt?new Date(input.followUpAt):null})`;
   await this.audit.recordInTransaction(tx,{actorId:actor.id,action:"order.lifecycle_transition",resourceType:"order",resourceId:id,before:{status:order.status},after:{status:input.to},reason:input.evidence,correlationId});
  });
  return this.detail(actor,id);
 }
 async block(actor:Actor,id:string,input:{reason:string;responsibleParty:string;requiredNextAction:string;evidence:string;followUpAt?:string;createFollowUp?:boolean;followUpIdempotencyKey?:string;version:number},correlationId:string) {
  const order=await this.order(actor,id);
  if(order.status==="closed"||order.blocked_reason||!input.reason||!input.responsibleParty||!input.requiredNextAction||!input.evidence||(input.createFollowUp&&!input.followUpAt))this.deny("Invalid order blocking data.");
  return this.sql.begin(async tx=>{
   const updated=(await tx<any[]>`UPDATE sales_orders SET blocked_reason=${input.reason},responsible_party=${input.responsibleParty},required_next_action=${input.requiredNextAction},follow_up_at=${input.followUpAt?new Date(input.followUpAt):null},version=version+1,updated_at=now() WHERE id=${id} AND version=${input.version} RETURNING id,version`)[0];
   if(!updated)this.deny("Order was updated by another user.",409);
   await tx`INSERT INTO order_lifecycle_events(id,order_id,organization_id,actor_employee_id,from_status,to_status,responsible_party,evidence,follow_up_at) VALUES(${randomUUID()},${id},${actor.organizationId},${actor.id},${order.status},${order.status},${input.responsibleParty},${input.evidence},${input.followUpAt?new Date(input.followUpAt):null})`;
   let commitmentId:string|null=null;
   if(input.createFollowUp){const commitment=await this.commitments.createCommitmentInTransaction(tx,actor,{customerId:order.customer_id,kind:"follow_up",title:input.requiredNextAction,dueAt:input.followUpAt!,sourceType:"order",sourceId:id,sourceEvidence:input.evidence,idempotencyKey:input.followUpIdempotencyKey??randomUUID()});commitmentId=commitment.id;if(!commitment.replayed)await this.audit.recordInTransaction(tx,{actorId:actor.id,action:"commitment.created",resourceType:"commitment",resourceId:commitmentId,before:null,after:{customerId:order.customer_id,sourceType:"order",sourceId:id},reason:null,correlationId});}
   await this.audit.recordInTransaction(tx,{actorId:actor.id,action:"order.blocked",resourceType:"order",resourceId:id,before:{blocked:false,status:order.status},after:{blocked:true,status:order.status,commitmentId},reason:input.evidence,correlationId});
   return {id:updated.id,version:updated.version,commitmentId};
  });
 }
 async unblock(actor:Actor,id:string,input:{evidence:string;version:number},correlationId:string) {
  const order=await this.order(actor,id);
  if(!order.blocked_reason||!input.evidence)this.deny("Order is not blocked.");
  return this.sql.begin(async tx=>{
   const updated=(await tx<any[]>`UPDATE sales_orders SET blocked_reason=null,required_next_action=null,follow_up_at=null,version=version+1,updated_at=now() WHERE id=${id} AND version=${input.version} RETURNING id,version`)[0];
   if(!updated)this.deny("Order was updated by another user.",409);
   await tx`INSERT INTO order_lifecycle_events(id,order_id,organization_id,actor_employee_id,from_status,to_status,responsible_party,evidence,follow_up_at) VALUES(${randomUUID()},${id},${actor.organizationId},${actor.id},${order.status},${order.status},${order.responsible_party},${input.evidence},null)`;
   await this.audit.recordInTransaction(tx,{actorId:actor.id,action:"order.unblocked",resourceType:"order",resourceId:id,before:{blocked:true,status:order.status},after:{blocked:false,status:order.status},reason:input.evidence,correlationId});
   return {id:updated.id,version:updated.version};
  });
 }
}
