import React, { useState, useMemo } from "react";
import {
  Sun, UsersRound, LayoutList, Activity, Bell, Search, ChevronLeft, ChevronDown,
  CheckCircle2, AlertTriangle, UserRound, Monitor, Smartphone,
  ArrowUpRight, PackageCheck, Clock, Sparkles, Info, Headphones
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  NAV (identical shape to the frozen Artifact 0 supervisor nav)          */
/* ---------------------------------------------------------------------- */

const NAV = [
  { id: "day", label: "اليوم", icon: Sun },
  { id: "team", label: "الفريق", icon: UsersRound },
  { id: "queues", label: "الطوابير", icon: LayoutList },
  { id: "activity", label: "النشاط", icon: Activity },
];

const CHECKPOINTS = [
  { id: "morning", label: "الصباح" },
  { id: "midday", label: "منتصف اليوم" },
  { id: "eod", label: "نهاية اليوم" },
];

/* ---------------------------------------------------------------------- */
/*  TEAM — four contrasting situations, same roster as Artifacts 0 & 2     */
/* ---------------------------------------------------------------------- */

const SEED_EMPLOYEES = [
  { id: "e1", name: "وليد سامي", assignedCalls: 14, completedCalls: 11, priorityCalls: 2, priorityDone: 2, missed: 0 },
  { id: "e2", name: "محمد الطيب", assignedCalls: 15, completedCalls: 9, priorityCalls: 3, priorityDone: 1, missed: 2 },
  { id: "e3", name: "سارة عادل", assignedCalls: 12, completedCalls: 10, priorityCalls: 2, priorityDone: 2, missed: 0 },
  { id: "e4", name: "نهى كامل", assignedCalls: 13, completedCalls: 12, priorityCalls: 2, priorityDone: 1, missed: 1 },
];

/* ---------------------------------------------------------------------- */
/*  EXCEPTION QUEUE — evidence-linked, not generic notification cards      */
/*  (customers/promises reused narratively from Artifact 2)                */
/* ---------------------------------------------------------------------- */

const SEED_EXCEPTIONS = [
  {
    id: "x1", type: "overdue_promise", severity: "urgent", employee: "سارة عادل",
    customer: "صيدليات الشفاء", what: "وعد سداد متأخر 4,200 ج.م",
    why: "تجاوز الموعد المتفق عليه 3 أيام دون تحصيل أو تجديد", age: "منذ 3 أيام",
    evidence: ["الوعد الأصلي: 4,200 ج.م — الخميس الماضي", "آخر مكالمة: منذ 3 أيام — طلب العميل تأجيلًا"],
    next: "تحصيل المبلغ أو تجديد الوعد اليوم", carriedOver: true, status: "open",
  },
  {
    id: "x2", type: "priority_not_contacted", severity: "urgent", employee: "محمد الطيب",
    customer: "توكيلات الشرق للسيارات", what: "عميل ذو أولوية لم يتم الاتصال به اليوم",
    why: "شكوى مفتوحة يجب إغلاقها قبل الساعة 5 اليوم", age: "منذ بداية اليوم",
    evidence: ["الشكوى: تأخر توصيل قطعة غيار 5 أيام", "المسؤول: قسم التوزيع — إجراء: تسريع الشحنة"],
    next: "الاتصال بالعميل لتأكيد موعد التوصيل الجديد", carriedOver: false, status: "open",
  },
  {
    id: "x3", type: "call_quality", severity: "watch", employee: "نهى كامل",
    customer: "مصنع الأمل للأغذية", what: "مكالمة تحتاج مراجعة جودة",
    why: "لم يتم توضيح الالتزام أو تسجيل نتيجة واضحة في ختام المكالمة", age: "أمس 14:20",
    evidence: ["مدة المكالمة: 6 دقائق", "لم يُحدَّد موعد متابعة قبل الإنهاء"],
    next: "مراجعة المكالمة وتقديم ملاحظات", carriedOver: false, status: "open",
  },
  {
    id: "x4", type: "inactive_not_followed", severity: "watch", employee: "نهى كامل",
    customer: "بقالة النصر", what: "عميل متوقف بدون محاولة تفعيل حديثة",
    why: "آخر محاولة تفعيل منذ أسبوعين دون رد، ولم تُجدول محاولة جديدة", age: "منذ أسبوعين",
    evidence: ["آخر محاولة: مكالمة تفعيل — لم يتم الرد", "فرصة عودة مسجَّلة بعد تسوية خلاف الأسعار"],
    next: "محاولة تفعيل جديدة أو إغلاق الفرصة رسميًا", carriedOver: true, status: "open",
  },
  {
    id: "x5", type: "execution_behind", severity: "urgent", employee: "محمد الطيب",
    customer: null, what: "أداء أقل من المتوسط 3 أيام متتالية",
    why: "أنجز 60٪ فقط من خطة المكالمات المخصصة له هذا الأسبوع", age: "3 أيام متتالية",
    evidence: ["مكالمات مكتملة: 9 من 15 اليوم", "أولويات منجزة: 1 من 3"],
    next: "مراجعة أداء ووضع خطة تحسين لمدة أسبوع", carriedOver: true, status: "open",
  },
];

const ACTIONS_BY_TYPE = {
  overdue_promise: [{ id: "escalate", label: "تصعيد للمدير" }, { id: "followup", label: "إنشاء متابعة غدًا" }],
  // Contacting a priority customer is a same-day fixable problem — the
  // supervisor must be able to correct today's execution, not only defer it.
  priority_not_contacted: [{ id: "today_contact", label: "متابعة اليوم" }, { id: "reassign", label: "إعادة تعيين المسؤول" }, { id: "followup", label: "إنشاء متابعة غدًا" }],
  call_quality: [{ id: "coaching", label: "جدولة تدريب" }],
  inactive_not_followed: [{ id: "followup", label: "إنشاء متابعة غدًا" }],
  execution_behind: [{ id: "coaching", label: "جدولة تدريب" }, { id: "escalate", label: "تصعيد للمدير" }],
};

// A supervisor action can be recorded while the underlying work continues.
// Coaching closes the immediate exception because it creates a separately tracked
// coaching commitment; escalation/follow-up/reassignment remain operationally open.
const ACTION_RESOLVES_WORK = {
  overdue_promise: { escalate: false, followup: false },
  priority_not_contacted: { today_contact: false, reassign: false, followup: false },
  call_quality: { coaching: true },
  inactive_not_followed: { followup: false },
  execution_behind: { coaching: true, escalate: false },
};

function isOperationallyOpen(x) {
  return x.status === "open" || x.stillOpen === true;
}

/* ---------------------------------------------------------------------- */
/*  PRIORITIES + CALL QUALITY + COACHING SEEDS                             */
/* ---------------------------------------------------------------------- */

const SEED_PRIORITIES = [
  { id: "pr1", customer: "صيدليات الشفاء", employee: "سارة عادل", reason: "وعد سداد مستحق اليوم", confirmed: true },
  { id: "pr2", customer: "توكيلات الشرق للسيارات", employee: "محمد الطيب", reason: "شكوى تحتاج إغلاق قبل نهاية اليوم", confirmed: true },
  { id: "pr3", customer: "بقالة النصر", employee: "نهى كامل", reason: "فرصة إعادة تنشيط", confirmed: false },
];

const CALL_QUALITY_CRITERIA = [
  { id: "prep", label: "التحضير وفهم العميل", ok: true },
  { id: "open", label: "الافتتاحية", ok: true },
  { id: "needs", label: "استكشاف الاحتياج", ok: false },
  { id: "product", label: "مناقشة المنتج المناسب", ok: true },
  { id: "objection", label: "التعامل مع الاعتراض", ok: false },
  { id: "close", label: "وضوح الالتزام وتسجيل النتيجة", ok: false },
];

const SEED_COACHING = [
  { id: "co1", employee: "نهى كامل", observation: "لم يتم تسجيل نتيجة مكالمة واضحة في مراجعة سابقة", expected: "توضيح الالتزام ونتيجة المكالمة بدقة قبل الإغلاق", followUp: "الجمعة القادمة", status: "open" },
];

/* ---------------------------------------------------------------------- */
/*  ONE OPERATIONAL TRUTH — employee state is never stored twice.          */
/*  It is derived live from the same exceptions/coaching arrays the        */
/*  checkpoints and exception queue already read, so an actioned           */
/*  exception can never leave the team view silently out of date.         */
/* ---------------------------------------------------------------------- */

function computeEmployeeState(name, exceptions, coaching) {
  const mine = exceptions.filter(x => x.employee === name && isOperationallyOpen(x));
  const customerExc = mine.find(x => x.type !== "execution_behind" && x.type !== "call_quality");
  const executionExc = mine.find(x => x.type === "execution_behind");
  const qualityExc = mine.find(x => x.type === "call_quality");
  const needsCoaching = !!qualityExc || coaching.some(c => c.employee === name && c.status === "open");

  if (customerExc) return { status: "exception", label: customerExc.what, openCount: mine.length };
  if (executionExc) return { status: "behind", label: executionExc.what, openCount: mine.length };
  if (needsCoaching) return { status: "coaching", label: "يحتاج تدريب / تحقق من ملاحظة سابقة", openCount: mine.length };
  return { status: "ready", label: "على المسار الصحيح — لا يوجد استثناء مفتوح", openCount: mine.length };
}

/* ---------------------------------------------------------------------- */
/*  SMALL SHARED COMPONENTS (frozen vocabulary)                             */
/* ---------------------------------------------------------------------- */

function LedgerRegister({ open, onToggle, mark = "normal", count, label, sub, children }) {
  return (
    <div className="reg-row">
      <button className="reg-head" onClick={onToggle}>
        <span className={"reg-mark mark-" + mark} />
        <span className="reg-count nums">{count}</span>
        <span className="reg-text">
          <span className="reg-label">{label}</span>
          <span className="reg-age">{sub}</span>
        </span>
        <ChevronDown size={16} className={open ? "chev open" : "chev"} />
      </button>
      {open && <div className="reg-breakdown">{children}</div>}
    </div>
  );
}

function EmployeeRow({ emp, exceptions, coaching, open, onToggle }) {
  const state = computeEmployeeState(emp.name, exceptions, coaching);
  const mark = state.status === "exception" ? "urgent" : state.status === "behind" || state.status === "coaching" ? "caution" : "normal";
  const stateLabel = { ready: "على المسار الصحيح", behind: "متأخر عن خطة المكالمات", exception: "استثناء عميل مفتوح", coaching: "يحتاج تدريب" }[state.status];
  return (
    <LedgerRegister
      open={open} onToggle={onToggle} mark={mark}
      count={emp.completedCalls} label={emp.name}
      sub={`${stateLabel} · ${emp.completedCalls} من ${emp.assignedCalls} مكالمة`}
    >
      <div className="breakdown-row"><span className="breakdown-who">أولويات منجزة</span><span className="breakdown-count nums">{emp.priorityDone} / {emp.priorityCalls}</span></div>
      <div className="breakdown-row"><span className="breakdown-who">مكالمات فائتة</span><span className="breakdown-count nums">{emp.missed}</span></div>
      <div className="breakdown-row"><span className="breakdown-who">استثناءات مفتوحة الآن</span><span className="breakdown-count nums">{state.openCount}</span></div>
      {state.openCount > 0 && <div className="hint-line"><ArrowUpRight size={12} /> {state.label}</div>}
    </LedgerRegister>
  );
}

function ExceptionDetail({ exc, onAction }) {
  const actions = ACTIONS_BY_TYPE[exc.type] || [];
  return (
    <div className="exc-detail">
      <div className="hint-line"><UserRound size={12} /> {exc.employee}{exc.customer ? ` · ${exc.customer}` : ""}</div>
      <div className="attn-reason" style={{ marginTop: 6 }}>{exc.why}</div>
      <div className="flag-list" style={{ marginTop: 8 }}>
        {exc.evidence.map((e, i) => <div key={i} className="flag-row flag-issue"><ArrowUpRight size={12} /><span>{e}</span></div>)}
      </div>
      <div className="hint-line" style={{ marginTop: 8 }}><Info size={12} /> التالي: {exc.next}</div>
      {exc.status === "open" ? (
        <div className="chip-row" style={{ marginTop: 10 }}>
          {actions.map(a => (
            <button key={a.id} className="reason-chip" onClick={() => onAction(exc.id, a.id)}>{a.label}</button>
          ))}
        </div>
      ) : exc.stillOpen ? (
        <div className="resolved-note in-progress"><Clock size={14} /> {exc.resolutionNote} — العمل التشغيلي مستمر</div>
      ) : (
        <div className="resolved-note"><CheckCircle2 size={14} /> {exc.resolutionNote}</div>
      )}
    </div>
  );
}

function ExceptionQueue({ exceptions, open, onToggle, onAction }) {
  return (
    <div className="reg-list">
      {exceptions.map(x => (
        <LedgerRegister
          key={x.id} open={open === x.id} onToggle={() => onToggle(x.id)}
          mark={x.status === "open" ? (x.severity === "urgent" ? "urgent" : "caution") : x.stillOpen ? "caution" : "normal"}
          count={x.status === "open" ? (x.age.match(/\d+/)?.[0] || "•") : x.stillOpen ? "↻" : "✓"}
          label={x.what} sub={x.status === "open" ? `${x.employee} · ${x.age}` : x.stillOpen ? "تم اتخاذ إجراء — العمل مستمر" : "تم الحل"}
        >
          <ExceptionDetail exc={x} onAction={onAction} />
        </LedgerRegister>
      ))}
    </div>
  );
}

function CallQualityCard({ criteria, onCreateCoaching, coachingCreated }) {
  const weakest = criteria.find(c => !c.ok);
  return (
    <div className="order-detail">
      <div className="hint-line"><Headphones size={12} /> نهى كامل · مصنع الأمل للأغذية · أمس 14:20</div>
      <div className="quality-list">
        {criteria.map(c => (
          <div className="quality-row" key={c.id}>
            <span className={"rail-node " + (c.ok ? "node-completed" : "node-urgent")} />
            <span className="quality-label">{c.label}</span>
            {!c.ok && <span className="status-tag" style={{ color: "var(--danger)" }}><AlertTriangle size={11} /> يحتاج تحسين</span>}
          </div>
        ))}
      </div>
      {!coachingCreated ? (
        <button className="btn-primary" style={{ width: "100%", marginTop: 12 }} onClick={() => onCreateCoaching(weakest)}>
          إنشاء ملاحظة تدريب
        </button>
      ) : (
        <div className="resolved-note"><CheckCircle2 size={14} /> تم إنشاء ملاحظة تدريب بشأن «{weakest.label}»</div>
      )}
    </div>
  );
}

function CoachingLog({ coaching }) {
  return (
    <div className="reg-list">
      {coaching.map(c => (
        <div className="order-detail" key={c.id} style={{ borderTop: "1px solid var(--rule)", paddingTop: 10 }}>
          <div className="breakdown-row"><span className="breakdown-who">{c.employee}</span><span className="breakdown-age">{c.status === "open" ? "قيد المتابعة" : "تم التحقق"}</span></div>
          <div className="hint-line"><Sparkles size={12} /> الملاحظة: {c.observation}</div>
          <div className="hint-line"><ArrowUpRight size={12} /> المتوقع: {c.expected}</div>
          <div className="hint-line"><Clock size={12} /> المتابعة: {c.followUp}</div>
        </div>
      ))}
      {!coaching.length && <div className="breakdown-row"><span className="breakdown-who">لا توجد ملاحظات تدريب مسجلة</span></div>}
    </div>
  );
}

function PriorityList({ priorities, onConfirm }) {
  return (
    <div className="rail-list">
      {priorities.map((p, i) => (
        <div className={"rail-item" + (i === 0 ? " rail-item-first" : "")} key={p.id}>
          <div className="rail-spine">
            {i !== 0 && <div className="rail-line rail-line-top" />}
            <span className={"rail-node " + (p.confirmed ? "node-completed" : "node-normal")} />
            {i !== priorities.length - 1 && <div className="rail-line rail-line-bottom" />}
          </div>
          <div className="rail-card no-hover">
            <div className="rail-card-top">
              <span className="rail-kind">{p.employee}</span>
              {!p.confirmed && <button className="mini-action" onClick={() => onConfirm(p.id)}>تأكيد</button>}
            </div>
            <div className="rail-sub">{p.customer} — {p.reason}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CHECKPOINTS — same evidence, three different questions                 */
/* ---------------------------------------------------------------------- */

function useCheckpointData(employees, exceptions, priorities, coaching, actionsTakenCount) {
  return useMemo(() => {
    const open = exceptions.filter(isOperationallyOpen);
    const carried = exceptions.filter(x => x.carriedOver);
    return {
      morning: [
        { label: "الحضور والجاهزية", value: `${employees.length}/${employees.length}`, sub: "لا يوجد غياب اليوم" },
        { label: "خطط مكالمات جاهزة", value: `${employees.filter(e => e.assignedCalls > 0).length}/${employees.length}`, sub: "جميع الموظفين لديهم خطة" },
        { label: "عملاء ذوو أولوية اليوم", value: priorities.length, sub: `${priorities.filter(p => p.confirmed).length} مؤكدة` },
        { label: "استثناءات مرحّلة من أمس", value: carried.length, sub: carried.length ? "تحتاج معالجة قبل نهاية اليوم" : "لا يوجد" },
      ],
      midday: [
        { label: "استثناءات تنفيذ مفتوحة", value: open.length, sub: open.length ? "تحتاج تدخّلًا" : "لا يوجد" },
        { label: "أولويات لم تُلمس بعد", value: priorities.filter(p => !p.confirmed).length, sub: "تحتاج تأكيدًا أو إعادة تعيين" },
        { label: "مشكلات جودة مكالمة", value: exceptions.filter(x => x.type === "call_quality" && isOperationallyOpen(x)).length, sub: "تحتاج مراجعة" },
        { label: "موظف متأخر عن الخطة", value: exceptions.filter(x => x.type === "execution_behind" && isOperationallyOpen(x)).length, sub: "يحتاج خطة تحسين" },
      ],
      eod: [
        { label: "استثناءات لم تُحل", value: open.length, sub: open.length ? "تُرحّل أو تحتاج قرارًا" : "تم إغلاق الكل" },
        { label: "إجراءات اتُّخذت اليوم", value: actionsTakenCount, sub: "تدريب أو تصعيد أو متابعة" },
        { label: "ملاحظات تدريب مفتوحة", value: coaching.filter(c => c.status === "open").length, sub: "بانتظار التحقق" },
        { label: "متابعات غدًا", value: exceptions.filter(x => x.followUpCreated).length, sub: "أُنشئت تلقائيًا من إجراءات اليوم" },
      ],
    };
  }, [employees, exceptions, priorities, coaching, actionsTakenCount]);
}

function CheckpointPanel({ rows }) {
  return (
    <div className="reg-list">
      {rows.map((r, i) => (
        <div className="checkpoint-row" key={i}>
          <span className="checkpoint-value nums">{r.value}</span>
          <span className="checkpoint-text">
            <span className="reg-label">{r.label}</span>
            <span className="reg-age">{r.sub}</span>
          </span>
        </div>
      ))}
      <div className="demo-note"><Info size={12} /> الأرقام بيانات تجريبية لأغراض العرض فقط</div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  MAIN APP                                                                */
/* ---------------------------------------------------------------------- */

export default function App() {
  const [device, setDevice] = useState("mobile");
  const [tab, setTab] = useState("day");
  const [checkpoint, setCheckpoint] = useState("morning");
  const [employees] = useState(SEED_EMPLOYEES);
  const [exceptions, setExceptions] = useState(SEED_EXCEPTIONS);
  const [priorities, setPriorities] = useState(SEED_PRIORITIES);
  const [coaching, setCoaching] = useState(SEED_COACHING);
  const [coachingFromQuality, setCoachingFromQuality] = useState(false);
  const [openException, setOpenException] = useState(null);
  const [openEmployee, setOpenEmployee] = useState(null);
  const [selectedExc, setSelectedExc] = useState(null); // tablet split
  const [toast, setToast] = useState(null);
  const [actionsTakenCount, setActionsTakenCount] = useState(0);
  const [dayClosed, setDayClosed] = useState(false);

  const isTablet = device === "tablet";
  const checkpointData = useCheckpointData(employees, exceptions, priorities, coaching, actionsTakenCount);

  const openExceptions = exceptions.filter(x => x.status === "open");
  const topException = openExceptions.find(x => x.severity === "urgent") || openExceptions[0] || null;
  const continuingExceptions = exceptions.filter(x => x.status !== "open" && x.stillOpen);
  const topContinuing = continuingExceptions.find(x => x.severity === "urgent") || continuingExceptions[0] || null;

  function notify(msg) {
    setToast(msg);
    window.clearTimeout(window.__toastT);
    window.__toastT = window.setTimeout(() => setToast(null), 3400);
  }

  function takeAction(excId, actionId) {
    const exc = exceptions.find(x => x.id === excId);
    if (!exc) return;
    let resolutionNote = "";
    let followUpCreated = false;
    let newEmployee = exc.employee;
    if (actionId === "coaching") {
      setCoaching(cs => [...cs, { id: "co-" + Date.now(), employee: exc.employee, observation: exc.what, expected: exc.next, followUp: "الأسبوع القادم", status: "open" }]);
      resolutionNote = `تمت جدولة تدريب لـ ${exc.employee}`;
    } else if (actionId === "escalate") {
      resolutionNote = `تم تصعيد الحالة للمدير — ${exc.customer || exc.employee}`;
    } else if (actionId === "followup") {
      followUpCreated = true;
      resolutionNote = "تم إنشاء متابعة غدًا لهذا البند";
    } else if (actionId === "today_contact") {
      // Corrects execution the same day — this is deliberately NOT a deferral:
      // no follow-up commitment is created because the loop closes today.
      resolutionNote = `تم تسجيل متابعة اليوم — سيتواصل ${exc.employee} مع العميل الآن`;
    } else if (actionId === "reassign") {
      const target = employees.find(e => e.name !== exc.employee && computeEmployeeState(e.name, exceptions, coaching).status === "ready");
      newEmployee = target ? target.name : exc.employee;
      resolutionNote = `تمت إعادة تعيين العميل إلى ${newEmployee} — سيتابعها اليوم`;
    }
    const resolved = ACTION_RESOLVES_WORK[exc.type]?.[actionId] ?? true;
    setExceptions(xs => xs.map(x => x.id === excId ? { ...x, status: "actioned", stillOpen: !resolved, employee: newEmployee, resolutionNote, followUpCreated } : x));
    setActionsTakenCount(n => n + 1);
    notify(resolutionNote);
  }

  function confirmPriority(id) {
    setPriorities(ps => ps.map(p => p.id === id ? { ...p, confirmed: true } : p));
    notify("تم تأكيد الأولوية");
  }

  function createCoachingFromQuality(weakest) {
    setCoaching(cs => [...cs, { id: "co-q-" + Date.now(), employee: "نهى كامل", observation: `مراجعة مكالمة — ${weakest.label} تحتاج تحسينًا`, expected: "تطبيق ملاحظة الجودة في المكالمة القادمة", followUp: "الأسبوع القادم", status: "open" }]);
    setCoachingFromQuality(true);
    notify("تم إنشاء ملاحظة تدريب من مراجعة الجودة");
  }

  const content = (
    <>
      {tab === "day" && (
        <>
          {topException ? (
            <div className="hero">
              <div className="hero-eyebrow">التالي الآن</div>
              <div className="hero-title">{topException.what}</div>
              <div className="hero-meta">{topException.employee}{topException.customer ? " · " + topException.customer : ""}</div>
            </div>
          ) : topContinuing ? (
            <div className="hero">
              <div className="hero-eyebrow">متابعة التنفيذ</div>
              <div className="hero-title">{topContinuing.what}</div>
              <div className="hero-meta">{topContinuing.resolutionNote}</div>
            </div>
          ) : (
            <div className="attn-row attn-ok">
              <span className="rail-node node-completed" />
              <span>لا يوجد ما يستدعي تدخّلك حاليًا</span>
            </div>
          )}
          <div className="checkpoint-switch">
            {CHECKPOINTS.map(c => (
              <button key={c.id} className={checkpoint === c.id ? "cp-btn active" : "cp-btn"} onClick={() => setCheckpoint(c.id)}>{c.label}</button>
            ))}
          </div>
          <div className="section-label">{checkpoint === "morning" ? "هل يمكن للفريق البدء بشكل صحيح؟" : checkpoint === "midday" ? "أين ينحرف التنفيذ الآن؟" : "ما الذي يتبقى بلا حل؟"}</div>
          <CheckpointPanel rows={checkpointData[checkpoint]} />
          {checkpoint === "morning" && (
            <>
              <div className="section-label">أولويات اليوم</div>
              <PriorityList priorities={priorities} onConfirm={confirmPriority} />
            </>
          )}
        </>
      )}

      {tab === "team" && (
        <>
          <div className="section-label">تنفيذ الفريق</div>
          <div className="reg-list">
            {employees.map(e => (
              <EmployeeRow key={e.id} emp={e} exceptions={exceptions} coaching={coaching} open={openEmployee === e.id} onToggle={() => setOpenEmployee(openEmployee === e.id ? null : e.id)} />
            ))}
          </div>
        </>
      )}

      {tab === "queues" && (
        <>
          <div className="section-label">استثناءات تحتاج تدخّلًا</div>
          <ExceptionQueue exceptions={exceptions} open={openException} onToggle={id => setOpenException(openException === id ? null : id)} onAction={takeAction} />

          <div className="section-label">مراجعة جودة مكالمة</div>
          <CallQualityCard criteria={CALL_QUALITY_CRITERIA} onCreateCoaching={createCoachingFromQuality} coachingCreated={coachingFromQuality} />

          <div className="section-label">سجل التدريب</div>
          <CoachingLog coaching={coaching} />
        </>
      )}

      {tab === "activity" && (
        <>
          <div className="section-label">إغلاق يومي للمشرف</div>
          <CheckpointPanel rows={checkpointData.eod} />
          <button className="btn-primary close-day-btn" disabled={dayClosed} onClick={() => { setDayClosed(true); notify("تم إغلاق اليوم"); }}>
            {dayClosed ? (<><CheckCircle2 size={16} /> تم إغلاق اليوم</>) : "تأكيد إغلاق اليوم"}
          </button>
        </>
      )}
    </>
  );

  return (
    <div className="sr-app" dir="rtl">
      <style>{CSS}</style>
      <div className={"frame " + (isTablet ? "frame-wide" : "frame-mobile")}>
        <header className="appbar">
          <div className="appbar-row">
            <div className="brand">
              <span className="brand-mark">س</span>
              <div className="brand-text">
                <div className="brand-name">مساحة تشغيل المشرف</div>
                <div className="brand-date nums">الخميس، ١٤ أغسطس</div>
              </div>
            </div>
            <div className="appbar-actions">
              <button className="icon-btn" aria-label="بحث"><Search size={18} /></button>
              <button className="icon-btn" aria-label="الإشعارات"><Bell size={18} /><span className="dot-badge" /></button>
            </div>
          </div>
          <div className="role-row">
            <div className="role-select"><UserRound size={14} /><span>مشرف مبيعات هاتفية</span></div>
            <div className="device-toggle">
              <button className={!isTablet ? "dev-btn active" : "dev-btn"} onClick={() => setDevice("mobile")}><Smartphone size={13} /> هاتف</button>
              <button className={isTablet ? "dev-btn active" : "dev-btn"} onClick={() => setDevice("tablet")}><Monitor size={13} /> لوحة إشراف</button>
            </div>
          </div>
        </header>

        {isTablet ? (
          <div className="split">
            <div className="split-list">
              <div className="section-label">استثناءات تحتاج تدخّلًا</div>
              <div className="reg-list">
                {exceptions.map(x => (
                  <div className="reg-row" key={x.id}>
                    <button className="reg-head cust-row" onClick={() => setSelectedExc(x.id)}>
                      <span className={"reg-mark " + (x.status === "open" ? (x.severity === "urgent" ? "mark-urgent" : "mark-caution") : x.stillOpen ? "mark-caution" : "mark-normal")} />
                      <span className="reg-text">
                        <span className="reg-label">{x.what}</span>
                        <span className="reg-age">{x.employee} · {x.status === "open" ? x.age : x.stillOpen ? "تم اتخاذ إجراء — العمل مستمر" : "تم الحل"}</span>
                      </span>
                      <ChevronLeft size={15} color="var(--ink-300)" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="section-label">تنفيذ الفريق</div>
              <div className="reg-list">
                {employees.map(e => (
                  <EmployeeRow key={e.id} emp={e} exceptions={exceptions} coaching={coaching} open={openEmployee === e.id} onToggle={() => setOpenEmployee(openEmployee === e.id ? null : e.id)} />
                ))}
              </div>
            </div>
            <div className="split-detail">
              <div className="detail-pane-body">
                {selectedExc ? (
                  <>
                    <div className="section-label">تفاصيل الاستثناء</div>
                    <ExceptionDetail exc={exceptions.find(x => x.id === selectedExc)} onAction={takeAction} />
                  </>
                ) : (
                  <div className="tab-placeholder">
                    <PackageCheck size={22} color="var(--ink-300)" />
                    <div className="tab-placeholder-title">اختر استثناءً من القائمة لعرض تفاصيله وإجراءاته</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <main className="content">{content}</main>
        )}

        {!isTablet && (
          <nav className="bottom-nav">
            {NAV.map(n => {
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
      </div>

      {toast && (
        <div className="toast">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CSS — same tokens/primitives as Artifacts 0–2                          */
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
  color:var(--ink-900); background:var(--canvas-alt);
  display:flex; justify-content:center; align-items:flex-start;
  min-height:100vh; padding:20px 10px; box-sizing:border-box; position:relative;
}
.sr-app *{box-sizing:border-box;}
.sr-app button{font-family:inherit; cursor:pointer; border:none; background:none; color:inherit; text-align:inherit;}
.sr-app *:focus-visible{outline:2px solid var(--action); outline-offset:2px; border-radius:4px;}
.nums{font-variant-numeric:tabular-nums; font-feature-settings:"tnum"; letter-spacing:.2px;}

.frame{background:var(--canvas); border:1px solid var(--rule); overflow:hidden; display:flex; flex-direction:column; box-shadow:0 1px 2px rgba(29,51,88,.04);}
.frame-mobile{width:390px; max-width:100%; height:780px; border-radius:22px;}
.frame-wide{width:100%; max-width:1080px; height:720px; border-radius:14px;}

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
.device-toggle{display:flex; background:var(--canvas-alt); border:1px solid var(--rule); border-radius:8px; padding:2px; gap:2px;}
.dev-btn{display:flex; align-items:center; gap:5px; font-size:11px; padding:5px 10px; border-radius:6px; color:var(--ink-500);}
.dev-btn.active{background:var(--ink-900); color:#fff;}
.chev{transition:transform .15s ease;}
.chev.open{transform:rotate(180deg);}

.content{flex:1; overflow-y:auto; padding:16px 16px 24px;}
.section-label{font-family:'Tajawal',sans-serif; font-weight:700; font-size:13px; color:var(--ink-700); margin:20px 2px 10px; border-inline-start:2px solid var(--stamp); padding-inline-start:8px;}

/* hero (frozen) */
.hero{display:block; width:100%; background:var(--ink-900); color:#fff; border-radius:8px; border-top:3px solid var(--stamp); padding:16px 18px; text-align:right; min-height:44px;}
.hero-eyebrow{font-size:11px; color:var(--stamp-soft); margin-bottom:6px; letter-spacing:.3px; font-weight:600;}
.hero-title{font-family:'Tajawal',sans-serif; font-weight:700; font-size:17px; line-height:1.35;}
.hero-meta{font-size:12px; color:#C9D8EC; margin-top:6px;}

/* attention state (positive fallback, reused from Artifact 2) */
.attn-row{display:flex; align-items:center; gap:10px; padding:10px 2px; font-size:12.5px;}
.attn-ok{color:var(--success);}

/* checkpoint switcher — a segmented control, not new chrome */
.checkpoint-switch{display:flex; background:var(--canvas-alt); border:1px solid var(--rule); border-radius:8px; padding:3px; gap:2px; margin-top:14px;}
.cp-btn{flex:1; font-size:12px; font-weight:600; color:var(--ink-500); padding:8px 4px; border-radius:6px; min-height:36px;}
.cp-btn.active{background:var(--ink-900); color:#fff;}

/* checkpoint rows */
.checkpoint-row{display:flex; align-items:center; gap:12px; padding:10px 4px; border-top:1px solid var(--rule);}
.checkpoint-row:first-child{border-top:none;}
.checkpoint-value{font-size:18px; font-weight:700; color:var(--ink-900); min-width:44px; text-align:center; flex-shrink:0;}
.checkpoint-text{flex:1; text-align:right;}

/* ledger register (frozen) */
.reg-list{display:flex; flex-direction:column;}
.reg-row{border-top:1px solid var(--rule);}
.reg-row:first-child{border-top:none;}
.reg-head{display:flex; align-items:center; gap:12px; width:100%; padding:12px 4px; min-height:44px;}
.reg-mark{width:10px; height:10px; flex-shrink:0;}
.mark-urgent{background:var(--danger); border-radius:2px; transform:rotate(45deg);}
.mark-caution{background:var(--caution); border-radius:3px;}
.mark-normal{border-radius:50%; border:2px solid var(--action); background:var(--canvas);}
.reg-count{font-size:14px; font-weight:700; color:var(--ink-900); min-width:22px; text-align:center; flex-shrink:0;}
.reg-text{flex:1; text-align:right;}
.reg-label{font-size:13.5px; font-weight:600; color:var(--ink-800);}
.reg-age{font-size:11.5px; color:var(--ink-500); margin-top:1px;}
.reg-breakdown{padding:2px 4px 14px 4px;}
.breakdown-row{display:flex; align-items:center; gap:10px; padding:7px 0; font-size:12.5px; border-bottom:1px dashed var(--rule);}
.breakdown-row:last-child{border-bottom:none;}
.breakdown-who{flex:1; color:var(--ink-700);}
.breakdown-count{font-weight:700;}
.breakdown-age{color:var(--ink-500); font-size:11.5px;}
.cust-row{width:100%;}

/* exception detail */
.exc-detail{padding:4px 0 6px;}
.attn-reason{font-size:12.5px; color:var(--ink-800); line-height:1.5;}
.flag-list{display:flex; flex-direction:column; gap:6px;}
.flag-row{display:flex; align-items:flex-start; gap:6px; font-size:12px; line-height:1.5; padding:8px 10px; border-radius:8px; background:var(--canvas-alt);}
.flag-issue{color:var(--ink-700);}
.hint-line{display:flex; align-items:center; gap:5px; font-size:11.5px; color:var(--ink-500); margin-top:6px; line-height:1.5;}
.chip-row{display:flex; flex-wrap:wrap; gap:8px;}
.reason-chip{font-size:12.5px; font-weight:600; color:var(--ink-700); border:1px solid var(--rule); border-radius:7px; padding:7px 12px; min-height:36px;}
.reason-chip.active{color:var(--action); border-color:var(--action); background:var(--quiet-blue);}
.resolved-note{display:flex; align-items:center; gap:6px; font-size:12px; color:var(--success); margin-top:10px; padding:9px 11px; background:var(--success-bg); border-radius:8px;}
.resolved-note.in-progress{color:var(--caution); background:var(--caution-bg);}
.mini-action{font-size:11.5px; font-weight:700; color:var(--action); border:1px solid var(--action); border-radius:7px; padding:6px 10px; min-height:32px; flex-shrink:0;}

/* call quality */
.order-detail{padding:6px 0 14px;}
.quality-list{display:flex; flex-direction:column; gap:2px; margin-top:10px;}
.quality-row{display:flex; align-items:center; gap:10px; padding:6px 0;}
.quality-label{flex:1; font-size:12.5px; color:var(--ink-800);}
.status-tag{display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700;}

/* rail (frozen) */
.rail-list{display:flex; flex-direction:column;}
.rail-item{display:flex; align-items:stretch; gap:10px; border-top:1px solid var(--rule);}
.rail-item-first{border-top:none;}
.rail-spine{width:36px; flex-shrink:0; display:flex; flex-direction:column; align-items:center; position:relative; padding-top:18px;}
.rail-node{width:12px; height:12px; flex-shrink:0; z-index:2; box-sizing:border-box;}
.node-normal{border-radius:50%; border:2px solid var(--action); background:var(--canvas);}
.node-urgent{border-radius:2px; background:var(--danger); transform:rotate(45deg);}
.node-completed{border-radius:50%; background:var(--success); box-shadow:inset 0 0 0 2px var(--canvas);}
.rail-line{position:absolute; width:1px; background:var(--rule); right:50%; left:50%; margin:0 auto;}
.rail-line-top{top:0; height:22px;}
.rail-line-bottom{bottom:0; top:33px;}
.rail-card{flex:1; background:transparent; border:none; padding:14px 4px 16px 0; margin:0; display:flex; flex-direction:column; gap:5px;}
.rail-card.no-hover{cursor:default;}
.rail-card-top{display:flex; align-items:center; justify-content:space-between; gap:8px;}
.rail-kind{font-size:11px; color:var(--ink-500); font-weight:500;}
.rail-sub{font-size:12.5px; color:var(--ink-700); line-height:1.5;}

/* buttons (frozen) */
.btn-primary{flex:1; background:var(--action); color:#fff; border-radius:9px; padding:0 16px; min-height:46px; font-weight:700; font-size:13.5px; display:flex; align-items:center; justify-content:center; gap:6px;}
.btn-primary:hover{background:var(--ink-900);}
.btn-primary:disabled{background:var(--ink-300); cursor:not-allowed;}
.close-day-btn{margin-top:16px;}

/* demo labeling + placeholder */
.demo-note{display:flex; align-items:center; gap:6px; font-size:11px; color:var(--ink-400); margin-top:12px; padding:10px 4px; border-top:1px dashed var(--rule);}
.tab-placeholder{display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px; padding:60px 20px; color:var(--ink-500);}
.tab-placeholder-title{font-family:'Tajawal',sans-serif; font-weight:700; font-size:14px; color:var(--ink-700);}

/* bottom nav (frozen) */
.bottom-nav{display:flex; border-top:1px solid var(--rule); background:var(--canvas); flex-shrink:0;}
.nav-btn{flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:9px 0 10px; color:var(--ink-300); font-size:10.5px; min-height:44px;}
.nav-btn.active{color:var(--action);}
.nav-btn span{font-weight:600;}

/* toast (frozen) */
.toast{position:fixed; bottom:28px; left:50%; transform:translateX(-50%); background:var(--ink-900); color:#fff; padding:12px 18px; border-radius:10px; display:flex; align-items:center; gap:8px; font-size:12.5px; box-shadow:0 10px 30px rgba(22,40,63,.28); z-index:100; max-width:320px;}

/* tablet split (frozen) */
.split{flex:1; display:flex; overflow:hidden;}
.split-list{width:340px; flex-shrink:0; border-inline-start:1px solid var(--rule); overflow-y:auto; padding:16px;}
.split-detail{flex:1; overflow-y:auto; display:flex; flex-direction:column;}
.detail-pane-body{padding:20px 22px; flex:1; overflow-y:auto;}

@media (prefers-reduced-motion: reduce){
  .sr-app *{animation:none !important; transition:none !important;}
}
`;
