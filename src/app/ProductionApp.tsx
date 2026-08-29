import { useEffect, useRef, useState, type ReactNode } from "react";
import "./production.css";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router";
import { ActivityLogIcon, ArrowLeftIcon, BellIcon, BookmarkIcon, CheckCircledIcon, HomeIcon, LockClosedIcon, MagnifyingGlassIcon, PersonIcon } from "@radix-ui/react-icons";
import { KeyboardInput, MobileScroll, useKeyboard } from "../mobile";
import { NextActionHero, StatePanel } from "../design-system/foundation";
import { accountProfile, getSession, login, logout, searchCustomers, workspaceNotifications, type SessionIdentity } from "../lib/api";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { CustomerOperatingFile, CustomerRegister } from "../features/customers/CustomerCore";
import { RepresentativeWorkspace } from "../features/representative/RepresentativeWorkspace";
import { TelesalesWorkspace } from "../features/telesales/TelesalesWorkspace";
import { SupervisorWorkspace } from "../features/supervisor/SupervisorWorkspace";
import { ManagerWorkspace } from "../features/manager/ManagerWorkspace";
import { ProfilePanel } from "../features/profile/ProfilePanel";
import { customerClassificationLabel } from "../lib/presentation";

const roles = [["sales-representative", "مندوب مبيعات", "sales_representative"], ["telesales", "موظف مبيعات هاتفية", "telesales_employee"], ["supervisor", "مشرف مبيعات هاتفية", "telesales_supervisor"], ["manager", "مدير مبيعات", "sales_manager"]] as const;
const roleLabels:Record<string,string>=Object.fromEntries(roles.map(([,label,role])=>[role,label]));
const frontlineNav=[
  ["day","اليوم",HomeIcon],
  ["mine","عملي",CheckCircledIcon],
  ["customers","العملاء",PersonIcon],
  ["activity","النشاط",ActivityLogIcon],
] as const;
const supervisorNav=[
  ["day","اليوم",HomeIcon],
  ["team","الفريق",PersonIcon],
  ["queues","الطوابير",CheckCircledIcon],
  ["activity","النشاط",ActivityLogIcon],
] as const;
const managerNav=[
  ["review","المراجعة",HomeIcon],
  ["priorities","الأولويات",CheckCircledIcon],
  ["customers","العملاء",PersonIcon],
  ["reports","النشاط",ActivityLogIcon],
] as const;
type FrontlineTab=typeof frontlineNav[number][0];
type WorkspaceTab=FrontlineTab|typeof supervisorNav[number][0]|typeof managerNav[number][0];
type AuthState = { status: "checking" } | { status: "anonymous" } | { status: "authenticated"; session: SessionIdentity };

function LoginRoute({ onLogin }: { onLogin: (session: SessionIdentity) => void }) {
 const navigate=useNavigate(),keyboard=useKeyboard(),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState<string|null>(null),[saving,setSaving]=useState(false);
 return <MobileScroll className="production-screen"><main className="production-login">
   <div className="production-login-logo"><img src="/assets/brand/ees-logo.svg" alt="El Masria Electric Solutions" draggable="false"/></div>
   <section className="production-login-welcome" aria-labelledby="login-heading"><h1 id="login-heading">تسجيل الدخول</h1><p>مرحباً بك. لنبدأ يوم عمل مرتباً.</p></section>
   <form className="production-login-form" onSubmit={async e=>{e.preventDefault();keyboard.hide();setSaving(true);setError(null);try{const session=await login(email,password);onLogin(session);navigate(`/app/${roles.find(([, ,r])=>r===session.employee.role)?.[0]??"sales-representative"}`,{replace:true});}catch(cause){setError(cause instanceof Error?cause.message:"تعذر تسجيل الدخول.");}finally{setSaving(false);}}}>
     <label htmlFor="login-email">البريد الإلكتروني أو رقم الموظف<KeyboardInput id="login-email" autoComplete="username" inputMode="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ahmed@company.com"/></label>
     <label htmlFor="login-password">كلمة المرور<KeyboardInput id="login-password" autoComplete="current-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="أدخل كلمة المرور"/></label>
     {error&&<StatePanel kind="error" title="تعذر تسجيل الدخول" detail={error}/>}<button className="production-primary production-login-submit" aria-label="تسجيل الدخول" disabled={saving}>{saving?"جارٍ التحقق…":<><span>تسجيل الدخول&nbsp; / &nbsp;Login</span><ArrowLeftIcon aria-hidden="true"/></>}</button>
     <p className="production-login-footnote"><LockClosedIcon aria-hidden="true"/> يحدد الخادم دورك ونطاق العملاء المصرح به بعد التحقق.</p>
   </form>
 </main></MobileScroll>;
}

function RoleWorkspace({session,onLogout}:{session:SessionIdentity;onLogout:()=>void}) {
 const [customerId,setCustomerId]=useState<string|null>(null);
 const [tab,setTab]=useState<WorkspaceTab>(session.employee.role==="sales_manager"?"review":"day");
 const [showStateGuide,setShowStateGuide]=useState(false);
 const [showProfile,setShowProfile]=useState(false);
 const [utility,setUtility]=useState<"search"|"notifications"|null>(null);
 const [searchTerm,setSearchTerm]=useState("");
 const navigationFrame=useRef<number|null>(null);
 const keyboard=useKeyboard();
 const navigate=useNavigate();
 const r=session.employee.role;
 const role=roleLabels[r]??r;
 const profile=useQuery({queryKey:["account-profile",session.employee.id],queryFn:accountProfile});
 const notifications=useQuery({queryKey:["workspace-notifications",session.employee.id],queryFn:workspaceNotifications});
 const search=useQuery({queryKey:["workspace-search",session.employee.id,searchTerm.trim()],queryFn:()=>searchCustomers(searchTerm.trim()),enabled:utility==="search"&&searchTerm.trim().length>=2});
 const hasWorkspaceNavigation=r==="sales_representative"||r==="telesales_employee"||r==="telesales_supervisor"||r==="sales_manager";
 const workspaceTitle=r==="telesales_supervisor"?"مساحة تشغيل المشرف":r==="sales_manager"?"مساحة عمل المدير":r==="telesales_employee"?"مساحة تشغيل المكالمات":"سجل تنفيذ الزيارات";
 const workspaceDate=new Intl.DateTimeFormat("ar-EG",{weekday:"long",day:"numeric",month:"long"}).format(new Date());
 const workspaceNav=r==="telesales_supervisor"?supervisorNav:r==="sales_manager"?managerNav:frontlineNav;
 const workspaceScroller=()=>document.querySelector<HTMLElement>(".production-app-shell [data-testid='mobile-scroll']");
 const openCustomer=(id:string)=>{keyboard.hide();setUtility(null);setShowProfile(false);setCustomerId(id);window.requestAnimationFrame(()=>workspaceScroller()?.scrollTo({top:0,behavior:"auto"}));};
 const navigateFrontline=(next:WorkspaceTab)=>{
   keyboard.hide();
   setUtility(null);
   setShowProfile(false);
   setTab(next);
   if(customerId){setCustomerId(null);}
   if(navigationFrame.current!==null)window.cancelAnimationFrame(navigationFrame.current);
   navigationFrame.current=window.requestAnimationFrame(()=>{
     navigationFrame.current=null;
     workspaceScroller()?.scrollTo({top:0,behavior:"auto"});
   });
 };
 const endSession=async()=>{keyboard.hide();try{await logout(session.csrfToken);}finally{onLogout();navigate("/login",{replace:true});}};
 useEffect(()=>()=>{if(navigationFrame.current!==null)window.cancelAnimationFrame(navigationFrame.current);},[]);
 return <div className="production-app-shell">
   <header className="production-appbar">
     <div className="artifact-brand"><button type="button" className="artifact-brand-mark" aria-label="فتح الملف الشخصي" aria-pressed={showProfile} onClick={()=>{keyboard.hide();setUtility(null);setShowProfile(true);setCustomerId(null);}}>{profile.data?.avatarDataUrl?<img src={profile.data.avatarDataUrl} alt=""/>:"س"}<span aria-hidden="true"/></button><span><b>{workspaceTitle}</b><small>{workspaceDate}</small></span></div>
     <div className="artifact-appbar-actions"><button type="button" className={utility==="search"?"active":""} aria-label="بحث العملاء" aria-expanded={utility==="search"} onClick={()=>{keyboard.hide();setUtility(utility==="search"?null:"search");setShowStateGuide(false);}}><MagnifyingGlassIcon/></button><button type="button" className={utility==="notifications"?"active":""} aria-label="الإشعارات" aria-expanded={utility==="notifications"} onClick={()=>{keyboard.hide();setUtility(utility==="notifications"?null:"notifications");setShowStateGuide(false);}}><BellIcon/>{Boolean(notifications.data?.length)&&<i aria-label={`${notifications.data!.length} تنبيه جديد`}/>}</button><button type="button" className={showStateGuide?"active":""} aria-label="دليل حالات الواجهة" aria-expanded={showStateGuide} onClick={()=>{keyboard.hide();setUtility(null);setShowStateGuide(true);}}><BookmarkIcon/></button></div>
     <div className="artifact-role-row" aria-label={`الدور المعروض: ${role}`}>
       <span className="artifact-role-label"><PersonIcon aria-hidden="true"/><span>{role}</span></span>
       {(r==="telesales_supervisor"||r==="sales_manager")&&<span className="artifact-role-device" aria-label="عرض الهاتف">هاتف</span>}
     </div>
   </header>
   <MobileScroll className="production-screen"><main className="production-content">{showProfile?<ProfilePanel session={session} onClose={()=>setShowProfile(false)} onLogout={endSession}/>:customerId?<CustomerOperatingFile id={customerId} onBack={()=>setCustomerId(null)} session={session}/>:r==="sales_representative"?(tab==="customers"?<CustomerRegister onOpen={openCustomer} session={session}/>:<RepresentativeWorkspace session={session} activeTab={tab as "day"|"mine"|"activity"}/>):r==="telesales_employee"?<TelesalesWorkspace session={session} onCustomer={openCustomer} activeTab={tab as FrontlineTab}/>:r==="telesales_supervisor"?<SupervisorWorkspace session={session} activeTab={tab as "day"|"team"|"queues"|"activity"}/>:r==="sales_manager"?(tab==="customers"?<CustomerRegister onOpen={openCustomer} session={session}/>:<ManagerWorkspace session={session} activeTab={tab as "review"|"priorities"|"reports"}/>):<StatePanel kind="empty" title="مسار الدور مهيأ" detail="لا توجد وظائف تشغيلية لهذا الدور."/>}</main></MobileScroll>
   {utility&&<section className="artifact-utility-panel" role="dialog" aria-modal="true" aria-label={utility==="search"?"بحث العملاء":"الإشعارات"}><header><div><small>{utility==="search"?"بحث تشغيلي":"مركز التنبيهات"}</small><strong>{utility==="search"?"ابحث في العملاء المصرح بهم":"تنبيهات مشتقة من السجل"}</strong></div><button type="button" onClick={()=>{keyboard.hide();setUtility(null);}} aria-label="إغلاق">×</button></header>{utility==="search"?<div className="artifact-utility-search"><label>اسم العميل أو الكود<KeyboardInput autoFocus value={searchTerm} onChange={event=>setSearchTerm(event.target.value)} placeholder="اكتب حرفين على الأقل"/></label>{searchTerm.trim().length<2?<StatePanel kind="empty" title="ابدأ البحث" detail="اكتب حرفين على الأقل لعرض العملاء داخل نطاقك."/>:search.isLoading?<StatePanel kind="loading" title="جارٍ البحث" detail="يتم جلب العملاء المصرح بهم من الخادم."/>:search.isError?<StatePanel kind="error" title="تعذر البحث" detail="أعد المحاولة لجلب نتائج العملاء." retry={()=>search.refetch()}/>:search.data?.length?<div className="artifact-search-results">{search.data.map(customer=><button type="button" key={customer.id} onClick={()=>openCustomer(customer.id)}><span><strong>{customer.name}</strong><small>{customer.customerCode??"بدون كود"} · {customerClassificationLabel(customer.classification)}</small></span><i>{customer.openCommitments} مفتوحة</i></button>)}</div>:<StatePanel kind="empty" title="لا توجد نتائج" detail="لا يوجد عميل مطابق داخل نطاق الوصول المصرح به."/>}</div>:<div className="artifact-notification-list">{notifications.isLoading?<StatePanel kind="loading" title="جارٍ تحميل التنبيهات" detail="يتم اشتقاقها من العمل المصرح به."/>:notifications.isError?<StatePanel kind="error" title="تعذر تحميل التنبيهات" detail="أعد المحاولة لجلب العمل المفتوح." retry={()=>notifications.refetch()}/>:notifications.data?.length?notifications.data.map(item=><button type="button" key={item.id} onClick={()=>item.customerId?openCustomer(item.customerId):setUtility(null)}><b className={`artifact-notification-mark artifact-notification-mark--${item.attention}`} aria-hidden="true"/><span><strong>{item.title}</strong><small>{item.detail}</small><time>{item.at?new Intl.DateTimeFormat("ar-EG",{dateStyle:"short",timeStyle:"short"}).format(new Date(item.at)):"وقت المصدر محفوظ"}</time></span><i>عرض ‹</i></button>):<div className="artifact-notification-empty"><BellIcon/><StatePanel kind="empty" title="لا توجد إشعارات جديدة" detail="لا توجد إشعارات تشغيلية متاحة لهذا الحساب الآن."/></div>}<p>تنبيه تشغيلي مشتق من السجل المصرح به؛ لا ينشئ حالة عمل موازية.</p></div>}</section>}
   {showStateGuide&&<section className="artifact-state-guide" role="dialog" aria-modal="true" aria-label="دليل حالات الواجهة"><div><header><strong>دليل حالات الواجهة</strong><button type="button" onClick={()=>setShowStateGuide(false)} aria-label="إغلاق الدليل">×</button></header><p><b className="artifact-guide-mark artifact-guide-mark--normal"/> مفتوح: العمل ما زال يحتاج تنفيذًا أو متابعة.</p><p><b className="artifact-guide-mark artifact-guide-mark--caution"/> انتباه: توجد متابعة أو دليل مطلوب.</p><p><b className="artifact-guide-mark artifact-guide-mark--urgent"/> عاجل: أولوية تشغيلية لا تعني الإغلاق.</p><p><b className="artifact-guide-mark artifact-guide-mark--success"/> مكتمل: تم تسجيل نتيجة أو إغلاق فعلي بدليل.</p></div></section>}
   {hasWorkspaceNavigation&&<nav className="production-nav" aria-label="تنقل مساحة العمل">{workspaceNav.map(([id,label,Icon])=><button type="button" key={id} className={tab===id?"active":""} aria-current={tab===id?"page":undefined} onClick={()=>navigateFrontline(id)}><Icon/><span>{label}</span></button>)}</nav>}
 </div>;
}

function Guard({state,role,children}:{state:AuthState;role:string;children:ReactNode}){if(state.status==="checking")return <StatePanel kind="loading" title="جارٍ التحقق من الجلسة" detail="يتم تحميل الوصول المصرح به."/>;if(state.status==="anonymous")return <Navigate to="/login" replace/>;if(state.session.employee.role!==role)return <StatePanel kind="denied" title="غير مصرح" detail="لا تملك صلاحية الوصول إلى مساحة هذا الدور."/>;return children;}
function AppRoutes({state,onLogin,onLogout}:{state:AuthState;onLogin:(session:SessionIdentity)=>void;onLogout:()=>void}){const destination=state.status==="authenticated"?(roles.find(([, ,r])=>r===state.session.employee.role)?.[0]??"sales-representative"):"sales-representative";return <Routes><Route path="/login" element={state.status==="authenticated"?<Navigate to={`/app/${destination}`} replace/>:<LoginRoute onLogin={onLogin}/>}/>{roles.map(([path,,role])=><Route key={path} path={`/app/${path}`} element={<Guard state={state} role={role}><RoleWorkspace session={state.status==="authenticated"?state.session:{employee:{id:"",displayName:"",role:""},csrfToken:""}} onLogout={onLogout}/></Guard>}/>)}<Route path="*" element={<Navigate to="/login" replace/>}/></Routes>}
export function ProductionApp(){const[state,setState]=useState<AuthState>({status:"checking"}),[client]=useState(()=>new QueryClient());useEffect(()=>{document.documentElement.lang="ar";document.documentElement.dir="rtl";void getSession().then(session=>setState({status:"authenticated",session})).catch(()=>setState({status:"anonymous"}));},[]);const acceptSession=(session:SessionIdentity)=>{client.clear();setState({status:"authenticated",session});};const clearSession=()=>{client.clear();setState({status:"anonymous"});};return <QueryClientProvider client={client}><div className="production-root" lang="ar" dir="rtl"><BrowserRouter><AppRoutes state={state} onLogin={acceptSession} onLogout={clearSession}/></BrowserRouter></div></QueryClientProvider>}
