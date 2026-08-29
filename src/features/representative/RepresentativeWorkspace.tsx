import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyboardInput, KeyboardTextarea, useKeyboard } from "../../mobile";
import { captureOperational, completeVisit, createOrder, representativeActivity, representativeDay, representativeProducts, startVisit, type SessionIdentity } from "../../lib/api";
import { LedgerRow, NextActionHero, StatePanel, StatusLabel } from "../../design-system/foundation";
import { ActivityCalendar } from "../../design-system/ActivityCalendar";
import "./representative.css";

const egp=(value:number)=>new Intl.NumberFormat("ar-EG",{style:"currency",currency:"EGP",maximumFractionDigits:0}).format(Number(value)||0);
const visitLabel=(status:string)=>status==="planned"?"مخططة":status==="in_progress"?"قيد التنفيذ":"مكتملة";

export function RepresentativeWorkspace({session,activeTab}:{session:SessionIdentity;activeTab:"day"|"mine"|"activity"}) {
 const qc=useQueryClient();
 const keyboard=useKeyboard();
 const q=useQuery({queryKey:["rep-day"],queryFn:representativeDay});
 const activity=useQuery({queryKey:["rep-activity"],queryFn:representativeActivity,enabled:activeTab==="activity"});
 const [selected,setSelected]=useState<string|null>(null);
 const [outcome,setOutcome]=useState("");
 const [evidence,setEvidence]=useState("");
 const [followUpTitle,setFollowUpTitle]=useState("");
 const [followUpDue,setFollowUpDue]=useState("");
 const [captureKind,setCaptureKind]=useState<""|"order"|"collection"|"complaint"|"opportunity"|"observation">("");
 const [captureNote,setCaptureNote]=useState("");
 const [captureDue,setCaptureDue]=useState("");
 const [productId,setProductId]=useState("");
 const [quantity,setQuantity]=useState("1");
 const [amount,setAmount]=useState("");
 const [classification,setClassification]=useState("");
 const [responsibleParty,setResponsibleParty]=useState("");
 const [competitor,setCompetitor]=useState("");
 const [competitorPrice,setCompetitorPrice]=useState("");
 const [duplicateOverride,setDuplicateOverride]=useState(false);
 const [captureNotice,setCaptureNotice]=useState<string|null>(null);
 const [captureSaving,setCaptureSaving]=useState(false);
 const [inspection,setInspection]=useState<string|null>(null);
 const [actionError,setActionError]=useState<string|null>(null);
 const products=useQuery({queryKey:["rep-products"],queryFn:representativeProducts,enabled:!!selected&&activeTab==="day"});
 const refresh=()=>Promise.all([qc.invalidateQueries({queryKey:["rep-day"]}),qc.invalidateQueries({queryKey:["rep-activity"]})]);
 if(activeTab==="activity"){
   if(activity.isLoading)return <StatePanel kind="loading" title="جارٍ تحميل نشاط المندوب" detail="يتم جلب الأدلة التشغيلية المحفوظة من الخادم."/>;
   if(activity.isError)return <StatePanel kind="error" title="تعذر تحميل نشاط المندوب" detail="أعد المحاولة لجلب الأدلة المصرح بها." retry={()=>activity.refetch()}/>;
   return <ActivityCalendar title="تقويم نشاط المندوب" evidence={activity.data??[]}/>;
 }
 if(q.isLoading)return <StatePanel kind="loading" title="جارٍ تحميل يوم العمل" detail="يتم جلب السجل التشغيلي المحفوظ."/>;
 if(q.isError)return <StatePanel kind="error" title="تعذر تحميل يوم العمل" detail="تحقق من الاتصال ثم أعد المحاولة." retry={()=>q.refetch()}/>;

 const day=q.data!,current=day.visits.find(v=>v.id===selected),close=day.close;
 const start=async(id:string)=>{try{setActionError(null);await startVisit(id,session.csrfToken);await refresh();}catch(cause){setActionError(cause instanceof Error?cause.message:"تعذر بدء الزيارة.");}};
 const resetExecution=()=>{setOutcome("");setEvidence("");setFollowUpTitle("");setFollowUpDue("");setCaptureKind("");setCaptureNote("");setCaptureDue("");setProductId("");setQuantity("1");setAmount("");setClassification("");setResponsibleParty("");setCompetitor("");setCompetitorPrice("");setDuplicateOverride(false);setCaptureNotice(null);};
 const complete=async()=>{if(!current)return;keyboard.hide();try{setActionError(null);await completeVisit(current.id,session.csrfToken,{outcome,evidence,followUpTitle:followUpTitle||undefined,followUpDueAt:followUpDue?new Date(followUpDue).toISOString():undefined});setSelected(null);resetExecution();await refresh();}catch(cause){setActionError(cause instanceof Error?cause.message:"تعذر حفظ نتيجة الزيارة.");}};
 const saveCapture=async()=>{
   if(!current||!captureKind)return;
   setCaptureSaving(true);setActionError(null);setCaptureNotice(null);
   try{
     if(captureNote.trim().length<2)throw new Error("يلزم تسجيل دليل واضح للعمل الناتج.");
     if(captureKind==="order"){
       if(!productId||Number(quantity)<=0)throw new Error("اختر منتجًا وأدخل كمية موجبة.");
       await createOrder(session.csrfToken,{customerId:current.customerId,visitId:current.id,productId,quantity:Number(quantity),requestNote:captureNote,requiresCreditReview:true,duplicateOverrideReason:duplicateOverride?"تأكيد المندوب لتسجيل الطلب المكرر":undefined});
     }else if(captureKind==="collection"){
       if(Number(amount)<0)throw new Error("أدخل مبلغًا صالحًا.");
       const promise=!!captureDue;
       if(Number(amount)<=0)throw new Error(promise?"مبلغ وعد السداد يجب أن يكون أكبر من صفر.":"أدخل المبلغ المحصل.");
       await captureOperational("collection",session.csrfToken,{customerId:current.customerId,visitId:current.id,outcome:promise?"promise":"collected",amountCollected:promise?0:Number(amount),promiseAmount:promise?Number(amount):undefined,promiseDueAt:promise?new Date(captureDue).toISOString():undefined,evidence:captureNote,followUpTitle:promise?"متابعة وعد سداد":undefined,followUpDueAt:promise?new Date(captureDue).toISOString():undefined});
     }else if(captureKind==="complaint"){
       if(!classification||!responsibleParty||!captureDue)throw new Error("التصنيف والجهة المسؤولة وموعد المتابعة مطلوبة.");
       await captureOperational("complaint",session.csrfToken,{customerId:current.customerId,visitId:current.id,classification,description:captureNote,responsibleParty,requiredAction:"متابعة الشكوى حتى الحل الفعلي",evidence:captureNote,followUpTitle:"متابعة شكوى العميل",followUpDueAt:new Date(captureDue).toISOString()});
     }else if(captureKind==="opportunity"){
       if(!classification||!captureDue)throw new Error("نوع الفرصة وموعد المتابعة مطلوبان.");
       await captureOperational("opportunity",session.csrfToken,{customerId:current.customerId,visitId:current.id,kind:classification,productReference:productId||undefined,note:captureNote,evidence:captureNote,followUpTitle:"متابعة فرصة بيع",followUpDueAt:new Date(captureDue).toISOString()});
     }else{
       if(!classification)throw new Error("اختر نوع ملاحظة السوق.");
       await captureOperational("observation",session.csrfToken,{customerId:current.customerId,visitId:current.id,observationType:classification,competitor:competitor||undefined,competitorPrice:competitorPrice?Number(competitorPrice):undefined,productReference:productId||undefined,note:captureNote,evidence:captureNote});
     }
     setCaptureNotice(captureKind==="complaint"?"تم تسجيل الشكوى كعمل مفتوح؛ التسجيل لا يعني الحل.":"تم حفظ العمل الناتج في السجل التشغيلي.");
     setCaptureKind("");setCaptureNote("");setCaptureDue("");setProductId("");setQuantity("1");setAmount("");setClassification("");setResponsibleParty("");setCompetitor("");setCompetitorPrice("");setDuplicateOverride(false);
     await refresh();
   }catch(cause){const message=cause instanceof Error?cause.message:"تعذر حفظ العمل الناتج.";if(message.includes("recent order")&&!duplicateOverride){setDuplicateOverride(true);setActionError("يوجد طلب حديث لنفس العميل والمنتج. راجع الطلب ثم أكّد التجاوز صراحة.");}else setActionError(message);}finally{setCaptureSaving(false);}
 };
 const unfinished=day.visits.filter(v=>v.status!=="completed");
 const time=(value:string)=>new Intl.DateTimeFormat("ar-EG",{timeStyle:"short"}).format(new Date(value));
 const ledger=(id:string,label:string,detail:string)=><section className="artifact1-close-row" key={id}>
   <button className="customer-core-row" onClick={()=>setInspection(inspection===id?null:id)}>
     <LedgerRow label={label} detail={detail} status={<StatusLabel>{inspection===id?"إخفاء الدليل":"فحص الدليل"}</StatusLabel>}/>
   </button>
   {inspection===id&&<div className="artifact1-close-evidence"><p>{id==="visits"?"راجع سجل الزيارات أعلاه؛ فهو المصدر نفسه لهذه النتيجة.":id==="commitments"?"راجع مسار الالتزامات المباشر أعلاه؛ وهو المصدر نفسه للعمل المحمول.":"هذا الإجمالي مشتق من سجلات اليوم المحفوظة، وليس من ملخص يدوي."}</p></div>}
 </section>;

 const closeLedger=<div className="artifact1-close-ledger">
   {ledger("visits","الزيارات والعملاء",`${close.plannedVisits} مخططة · ${close.completedVisits} مكتملة · ${close.customersVisited} عملاء تمت زيارتهم`)}
   {ledger("orders","الطلبات المسجلة",`${close.orders} طلبات · ${egp(close.orderValue)}`)}
   {ledger("collections","التحصيل",`${close.collections} عمليات · ${egp(close.collectedAmount)}`)}
   {ledger("promises","وعود السداد",`${close.paymentPromises} وعود · ${egp(close.promiseAmount)}`)}
   {ledger("complaints","الشكاوى والقضايا",`${close.complaints} شكاوى مسجلة — التسجيل لا يعني الحل`)}
   {ledger("opportunities","الفرص والبيع الإضافي",`${close.opportunities} فرص مسجلة`)}
   {ledger("observations","ملاحظات السوق",`${close.observations} أدلة سوق محفوظة`)}
   {ledger("reactivations","إعادة التنشيط",`${close.reactivations} متابعات لعملاء غير نشطين`)}
   {ledger("commitments","المتابعات والعمل المحمول",`${close.openFollowUps} التزامات مفتوحة · ${close.carriedForward} عمل محمول`)}
   <LedgerRow label="نتائج الزيارات" detail={day.visits.filter(v=>v.outcome).map(v=>v.outcome).join(" · ")||"لا توجد نتائج مكتملة بعد"}/>
 </div>;

 if(current&&activeTab==="day")return <section className="artifact1-execution" aria-label="تنفيذ زيارة">
   <button className="customer-back" onClick={()=>{keyboard.hide();setSelected(null);resetExecution();}}>رجوع إلى اليوم</button>
   <NextActionHero eyebrow="تنفيذ زيارة" title={current.customerName} detail={current.purpose}/>
   <div className="artifact1-context-strip" aria-label="سياق الزيارة">
     <span>زيارة ميدانية</span><i>•</i><span>قيد التنفيذ الآن</span><i>•</i><span>الدليل مطلوب للإكمال</span>
   </div>
   <section className="artifact1-outcome-section">
     <h2>حالة التنفيذ</h2>
     <div className="artifact1-live-row"><span aria-hidden="true"/>تم بدء الزيارة. سجّل النتيجة والدليل لإكمالها.</div>
   </section>
   <section className="artifact1-outcome-section">
     <h2>ما الذي حدث؟</h2>
     <label className="artifact1-ledger-field"><span>النتيجة التشغيلية</span><KeyboardTextarea value={outcome} onChange={e=>setOutcome(e.target.value)} placeholder="اكتب ما حدث لدى العميل"/></label>
   </section>
   <section className="artifact1-outcome-section">
     <h2>الدليل أو النتيجة</h2>
     <label className="artifact1-ledger-field"><span>دليل محفوظ مع الزيارة</span><KeyboardTextarea value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="سجّل الدليل أو النتيجة القابلة للمراجعة"/></label>
   </section>
   <section className="artifact1-outcome-section artifact1-capture" aria-label="العمل الناتج من الزيارة">
     <h2>عمل ناتج من الزيارة</h2>
     <p className="artifact1-section-note">كل بند يُحفظ في مجاله التشغيلي الحقيقي ويظهر بعد التحديث في النشاط والإغلاق اليومي.</p>
     <div className="artifact1-chip-row" role="group" aria-label="نوع العمل الناتج">
       {([['order','طلبية'],['collection','تحصيل / وعد'],['complaint','شكوى'],['opportunity','فرصة بيع'],['observation','ملاحظة سوق']] as const).map(([id,label])=><button key={id} className={captureKind===id?"active":""} aria-pressed={captureKind===id} onClick={()=>{setCaptureKind(captureKind===id?"":id);setActionError(null);setCaptureNotice(null);setClassification("");}}>{label}</button>)}
     </div>
     {captureKind&&<div className="artifact1-capture-form">
       {captureKind==="order"&&<><label>المنتج<select value={productId} onChange={e=>setProductId(e.target.value)}><option value="">اختر المنتج</option>{(products.data??[]).map(product=><option value={product.id} key={product.id}>{product.name}</option>)}</select></label><label>الكمية<KeyboardInput type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label></>}
       {captureKind==="collection"&&<><label>المبلغ المحصل أو مبلغ الوعد<KeyboardInput type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>موعد وعد جديد — اتركه فارغًا للتحصيل الفعلي<KeyboardInput type="datetime-local" value={captureDue} onChange={e=>setCaptureDue(e.target.value)}/></label></>}
       {captureKind==="complaint"&&<><label>تصنيف المشكلة<select value={classification} onChange={e=>setClassification(e.target.value)}><option value="">اختر التصنيف</option><option value="delivery_delay">تأخير توصيل</option><option value="quality">جودة</option><option value="pricing">تسعير</option><option value="service">خدمة</option></select></label><label>الجهة المسؤولة<select value={responsibleParty} onChange={e=>setResponsibleParty(e.target.value)}><option value="">اختر المسؤول</option><option value="خدمة العملاء">خدمة العملاء</option><option value="التوزيع">التوزيع</option><option value="الجودة">الجودة</option><option value="المبيعات">المبيعات</option></select></label><label>موعد المتابعة<KeyboardInput type="datetime-local" value={captureDue} onChange={e=>setCaptureDue(e.target.value)}/></label></>}
       {captureKind==="opportunity"&&<><label>نوع الفرصة<select value={classification} onChange={e=>setClassification(e.target.value)}><option value="">اختر النوع</option><option value="cross_sell">بيع إضافي</option><option value="new_product">منتج جديد</option><option value="expansion">توسّع العميل</option></select></label><label>منتج مرتبط — اختياري<select value={productId} onChange={e=>setProductId(e.target.value)}><option value="">بدون منتج محدد</option>{(products.data??[]).map(product=><option value={product.referenceCode} key={product.id}>{product.name}</option>)}</select></label><label>موعد المتابعة<KeyboardInput type="datetime-local" value={captureDue} onChange={e=>setCaptureDue(e.target.value)}/></label></>}
       {captureKind==="observation"&&<><label>نوع الملاحظة<select value={classification} onChange={e=>setClassification(e.target.value)}><option value="">اختر النوع</option><option value="competitor">منافس</option><option value="price">سعر</option><option value="offer">عرض سوقي</option><option value="availability">توافر</option></select></label><label>اسم المنافس — اختياري<KeyboardInput value={competitor} onChange={e=>setCompetitor(e.target.value)}/></label><label>سعر المنافس — اختياري<KeyboardInput type="number" min="0" value={competitorPrice} onChange={e=>setCompetitorPrice(e.target.value)}/></label></>}
       <label className="artifact1-capture-note">الدليل / التفاصيل<KeyboardTextarea value={captureNote} onChange={e=>setCaptureNote(e.target.value)} placeholder="اكتب دليلاً يمكن مراجعته"/></label>
       {duplicateOverride&&<div className="artifact1-duplicate-warning"><strong>تحذير تكرار</strong><p>اضغط الحفظ مرة ثانية فقط إذا راجعت الطلب الحالي وتريد تسجيل طلب آخر صراحة.</p></div>}
       <button className="production-secondary" disabled={captureSaving||captureNote.trim().length<2} onClick={()=>void saveCapture()}>{duplicateOverride?"تأكيد التسجيل رغم التكرار":"حفظ العمل الناتج"}</button>
     </div>}
     {captureNotice&&<p className="artifact1-capture-success" role="status">{captureNotice}</p>}
   </section>
   <section className="artifact1-outcome-section">
     <h2>الالتزام التالي — اختياري</h2>
     <p className="artifact1-section-note">أدخل العنوان والموعد معًا لإنشاء متابعة مرتبطة بنتيجة الزيارة.</p>
     <label className="artifact1-ledger-field"><span>عنوان المتابعة</span><KeyboardInput value={followUpTitle} onChange={e=>setFollowUpTitle(e.target.value)} placeholder="مثال: تأكيد التسليم مع العميل"/></label>
     <label className="artifact1-ledger-field"><span>موعد الاستحقاق</span><KeyboardInput type="datetime-local" value={followUpDue} onChange={e=>setFollowUpDue(e.target.value)}/></label>
   </section>
   <div className="artifact1-outcome-actions">
     <button className="production-primary" disabled={!outcome||!evidence||Boolean(followUpTitle)!==Boolean(followUpDue)} onClick={()=>void complete()}>حفظ النتيجة وإكمال الزيارة</button>
   </div>
   {actionError&&<StatePanel kind="error" title="تعذر حفظ الزيارة" detail={actionError}/>}
 </section>;

 if(activeTab==="mine")return <section id="rep-mine" className="artifact1-rep-day" aria-label="الإغلاق اليومي للمندوب">
   <NextActionHero eyebrow="إقفال اليوم" title="عملي" detail="ملخص مشتق من الأدلة التشغيلية المحفوظة"/>
   <h2>إغلاق يومي مشتق</h2>
   {closeLedger}
 </section>;

 return <section className="artifact1-rep-day" aria-label="مساحة عمل المندوب اليومية">
   <div className="artifact1-morning-strip" aria-label="ملخص الزيارات اليوم">
     <span className="artifact1-mstat"><b>{unfinished.length}</b> زيارات مخطط لها اليوم</span><i>•</i><span className="artifact1-mstat"><b>{day.commitments.filter(c=>new Date(c.dueAt)<new Date()&&c.status!=="completed").length}</b> متأخرة</span><i>•</i><span className="artifact1-mstat"><b>{day.commitments.filter(c=>/تحصيل|سداد/.test(c.title)).length}</b> وعد تحصيل</span><i>•</i><span className="artifact1-mstat"><b>{close.complaints}</b> شكوى مفتوحة</span>
   </div>
   <NextActionHero eyebrow="التالي الآن" title={unfinished[0]?.purpose??"لا توجد زيارات معلقة"} detail={unfinished[0]?`${unfinished[0].customerName} · ${time(unfinished[0].plannedAt)}`:"كل الزيارات المسجلة مكتملة. راجع الالتزامات المفتوحة."}/>
   <h2 id="rep-day">مسار التزامات اليوم</h2>
   <div className="artifact1-visit-rail">
     {day.visits.length===0?<p className="artifact1-empty-note">لا توجد زيارات مسجلة لهذا اليوم.</p>:day.visits.map((v,index)=><article className="artifact1-visit-item" key={v.id}>
       <div className="artifact1-visit-spine"><time>{time(v.plannedAt)}</time><span className={`artifact1-visit-node artifact1-visit-node--${v.status}`}/>{(index<day.visits.length-1||day.commitments.length>0)&&<i/>}</div>
       <div className="artifact1-visit-body">
         <div className="artifact1-visit-top"><span>زيارة ميدانية</span><StatusLabel>{visitLabel(v.status)}</StatusLabel></div>
         <strong>{v.customerName}</strong><p>{v.purpose}</p>
         <div className="artifact1-visit-foot"><span>{v.status==="completed"?"تم حفظ النتيجة":"المالك: أنت"}</span>{v.status==="planned"&&<button className="artifact1-inline-action" onClick={()=>void start(v.id)}>بدء الزيارة</button>}{v.status==="in_progress"&&<button className="artifact1-inline-action" aria-label="تنفيذ الزيارة" onClick={()=>setSelected(v.id)}>تسجيل النتيجة</button>}</div>
       </div>
     </article>)}
   </div>
   {day.commitments.length>0&&<div className="artifact1-visit-rail artifact1-commitment-followups">{day.commitments.map((c,index)=>{const state=c.status==="completed"?"completed":new Date(c.dueAt)<new Date()?"urgent":"normal";return <article className="artifact1-visit-item" key={c.id}>
     <div className="artifact1-visit-spine"><time>{time(c.dueAt)}</time><span className={`artifact1-visit-node artifact1-visit-node--${state}`}/>{index<day.commitments.length-1&&<i/>}</div>
     <div className="artifact1-visit-body"><div className="artifact1-visit-top"><span>التزام / متابعة</span><StatusLabel>{c.status==="completed"?"مكتمل":"مفتوح"}</StatusLabel></div><strong>{c.title}</strong><p>التزام محفوظ مرتبط بالعمل التشغيلي.</p><div className="artifact1-visit-foot"><span>مسؤول التنفيذ: أنت</span></div></div>
   </article>})}</div>}
   {day.visits.length===0&&day.commitments.length===0&&<p className="artifact1-empty-note">لا توجد التزامات أو زيارات مفتوحة مرتبطة باليوم.</p>}
 </section>;
}
