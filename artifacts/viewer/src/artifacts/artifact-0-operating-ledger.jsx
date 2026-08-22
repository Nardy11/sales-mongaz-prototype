import React, { useState, useMemo } from "react";
import {
  Sun, ListChecks, Users, Activity, UsersRound, LayoutList, ClipboardCheck,
  Flag, BarChart3, Bell, Search, ChevronLeft, ChevronDown, Phone, MapPin,
  CheckCircle2, AlertTriangle, Lock, RotateCw, X, Building2, Wallet,
  PhoneCall, MessageSquareWarning, UserRound, Monitor, Smartphone, BookOpen,
  ArrowUpRight, CircleDot, PackageCheck, MessageCircleWarning
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  DATA                                                                   */
/* ---------------------------------------------------------------------- */

const ROLES = [
  { id: "rep", label: "مندوب مبيعات", nav: [
      { id: "day", label: "اليوم", icon: Sun },
      { id: "mine", label: "عملي", icon: ListChecks },
      { id: "customers", label: "العملاء", icon: Users },
      { id: "activity", label: "النشاط", icon: Activity },
    ] },
  { id: "tele", label: "موظف مبيعات هاتفية", nav: [
      { id: "day", label: "اليوم", icon: Sun },
      { id: "mine", label: "عملي", icon: ListChecks },
      { id: "customers", label: "العملاء", icon: Users },
      { id: "activity", label: "النشاط", icon: Activity },
    ] },
  { id: "sup", label: "مشرف مبيعات هاتفية", nav: [
      { id: "day", label: "اليوم", icon: Sun },
      { id: "team", label: "الفريق", icon: UsersRound },
      { id: "queues", label: "الطوابير", icon: LayoutList },
      { id: "activity", label: "النشاط", icon: Activity },
    ] },
  { id: "mgr", label: "مدير مبيعات", nav: [
      { id: "review", label: "المراجعة", icon: ClipboardCheck },
      { id: "priorities", label: "الأولويات", icon: Flag },
      { id: "customers", label: "العملاء", icon: Users },
      { id: "reports", label: "التقارير", icon: BarChart3 },
    ] },
];

const repItems = [
  { id: "r1", time: "09:00", kind: "زيارة عميل", title: "زيارة تغطية دورية", who: "كريم منصور", org: "سوبر ماركت الأمانة", area: "فيصل، الجيزة", status: "completed", owner: "أنت", due: "تم قبل 3 ساعات", next: "تم تسجيل طلبية بقيمة 6,800 ج.م", amount: "6,800 ج.م", phone: "01012345001" },
  { id: "r2", time: "11:30", kind: "زيارة تحصيل", title: "زيارة تحصيل وعد سداد", who: "هبة الشناوي", org: "صيدليات الشفاء", area: "الهرم، الجيزة", status: "urgent", owner: "أنت", due: "متأخرة 40 دقيقة", next: "تحصيل 4,200 ج.م أو تجديد الوعد كتابيًا", amount: "4,200 ج.م", phone: "01098765002" },
  { id: "r3", time: "13:00", kind: "زيارة عميل", title: "عرض تسعير جديد", who: "محمود عبد الرازق", org: "مطاعم الفنار", area: "الدقي، الجيزة", status: "normal", owner: "أنت", due: "خلال ساعتين", next: "عرض قائمة الأسعار المُحدّثة لشهر سبتمبر", amount: null, phone: "01123456003" },
  { id: "r4", time: "15:30", kind: "متابعة عميل", title: "متابعة إغلاق شكوى", who: "ياسمين توفيق", org: "توكيلات الشرق للسيارات", area: "المهندسين، الجيزة", status: "normal", owner: "أنت", due: "اليوم قبل الساعة 5", next: "تأكيد وصول قطعة الغيار المتأخرة", amount: null, phone: "01234567004" },
];

const teleItems = [
  { id: "t1", time: "09:15", kind: "مكالمة تأكيد", title: "تأكيد طلبية مرسلة", who: "أحمد فتحي", org: "مصنع الدلتا للبلاستيك", area: "العاشر من رمضان", status: "completed", owner: "أنت", due: "تم قبل 4 ساعات", next: "تم التأكيد وجدولة التسليم", amount: null, phone: "01055512011" },
  { id: "t2", time: "10:40", kind: "مكالمة تحصيل", title: "متابعة وعد سداد", who: "هدير جمال", org: "شركة النور للتجارة والتوزيع", area: "شبرا الخيمة", status: "urgent", owner: "أنت", due: "متأخرة 25 دقيقة", next: "تحصيل 2,150 ج.م أو تصعيد للمشرف", amount: "2,150 ج.م", phone: "01166612022" },
  { id: "t3", time: "12:00", kind: "مكالمة تغطية", title: "مكالمة تغطية دورية", who: "وليد سامي", org: "مجموعة الرواد للمقاولات", area: "مدينة نصر", status: "normal", owner: "أنت", due: "خلال 90 دقيقة", next: "عرض العروض الموسمية الحالية", amount: null, phone: "01277712033" },
  { id: "t4", time: "14:20", kind: "مكالمة شكوى", title: "شكوى تأخير توصيل", who: "منى أحمد", org: "سوبر ماركت الأمانة - فرع 2", area: "المرج", status: "normal", owner: "أنت", due: "اليوم", next: "تهدئة العميل وتصعيد الشكوى للمشرف", amount: null, phone: "01088812044" },
];

const supQueues = [
  { id: "q1", label: "شكاوى مفتوحة أكثر من 24 ساعة", count: 3, severity: "urgent", age: "أقدمها منذ يومين", breakdown: [
      { who: "محمد الطيب", count: 2, age: "يومين" },
      { who: "سارة عادل", count: 1, age: "يوم واحد" },
    ] },
  { id: "q2", label: "مكالمات فائتة اليوم", count: 7, severity: "caution", age: "أقدمها منذ 3 ساعات", breakdown: [
      { who: "محمد الطيب", count: 4, age: "3 ساعات" },
      { who: "نهى كامل", count: 3, age: "ساعة ونصف" },
    ] },
  { id: "q3", label: "وعود سداد متأخرة", count: 5, severity: "urgent", age: "بقيمة إجمالية 18,400 ج.م", breakdown: [
      { who: "سارة عادل", count: 3, age: "10,200 ج.م" },
      { who: "وليد سامي", count: 2, age: "8,200 ج.م" },
    ] },
  { id: "q4", label: "زيارات لم تُسجَّل نتيجتها", count: 2, severity: "normal", age: "منذ أمس", breakdown: [
      { who: "نهى كامل", count: 2, age: "منذ أمس" },
    ] },
];

const supRail = [
  { id: "s1", time: "10:00", kind: "مراجعة أداء", title: "مراجعة أداء فردية", who: "محمد الطيب", org: "أقل من المتوسط 3 أيام متتالية", area: "فريق القاهرة", status: "urgent", owner: "أنت", due: "خلال ساعة", next: "تحديد خطة تحسين لمدة أسبوع", amount: null, phone: null },
  { id: "s2", time: "12:30", kind: "تدريب ميداني", title: "تدريب مصاحبة مكالمات", who: "سارة عادل", org: "جودة مكالمات منخفضة هذا الأسبوع", area: "فريق القاهرة", status: "normal", owner: "أنت", due: "اليوم", next: "الاستماع لـ 3 مكالمات وتقديم ملاحظات", amount: null, phone: null },
  { id: "s3", time: "16:00", kind: "اجتماع فريق", title: "إغلاق يومي للفريق", who: "الفريق بالكامل", org: "مراجعة الالتزامات المفتوحة", area: "فريق القاهرة", status: "normal", owner: "أنت", due: "نهاية اليوم", next: "توزيع التزامات الغد", amount: null, phone: null },
];

const mgrRail = [
  { id: "m1", time: "09:00", kind: "انحراف التزام", title: "انحراف التزام فريق كامل", who: "عمر خالد", org: "التزام العملاء 82% مقابل هدف 95%", area: "فريق القاهرة الكبرى", status: "urgent", owner: "المشرف: عمر خالد", due: "يتطلب قرارًا اليوم", next: "اعتماد خطة تصحيح مدتها أسبوع", amount: null, phone: null },
  { id: "m2", time: "11:00", kind: "مخاطرة عميل رئيسي", title: "تعثر سداد عميل رئيسي", who: "كريم لطفي", org: "شركة النور للتجارة والتوزيع", area: "تأخر السداد 45 يومًا", status: "urgent", owner: "المندوب: كريم لطفي", due: "قرار معلّق", next: "تجميد حد الائتمان أم تمديد المهلة؟", amount: "62,000 ج.م", phone: null },
  { id: "m3", time: "14:00", kind: "مراجعة تغطية", title: "نقص تغطية منطقة", who: "منى الشريف", org: "انخفاض زيارات مكتملة بنسبة 12%", area: "منطقة الإسكندرية", status: "normal", owner: "المشرفة: منى الشريف", due: "خلال 3 أيام", next: "مراجعة خطة التوزيع الجغرافي", amount: null, phone: null },
  { id: "m4", time: "16:30", kind: "إغلاق يومي", title: "تقرير إغلاق العمليات", who: "جميع الفرق", org: "جاهز للمراجعة النهائية", area: "كل المناطق", status: "normal", owner: "أنت", due: "نهاية اليوم", next: "اعتماد ونشر ملخص الغد", amount: null, phone: null },
];

const STATUS_META = {
  normal:    { color: "var(--action)",  label: "قيد الانتظار",  Icon: CircleDot },
  urgent:    { color: "var(--danger)",  label: "متأخر",          Icon: AlertTriangle },
  completed: { color: "var(--success)", label: "مكتمل",          Icon: CheckCircle2 },
};

/** Role → card variant. Reflects the job, not just the data: field work is
 *  task-first, oversight is people-first, decisions are figure/consequence-first. */
function variantForRole(roleId) {
  if (roleId === "sup") return "oversight";
  if (roleId === "mgr") return "decision";
  return "field";
}

/** Detects a genuine binary decision ("X أم Y؟") so it can render as two
 *  weighed options instead of a single arrow-prefixed next step. */
function splitDecision(text) {
  if (!text || !text.includes(" أم ")) return null;
  const parts = text.split(" أم ");
  if (parts.length !== 2) return null;
  return [parts[0].trim(), parts[1].replace(/؟\s*$/, "").trim()];
}

function buildDetail(item) {
  const events = item.status === "completed"
    ? [
        { when: "اليوم", text: `تم تنفيذ ${item.kind.toLowerCase()} وتسجيل النتيجة`, out: item.next },
        { when: "منذ أسبوع", text: `${item.kind} سابقة بنفس العميل`, out: "لا توجد ملاحظات إضافية" },
      ]
    : [
        { when: "منذ 3 أيام", text: "وعد بالسداد يوم الخميس القادم", out: `أدى إلى جدولة ${item.kind} اليوم` },
        { when: "منذ أسبوعين", text: "زيارة تغطية اعتيادية وتسجيل طلبية", out: "أدى إلى فاتورة مستحقة خلال 14 يومًا" },
        { when: "منذ شهر", text: "شكوى تأخير توصيل من العميل", out: "أدى إلى تعويض بخصم 5٪ على الطلبية التالية" },
      ];
  return {
    phone: item.phone || "01000000000",
    lastOrder: item.status === "completed" ? "اليوم" : "منذ 7 أيام",
    balance: item.amount || "لا يوجد رصيد مستحق",
    tier: item.status === "urgent" ? "عميل يتطلب متابعة" : "عميل فضي",
    area: item.area,
    events,
  };
}

/* ---------------------------------------------------------------------- */
/*  SMALL COMPONENTS                                                       */
/* ---------------------------------------------------------------------- */

function StatusPill({ status }) {
  const m = STATUS_META[status];
  if (!m) return null;
  const Icon = m.Icon;
  return (
    <span className="status-tag" style={{ color: m.color }}>
      <Icon size={12} strokeWidth={2.6} />
      {m.label}
    </span>
  );
}

function RailItem({ item, onOpen, first, last, variant = "field" }) {
  const decision = variant === "decision" ? splitDecision(item.next) : null;

  return (
    <div className={"rail-item" + (first ? " rail-item-first" : "")}>
      <div className="rail-spine">
        {!first && <div className="rail-line rail-line-top" />}
        <span className="rail-time nums">{item.time}</span>
        <span className={"rail-node node-" + item.status} />
        {!last && <div className="rail-line rail-line-bottom" />}
      </div>
      <button className="rail-card" onClick={() => onOpen(item)}>
        <div className="rail-card-top">
          <span className="rail-kind">{item.kind}</span>
          <StatusPill status={item.status} />
        </div>

        {variant === "oversight" ? (
          <>
            <div className="rail-title">{item.who}</div>
            <div className="rail-sub">{item.org}</div>
          </>
        ) : variant === "decision" ? (
          <>
            <div className="rail-title">{item.title}</div>
            <div className="rail-note">{item.org}</div>
            <div className="rail-owner"><UserRound size={11} /> {item.owner}</div>
          </>
        ) : (
          <>
            <div className="rail-title">{item.title}</div>
            <div className="rail-sub">{item.who} · {item.org}</div>
          </>
        )}

        {variant === "decision" && decision ? (
          <div className="decision-row">
            <span className="decision-opt">{decision[0]}</span>
            <span className="decision-or">أم</span>
            <span className="decision-opt">{decision[1]}</span>
          </div>
        ) : (
          <div className="rail-next">
            <ArrowUpRight size={13} strokeWidth={2.2} />
            <span>{item.next}</span>
          </div>
        )}

        <div className="rail-foot">
          <span className={item.status === "urgent" ? "rail-due danger" : "rail-due"}>{item.due}</span>
          {item.amount && (
            <span className={"rail-amount nums" + (variant === "decision" ? " big" : "")}>{item.amount}</span>
          )}
        </div>
      </button>
    </div>
  );
}

function RailSkeleton() {
  return (
    <div className="rail-item">
      <div className="rail-spine">
        <span className="rail-node skeleton-node" />
      </div>
      <div className="rail-card no-hover">
        <div className="skeleton-line" style={{ width: "40%" }} />
        <div className="skeleton-line" style={{ width: "70%", height: 14 }} />
        <div className="skeleton-line" style={{ width: "55%" }} />
      </div>
    </div>
  );
}

function RailEmpty({ text }) {
  return (
    <div className="rail-item">
      <div className="rail-spine">
        <span className="rail-node node-empty" />
      </div>
      <div className="rail-card no-hover empty-card">
        <PackageCheck size={18} color="var(--ink-300)" />
        <span>{text}</span>
      </div>
    </div>
  );
}

function RailRestricted() {
  return (
    <div className="rail-item">
      <div className="rail-spine">
        <span className="rail-node node-empty" />
      </div>
      <div className="rail-card no-hover restricted-card">
        <Lock size={14} color="var(--ink-300)" />
        <span>هذا القسم غير متاح لدورك الحالي</span>
      </div>
    </div>
  );
}

function RailError({ onRetry }) {
  return (
    <div className="rail-item">
      <div className="rail-spine">
        <span className="rail-node node-error" />
      </div>
      <div className="rail-card no-hover error-card">
        <div className="rail-card-top">
          <MessageCircleWarning size={16} color="var(--caution)" />
          <span>تعذّر تحميل هذا البند</span>
        </div>
        <button className="retry-btn" onClick={onRetry}>
          <RotateCw size={13} /> إعادة المحاولة
        </button>
      </div>
    </div>
  );
}

function QueueRegister({ q, open, onToggle }) {
  return (
    <div className="reg-row">
      <button className="reg-head" onClick={onToggle}>
        <span className={"reg-mark mark-" + q.severity} />
        <span className="reg-count nums">{q.count}</span>
        <span className="reg-text">
          <span className="reg-label">{q.label}</span>
          <span className="reg-age">{q.age}</span>
        </span>
        <ChevronDown size={16} className={open ? "chev open" : "chev"} />
      </button>
      {open && (
        <div className="reg-breakdown">
          {q.breakdown.map((b, i) => (
            <div className="breakdown-row" key={i}>
              <span className="breakdown-who">{b.who}</span>
              <span className="breakdown-count nums">{b.count}</span>
              <span className="breakdown-age nums">{b.age}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HeroAction({ role, item, onOpen, queueTop }) {
  if (role === "sup" && queueTop) {
    return (
      <button className="hero" onClick={() => {}}>
        <div className="hero-eyebrow">تدخّل الآن</div>
        <div className="hero-title">{queueTop.count} {queueTop.label}</div>
        <div className="hero-meta">{queueTop.age}</div>
      </button>
    );
  }
  if (!item) return null;
  return (
    <button className="hero" onClick={() => onOpen(item)}>
      <div className="hero-eyebrow">التالي الآن · {item.time}</div>
      <div className="hero-title">{item.kind}: {item.org}</div>
      <div className="hero-meta">{item.who} · {item.due}</div>
    </button>
  );
}

function EmptyTab({ label }) {
  return (
    <div className="tab-placeholder">
      <PackageCheck size={22} color="var(--ink-300)" />
      <div className="tab-placeholder-title">قسم "{label}" غير مُفصَّل في هذا النموذج الأولي</div>
      <div className="tab-placeholder-text">سيُبنى لاحقًا باستخدام نفس نظام التصميم ومسار الالتزام.</div>
    </div>
  );
}

function DetailBody({ item }) {
  const d = useMemo(() => buildDetail(item), [item]);
  return (
    <>
      <div className="snap-grid">
        <div className="snap-cell">
          <span className="snap-label"><Phone size={12} /> الهاتف</span>
          <span className="snap-value nums">{d.phone}</span>
        </div>
        <div className="snap-cell">
          <span className="snap-label"><MapPin size={12} /> المنطقة</span>
          <span className="snap-value">{d.area}</span>
        </div>
        <div className="snap-cell">
          <span className="snap-label"><Wallet size={12} /> الرصيد</span>
          <span className="snap-value nums">{d.balance}</span>
        </div>
        <div className="snap-cell">
          <span className="snap-label"><Building2 size={12} /> التصنيف</span>
          <span className="snap-value">{d.tier}</span>
        </div>
      </div>

      <div className="section-label">سجل الأحداث السابقة</div>
      <div className="timeline">
        {d.events.map((e, i) => (
          <div className="tl-row" key={i}>
            <div className="tl-dot-col">
              <span className="tl-dot" />
              {i !== d.events.length - 1 && <span className="tl-line" />}
            </div>
            <div className="tl-body">
              <div className="tl-when">{e.when}</div>
              <div className="tl-text">{e.text}</div>
              <div className="tl-out"><ArrowUpRight size={12} /> {e.out}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/*  MAIN APP                                                                */
/* ---------------------------------------------------------------------- */

export default function App() {
  const [roleId, setRoleId] = useState("rep");
  const [device, setDevice] = useState("mobile");
  const [tab, setTab] = useState("day");
  const [openQueue, setOpenQueue] = useState("q1");
  const [selected, setSelected] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [statusOverride, setStatusOverride] = useState({});

  const role = ROLES.find(r => r.id === roleId);
  const variant = variantForRole(roleId);

  const items = roleId === "rep" ? repItems
    : roleId === "tele" ? teleItems
    : roleId === "sup" ? supRail
    : mgrRail;

  const liveItems = items.map(it => statusOverride[it.id] ? { ...it, status: statusOverride[it.id], next: "تم تسجيل النتيجة" } : it);

  const heroItem = liveItems.find(i => i.status === "urgent") || liveItems.find(i => i.status === "normal");
  const queueTop = supQueues.find(q => q.severity === "urgent");

  function openItem(it) { setSelected(it); }
  function closeSheet() { setSelected(null); }

  function completeItem(it) {
    setStatusOverride(s => ({ ...s, [it.id]: "completed" }));
    setSelected(null);
    setToast(`تم تسجيل النتيجة — تم إنشاء متابعة جديدة غدًا الساعة 10:00 ص`);
    window.clearTimeout(window.__toastT);
    window.__toastT = window.setTimeout(() => setToast(null), 3200);
  }

  React.useEffect(() => {
    if (roleId !== "sup" && roleId !== "mgr" && device === "tablet") setDevice("mobile");
    setTab(ROLES.find(r => r.id === roleId).nav[0].id);
    setSelected(null);
  }, [roleId]); // eslint-disable-line

  const isTablet = device === "tablet" && (roleId === "sup" || roleId === "mgr");

  return (
    <div className="sr-app" dir="rtl">
      <style>{CSS}</style>

      <div className={"frame " + (isTablet ? "frame-wide" : "frame-mobile")}>
        {/* HEADER */}
        <header className="appbar">
          <div className="appbar-row">
            <div className="brand">
              <span className="brand-mark">س</span>
              <div className="brand-text">
                <div className="brand-name">سجل التنفيذ</div>
                <div className="brand-date nums">الخميس، ١٤ أغسطس</div>
              </div>
            </div>
            <div className="appbar-actions">
              <button className="icon-btn" aria-label="بحث"><Search size={18} /></button>
              <button className="icon-btn" aria-label="الإشعارات">
                <Bell size={18} />
                <span className="dot-badge" />
              </button>
              <button className="icon-btn" aria-label="دليل حالات الواجهة" onClick={() => setGuideOpen(true)}>
                <BookOpen size={18} />
              </button>
            </div>
          </div>

          <div className="role-row">
            <button className="role-select" onClick={() => setRoleMenuOpen(o => !o)}>
              <UserRound size={14} />
              <span>عرض تجريبي: {role.label}</span>
              <ChevronDown size={14} className={roleMenuOpen ? "chev open" : "chev"} />
            </button>
            {(roleId === "sup" || roleId === "mgr") && (
              <div className="device-toggle">
                <button className={device === "mobile" ? "dev-btn active" : "dev-btn"} onClick={() => setDevice("mobile")}>
                  <Smartphone size={13} /> هاتف
                </button>
                <button className={device === "tablet" ? "dev-btn active" : "dev-btn"} onClick={() => setDevice("tablet")}>
                  <Monitor size={13} /> لوحة إشراف
                </button>
              </div>
            )}
          </div>

          {roleMenuOpen && (
            <div className="role-menu">
              {ROLES.map(r => (
                <button key={r.id} className={"role-opt" + (r.id === roleId ? " active" : "")}
                  onClick={() => { setRoleId(r.id); setRoleMenuOpen(false); }}>
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* CONTENT */}
        {isTablet ? (
          <TabletSplit
            role={roleId}
            variant={variant}
            items={liveItems}
            queues={supQueues}
            openQueue={openQueue}
            setOpenQueue={setOpenQueue}
            selected={selected}
            onOpen={openItem}
            onComplete={completeItem}
            heroItem={heroItem}
            queueTop={queueTop}
          />
        ) : (
          <main className="content">
            {tab === "day" || tab === "review" ? (
              <>
                <HeroAction role={roleId} item={heroItem} onOpen={openItem} queueTop={roleId === "sup" ? queueTop : null} />

                {roleId === "sup" && (
                  <>
                    <div className="section-label">طوابير تحتاج تدخّل</div>
                    <div className="reg-list">
                      {supQueues.map(q => (
                        <QueueRegister key={q.id} q={q} open={openQueue === q.id} onToggle={() => setOpenQueue(openQueue === q.id ? null : q.id)} />
                      ))}
                    </div>
                    <div className="section-label">أولويات فريقك اليوم</div>
                  </>
                )}

                {roleId === "mgr" && <div className="section-label">مراجعة العمليات المملوكة</div>}
                {(roleId === "rep" || roleId === "tele") && <div className="section-label">مسار التزامات اليوم</div>}

                <div className="rail-list">
                  {liveItems.map((it, i) => (
                    <RailItem key={it.id} item={it} onOpen={openItem} first={i === 0} last={i === liveItems.length - 1} variant={variant} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyTab label={role.nav.find(n => n.id === tab)?.label} />
            )}
          </main>
        )}

        {/* BOTTOM NAV (mobile only) */}
        {!isTablet && (
          <nav className="bottom-nav">
            {role.nav.map(n => {
              const Icon = n.icon;
              return (
                <button key={n.id} className={tab === n.id ? "nav-btn active" : "nav-btn"} onClick={() => setTab(n.id)}>
                  <Icon size={19} strokeWidth={tab === n.id ? 2.4 : 2} />
                  <span>{n.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* DETAIL SHEET (mobile) */}
        {!isTablet && selected && (
          <div className="sheet-overlay" onClick={closeSheet}>
            <div className="sheet" onClick={e => e.stopPropagation()}>
              <div className="sheet-handle" />
              <div className="sheet-head">
                <div>
                  <div className="sheet-kind">{selected.kind}</div>
                  <div className="sheet-title">{selected.org}</div>
                  <div className="sheet-sub">{selected.who}</div>
                </div>
                <button className="icon-btn" onClick={closeSheet} aria-label="إغلاق"><X size={18} /></button>
              </div>
              <div className="sheet-scroll">
                <DetailBody item={selected} />
              </div>
              <div className="sheet-actions">
                {selected.phone && (
                  <button className="btn-secondary"><PhoneCall size={16} /></button>
                )}
                <button className="btn-secondary text-btn">تأجيل</button>
                {selected.status !== "completed" ? (
                  <button className="btn-primary" onClick={() => completeItem(selected)}>
                    تسجيل نتيجة {selected.kind}
                  </button>
                ) : (
                  <button className="btn-primary done" disabled>
                    <CheckCircle2 size={16} /> تم التسجيل
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* STATES GUIDE MODAL */}
      {guideOpen && (
        <div className="guide-overlay" onClick={() => setGuideOpen(false)}>
          <div className="guide-panel" onClick={e => e.stopPropagation()}>
            <div className="guide-head">
              <div className="guide-title">دليل حالات مسار الالتزام</div>
              <button className="icon-btn" onClick={() => setGuideOpen(false)}><X size={18} /></button>
            </div>
            <div className="guide-body">
              <div className="rail-list guide-rail">
                <RailItem item={repItems[1]} onOpen={() => {}} first last={false} variant="field" />
                <RailItem item={{ ...repItems[0] }} onOpen={() => {}} first={false} last={false} variant="field" />
                <RailSkeleton />
                <RailError onRetry={() => {}} />
                <RailRestricted />
                <RailEmpty text="لا توجد التزامات متبقية اليوم" />
              </div>
              <p className="guide-note">تُستخدم هذه الحالات ضمن السياق الفعلي للمسار، وليست شاشات منفصلة: عادي، متأخر، مكتمل، تحميل، خطأ مع إعادة محاولة، مقيّد حسب الدور، وفارغ.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  TABLET / DESKTOP SPLIT (supervisor & manager)                          */
/* ---------------------------------------------------------------------- */

function TabletSplit({ role, variant, items, queues, openQueue, setOpenQueue, selected, onOpen, onComplete, heroItem, queueTop }) {
  const activeItem = selected || heroItem || items[0];
  return (
    <div className="split">
      <div className="split-list">
        <HeroAction role={role} item={heroItem} onOpen={onOpen} queueTop={role === "sup" ? queueTop : null} />
        {role === "sup" && (
          <>
            <div className="section-label">طوابير تحتاج تدخّل</div>
            <div className="reg-list">
              {queues.map(q => (
                <QueueRegister key={q.id} q={q} open={openQueue === q.id} onToggle={() => setOpenQueue(openQueue === q.id ? null : q.id)} />
              ))}
            </div>
          </>
        )}
        <div className="section-label">{role === "sup" ? "أولويات فريقك اليوم" : "مراجعة العمليات المملوكة"}</div>
        <div className="rail-list">
          {items.map((it, i) => (
            <RailItem key={it.id} item={it} onOpen={onOpen} first={i === 0} last={i === items.length - 1} variant={variant} />
          ))}
        </div>
      </div>
      <div className="split-detail">
        {activeItem ? (
          <>
            <div className="detail-pane-head">
              <div>
                <div className="sheet-kind">{activeItem.kind}</div>
                <div className="sheet-title">{activeItem.org}</div>
                <div className="sheet-sub">{activeItem.who} · {activeItem.due}</div>
              </div>
              <StatusPill status={activeItem.status} />
            </div>
            <div className="detail-pane-body">
              <DetailBody item={activeItem} />
            </div>
            <div className="detail-pane-actions">
              <button className="btn-secondary text-btn">تأجيل</button>
              {activeItem.status !== "completed" ? (
                <button className="btn-primary" onClick={() => onComplete(activeItem)}>تسجيل النتيجة</button>
              ) : (
                <button className="btn-primary done" disabled><CheckCircle2 size={16} /> تم التسجيل</button>
              )}
            </div>
          </>
        ) : (
          <div className="tab-placeholder">
            <PackageCheck size={22} color="var(--ink-300)" />
            <div className="tab-placeholder-title">اختر بندًا من القائمة لعرض تفاصيله</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CSS                                                                     */
/* ---------------------------------------------------------------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');

.sr-app {
  --ink-900:#16283F; --ink-800:#1D3358; --ink-700:#2C4972; --ink-500:#5B6B84; --ink-400:#7C8CA6; --ink-300:#93A0B3;
  --action:#3576B8; --action-soft:#4285C5;
  --canvas:#FCFDFE; --canvas-alt:#F5F8FB;
  --rule:#DCE5EE; --quiet-blue:#EAF3FB;
  --success:#167A5B; --success-bg:#E5F4EF;
  --caution:#A45A08; --caution-bg:#FBF0E1;
  --danger:#B42318; --danger-bg:#FCEAE8;
  --stamp:#A97A2F; --stamp-soft:#E4C583; --stamp-bg:#F3EAD4;
  font-family:'Noto Sans Arabic', system-ui, sans-serif;
  color:var(--ink-900);
  background:var(--canvas-alt);
  display:flex; justify-content:center; align-items:flex-start;
  min-height:100vh; padding:20px 10px; box-sizing:border-box;
  position:relative;
}
.sr-app *{box-sizing:border-box;}
.sr-app button{font-family:inherit; cursor:pointer; border:none; background:none; color:inherit; text-align:inherit;}
.sr-app *:focus-visible{outline:2px solid var(--action); outline-offset:2px; border-radius:4px;}
.nums{font-variant-numeric:tabular-nums; font-feature-settings:"tnum"; letter-spacing:.2px;}

.frame{background:var(--canvas); border:1px solid var(--rule); overflow:hidden; display:flex; flex-direction:column; box-shadow:0 1px 2px rgba(29,51,88,.04);}
.frame-mobile{width:390px; max-width:100%; height:780px; border-radius:22px;}
.frame-wide{width:100%; max-width:1080px; height:720px; border-radius:14px;}

/* ---------- header ---------- */
.appbar{border-bottom:1px solid var(--rule); padding:14px 16px 0; flex-shrink:0; position:relative;}
.appbar-row{display:flex; align-items:center; justify-content:space-between;}
.brand{display:flex; align-items:center; gap:10px;}
.brand-mark{width:32px; height:32px; border-radius:8px; background:var(--ink-900); color:#fff; display:flex; align-items:center; justify-content:center; font-family:'Tajawal',sans-serif; font-weight:800; font-size:16px;}
.brand-name{font-family:'Tajawal',sans-serif; font-weight:700; font-size:14px; line-height:1.2;}
.brand-date{font-size:11px; color:var(--ink-500); margin-top:1px;}
.appbar-actions{display:flex; gap:4px;}
.icon-btn{width:38px; height:38px; display:flex; align-items:center; justify-content:center; border-radius:9px; color:var(--ink-700); position:relative;}
.icon-btn:hover{background:var(--canvas-alt);}
.dot-badge{position:absolute; top:8px; left:9px; width:6px; height:6px; border-radius:50%; background:var(--danger);}

.role-row{display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 0 12px;}
.role-select{display:flex; align-items:center; gap:6px; font-size:12px; color:var(--ink-700); background:var(--canvas-alt); border:1px solid var(--rule); padding:6px 10px; border-radius:8px; min-height:32px;}
.chev{transition:transform .15s ease;}
.chev.open{transform:rotate(180deg);}
.device-toggle{display:flex; background:var(--canvas-alt); border:1px solid var(--rule); border-radius:8px; padding:2px; gap:2px;}
.dev-btn{display:flex; align-items:center; gap:5px; font-size:11px; padding:5px 10px; border-radius:6px; color:var(--ink-500);}
.dev-btn.active{background:var(--ink-900); color:#fff;}
.role-menu{position:absolute; top:100%; right:16px; left:16px; background:var(--canvas); border:1px solid var(--rule); border-radius:10px; box-shadow:0 8px 24px rgba(29,51,88,.12); z-index:40; overflow:hidden;}
.role-opt{display:block; width:100%; padding:12px 14px; font-size:13px; min-height:44px; border-bottom:1px solid var(--rule);}
.role-opt:last-child{border-bottom:none;}
.role-opt.active{color:var(--action); font-weight:600; background:var(--quiet-blue);}
.role-opt:hover{background:var(--canvas-alt);}

/* ---------- content ---------- */
.content{flex:1; overflow-y:auto; padding:16px 16px 24px;}
.section-label{font-family:'Tajawal',sans-serif; font-weight:700; font-size:13px; color:var(--ink-700); margin:22px 2px 10px; border-inline-start:2px solid var(--stamp); padding-inline-start:8px;}

/* ---------- hero: the day's heading tab ---------- */
.hero{display:block; width:100%; background:var(--ink-900); color:#fff; border-radius:8px; border-top:3px solid var(--stamp); padding:16px 18px; text-align:right; min-height:44px;}
.hero:hover{background:var(--ink-700);}
.hero-eyebrow{font-size:11px; color:var(--stamp-soft); margin-bottom:6px; letter-spacing:.3px; font-weight:600;}
.hero-title{font-family:'Tajawal',sans-serif; font-weight:700; font-size:17px; line-height:1.35;}
.hero-meta{font-size:12px; color:#C9D8EC; margin-top:6px;}

/* ---------- commitment rail: a ruled ledger, not a stack of cards ---------- */
.rail-list{display:flex; flex-direction:column;}
.rail-item{display:flex; align-items:stretch; gap:10px; border-top:1px solid var(--rule);}
.rail-item-first{border-top:none;}
.rail-spine{width:52px; flex-shrink:0; display:flex; flex-direction:column; align-items:center; position:relative; padding-top:16px;}
.rail-time{font-size:11px; color:var(--ink-500); font-weight:500; margin-bottom:6px;}
.rail-node{width:12px; height:12px; flex-shrink:0; z-index:2; box-sizing:border-box;}
.node-normal{border-radius:50%; border:2px solid var(--action); background:var(--canvas);}
.node-urgent{border-radius:2px; background:var(--danger); transform:rotate(45deg);}
.node-completed{border-radius:50%; background:var(--success); box-shadow:inset 0 0 0 2px var(--canvas);}
.node-empty{border-radius:50%; border:1.5px dashed var(--ink-300); background:var(--canvas);}
.node-error{border-radius:50%; border:2px solid var(--caution); background:var(--canvas);}
.rail-line{position:absolute; width:1px; background:var(--rule); right:50%; left:50%; margin:0 auto;}
.rail-line-top{top:0; height:22px;}
.rail-line-bottom{bottom:0; top:33px;}
.rail-card{flex:1; background:transparent; border:none; border-radius:0; padding:14px 4px 16px 0; margin:0; display:flex; flex-direction:column; gap:5px; transition:background-color .12s ease;}
.rail-card:not(.no-hover):hover{background:var(--canvas-alt); margin:0 -4px; padding-inline:8px 4px; border-radius:8px;}
.rail-card.no-hover{cursor:default; padding:14px 4px 16px 0;}
.rail-card-top{display:flex; align-items:center; justify-content:space-between; gap:8px;}
.rail-kind{font-size:11px; color:var(--ink-500); font-weight:500;}
.status-tag{display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; letter-spacing:.15px;}
.rail-title{font-family:'Tajawal',sans-serif; font-weight:600; font-size:14.5px; line-height:1.3;}
.rail-sub{font-size:12px; color:var(--ink-500);}
.rail-note{font-size:12.5px; color:var(--ink-700); border-inline-start:2px solid var(--rule); padding-inline-start:8px; line-height:1.5;}
.rail-owner{display:flex; align-items:center; gap:5px; font-size:11.5px; color:var(--ink-500);}
.rail-next{display:flex; align-items:center; gap:4px; font-size:12px; color:var(--ink-700); margin-top:1px;}
.decision-row{display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:2px;}
.decision-opt{font-size:12.5px; font-weight:700; color:var(--stamp); border-bottom:1.5px solid var(--stamp-bg); padding-bottom:1px;}
.decision-or{font-size:11px; color:var(--ink-400);}
.rail-foot{display:flex; align-items:center; justify-content:space-between; margin-top:3px;}
.rail-due{font-size:11px; color:var(--ink-500);}
.rail-due.danger{color:var(--danger); font-weight:700;}
.rail-amount{font-size:12px; font-weight:700; color:var(--ink-900);}
.rail-amount.big{font-size:16px;}

/* skeleton */
.skeleton-node{border-radius:50%; border:2px solid var(--rule); background:var(--canvas); animation:none;}
.skeleton-line{height:10px; border-radius:5px; background:linear-gradient(90deg, var(--rule) 25%, #EEF2F7 37%, var(--rule) 63%); background-size:400% 100%; animation:shimmer 1.6s ease infinite;}
@keyframes shimmer{0%{background-position:100% 0;}100%{background-position:0 0;}}
.empty-card{flex-direction:row; align-items:center; gap:8px; color:var(--ink-300); font-size:12.5px; justify-content:flex-start;}
.restricted-card{flex-direction:row; align-items:center; gap:8px; color:var(--ink-300); font-size:12.5px;}
.error-card{color:var(--caution);}
.retry-btn{display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:var(--caution); margin-top:4px; min-height:32px;}

/* ---------- exception register (supervisor queues, ledger-styled) ---------- */
.reg-list{display:flex; flex-direction:column;}
.reg-row{border-top:1px solid var(--rule);}
.reg-row:first-child{border-top:none;}
.reg-head{display:flex; align-items:center; gap:12px; width:100%; padding:12px 4px; min-height:44px;}
.reg-mark{width:10px; height:10px; flex-shrink:0;}
.mark-urgent{background:var(--danger); border-radius:2px; transform:rotate(45deg);}
.mark-caution{background:var(--caution); border-radius:3px;}
.mark-normal{border-radius:50%; border:2px solid var(--action); background:var(--canvas);}
.reg-count{font-size:16px; font-weight:700; color:var(--ink-900); min-width:22px; text-align:center; flex-shrink:0;}
.reg-text{flex:1; text-align:right;}
.reg-label{font-size:13.5px; font-weight:600; color:var(--ink-800);}
.reg-age{font-size:11.5px; color:var(--ink-500); margin-top:1px;}
.reg-breakdown{padding:2px 4px 12px 34px;}
.breakdown-row{display:flex; align-items:center; gap:10px; padding:7px 0; font-size:12.5px; border-bottom:1px dashed var(--rule);}
.breakdown-row:last-child{border-bottom:none;}
.breakdown-who{flex:1; color:var(--ink-700);}
.breakdown-count{font-weight:700;}
.breakdown-age{color:var(--ink-500); font-size:11.5px; min-width:70px; text-align:left;}

/* ---------- bottom nav ---------- */
.bottom-nav{display:flex; border-top:1px solid var(--rule); background:var(--canvas); flex-shrink:0;}
.nav-btn{flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:9px 0 10px; color:var(--ink-300); font-size:10.5px; min-height:44px;}
.nav-btn.active{color:var(--action);}
.nav-btn span{font-weight:600;}

/* ---------- empty tab placeholder ---------- */
.tab-placeholder{display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px; padding:60px 20px; color:var(--ink-500);}
.tab-placeholder-title{font-family:'Tajawal',sans-serif; font-weight:700; font-size:14px; color:var(--ink-700);}
.tab-placeholder-text{font-size:12px; max-width:260px; line-height:1.6;}

/* ---------- sheet ---------- */
.sheet-overlay{position:absolute; inset:0; background:rgba(22,40,63,.35); display:flex; align-items:flex-end; z-index:50; border-radius:22px; animation:fadeIn .18s ease;}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
.sheet{background:var(--canvas); width:100%; max-height:88%; border-radius:18px 18px 0 0; display:flex; flex-direction:column; animation:slideUp .22s cubic-bezier(.2,.8,.2,1);}
@keyframes slideUp{from{transform:translateY(24px); opacity:.6;}to{transform:translateY(0); opacity:1;}}
.sheet-handle{width:36px; height:4px; border-radius:3px; background:var(--rule); margin:10px auto 4px;}
.sheet-head{display:flex; align-items:flex-start; justify-content:space-between; padding:8px 18px 14px; border-bottom:1px solid var(--rule);}
.sheet-kind{font-size:11.5px; color:var(--ink-500); margin-bottom:3px;}
.sheet-title{font-family:'Tajawal',sans-serif; font-weight:700; font-size:16.5px;}
.sheet-sub{font-size:12.5px; color:var(--ink-500); margin-top:2px;}
.sheet-scroll{overflow-y:auto; padding:16px 18px; flex:1;}
.sheet-actions{display:flex; gap:8px; padding:12px 18px 16px; border-top:1px solid var(--rule);}

/* ---------- snapshot + timeline ---------- */
.snap-grid{display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--rule); border:1px solid var(--rule); margin-bottom:20px; border-radius:8px; overflow:hidden;}
.snap-cell{background:var(--canvas); padding:10px 12px; display:flex; flex-direction:column; gap:4px;}
.snap-label{display:flex; align-items:center; gap:5px; font-size:11px; color:var(--ink-500);}
.snap-value{font-size:13px; font-weight:600; color:var(--ink-900);}
.timeline{display:flex; flex-direction:column;}
.tl-row{display:flex; gap:10px;}
.tl-dot-col{display:flex; flex-direction:column; align-items:center; padding-top:4px;}
.tl-dot{width:8px; height:8px; border-radius:50%; background:var(--action-soft); flex-shrink:0;}
.tl-line{width:1px; flex:1; background:var(--rule); margin:2px 0;}
.tl-body{padding-bottom:16px; flex:1;}
.tl-when{font-size:11px; color:var(--ink-500); margin-bottom:2px;}
.tl-text{font-size:13px; color:var(--ink-900); line-height:1.5;}
.tl-out{display:flex; align-items:center; gap:4px; font-size:11.5px; color:var(--action); margin-top:4px;}

/* ---------- buttons ---------- */
.btn-primary{flex:1; background:var(--action); color:#fff; border-radius:9px; padding:0 16px; min-height:46px; font-weight:700; font-size:13.5px; display:flex; align-items:center; justify-content:center; gap:6px;}
.btn-primary:hover{background:var(--ink-900);}
.btn-primary.done{background:var(--success);}
.btn-secondary{background:var(--canvas-alt); border:1px solid var(--rule); border-radius:9px; width:46px; min-height:46px; display:flex; align-items:center; justify-content:center; color:var(--ink-700);}
.btn-secondary.text-btn{width:auto; padding:0 16px; font-size:13px; font-weight:600;}

/* ---------- toast ---------- */
.toast{position:fixed; bottom:28px; left:50%; transform:translateX(-50%); background:var(--ink-900); color:#fff; padding:12px 18px; border-radius:10px; display:flex; align-items:center; gap:8px; font-size:12.5px; box-shadow:0 10px 30px rgba(22,40,63,.28); z-index:100; max-width:320px; animation:fadeIn .2s ease;}

/* ---------- states guide modal ---------- */
.guide-overlay{position:fixed; inset:0; background:rgba(22,40,63,.4); display:flex; align-items:center; justify-content:center; z-index:200; padding:20px;}
.guide-panel{background:var(--canvas); width:420px; max-width:100%; max-height:82vh; border-radius:16px; display:flex; flex-direction:column; overflow:hidden;}
.guide-head{display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--rule);}
.guide-title{font-family:'Tajawal',sans-serif; font-weight:700; font-size:15px;}
.guide-body{padding:14px 16px 18px; overflow-y:auto;}
.guide-note{font-size:12px; color:var(--ink-500); line-height:1.7; margin-top:12px; padding:0 4px;}

/* ---------- tablet split (supervisor / manager) ---------- */
.split{flex:1; display:flex; overflow:hidden;}
.split-list{width:380px; flex-shrink:0; border-inline-start:1px solid var(--rule); overflow-y:auto; padding:16px;}
.split-detail{flex:1; overflow-y:auto; display:flex; flex-direction:column;}
.detail-pane-head{display:flex; align-items:flex-start; justify-content:space-between; padding:18px 22px; border-bottom:1px solid var(--rule);}
.detail-pane-body{padding:20px 22px; flex:1; overflow-y:auto;}
.detail-pane-actions{display:flex; gap:10px; padding:14px 22px; border-top:1px solid var(--rule); justify-content:flex-end;}
.detail-pane-actions .btn-primary{flex:none; padding:0 22px;}

@media (prefers-reduced-motion: reduce){
  .sr-app *{animation:none !important; transition:none !important;}
}
`;
