import {randomUUID} from "node:crypto";
import type {Sql} from "postgres";
import {AuditService} from "./audit";
import {CustomerCommitmentService,type Actor} from "./customer-commitment";

const stages=["recorded","classified","assigned","corrective_action","follow_up","resolved","closed"] as const;
type Stage=typeof stages[number];
export const isComplaintOperationallyOpen=(complaint:{status:string})=>complaint.status!=="closed";

export class ComplaintLifecycleService {
 constructor(private readonly sql:Sql,private readonly audit:AuditService,private readonly commitments:CustomerCommitmentService){}
 private deny(message:string,statusCode=422):never{throw Object.assign(new Error(message),{statusCode});}
 private async complaint(actor:Actor,id:string,write=false) {
  const complaint=(await this.sql<any[]>`SELECT c.*,customer.name AS "customerName",customer.owner_employee_id AS "ownerId",customer.owner_team_id AS "ownerTeamId" FROM complaints c JOIN customers customer ON customer.id=c.customer_id WHERE c.id=${id} AND c.organization_id=${actor.organizationId}`)[0];
  const readable=!!complaint&&(actor.role==="sales_manager"||(actor.role==="telesales_supervisor"&&actor.teamId!==null&&actor.teamId===complaint.ownerTeamId)||actor.id===complaint.ownerId);
  if(!readable)this.deny("Complaint is not accessible.",404);
  if(write&&(actor.role!=="sales_representative"||complaint.ownerId!==actor.id))this.deny("Representative role required.",403);
  return complaint;
 }
 async detail(actor:Actor,id:string) {
  const complaint=await this.complaint(actor,id);
  const history=await this.sql<any[]>`SELECT e.id,e.from_status AS "from",e.to_status AS "to",e.responsible_party AS "responsibleParty",e.evidence,e.follow_up_at AS "followUpAt",e.actor_employee_id AS "actorEmployeeId",employee.display_name AS "actorName",e.created_at AS "at" FROM complaint_lifecycle_events e JOIN employees employee ON employee.id=e.actor_employee_id WHERE e.complaint_id=${id} ORDER BY e.created_at,e.id`;
  const resultingWork=await this.sql<any[]>`SELECT id,title,status,due_at AS "dueAt",owner_employee_id AS "ownerEmployeeId",source_evidence AS "sourceEvidence",created_at AS "createdAt" FROM commitments WHERE organization_id=${actor.organizationId} AND source_type='complaint' AND source_id=${id} ORDER BY created_at,id`;
  const latest=history.at(-1)??null;
  return {complaint:{id:complaint.id,customer:{id:complaint.customer_id,name:complaint.customerName},classification:complaint.classification,status:complaint.status,operationallyOpen:isComplaintOperationallyOpen(complaint),responsibleParty:complaint.responsible_party,requiredAction:complaint.required_action,correctiveAction:complaint.corrective_action,followUpAt:complaint.follow_up_at,latestEvidence:latest?.evidence??null,version:complaint.version,resolution:complaint.resolved_at?{evidence:complaint.resolution_evidence,responsibleParty:complaint.responsible_party,at:complaint.resolved_at}:null,closure:complaint.closed_at?{evidence:complaint.closure_evidence,responsibleParty:complaint.responsible_party,at:complaint.closed_at,actorEmployeeId:complaint.closed_by_employee_id}:null},history,resultingWork};
 }
 private expectedNext(status:string):Stage {const index=stages.indexOf(status as Stage);if(index<0||index>=stages.length-1)this.deny("Invalid complaint lifecycle transition.");return stages[index+1];}
 async transition(actor:Actor,id:string,input:{to:Stage;evidence:string;classification?:string;responsibleParty?:string;correctiveAction?:string;followUpAt?:string;followUpTitle?:string;createFollowUp?:boolean;followUpIdempotencyKey?:string;version:number},correlationId:string) {
  const complaint=await this.complaint(actor,id,true);
  if(input.to!==this.expectedNext(complaint.status)||!input.evidence)this.deny("Invalid complaint lifecycle transition.");
  if(input.to==="classified"&&!input.classification)this.deny("Classification is required.");
  if(input.to==="assigned"&&!input.responsibleParty)this.deny("A responsible party is required.");
  if(input.to==="corrective_action"&&!input.correctiveAction)this.deny("Corrective action is required.");
  if(input.to==="follow_up"&&(!input.createFollowUp||!input.followUpAt||!input.followUpTitle))this.deny("Follow-up work, title, and due point are required.");
  if((input.to==="resolved"||input.to==="closed")&&!input.responsibleParty)this.deny("A responsible party is required.");
  return this.sql.begin(async tx=>{
   const responsible=input.responsibleParty??complaint.responsible_party;
   const updated=(await tx<any[]>`UPDATE complaints SET status=${input.to},classification=${input.to==="classified"?input.classification:complaint.classification},responsible_party=${responsible},corrective_action=${input.to==="corrective_action"?input.correctiveAction:complaint.corrective_action},follow_up_at=${input.to==="follow_up"?new Date(input.followUpAt!):complaint.follow_up_at},resolution_evidence=${input.to==="resolved"?input.evidence:complaint.resolution_evidence},resolved_at=${input.to==="resolved"?new Date():complaint.resolved_at},closure_evidence=${input.to==="closed"?input.evidence:complaint.closure_evidence},closed_at=${input.to==="closed"?new Date():complaint.closed_at},closed_by_employee_id=${input.to==="closed"?actor.id:complaint.closed_by_employee_id},version=version+1,updated_at=now() WHERE id=${id} AND version=${input.version} RETURNING id,version`)[0];
   if(!updated)this.deny("Complaint was updated by another user.",409);
   await tx`INSERT INTO complaint_lifecycle_events(id,complaint_id,organization_id,actor_employee_id,from_status,to_status,responsible_party,evidence,follow_up_at) VALUES(${randomUUID()},${id},${actor.organizationId},${actor.id},${complaint.status},${input.to},${responsible},${input.evidence},${input.to==="follow_up"?new Date(input.followUpAt!):null})`;
   let commitmentId:string|null=null;
   if(input.to==="follow_up"){const commitment=await this.commitments.createCommitmentInTransaction(tx,actor,{customerId:complaint.customer_id,kind:"follow_up",title:input.followUpTitle!,dueAt:input.followUpAt!,sourceType:"complaint",sourceId:id,sourceEvidence:input.evidence,idempotencyKey:input.followUpIdempotencyKey??randomUUID()});commitmentId=commitment.id;if(!commitment.replayed)await this.audit.recordInTransaction(tx,{actorId:actor.id,action:"commitment.created",resourceType:"commitment",resourceId:commitmentId,before:null,after:{customerId:complaint.customer_id,sourceType:"complaint",sourceId:id},reason:null,correlationId});}
   await this.audit.recordInTransaction(tx,{actorId:actor.id,action:`complaint.${input.to}`,resourceType:"complaint",resourceId:id,before:{status:complaint.status},after:{status:input.to,commitmentId},reason:input.evidence,correlationId});
   return {id:updated.id,version:updated.version,commitmentId};
  });
 }
}
