import React, { useState, useMemo } from "react";
import {
  Sun, ListChecks, Users, Activity, UsersRound, LayoutList, ClipboardCheck,
  Flag, BarChart3, Bell, Search, ChevronLeft, ChevronDown, Phone, MapPin,
  CheckCircle2, AlertTriangle, Lock, RotateCw, X, Building2, Wallet,
  PhoneCall, MessageSquareWarning, UserRound, Monitor, Smartphone, BookOpen,
  ArrowUpRight, CircleDot, PackageCheck, MessageCircleWarning, Clock, ChevronRight,
  Package, Coins, Radar, UserPlus, UserMinus, Sparkles, CalendarClock,
  Info, Plus, Minus
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
  { id: "r1", time: "09:00", kind: "زيارة عميل", title: "زيارة تغطية دورية", who: "كريم منصور", org: "سوبر ماركت الأمانة", area: "فيصل، الجيزة", status: "completed", owner: "أنت", due: "تم قبل 3 ساعات", next: "تم تسجيل طلبية بقيمة 6,800 ج.م", amount: "6,800 ج.م", phone: "01012345001", customerId: "c1" },
  { id: "r2", time: "11:30", kind: "زيارة تحصيل", title: "زيارة تحصيل وعد سداد", who: "هبة الشناوي", org: "صيدليات الشفاء", area: "الهرم، الجيزة", status: "urgent", owner: "أنت", due: "متأخرة 40 دقيقة", next: "تحصيل 4,200 ج.م أو تجديد الوعد كتابيًا", amount: "4,200 ج.م", phone: "01098765002", customerId: "c2" },
  { id: "r3", time: "13:00", kind: "زيارة عميل", title: "عرض تسعير جديد", who: "محمود عبد الرازق", org: "مطاعم الفنار", area: "الدقي، الجيزة", status: "normal", owner: "أنت", due: "خلال ساعتين", next: "عرض قائمة الأسعار المُحدّثة لشهر سبتمبر", amount: null, phone: "01123456003", customerId: "c3" },
  { id: "r4", time: "15:30", kind: "متابعة عميل", title: "متابعة إغلاق شكوى", who: "ياسمين توفيق", org: "توكيلات الشرق للسيارات", area: "المهندسين، الجيزة", status: "normal", owner: "أنت", due: "اليوم قبل الساعة 5", next: "تأكيد وصول قطعة الغيار المتأخرة", amount: null, phone: "01234567004", customerId: "c4" },
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

/* ---------------------------------------------------------------------- */
/*  CUSTOMER MASTER (rep-facing, kept concise on purpose)                  */
/*  Not a CRM record — just what a rep needs before/during a visit.        */
/* ---------------------------------------------------------------------- */

const CUSTOMERS = [
  { id: "c1", name: "سوبر ماركت الأمانة", contact: "كريم منصور", area: "فيصل، الجيزة", phone: "01012345001", classification: "عميل ذهبي", type: "active", balance: "لا يوجد رصيد مستحق", lastVisit: "اليوم — زيارة تغطية، طلبية 6,800 ج.م", activePromise: null, openComplaint: null, opportunity: "أبدى اهتمامًا بمنتج التنظيف الجديد" },
  { id: "c2", name: "صيدليات الشفاء", contact: "هبة الشناوي", area: "الهرم، الجيزة", phone: "01098765002", classification: "عميل يتطلب متابعة", type: "active", balance: "4,200 ج.م مستحقة", lastVisit: "منذ 3 أيام — وعد سداد", activePromise: "4,200 ج.م — يوم الخميس القادم", openComplaint: null, opportunity: null },
  { id: "c3", name: "مطاعم الفنار", contact: "محمود عبد الرازق", area: "الدقي، الجيزة", phone: "01123456003", classification: "عميل فضي", type: "active", balance: "لا يوجد رصيد مستحق", lastVisit: "منذ أسبوعين — زيارة تغطية", activePromise: null, openComplaint: null, opportunity: "توسعة الفرع الجديد قريبًا" },
  { id: "c4", name: "توكيلات الشرق للسيارات", contact: "ياسمين توفيق", area: "المهندسين، الجيزة", phone: "01234567004", classification: "عميل فضي", type: "active", balance: "لا يوجد رصيد مستحق", lastVisit: "منذ يومين — شكوى تأخير توصيل", activePromise: null, openComplaint: "تأخر وصول قطعة غيار عن الموعد المتفق عليه", opportunity: null },
  { id: "c5", name: "مصنع الأمل للأغذية", contact: "طارق حلمي", area: "أكتوبر، الجيزة", phone: "01011122005", classification: "عميل جديد", type: "new", balance: "—", lastVisit: "لا توجد زيارات سابقة", activePromise: null, openComplaint: null, opportunity: "أول زيارة تعريفية مطلوبة" },
  { id: "c6", name: "بقالة النصر", contact: "سيد فوزي", area: "إمبابة، الجيزة", phone: "01099988006", classification: "عميل متوقف", type: "inactive", balance: "لا يوجد رصيد مستحق", lastVisit: "منذ 4 أشهر", activePromise: null, openComplaint: null, opportunity: "توقف الشراء بعد خلاف على الأسعار — فرصة عودة محتملة" },
];

function getCustomer(id) {
  return CUSTOMERS.find(c => c.id === id) || null;
}

/* ---------------------------------------------------------------------- */
/*  OPERATIONAL LOGS (orders / collections / complaints / market)          */
/*  Seeded with today's already-known evidence; grows as the rep works.    */
/* ---------------------------------------------------------------------- */

const SEED_ORDERS = [
  { id: "o1", time: "09:00", customerId: "c1", customerName: "سوبر ماركت الأمانة", items: "منظف أرضيات 5 لتر × 12، صابون سائل 1 لتر × 24", value: "6,800 ج.م", status: "قيد التجهيز", responsible: "المخزن الرئيسي", next: "تجهيز الطلبية للتسليم غدًا", shortage: false },
];

const SEED_COLLECTIONS = [
  { id: "k1", time: "منذ 3 أيام", customerId: "c2", customerName: "صيدليات الشفاء", outstanding: "4,200 ج.م", collected: "0 ج.م", partial: false, promiseDate: "الخميس القادم", overdue: true },
];

const SEED_COMPLAINTS = [
  { id: "x1", time: "منذ يومين", customerId: "c4", customerName: "توكيلات الشرق للسيارات", description: "تأخر وصول قطعة غيار عن الموعد المتفق عليه بخمسة أيام", classification: "تأخير توصيل", owner: "قسم التوزيع", action: "تسريع الشحنة وتأكيد موعد جديد", followUp: "اليوم قبل الساعة 5", status: "قيد المعالجة", resolved: false },
];

const SEED_MARKET = [
  { id: "g1", time: "اليوم", customerId: "c1", customerName: "سوبر ماركت الأمانة", competitor: "شركة النجاح للتوزيع", product: "منظف أرضيات", competitorPrice: "أقل بنحو 8٪", promo: "خصم 10٪ عند الشراء بالجملة", note: "ذكر العميل عرض المنافس أثناء الزيارة" },
];

const SEED_OPPORTUNITIES = [];

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

/* ---------------------------------------------------------------------- */
/*  OUTCOME → NEXT COMMITMENT                                              */
/*  Closing a loop on the rail always opens the next one. This is the      */
/*  mechanic that makes it an operating rhythm rather than a task list.    */
/* ---------------------------------------------------------------------- */

const OUTCOME_TYPES = [
  { id: "order", label: "تسجيل طلبية", helper: "العميل وافق على شراء أصناف", Icon: Package },
  { id: "collection", label: "متابعة تحصيل", helper: "زيارة أو مكالمة تحصيل مستحقات", Icon: Coins },
  { id: "no_contact", label: "لم يتم الوصول للعميل", helper: "لا رد، مغلق، أو تأجيل من العميل", Icon: AlertTriangle },
  { id: "issue", label: "شكوى / مشكلة", helper: "عائق يحتاج متابعة وحل", Icon: MessageCircleWarning },
];

const NO_CONTACT_REASONS = ["لا يوجد بالمكان", "الخط مغلق", "مؤجل بطلب العميل"];

const PRODUCT_PRESETS = ["منظف أرضيات 5 لتر", "صابون سائل 1 لتر", "معطر جو", "منتج موسمي جديد"];

const COMPLAINT_CLASS = ["تأخير توصيل", "جودة منتج", "خطأ فاتورة", "أخرى"];
const COMPLAINT_OWNERS = ["قسم التوزيع", "قسم المبيعات", "الحسابات"];

const NEED_CATEGORIES = ["منتجات تنظيف", "عناية شخصية", "أغذية ومشروبات", "أخرى"];
const OPP_RESULTS = ["تم البيع الآن", "يحتاج عرض سعر", "مؤجل"];

const TIMING_PRESETS = [
  { id: "tomorrow", label: "غدًا · 10:00 ص", due: "غدًا الساعة 10:00 ص", time: "10:00" },
  { id: "later", label: "اليوم لاحقًا · 4:00 م", due: "اليوم الساعة 4:00 م", time: "16:00" },
];

/** Turns what just happened in the field into what happens next on the
 *  rail — including, sometimes, nothing at all when a loop is fully closed. */
function deriveNextCommitments(item, ctx) {
  const timing = TIMING_PRESETS.find(t => t.id === ctx.preset) || TIMING_PRESETS[0];
  const list = [];
  const base = { area: item.area, owner: "أنت", phone: item.phone, customerId: item.customerId, who: item.who, org: item.org, title: item.title, status: "normal" };

  if (ctx.outcomeType === "order") {
    list.push({ ...base, id: item.id + "-ord-" + Date.now(), time: timing.time, kind: "متابعة تسليم", due: timing.due, next: `تأكيد تسليم الطلبية (${ctx.orderValue || "قيمة غير محددة"})`, amount: ctx.orderValue || null });
  } else if (ctx.outcomeType === "collection") {
    if (!ctx.fullyCollected) {
      list.push({ ...base, id: item.id + "-col-" + Date.now(), time: timing.time, kind: item.kind, due: ctx.promiseDate ? `وعد سداد — ${ctx.promiseDate}` : timing.due, next: `متابعة تحصيل الرصيد المتبقي${ctx.partial ? " بعد تحصيل جزئي" : ""}`, amount: ctx.outstanding || null });
    }
    // fully collected → loop closes, no further commitment needed
  } else if (ctx.outcomeType === "no_contact") {
    list.push({ ...base, id: item.id + "-nc-" + Date.now(), time: timing.time, kind: item.kind, due: timing.due, next: `إعادة محاولة — ${ctx.reason || "لم يُحدَّد السبب"}`, amount: null });
  } else if (ctx.outcomeType === "issue") {
    list.push({ ...base, id: item.id + "-iss-" + Date.now(), time: timing.time, kind: "متابعة شكوى", due: ctx.followUp || timing.due, next: ctx.action || "متابعة حل المشكلة مع العميل", amount: null });
    if (ctx.escalate) {
      list.push({ ...base, id: item.id + "-esc-" + Date.now(), time: timing.time, kind: "متابعة تصعيد", due: timing.due, next: "تأكيد استلام المشرف للشكوى المصعَّدة", amount: null, owner: "أنت (تصعيد للمشرف)" });
    }
  }

  if (ctx.needAdded && ctx.oppResult === "يحتاج عرض سعر") {
    list.push({ ...base, id: item.id + "-opp-" + Date.now(), time: timing.time, kind: "متابعة فرصة بيع", due: timing.due, next: `إرسال عرض سعر — ${ctx.needCategory || "فئة غير محددة"}`, amount: null });
  }

  return list;
}

function buildDetail(item) {
  const cust = item.customerId ? getCustomer(item.customerId) : null;
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
    phone: cust?.phone || item.phone || "01000000000",
    balance: cust?.balance || item.amount || "لا يوجد رصيد مستحق",
    tier: cust?.classification || (item.status === "urgent" ? "عميل يتطلب متابعة" : "عميل فضي"),
    area: cust?.area || item.area,
    activePromise: cust?.activePromise || null,
    openComplaint: cust?.openComplaint || null,
    opportunity: cust?.opportunity || null,
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
  const flags = [d.activePromise, d.openComplaint, d.opportunity].filter(Boolean);
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

      {flags.length > 0 && (
        <div className="flag-list">
          {d.activePromise && <div className="flag-row flag-promise"><CalendarClock size={13} /><span>وعد سداد نشط — {d.activePromise}</span></div>}
          {d.openComplaint && <div className="flag-row flag-issue"><MessageCircleWarning size={13} /><span>شكوى مفتوحة — {d.openComplaint}</span></div>}
          {d.opportunity && <div className="flag-row flag-opp"><Sparkles size={13} /><span>{d.opportunity}</span></div>}
        </div>
      )}

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
/*  REP WORKSPACE — morning strip, customer register, activity, close/report */
/* ---------------------------------------------------------------------- */

function MorningStrip({ liveItems }) {
  const planned = liveItems.length;
  const overdue = liveItems.filter(i => i.status === "urgent").length;
  const promises = liveItems.filter(i => i.kind.includes("تحصيل")).length;
  const complaints = liveItems.filter(i => i.kind.includes("شكوى") || i.kind.includes("مشكلة")).length;
  return (
    <div className="morning-strip">
      <span className="mstat"><b className="nums">{planned}</b> زيارات مخطط لها اليوم</span>
      <span className="ctx-dot">·</span>
      <span className="mstat"><b className="nums">{overdue}</b> متأخرة</span>
      <span className="ctx-dot">·</span>
      <span className="mstat"><b className="nums">{promises}</b> وعد تحصيل</span>
      <span className="ctx-dot">·</span>
      <span className="mstat"><b className="nums">{complaints}</b> شكوى مفتوحة</span>
    </div>
  );
}

function CustomerRow({ cust, onOpen }) {
  const markClass = cust.type === "inactive" ? "mark-empty" : cust.type === "new" ? "mark-new" : "mark-normal";
  return (
    <button className="reg-head cust-row" onClick={() => onOpen(cust.id)}>
      <span className={"reg-mark " + markClass} />
      <span className="reg-text">
        <span className="reg-label">{cust.name}</span>
        <span className="reg-age">{cust.classification} · {cust.area}</span>
      </span>
      {cust.type === "new" && <span className="type-flag flag-new"><UserPlus size={11} /> جديد</span>}
      {cust.type === "inactive" && <span className="type-flag flag-inactive"><UserMinus size={11} /> متوقف</span>}
      {cust.openComplaint && <span className="type-flag flag-issue"><MessageCircleWarning size={11} /></span>}
      <ChevronLeft size={15} color="var(--ink-300)" />
    </button>
  );
}

function CustomerSheet({ cust, onClose, onActivate }) {
  const isActionable = cust.type === "new" || cust.type === "inactive";
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div>
            <div className="sheet-kind">{cust.classification}</div>
            <div className="sheet-title">{cust.name}</div>
            <div className="sheet-sub">{cust.contact} · {cust.area}</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
        </div>
        <div className="sheet-scroll">
          <div className="snap-grid">
            <div className="snap-cell"><span className="snap-label"><Phone size={12} /> الهاتف</span><span className="snap-value nums">{cust.phone}</span></div>
            <div className="snap-cell"><span className="snap-label"><Wallet size={12} /> الرصيد</span><span className="snap-value nums">{cust.balance}</span></div>
            <div className="snap-cell"><span className="snap-label"><Clock size={12} /> آخر زيارة</span><span className="snap-value">{cust.lastVisit}</span></div>
            <div className="snap-cell"><span className="snap-label"><Building2 size={12} /> التصنيف</span><span className="snap-value">{cust.classification}</span></div>
          </div>
          {(cust.activePromise || cust.openComplaint || cust.opportunity) && (
            <div className="flag-list">
              {cust.activePromise && <div className="flag-row flag-promise"><CalendarClock size={13} /><span>{cust.activePromise}</span></div>}
              {cust.openComplaint && <div className="flag-row flag-issue"><MessageCircleWarning size={13} /><span>{cust.openComplaint}</span></div>}
              {cust.opportunity && <div className="flag-row flag-opp"><Sparkles size={13} /><span>{cust.opportunity}</span></div>}
            </div>
          )}
        </div>
        {isActionable && (
          <div className="sheet-actions">
            <button className="btn-primary" onClick={() => onActivate(cust)}>
              {cust.type === "new" ? "جدولة زيارة تعريفية" : "بدء التفعيل"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EvidenceRow({ time, kind, text, amount }) {
  return (
    <div className="evidence-row">
      <span className="evidence-time nums">{time}</span>
      <span className="evidence-body">
        <span className="rail-kind">{kind}</span>
        <span className="evidence-text">{text}</span>
      </span>
      {amount && <span className="rail-amount nums">{amount}</span>}
    </div>
  );
}

function RepActivityTab({ completedVisits, orders, collections, complaints, marketObs }) {
  return (
    <>
      <div className="section-label">زيارات مكتملة</div>
      <div className="evidence-list">
        {completedVisits.length ? completedVisits.map(v => (
          <EvidenceRow key={v.id} time={v.time} kind={v.kind} text={`${v.who} · ${v.org}`} amount={v.amount} />
        )) : <div className="empty-note">لا توجد زيارات مكتملة بعد</div>}
      </div>

      <div className="section-label">طلبات مسجلة</div>
      <div className="evidence-list">
        {orders.length ? orders.map(o => (
          <EvidenceRow key={o.id} time={o.time} kind={o.customerName} text={o.items} amount={o.value} />
        )) : <div className="empty-note">لا توجد طلبات مسجلة بعد</div>}
      </div>

      <div className="section-label">تحصيل ووعود</div>
      <div className="evidence-list">
        {collections.length ? collections.map(k => (
          <EvidenceRow key={k.id} time={k.time} kind={k.customerName} text={k.promiseDate ? `وعد جديد — ${k.promiseDate}` : "تم التحصيل بالكامل"} amount={k.collected} />
        )) : <div className="empty-note">لا توجد متابعات تحصيل بعد</div>}
      </div>

      <div className="section-label">شكاوى ومشاكل</div>
      <div className="evidence-list">
        {complaints.length ? complaints.map(x => (
          <EvidenceRow key={x.id} time={x.time} kind={x.customerName} text={`${x.classification} — ${x.status}`} />
        )) : <div className="empty-note">لا توجد شكاوى مسجلة اليوم</div>}
      </div>

      <div className="section-label">ملاحظات سوق</div>
      <div className="evidence-list">
        {marketObs.length ? marketObs.map(g => (
          <EvidenceRow key={g.id} time={g.time} kind={g.customerName} text={`${g.competitor}${g.competitorPrice ? " — " + g.competitorPrice : ""}`} />
        )) : <div className="empty-note">لا توجد ملاحظات سوق اليوم</div>}
      </div>
    </>
  );
}

function RepCloseDayTab({ liveItems, plannedCount, orders, collections, complaints, marketObs, opportunities, injectedTomorrow, dayClosed, onClose }) {
  const [open, setOpen] = useState("visits");
  const completed = liveItems.filter(i => i.status === "completed");
  const open_ = liveItems.filter(i => i.status !== "completed");

  const rows = [
    { id: "visits", severity: "normal", count: completed.length, label: `زيارات منجزة من أصل ${plannedCount}`, sub: `${Math.max(plannedCount - completed.length, 0)} متبقية اليوم`, items: liveItems.map(i => `${i.time} — ${i.org} (${i.status === "completed" ? "منجزة" : i.status === "urgent" ? "متأخرة" : "قيد الانتظار"})`) },
    { id: "open", severity: open_.length ? "urgent" : "normal", count: open_.length, label: "التزامات مفتوحة", sub: open_.length ? "تحتاج إغلاق قبل نهاية اليوم" : "لا يوجد التزامات مفتوحة", items: open_.map(i => `${i.time} — ${i.org} · ${i.next}`) },
    { id: "collections", severity: "caution", count: collections.length, label: "تحصيل ووعود سداد", sub: `${collections.filter(k => k.promiseDate).length} وعد جديد`, items: collections.map(k => `${k.customerName} — ${k.collected}${k.promiseDate ? " · وعد " + k.promiseDate : ""}`) },
    { id: "complaints", severity: complaints.some(x => !x.resolved) ? "urgent" : "normal", count: complaints.length, label: "شكاوى ومشاكل", sub: `${complaints.filter(x => !x.resolved).length} غير مغلقة`, items: complaints.map(x => `${x.customerName} — ${x.classification} (${x.status})`) },
    { id: "orders", severity: "normal", count: orders.length, label: "طلبات مسجلة", sub: orders.length ? "بانتظار مراجعة الائتمان" : "لا توجد طلبات اليوم", items: orders.map(o => `${o.customerName} — ${o.items} (${o.value})`) },
    { id: "customers", severity: "normal", count: opportunities.length, label: "فرص بيع / احتياجات إضافية", sub: opportunities.length ? "تحتاج متابعة" : "لا يوجد", items: opportunities.map(n => `${n.customerName} — ${n.category} (${n.result})`) },
    { id: "market", severity: "normal", count: marketObs.length, label: "ملاحظات سوق", sub: marketObs.length ? "رُصدت اليوم" : "لا يوجد", items: marketObs.map(g => `${g.customerName} — ${g.competitor}`) },
    { id: "tomorrow", severity: "normal", count: injectedTomorrow.length, label: "متابعات الغد", sub: injectedTomorrow.length ? "أُنشئت تلقائيًا من نتائج اليوم" : "لا يوجد متابعات مجدولة", items: injectedTomorrow.map(i => `${i.due} — ${i.org} · ${i.next}`) },
  ];

  return (
    <>
      <div className="section-label">إغلاق يومي</div>
      <div className="reg-list">
        {rows.map(r => (
          <div className="reg-row" key={r.id}>
            <button className="reg-head" onClick={() => setOpen(open === r.id ? null : r.id)}>
              <span className={"reg-mark mark-" + r.severity} />
              <span className="reg-count nums">{r.count}</span>
              <span className="reg-text">
                <span className="reg-label">{r.label}</span>
                <span className="reg-age">{r.sub}</span>
              </span>
              <ChevronDown size={16} className={open === r.id ? "chev open" : "chev"} />
            </button>
            {open === r.id && (
              <div className="reg-breakdown">
                {r.items.length ? r.items.map((t, i) => (
                  <div className="breakdown-row" key={i}><span className="breakdown-who">{t}</span></div>
                )) : <div className="breakdown-row"><span className="breakdown-who">لا توجد بنود</span></div>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="demo-note"><Info size={12} /> هدف تجريبي: 4 زيارات يوميًا · بيانات تجريبية لأغراض العرض فقط</div>

      <button className="btn-primary close-day-btn" disabled={dayClosed} onClick={onClose}>
        {dayClosed ? (<><CheckCircle2 size={16} /> تم إغلاق اليوم</>) : "تأكيد إغلاق اليوم"}
      </button>
    </>
  );
}

function OutcomeCapture({ item, existingOrders, onSave, onCancel }) {
  const isVisit = item.kind.includes("زيارة");
  const cust = item.customerId ? getCustomer(item.customerId) : null;

  const [started, setStarted] = useState(false);
  const [startedAt] = useState(item.time);
  const [outcomeType, setOutcomeType] = useState(null);
  const [preset, setPreset] = useState("tomorrow");

  // order
  const [orderItems, setOrderItems] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  const [orderValue, setOrderValue] = useState("");
  const [shortage, setShortage] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);

  // collection
  const outstanding = cust?.balance && cust.balance !== "لا يوجد رصيد مستحق" ? cust.balance : "4,200 ج.م";
  const [collected, setCollected] = useState("");
  const [fullyCollected, setFullyCollected] = useState(false);
  const [promiseDate, setPromiseDate] = useState("الخميس القادم");

  // no contact
  const [reason, setReason] = useState(null);

  // issue
  const [complaintClass, setComplaintClass] = useState(null);
  const [complaintOwner, setComplaintOwner] = useState(null);
  const [action, setAction] = useState("");
  const [followUp, setFollowUp] = useState("اليوم قبل الساعة 5");
  const [escalate, setEscalate] = useState(false);

  // optional add-ons
  const [needOpen, setNeedOpen] = useState(false);
  const [needCategory, setNeedCategory] = useState(null);
  const [oppResult, setOppResult] = useState(null);

  const [marketOpen, setMarketOpen] = useState(false);
  const [competitor, setCompetitor] = useState("");
  const [competitorPrice, setCompetitorPrice] = useState("");
  const [marketNote, setMarketNote] = useState("");

  const needsReason = outcomeType === "no_contact";
  const needsClass = outcomeType === "issue";
  const canSave = started && !!outcomeType
    && (!needsReason || !!reason)
    && (!needsClass || (!!complaintClass && !!complaintOwner));

  const ctx = {
    outcomeType, preset,
    orderValue: orderValue || `${(parseInt(orderQty, 10) || 1) * 350} ج.م تقديريًا`,
    outstanding, fullyCollected, partial: !fullyCollected && !!collected, promiseDate,
    reason,
    action, followUp, escalate,
    needAdded: needOpen && !!needCategory, needCategory, oppResult,
  };

  const commitments = outcomeType ? deriveNextCommitments(item, ctx) : [];

  function handleSave() {
    if (outcomeType === "order") {
      if (!item.customerId) { setOrderError("يجب أن يكون الطلب مرتبطًا بعميل معروف."); return; }
      if (!orderItems) { setOrderError("اختر الصنف قبل حفظ الطلب."); return; }
      if (!Number.isFinite(Number(orderQty)) || Number(orderQty) < 1) { setOrderError("أدخل كمية صحيحة لا تقل عن 1."); return; }
      const duplicate = existingOrders.some(o => o.customerId === item.customerId && o.items?.startsWith(`${orderItems} ×`));
      if (duplicate && !duplicateConfirmed) {
        setOrderError("يوجد طلب لنفس العميل والصنف مسجل في هذه الجلسة. راجعه أو أكّد الحفظ رغم التكرار.");
        setDuplicateConfirmed(true);
        return;
      }
    }
    setOrderError("");
    const record = { customerId: item.customerId, customerName: item.org, time: item.time };
    let orderRecord = null, collectionRecord = null, complaintRecord = null;
    if (outcomeType === "order") {
      orderRecord = { ...record, id: item.id + "-o-" + Date.now(), items: `${orderItems} × ${orderQty}`, value: ctx.orderValue, status: "قيد المراجعة", responsible: "قسم الائتمان", next: "مراجعة الحد الائتماني قبل التجهيز", shortage };
    } else if (outcomeType === "collection") {
      collectionRecord = { ...record, id: item.id + "-k-" + Date.now(), outstanding, collected: fullyCollected ? outstanding : (collected || "0 ج.م"), partial: !fullyCollected && !!collected, promiseDate: fullyCollected ? null : promiseDate, overdue: false };
    } else if (outcomeType === "issue") {
      complaintRecord = { ...record, id: item.id + "-x-" + Date.now(), description: action || "بدون وصف إضافي", classification: complaintClass, owner: complaintOwner, action: action || "بانتظار تحديد الإجراء", followUp, status: escalate ? "مُصعَّدة للمشرف" : "قيد المعالجة", resolved: false };
    }
    const marketRecord = marketOpen && (competitor || marketNote)
      ? { ...record, id: item.id + "-g-" + Date.now(), competitor, product: orderItems, competitorPrice, promo: "", note: marketNote }
      : null;
    const oppRecord = needOpen && needCategory
      ? { ...record, id: item.id + "-n-" + Date.now(), category: needCategory, result: oppResult || "مؤجل" }
      : null;

    onSave({ commitments, orderRecord, collectionRecord, complaintRecord, marketRecord, oppRecord });
  }

  return (
    <div className="outcome">
      {cust && (
        <div className="context-strip">
          <span className="ctx-item"><Building2 size={12} /> {cust.classification}</span>
          <span className="ctx-dot">·</span>
          <span className="ctx-item nums">{cust.balance}</span>
          {cust.activePromise && (<><span className="ctx-dot">·</span><span className="ctx-item ctx-warn">{cust.activePromise}</span></>)}
        </div>
      )}

      {/* البدء */}
      <div className="outcome-section">
        <div className="section-label">بدء التنفيذ</div>
        {!started ? (
          <button className="start-row" onClick={() => setStarted(true)}>
            {isVisit ? <MapPin size={15} /> : <PhoneCall size={15} />}
            <span>{isVisit ? "تسجيل الوصول للموقع" : "بدء المكالمة"}</span>
          </button>
        ) : (
          <div className="live-row">
            <span className="live-dot" />
            <Clock size={13} />
            <span>{isVisit ? "تم تسجيل الوصول" : "المكالمة متصلة"} · {startedAt}</span>
          </div>
        )}
      </div>

      {/* النتيجة */}
      {started && (
        <div className="outcome-section">
          <div className="section-label">ما الذي تحقق؟</div>
          <div className="option-list">
            {OUTCOME_TYPES.map(o => {
              const OIcon = o.Icon;
              return (
                <button key={o.id} className="option-row" onClick={() => setOutcomeType(o.id)}>
                  <span className={"option-mark" + (outcomeType === o.id ? " checked" : "")} />
                  <span className="option-text">
                    <span className="option-label"><OIcon size={13} /> {o.label}</span>
                    <span className="option-helper">{o.helper}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* طلبية */}
      {outcomeType === "order" && (
        <div className="outcome-section">
          <div className="section-label">تفاصيل الطلبية</div>
          <div className="chip-row">
            {PRODUCT_PRESETS.map(p => (
              <button key={p} className={"reason-chip" + (orderItems === p ? " active" : "")} onClick={() => { setOrderItems(p); setOrderError(""); setDuplicateConfirmed(false); }}>{p}</button>
            ))}
          </div>
          <div className="qty-row">
            <span className="toggle-text">الكمية</span>
            <div className="qty-stepper">
              <button onClick={() => setOrderQty(q => Math.max(1, q - 1))}><Minus size={13} /></button>
              <span className="nums">{orderQty}</span>
              <button onClick={() => setOrderQty(q => q + 1)}><Plus size={13} /></button>
            </div>
          </div>
          <input className="ledger-input nums" inputMode="numeric" placeholder="القيمة التقديرية (اختياري)" value={orderValue} onChange={e => setOrderValue(e.target.value)} />
          <button className="toggle-row" onClick={() => setShortage(v => !v)}>
            <span className="toggle-text">يوجد نقص مخزون على أحد الأصناف</span>
            <span className={"toggle-switch" + (shortage ? " on" : "")}><span className="toggle-knob" /></span>
          </button>
          {orderError && <div className="hint-line" style={{ color: "var(--danger)" }}><AlertTriangle size={12} /> {orderError}</div>}
          <div className="hint-line"><Info size={12} /> الحالة الداخلية: قيد المراجعة — تنتقل لقسم الائتمان قبل التجهيز</div>
        </div>
      )}

      {/* تحصيل */}
      {outcomeType === "collection" && (
        <div className="outcome-section">
          <div className="section-label">تفاصيل التحصيل</div>
          <div className="snap-grid two">
            <div className="snap-cell"><span className="snap-label">الرصيد المستحق</span><span className="snap-value nums">{outstanding}</span></div>
          </div>
          <button className="toggle-row" onClick={() => setFullyCollected(v => !v)}>
            <span className="toggle-text">تم تحصيل كامل المبلغ</span>
            <span className={"toggle-switch" + (fullyCollected ? " on" : "")}><span className="toggle-knob" /></span>
          </button>
          {!fullyCollected && (
            <>
              <input className="ledger-input nums" inputMode="numeric" placeholder="المبلغ المُحصَّل جزئيًا (اختياري)" value={collected} onChange={e => setCollected(e.target.value)} />
              <div className="section-label small">موعد الوعد الجديد</div>
              <div className="chip-row">
                {["الخميس القادم", "أول الأسبوع القادم"].map(d => (
                  <button key={d} className={"reason-chip" + (promiseDate === d ? " active" : "")} onClick={() => setPromiseDate(d)}>{d}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {needsReason && (
        <div className="outcome-section">
          <div className="section-label">السبب</div>
          <div className="chip-row">
            {NO_CONTACT_REASONS.map(r => (
              <button key={r} className={"reason-chip" + (reason === r ? " active" : "")} onClick={() => setReason(r)}>{r}</button>
            ))}
          </div>
        </div>
      )}

      {/* شكوى / مشكلة */}
      {needsClass && (
        <div className="outcome-section">
          <div className="section-label">تصنيف المشكلة</div>
          <div className="chip-row">
            {COMPLAINT_CLASS.map(c => (
              <button key={c} className={"reason-chip" + (complaintClass === c ? " active" : "")} onClick={() => setComplaintClass(c)}>{c}</button>
            ))}
          </div>
          <div className="section-label small">الجهة المسؤولة</div>
          <div className="chip-row">
            {COMPLAINT_OWNERS.map(o => (
              <button key={o} className={"reason-chip" + (complaintOwner === o ? " active" : "")} onClick={() => setComplaintOwner(o)}>{o}</button>
            ))}
          </div>
          <textarea className="ledger-textarea" rows={2} placeholder="الإجراء التصحيحي المطلوب..." value={action} onChange={e => setAction(e.target.value)} />
          <button className="toggle-row" onClick={() => setEscalate(v => !v)}>
            <span className="toggle-text">تصعيد للمشرف مباشرة</span>
            <span className={"toggle-switch" + (escalate ? " on" : "")}><span className="toggle-knob" /></span>
          </button>
        </div>
      )}

      {/* إضافات اختيارية */}
      {started && (
        <div className="outcome-section addon-section">
          <button className="addon-toggle" onClick={() => setNeedOpen(v => !v)}>
            <Sparkles size={14} />
            <span>{needOpen ? "إخفاء" : "+ إضافة"} احتياج / فرصة بيع إضافية</span>
          </button>
          {needOpen && (
            <div className="addon-body">
              <div className="chip-row">
                {NEED_CATEGORIES.map(c => (
                  <button key={c} className={"reason-chip" + (needCategory === c ? " active" : "")} onClick={() => setNeedCategory(c)}>{c}</button>
                ))}
              </div>
              <div className="chip-row">
                {OPP_RESULTS.map(r => (
                  <button key={r} className={"reason-chip" + (oppResult === r ? " active" : "")} onClick={() => setOppResult(r)}>{r}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {started && (
        <div className="outcome-section addon-section">
          <button className="addon-toggle" onClick={() => setMarketOpen(v => !v)}>
            <Radar size={14} />
            <span>{marketOpen ? "إخفاء" : "+ إضافة"} ملاحظة سوق أو منافس</span>
          </button>
          {marketOpen && (
            <div className="addon-body">
              <input className="ledger-input" placeholder="اسم المنافس" value={competitor} onChange={e => setCompetitor(e.target.value)} />
              <input className="ledger-input" placeholder="سعر المنافس أو عرضه" value={competitorPrice} onChange={e => setCompetitorPrice(e.target.value)} />
              <textarea className="ledger-textarea" rows={2} placeholder="ملاحظة سريعة..." value={marketNote} onChange={e => setMarketNote(e.target.value)} />
            </div>
          )}
        </div>
      )}

      {/* الالتزام التالي */}
      {outcomeType && (
        <div className="outcome-section">
          <div className="section-label">الالتزام التالي</div>
          <div className="chip-row">
            {TIMING_PRESETS.map(t => (
              <button key={t.id} className={"reason-chip" + (preset === t.id ? " active" : "")} onClick={() => setPreset(t.id)}>{t.label}</button>
            ))}
          </div>
          {commitments.length > 0 ? (
            <div className="next-list">
              {commitments.map((c, i) => (
                <div className="next-preview" key={i}>
                  <span className="rail-node node-normal" />
                  <div className="next-preview-body">
                    <div className="rail-kind">{c.kind}</div>
                    <div className="rail-next"><ArrowUpRight size={13} /><span>{c.next}</span></div>
                    <div className="rail-due">{c.due}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="next-closed"><CheckCircle2 size={14} /> لا يوجد التزام تالٍ — تم إغلاق الحلقة بالكامل</div>
          )}
        </div>
      )}

      <div className="outcome-actions">
        <button className="btn-secondary text-btn" onClick={onCancel}>
          <ChevronRight size={15} /> رجوع
        </button>
        <button className="btn-primary" disabled={!canSave} onClick={handleSave}>
          حفظ النتيجة
        </button>
      </div>
    </div>
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
  const [sheetMode, setSheetMode] = useState("view"); // 'view' | 'capture'
  const [injected, setInjected] = useState({ rep: [], tele: [], sup: [], mgr: [] });

  // Rep-only operational logs — grow as the day is worked, never re-entered.
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [collections, setCollections] = useState(SEED_COLLECTIONS);
  const [complaints, setComplaints] = useState(SEED_COMPLAINTS);
  const [marketObs, setMarketObs] = useState(SEED_MARKET);
  const [opportunities, setOpportunities] = useState(SEED_OPPORTUNITIES);
  const [customerSheet, setCustomerSheet] = useState(null); // customer id
  const [dayClosed, setDayClosed] = useState(false);

  const role = ROLES.find(r => r.id === roleId);
  const variant = variantForRole(roleId);

  const items = roleId === "rep" ? repItems
    : roleId === "tele" ? teleItems
    : roleId === "sup" ? supRail
    : mgrRail;

  const baseItems = items.map(it => statusOverride[it.id] ? { ...it, status: statusOverride[it.id], next: "تم تسجيل النتيجة" } : it);
  const liveItems = [...baseItems, ...injected[roleId]];

  const heroItem = liveItems.find(i => i.status === "urgent") || liveItems.find(i => i.status === "normal");
  const queueTop = supQueues.find(q => q.severity === "urgent");

  function openItem(it) { setSelected(it); setSheetMode("view"); }
  function closeSheet() { setSelected(null); setSheetMode("view"); }

  function completeItem(it) {
    // Used by supervisor/manager rows and the tablet detail pane, where the
    // detailed outcome flow below doesn't apply — a direct close-out.
    setStatusOverride(s => ({ ...s, [it.id]: "completed" }));
    setSelected(null);
    setToast(`تم تسجيل النتيجة`);
    window.clearTimeout(window.__toastT);
    window.__toastT = window.setTimeout(() => setToast(null), 3200);
  }

  function saveOutcome(result) {
    const { commitments, orderRecord, collectionRecord, complaintRecord, marketRecord, oppRecord } = result;
    setStatusOverride(s => ({ ...s, [selected.id]: "completed" }));
    if (commitments && commitments.length) {
      setInjected(s => ({ ...s, [roleId]: [...s[roleId], ...commitments] }));
    }
    if (orderRecord) setOrders(s => [...s, orderRecord]);
    if (collectionRecord) setCollections(s => [...s, collectionRecord]);
    if (complaintRecord) setComplaints(s => [...s, complaintRecord]);
    if (marketRecord) setMarketObs(s => [...s, marketRecord]);
    if (oppRecord) setOpportunities(s => [...s, oppRecord]);

    setSelected(null);
    setSheetMode("view");
    const msg = commitments && commitments.length
      ? `تم تسجيل النتيجة — أُضيف ${commitments.length > 1 ? "التزامان جديدان" : "التزام جديد"}: ${commitments[0].due}`
      : "تم تسجيل النتيجة — لا يوجد التزام تالٍ";
    setToast(msg);
    window.clearTimeout(window.__toastT);
    window.__toastT = window.setTimeout(() => setToast(null), 3600);
  }

  function activateCustomer(cust) {
    const kind = cust.type === "new" ? "زيارة عميل" : "زيارة تفعيل";
    const title = cust.type === "new" ? "زيارة تعريفية عميل جديد" : "زيارة إعادة تفعيل";
    const commitment = {
      id: cust.id + "-activate-" + Date.now(),
      time: "16:00", kind, title, who: cust.contact, org: cust.name, area: cust.area,
      status: "normal", owner: "أنت", due: "غدًا الساعة 10:00 ص", next: cust.opportunity || "زيارة أولى لتقييم الفرصة",
      amount: null, phone: cust.phone, customerId: cust.id,
    };
    setInjected(s => ({ ...s, rep: [...s.rep, commitment] }));
    setCustomerSheet(null);
    setToast(`تمت جدولة ${title} — غدًا الساعة 10:00 ص`);
    window.clearTimeout(window.__toastT);
    window.__toastT = window.setTimeout(() => setToast(null), 3400);
  }

  React.useEffect(() => {
    if (roleId !== "sup" && roleId !== "mgr" && device === "tablet") setDevice("mobile");
    setTab(ROLES.find(r => r.id === roleId).nav[0].id);
    setSelected(null);
  }, [roleId]); // eslint-disable-line

  const isTablet = device === "tablet" && (roleId === "sup" || roleId === "mgr");
  const completedVisits = roleId === "rep" ? liveItems.filter(i => i.status === "completed") : [];
  const tomorrowFollowUps = roleId === "rep" ? injected.rep.filter(i => i.due.includes("غدًا")) : [];

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
                {roleId === "rep" && <MorningStrip liveItems={liveItems} />}
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
            ) : roleId === "rep" && tab === "customers" ? (
              <>
                <div className="section-label">عملاؤك</div>
                <div className="reg-list">
                  {CUSTOMERS.map(c => (
                    <div className="reg-row" key={c.id}><CustomerRow cust={c} onOpen={setCustomerSheet} /></div>
                  ))}
                </div>
              </>
            ) : roleId === "rep" && tab === "activity" ? (
              <RepActivityTab completedVisits={completedVisits} orders={orders} collections={collections} complaints={complaints} marketObs={marketObs} />
            ) : roleId === "rep" && tab === "mine" ? (
              <RepCloseDayTab
                liveItems={liveItems}
                plannedCount={repItems.length}
                orders={orders} collections={collections} complaints={complaints}
                marketObs={marketObs} opportunities={opportunities}
                injectedTomorrow={tomorrowFollowUps}
                dayClosed={dayClosed}
                onClose={() => { setDayClosed(true); setToast("تم إغلاق اليوم"); window.clearTimeout(window.__toastT); window.__toastT = window.setTimeout(() => setToast(null), 3000); }}
              />
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
              {sheetMode === "view" ? (
                <>
                  <div className="sheet-scroll">
                    <DetailBody item={selected} />
                  </div>
                  <div className="sheet-actions">
                    {selected.phone && (
                      <button className="btn-secondary"><PhoneCall size={16} /></button>
                    )}
                    <button className="btn-secondary text-btn">تأجيل</button>
                    {selected.status !== "completed" ? (
                      <button className="btn-primary" onClick={() => (roleId === "rep" || roleId === "tele") ? setSheetMode("capture") : completeItem(selected)}>
                        تسجيل نتيجة {selected.kind}
                      </button>
                    ) : (
                      <button className="btn-primary done" disabled>
                        <CheckCircle2 size={16} /> تم التسجيل
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="sheet-scroll">
                  <OutcomeCapture item={selected} existingOrders={orders} onSave={saveOutcome} onCancel={() => setSheetMode("view")} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* CUSTOMER SHEET (rep, mobile) */}
        {!isTablet && customerSheet && (
          <CustomerSheet cust={getCustomer(customerSheet)} onClose={() => setCustomerSheet(null)} onActivate={activateCustomer} />
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
.btn-secondary{background:var(--canvas-alt); border:1px solid var(--rule); border-radius:9px; width:46px; min-height:46px; display:flex; align-items:center; justify-content:center; gap:6px; color:var(--ink-700);}
.btn-secondary.text-btn{width:auto; padding:0 16px; font-size:13px; font-weight:600;}

/* ---------- outcome capture: a ledger form, not a wizard modal ---------- */
.outcome{display:flex; flex-direction:column;}
.outcome-section{padding:16px 0; border-top:1px solid var(--rule);}
.outcome-section:first-child{border-top:none; padding-top:2px;}
.start-row{display:flex; align-items:center; gap:8px; width:100%; min-height:46px; padding:0 4px; font-size:13.5px; font-weight:600; color:var(--action);}
.live-row{display:flex; align-items:center; gap:8px; font-size:13px; color:var(--ink-700); padding:0 4px; min-height:46px;}
.live-dot{width:8px; height:8px; border-radius:50%; background:var(--success); animation:pulse 1.6s ease infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.35;}}
.option-list{display:flex; flex-direction:column;}
.option-row{display:flex; align-items:flex-start; gap:10px; width:100%; padding:10px 4px; min-height:44px; border-top:1px dashed var(--rule);}
.option-row:first-child{border-top:none;}
.option-mark{width:14px; height:14px; border-radius:50%; border:2px solid var(--action); background:var(--canvas); flex-shrink:0; margin-top:2px;}
.option-mark.checked{background:var(--action); box-shadow:inset 0 0 0 2px var(--canvas);}
.option-text{display:flex; flex-direction:column; gap:2px; text-align:right;}
.option-label{font-size:13.5px; font-weight:600; color:var(--ink-900);}
.option-helper{font-size:11.5px; color:var(--ink-500);}
.ledger-input{border:none; border-bottom:1.5px solid var(--rule); background:transparent; font-size:16px; font-weight:700; color:var(--ink-900); padding:8px 2px; width:100%; text-align:right; font-family:inherit;}
.ledger-input:focus{border-bottom-color:var(--action);}
.ledger-input::placeholder{color:var(--ink-300); font-weight:500;}
.ledger-textarea{border:none; border-bottom:1.5px solid var(--rule); background:transparent; font-size:13.5px; color:var(--ink-900); padding:8px 2px; width:100%; text-align:right; font-family:inherit; resize:none; margin-bottom:12px;}
.ledger-textarea:focus{border-bottom-color:var(--action);}
.chip-row{display:flex; flex-wrap:wrap; gap:8px;}
.reason-chip{font-size:12.5px; font-weight:600; color:var(--ink-700); border:1px solid var(--rule); border-radius:7px; padding:7px 12px; min-height:36px;}
.reason-chip.active{color:var(--action); border-color:var(--action); background:var(--quiet-blue);}
.toggle-row{display:flex; align-items:center; justify-content:space-between; width:100%; min-height:40px; padding:2px 4px;}
.toggle-text{font-size:12.5px; color:var(--ink-700); font-weight:600;}
.toggle-switch{width:34px; height:20px; border-radius:11px; background:var(--rule); position:relative; flex-shrink:0; transition:background-color .12s ease;}
.toggle-switch.on{background:var(--action);}
.toggle-knob{position:absolute; top:2px; right:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform .12s ease; box-shadow:0 1px 2px rgba(22,40,63,.2);}
.toggle-switch.on .toggle-knob{transform:translateX(-14px);}
.next-preview{display:flex; align-items:flex-start; gap:10px; margin-top:12px; padding:12px; background:var(--canvas-alt); border-radius:8px;}
.next-preview .rail-node{margin-top:3px;}
.next-preview-body{flex:1; display:flex; flex-direction:column; gap:4px;}
.next-preview .rail-next{margin-top:0;}
.outcome-actions{display:flex; gap:8px; padding-top:16px;}
.outcome-actions .btn-primary:disabled{background:var(--ink-300); cursor:not-allowed;}

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

/* ---------- morning strip: one ruled line, not a KPI wall ---------- */
.morning-strip{display:flex; flex-wrap:wrap; align-items:center; gap:6px; padding:0 2px 14px; font-size:12px; color:var(--ink-500); border-bottom:1px solid var(--rule); margin-bottom:14px;}
.mstat b{color:var(--ink-900); font-weight:700;}
.ctx-dot{color:var(--ink-300);}

/* ---------- customer context strip (inside outcome capture) ---------- */
.context-strip{display:flex; flex-wrap:wrap; align-items:center; gap:6px; font-size:11.5px; color:var(--ink-500); padding-bottom:14px; margin-bottom:2px; border-bottom:1px dashed var(--rule);}
.ctx-item{display:inline-flex; align-items:center; gap:4px;}
.ctx-warn{color:var(--danger); font-weight:600;}

/* ---------- customer flags (view mode + customer sheet) ---------- */
.flag-list{display:flex; flex-direction:column; gap:6px; margin-bottom:18px;}
.flag-row{display:flex; align-items:flex-start; gap:6px; font-size:12px; line-height:1.5; padding:8px 10px; border-radius:8px; background:var(--canvas-alt);}
.flag-promise{color:var(--caution);}
.flag-issue{color:var(--danger);}
.flag-opp{color:var(--stamp);}

/* ---------- order sub-form ---------- */
.qty-row{display:flex; align-items:center; justify-content:space-between; padding:8px 4px; min-height:36px;}
.qty-stepper{display:flex; align-items:center; gap:10px;}
.qty-stepper button{width:26px; height:26px; border-radius:6px; background:var(--canvas-alt); border:1px solid var(--rule); display:flex; align-items:center; justify-content:center; color:var(--ink-700);}
.qty-stepper span{min-width:18px; text-align:center; font-weight:700;}
.hint-line{display:flex; align-items:center; gap:5px; font-size:11px; color:var(--ink-500); margin-top:8px;}
.snap-grid.two{grid-template-columns:1fr; margin-bottom:12px;}

/* ---------- optional add-on sections ---------- */
.addon-section{padding-top:12px; padding-bottom:12px;}
.addon-toggle{display:flex; align-items:center; gap:7px; font-size:12.5px; font-weight:600; color:var(--stamp); min-height:36px;}
.addon-body{display:flex; flex-direction:column; gap:10px; margin-top:8px; padding-inline-start:20px;}

/* ---------- next-commitment preview list ---------- */
.next-list{display:flex; flex-direction:column; gap:8px; margin-top:12px;}
.next-list .next-preview{margin-top:0;}
.next-closed{display:flex; align-items:center; gap:6px; font-size:12.5px; color:var(--success); margin-top:12px; padding:10px 12px; background:var(--success-bg); border-radius:8px;}
.close-day-btn{width:100%; margin-top:16px;}

/* ---------- customer register (rep) ---------- */
.cust-row{width:100%;}
.mark-empty{border-radius:50%; border:1.5px dashed var(--ink-300); background:var(--canvas);}
.mark-new{border-radius:50%; background:var(--stamp);}
.type-flag{display:inline-flex; align-items:center; gap:3px; font-size:10.5px; font-weight:700; padding:2px 6px; border-radius:5px; flex-shrink:0;}
.flag-new{color:var(--stamp); background:var(--stamp-bg);}
.flag-inactive{color:var(--ink-500); background:var(--canvas-alt);}

/* ---------- activity evidence log (rep) ---------- */
.evidence-list{display:flex; flex-direction:column;}
.evidence-row{display:flex; align-items:center; gap:10px; padding:10px 2px; border-top:1px solid var(--rule);}
.evidence-list .evidence-row:first-child{border-top:none;}
.evidence-time{font-size:11px; color:var(--ink-500); flex-shrink:0; min-width:32px;}
.evidence-body{flex:1; display:flex; flex-direction:column; gap:2px;}
.evidence-text{font-size:12.5px; color:var(--ink-700);}
.empty-note{font-size:12px; color:var(--ink-300); padding:10px 2px;}

/* ---------- close day / demo labeling ---------- */
.demo-note{display:flex; align-items:center; gap:6px; font-size:11px; color:var(--ink-400); margin-top:16px; padding:10px 4px; border-top:1px dashed var(--rule);}

@media (prefers-reduced-motion: reduce){
  .sr-app *{animation:none !important; transition:none !important;}
}
`;
