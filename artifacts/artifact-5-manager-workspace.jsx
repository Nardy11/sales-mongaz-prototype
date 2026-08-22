import React, { useState, useMemo } from "react";
import {
  ClipboardCheck, Flag, Users, BarChart3, Bell, Search, ChevronDown, ChevronLeft,
  CheckCircle2, AlertTriangle, UserRound, Monitor, Smartphone, ArrowUpRight,
  PackageCheck, MessageCircleWarning, Info, CalendarClock, Clock,
  Radar, GraduationCap, Wallet,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  NAV (same shape as the frozen Manager nav established in Artifact 0)   */
/* ---------------------------------------------------------------------- */

const NAV = [
  { id: "review", label: "المراجعة", icon: ClipboardCheck },
  { id: "priorities", label: "الأولويات", icon: Flag },
  { id: "customers", label: "العملاء", icon: Users },
  { id: "reports", label: "التقارير", icon: BarChart3 },
];

const CHECKPOINTS = [
  { id: "morning", label: "الصباح" },
  { id: "midday", label: "منتصف اليوم" },
  { id: "eod", label: "نهاية اليوم" },
];

const ORDER_STEPS = ["مسجلة", "مراجعة الحسابات", "معتمدة", "التجهيز", "تجهيز التسليم", "تم التسليم", "مغلق"];

/* ---------------------------------------------------------------------- */
/*  MANAGER ATTENTION QUEUE — cross-functional, decision-level exceptions  */
/*  (continuous with the same customers/situations from Artifacts 2 & 3)   */
/* ---------------------------------------------------------------------- */

const SEED_EXCEPTIONS = [
  {
    id: "m1", type: "credit_decision", severity: "urgent",
    what: "قرار ائتمان مطلوب — صيدليات الشفاء", customer: "صيدليات الشفاء", owner: "سارة عادل (مبيعات هاتفية)",
    why: "وعد سداد متأخر 3 أيام (4,200 ج.م) — تم رصدها من المشرف بالفعل",
    evidence: ["الوعد الأصلي: 4,200 ج.م — الخميس الماضي", "المشرف اتخذ إجراء أولي: تصعيد للمدير"],
    status: "open", decision: true,
  },
  {
    id: "m2", type: "order_blocked", severity: "urgent",
    what: "طلب معطَّل — توكيلات الشرق للسيارات", customer: "توكيلات الشرق للسيارات", owner: "قسم التوزيع",
    why: "تأخر شحن قطع الغيار عن المخزن 5 أيام — يؤثر على عميل ذو قيمة", orderValue: "2,300 ج.م",
    evidence: ["الطلب: طقم فحمات فرامل × 4 — 2,300 ج.م", "الحالة الحالية: تجهيز التسليم (خطوة 5 من 7)"],
    currentStep: 4, closure: null, status: "open",
  },
  {
    id: "m3", type: "escalated_complaint", severity: "urgent",
    what: "شكوى مُصعَّدة — توكيلات الشرق للسيارات", customer: "توكيلات الشرق للسيارات", owner: "قسم التوزيع",
    why: "تأخير توصيل متكرر — تم تصعيدها من المشرف لعدم الحل خلال المهلة المتفق عليها",
    evidence: ["تصنيف الشكوى: تأخير توصيل", "الإجراء السابق: تسريع الشحنة — لم يُغلق الملف بعد"],
    status: "open",
  },
  {
    id: "m4", type: "team_execution", severity: "watch", team: "t1",
    what: "أداء فريق المبيعات الهاتفية أقل من الخطة", customer: null, owner: "محمد الطيب",
    why: "3 أيام متتالية أقل من المتوسط — المشرف بدأ بالفعل خطة تحسين أسبوعية",
    evidence: ["مكالمات مكتملة: 9 من 15 اليوم", "المشرف اتخذ إجراء: جدولة تدريب بالفعل"],
    status: "open",
  },
  {
    id: "m5", type: "inactive_customer", severity: "watch",
    what: "عميل متوقف — فرصة عودة", customer: "بقالة النصر", owner: "نهى كامل (مبيعات هاتفية)",
    why: "متوقف منذ 4 أشهر بعد خلاف على الأسعار — جُدولت محاولة تفعيل بالفعل",
    evidence: ["آخر نشاط: زيارة تغطية منذ 4 أشهر", "فرصة عودة مسجَّلة بعد تسوية الخلاف"],
    status: "open",
  },
  {
    id: "m6", type: "market_observation", severity: "watch",
    what: "عرض منافس يتكرر ذكره من عدة عملاء", customer: null, owner: "فريق المبيعات",
    why: "شركة النجاح للتوزيع تقدّم خصم 10٪ بالجملة على منظفات الأرضيات",
    evidence: ["سوبر ماركت الأمانة — ذكر العرض أثناء زيارة", "عميل آخر في نفس المنطقة أبلغ عن نفس العرض"],
    status: "open",
  },
  {
    id: "m7", type: "order_blocked", severity: "watch",
    what: "طلب تم تسليمه — إغلاق تشغيلي بانتظار التأكيد", customer: "سوبر ماركت الأمانة", owner: "وليد سامي (مندوب مبيعات)",
    why: "سُجل قرار متابعة سابق؛ تم التسليم للعميل لكن الإغلاق التشغيلي لم يُسجل بعد.", orderValue: "6,800 ج.م",
    evidence: ["تم التسليم اليوم 14:30", "المطلوب: تأكيد الاستلام ثم إغلاق السجل التشغيلي"],
    currentStep: 5, closure: { status: "pending", owner: "وليد سامي", recordedAt: "اليوم 14:30", note: "تم التسليم؛ بانتظار تأكيد الاستلام والإغلاق التشغيلي." },
    status: "actioned", stillOpen: true, resolutionNote: "تمت متابعة التنفيذ بعد قرار المدير",
  },
  {
    id: "m8", type: "order_blocked", severity: "watch",
    what: "طلب مغلق تشغيليًا", customer: "سوبر ماركت الأمانة", owner: "وليد سامي (مندوب مبيعات)",
    why: "اكتمل التسليم ثم سُجل الإغلاق بعد تأكيد الاستلام.", orderValue: "1,200 ج.م",
    evidence: ["تم التسليم أمس", "تأكيد استلام العميل مسجل"],
    currentStep: 6, closure: { status: "closed", owner: "وليد سامي", recordedAt: "أمس 16:10", note: "تم تأكيد الاستلام وإغلاق الطلب بعد اكتمال التنفيذ." },
    status: "actioned", stillOpen: false, resolutionNote: "تم الحل بالكامل — أُغلق الطلب تشغيليًا",
  },
];

const ACTIONS_BY_TYPE = {
  credit_decision: [{ id: "extend", label: "تمديد المهلة" }, { id: "freeze", label: "تجميد الحد الائتماني" }],
  order_blocked: [{ id: "alternative", label: "الموافقة على بديل" }, { id: "urgent", label: "تعليمها عاجلة" }, { id: "reschedule", label: "إعادة جدولة" }],
  escalated_complaint: [{ id: "compensate", label: "اعتماد تعويض" }, { id: "close", label: "إغلاق كمحلولة" }, { id: "followup", label: "طلب متابعة إضافية" }],
  team_execution: [{ id: "confirm", label: "تأكيد متابعة المشرف" }, { id: "develop", label: "تكليف بخطة تطوير إضافية" }],
  inactive_customer: [{ id: "approve_offer", label: "اعتماد عرض تفعيل خاص" }, { id: "assign_rep", label: "تكليف مندوب ميداني" }, { id: "close_opp", label: "إغلاق الفرصة" }],
  market_observation: [{ id: "pricing", label: "تعميم توجيه تسعير مؤقت" }, { id: "assign_team", label: "تكليف الفريق بالتواصل" }, { id: "no_action", label: "لا حاجة لإجراء الآن" }],
};

/** Whether taking this action finishes the underlying operational work, or
 *  only records the manager's decision while work continues (e.g. an
 *  approved alternative still has to be delivered; a rescheduled order is
 *  still outstanding by definition). `true` here means fully resolved. */
const ACTION_RESOLVES_WORK = {
  credit_decision: { extend: false, freeze: false },
  order_blocked: { alternative: false, urgent: false, reschedule: false },
  escalated_complaint: { compensate: false, close: true, followup: false },
  team_execution: { confirm: true, develop: true },
  inactive_customer: { approve_offer: false, assign_rep: false, close_opp: true },
  market_observation: { pricing: true, assign_team: false, no_action: true },
};

/** A decision has been recorded (status !== "open") but the work behind it
 *  may still be outstanding (stillOpen). This is the single predicate every
 *  "unresolved / carried forward" count should use — never raw status alone. */
function isOperationallyOpen(x) {
  return x.status === "open" || x.stillOpen === true;
}

const TEAMS = [
  { id: "t1", name: "فريق المبيعات الهاتفية", supervisor: "مشرف مبيعات هاتفية" },
  { id: "t2", name: "فريق المبيعات الميدانية", supervisor: "—" },
];

const SEED_DEVELOPMENT = [];

const SEED_MANAGER_PRIORITIES = [
  { id: "mp1", subject: "صيدليات الشفاء", kind: "ائتمان وتحصيل", reason: "وعد سداد متأخر مع قرار ائتمان مطلوب", owner: "سارة عادل", due: "اليوم قبل 12:00", level: "عاجلة", confirmed: false },
  { id: "mp2", subject: "توكيلات الشرق للسيارات", kind: "طلب مهم", reason: "طلب متعطل يؤثر على عميل مهم", owner: "قسم التوزيع", due: "اليوم", level: "عاجلة", confirmed: true },
  { id: "mp3", subject: "بقالة النصر", kind: "إعادة تنشيط", reason: "فرصة عودة بعد توقف 4 أشهر", owner: "نهى كامل", due: "هذا الأسبوع", level: "متابعة", confirmed: false },
  { id: "mp4", subject: "استجابة للسوق", kind: "ملاحظة سوق", reason: "تكرار عرض منافس لدى أكثر من عميل", owner: "فريق المبيعات", due: "اليوم", level: "متابعة", confirmed: false },
];


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

function LifecycleSteps({ steps, currentStep, exception, closure }) {
  return (
    <div className="lifecycle">
      {steps.map((s, i) => (
        <div key={s} className={"lifecycle-step" + (i < currentStep ? " done" : i === currentStep ? " current" : "")}>
          <span className="lifecycle-mark" />
          <span className="lifecycle-label">{s}</span>
        </div>
      ))}
      {exception && <div className="lifecycle-exception"><AlertTriangle size={12} /> {exception}</div>}
      {closure && (
        <div className={"lifecycle-closure " + closure.status}>
          {closure.status === "closed" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          <span><b>{closure.status === "closed" ? "مغلق" : "تم التسليم — بانتظار الإغلاق"}</b> · {closure.owner} · {closure.recordedAt}<br />{closure.note}</span>
        </div>
      )}
    </div>
  );
}

const TYPE_ICON = {
  credit_decision: Wallet, order_blocked: PackageCheck, escalated_complaint: MessageCircleWarning,
  team_execution: Users, inactive_customer: CalendarClock, market_observation: Radar,
};

function ExceptionDetail({ exc, onAction }) {
  const actions = ACTIONS_BY_TYPE[exc.type] || [];
  const Icon = TYPE_ICON[exc.type] || Info;
  return (
    <div className="exc-detail">
      <div className="hint-line"><Icon size={12} /> المسؤول الحالي: {exc.owner}{exc.customer ? ` · ${exc.customer}` : ""}</div>
      <div className="attn-reason" style={{ marginTop: 6 }}>{exc.why}</div>
      <div className="flag-list" style={{ marginTop: 8 }}>
        {exc.evidence.map((e, i) => <div key={i} className="flag-row flag-issue"><ArrowUpRight size={12} /><span>{e}</span></div>)}
      </div>

      {exc.type === "order_blocked" && (
        <LifecycleSteps steps={ORDER_STEPS} currentStep={exc.currentStep} exception={`${exc.why} — قيمة الطلب ${exc.orderValue}`} closure={exc.closure} />
      )}

      {exc.status === "open" ? (
        exc.type === "credit_decision" ? (
          <>
            <div className="decision-row" style={{ marginTop: 12 }}>
              <span className="decision-opt">تمديد المهلة</span>
              <span className="decision-or">أم</span>
              <span className="decision-opt">تجميد الحد الائتماني</span>
            </div>
            <div className="chip-row" style={{ marginTop: 10 }}>
              {actions.map(a => <button key={a.id} className="reason-chip" onClick={() => onAction(exc.id, a.id)}>{a.label}</button>)}
            </div>
          </>
        ) : (
          <div className="chip-row" style={{ marginTop: 10 }}>
            {actions.map(a => <button key={a.id} className="reason-chip" onClick={() => onAction(exc.id, a.id)}>{a.label}</button>)}
          </div>
        )
      ) : (
        <div className={"resolved-note" + (exc.stillOpen ? " in-progress" : "")}>
          {exc.stillOpen ? <Clock size={14} /> : <CheckCircle2 size={14} />}
          {exc.resolutionNote}{exc.stillOpen ? " — العمل التشغيلي مستمر ولم يُغلق بعد" : ""}
        </div>
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
          count={x.status === "open" ? "•" : x.stillOpen ? "↻" : "✓"}
          label={x.what} sub={x.status === "open" ? x.owner : x.stillOpen ? "قرار متخذ — العمل مستمر" : "تم الحل بالكامل"}
        >
          <ExceptionDetail exc={x} onAction={onAction} />
        </LedgerRegister>
      ))}
    </div>
  );
}

function TeamRow({ team, exceptions, development, open, onToggle }) {
  const mine = exceptions.filter(x => x.type === "team_execution" && x.status === "open" && x.team === team.id);
  const hasOpenIssue = mine.length > 0;
  const mark = hasOpenIssue ? "caution" : "normal";
  const label = hasOpenIssue ? "يحتاج انتباه — المشرف يتابع بالفعل" : "على المسار الصحيح";
  const devForTeam = development.filter(d => d.team === team.id);
  return (
    <LedgerRegister open={open} onToggle={onToggle} mark={mark} count={mine.length + devForTeam.length} label={team.name} sub={`${label} · المشرف: ${team.supervisor}`}>
      {hasOpenIssue ? (
        <div className="hint-line"><ArrowUpRight size={12} /> {mine[0].why}</div>
      ) : (
        <div className="breakdown-row"><span className="breakdown-who">لا يوجد ما يستدعي تدخل المدير حاليًا</span></div>
      )}
      {devForTeam.map(d => (
        <div key={d.id} className="hint-line"><GraduationCap size={12} /> {d.employee}: {d.action} — متابعة {d.followUp}</div>
      ))}
    </LedgerRegister>
  );
}

function ManagerPriorityList({ priorities, onConfirm, onAdjust }) {
  return (
    <div className="reg-list">
      {priorities.map(p => (
        <LedgerRegister key={p.id} open={false} onToggle={() => {}} mark={p.confirmed ? "normal" : p.level === "عاجلة" ? "urgent" : "caution"} count={p.confirmed ? "✓" : "•"} label={`${p.subject} — ${p.kind}`} sub={`${p.reason} · ${p.owner} · ${p.due}`}>
          <></>
        </LedgerRegister>
      )).map((row, i) => (
        <React.Fragment key={priorities[i].id}>
          {row}
          <div className="chip-row" style={{ margin: "-6px 12px 10px" }}>
            {!priorities[i].confirmed && <button className="reason-chip" onClick={() => onConfirm(priorities[i].id)}>تأكيد الأولوية</button>}
            <button className="reason-chip" onClick={() => onAdjust(priorities[i].id)}>{priorities[i].level === "عاجلة" ? "تحويل إلى متابعة" : "رفع إلى عاجلة"}</button>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CHECKPOINTS — same evidence, three different questions                 */
/* ---------------------------------------------------------------------- */

function useCheckpointData(exceptions, development, actionsTakenCount, priorities) {
  // Morning is an explicit snapshot captured once at the start of the day —
  // labeled as such, so it never silently drifts as decisions are made later.
  const [morningSnapshot] = useState(() => ([
    { label: "جاهزية الفرق", value: "2/2", sub: "لقطة الصباح — لا يوجد غياب مؤثر على التنفيذ" },
    { label: "عملاء مهمون يحتاجون متابعة", value: exceptions.filter(x => x.customer).length, sub: "لقطة الصباح — قبل بدء التنفيذ" },
    { label: "قضايا عاجلة معروفة قبل البدء", value: exceptions.filter(x => x.severity === "urgent").length, sub: "لقطة الصباح — تحتاج قرارًا مبكرًا" },
  ]));
  // Priority confirmation/adjustment is live manager work, so this row reads
  // the real priority state while the remaining readiness rows stay a morning snapshot.
  const morning = [
    { label: "أولويات اليوم مؤكدة", value: `${priorities.filter(p => p.confirmed).length}/${priorities.length}`, sub: `${priorities.filter(p => p.level === "عاجلة").length} عاجلة — حالة حية` },
    ...morningSnapshot,
  ];

  // Midday and end-of-day are always live, and always read the same
  // "operationally open" definition — a decision that's recorded but whose
  // underlying work isn't finished must keep counting here.
  const live = useMemo(() => {
    const open = exceptions.filter(isOperationallyOpen);
    return {
      midday: [
        { label: "استثناءات مفتوحة", value: open.length, sub: open.length ? "تشمل قرارات مُتخذة لم يكتمل تنفيذها بعد" : "لا يوجد" },
        { label: "طلبات معطَّلة", value: exceptions.filter(x => x.type === "order_blocked" && isOperationallyOpen(x)).length, sub: "تؤثر على عملاء" },
        { label: "شكاوى مُصعَّدة", value: exceptions.filter(x => x.type === "escalated_complaint" && isOperationallyOpen(x)).length, sub: "تحتاج قرارًا أو تنفيذًا" },
        { label: "ملاحظات سوق تحتاج ردًا", value: exceptions.filter(x => x.type === "market_observation" && isOperationallyOpen(x)).length, sub: "بيانات تجريبية" },
      ],
      eod: [
        { label: "استثناءات لم تُحل", value: open.length, sub: open.length ? "تُرحّل لغدًا بمسؤول محدد" : "تم إغلاق الكل فعليًا" },
        { label: "قرارات اتُّخذت اليوم", value: actionsTakenCount, sub: "ائتمان، تصعيد، تطوير، أو تعميم" },
        { label: "إجراءات تطوير مفتوحة", value: development.length, sub: "بانتظار المتابعة" },
        { label: "التزامات مُرحَّلة", value: open.length, sub: "بملكية واضحة لكل بند" },
      ],
    };
  }, [exceptions, development, actionsTakenCount]);

  return { morning, ...live };
}

function CheckpointPanel({ rows }) {
  return (
    <div className="reg-list">
      {rows.map((r, i) => (
        <div className="checkpoint-row" key={i}>
          <span className="checkpoint-value nums">{r.value}</span>
          <span className="checkpoint-text"><span className="reg-label">{r.label}</span><span className="reg-age">{r.sub}</span></span>
        </div>
      ))}
      <div className="demo-note"><Info size={12} /> الأرقام بيانات تجريبية لأغراض العرض فقط</div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CUSTOMERS TAB — segmentation only where it changes a decision          */
/* ---------------------------------------------------------------------- */

function CustomersTab({ exceptions }) {
  const [open, setOpen] = useState(null);

  // Group by customer so one customer with several reasons shows as one
  // entry with inspectable underlying reasons, not duplicate rows.
  const groups = useMemo(() => {
    const map = new Map();
    exceptions.filter(x => x.customer).forEach(x => {
      if (!map.has(x.customer)) map.set(x.customer, []);
      map.get(x.customer).push(x);
    });
    return Array.from(map.entries()).map(([name, reasons]) => {
      const anyOpen = reasons.some(isOperationallyOpen);
      const anyUrgentOpen = reasons.some(r => isOperationallyOpen(r) && r.severity === "urgent");
      return { name, reasons, anyOpen, anyUrgentOpen };
    });
  }, [exceptions]);

  return (
    <>
      <div className="section-label">عملاء يحتاجون قرارًا الآن</div>
      <div className="reg-list">
        {groups.map(g => (
          <LedgerRegister
            key={g.name} open={open === g.name} onToggle={() => setOpen(open === g.name ? null : g.name)}
            mark={!g.anyOpen ? "normal" : g.anyUrgentOpen ? "urgent" : "caution"}
            count={g.reasons.length}
            label={g.name}
            sub={g.anyOpen ? `${g.reasons.length} سبب يحتاج انتباهًا` : "كل الأسباب مُغلقة بالكامل"}
          >
            {g.reasons.map(r => (
              <div key={r.id} className="breakdown-row">
                <span className="breakdown-who">
                  {r.why}
                  {r.status !== "open" && <span style={{ color: r.stillOpen ? "var(--caution)" : "var(--success)" }}> — {r.stillOpen ? "قرار متخذ، العمل مستمر" : "تم الحل بالكامل"}</span>}
                </span>
              </div>
            ))}
          </LedgerRegister>
        ))}
      </div>
      <div className="hint-line" style={{ marginTop: 10 }}><Info size={12} /> يعرض هذا القسم العملاء المرتبطين بقرار مطلوب فقط، وليس قائمة عملاء كاملة.</div>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/*  REPORTS TAB — derived, evidence-backed, demo-labeled                   */
/* ---------------------------------------------------------------------- */

function ReportsTab({ exceptions, development, actionsTakenCount }) {
  const [open, setOpen] = useState(null);
  const carried = exceptions.filter(isOperationallyOpen);
  const blockedOrders = exceptions.filter(x => x.type === "order_blocked" && isOperationallyOpen(x));
  const rows = [
    { id: "plan", severity: "normal", count: "بيانات تجريبية", label: "التنفيذ مقابل الخطة", sub: "طلبات، تحصيل، عملاء جدد", items: ["طلبات: 9 من 12 مخطط لها (تجريبي)", "تحصيل: 62,000 ج.م من 80,000 ج.م مستهدف (تجريبي)", "عملاء جدد: 2 من 3 (تجريبي)"] },
    { id: "orders", severity: "normal", count: blockedOrders.length, label: "طلبات معطَّلة", sub: "بانتظار أو قيد المعالجة", items: blockedOrders.map(x => `${x.customer} — ${x.why}`) },
    { id: "credit", severity: "normal", count: exceptions.filter(x => x.type === "credit_decision").length, label: "قرارات ائتمان وتحصيل", sub: "متخذة أو معلّقة", items: exceptions.filter(x => x.type === "credit_decision").map(x => `${x.customer} — ${x.status === "open" ? "معلّق" : x.resolutionNote}`) },
    { id: "complaints", severity: "normal", count: exceptions.filter(x => x.type === "escalated_complaint").length, label: "شكاوى مُصعَّدة", sub: "قرار مدير مطلوب أو مُتخذ", items: exceptions.filter(x => x.type === "escalated_complaint").map(x => `${x.customer} — ${x.status === "open" ? "بانتظار القرار" : x.resolutionNote}`) },
    { id: "market", severity: "normal", count: exceptions.filter(x => x.type === "market_observation").length, label: "استجابات لملاحظات سوق", sub: "بيانات تجريبية", items: exceptions.filter(x => x.type === "market_observation").map(x => x.status === "open" ? `${x.what} — بانتظار الرد` : `${x.what} — ${x.resolutionNote}`) },
    { id: "dev", severity: "normal", count: development.length, label: "إجراءات تطوير وتدريب", sub: development.length ? "مرتبطة بأدلة تشغيلية" : "لا يوجد", items: development.map(d => `${d.employee} — ${d.action}`) },
    { id: "carried", severity: carried.length ? "caution" : "normal", count: carried.length, label: "أعمال مُرحَّلة لغدًا", sub: "بملكية واضحة — تشمل قرارات مُتخذة لم يكتمل تنفيذها بعد", items: carried.map(x => `${x.what} — المسؤول: ${x.owner}${x.status !== "open" ? " (قرار متخذ، العمل مستمر)" : " (بانتظار القرار)"}`) },
  ];
  return (
    <>
      <div className="section-label">تقرير نهاية اليوم</div>
      <div className="reg-list">
        {rows.map(r => (
          <div className="reg-row" key={r.id}>
            <button className="reg-head" onClick={() => setOpen(open === r.id ? null : r.id)}>
              <span className={"reg-mark mark-" + r.severity} />
              <span className="reg-count nums">{r.count}</span>
              <span className="reg-text"><span className="reg-label">{r.label}</span><span className="reg-age">{r.sub}</span></span>
              <ChevronDown size={16} className={open === r.id ? "chev open" : "chev"} />
            </button>
            {open === r.id && (
              <div className="reg-breakdown">
                {r.items.length ? r.items.map((t, i) => <div className="breakdown-row" key={i}><span className="breakdown-who">{t}</span></div>) : <div className="breakdown-row"><span className="breakdown-who">لا توجد بنود</span></div>}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="demo-note"><Info size={12} /> كل الأهداف والقيم الرقمية بيانات تجريبية — قابلة للاستبدال عبر إعداد مصرَّح به دون تعديل برمجي</div>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/*  MAIN APP                                                                */
/* ---------------------------------------------------------------------- */

export default function App() {
  const [device, setDevice] = useState("mobile");
  const [tab, setTab] = useState("review");
  const [checkpoint, setCheckpoint] = useState("morning");
  const [exceptions, setExceptions] = useState(SEED_EXCEPTIONS);
  const [development, setDevelopment] = useState(SEED_DEVELOPMENT);
  const [priorities, setPriorities] = useState(SEED_MANAGER_PRIORITIES);
  const [openException, setOpenException] = useState(null);
  const [openTeam, setOpenTeam] = useState(null);
  const [selectedExc, setSelectedExc] = useState(null); // tablet split
  const [toast, setToast] = useState(null);
  const [actionsTakenCount, setActionsTakenCount] = useState(0);

  const isTablet = device === "tablet";
  const checkpointData = useCheckpointData(exceptions, development, actionsTakenCount, priorities);
  const openExceptions = exceptions.filter(x => x.status === "open");
  const topUndecided = openExceptions.find(x => x.severity === "urgent") || openExceptions[0] || null;
  const continuingExceptions = exceptions.filter(x => x.status !== "open" && x.stillOpen);
  const topContinuing = continuingExceptions.find(x => x.severity === "urgent") || continuingExceptions[0] || null;

  function notify(msg) {
    setToast(msg);
    window.clearTimeout(window.__toastT);
    window.__toastT = window.setTimeout(() => setToast(null), 3600);
  }

  function confirmPriority(id) {
    setPriorities(ps => ps.map(p => p.id === id ? { ...p, confirmed: true } : p));
    notify("تم تأكيد الأولوية");
  }

  function adjustPriority(id) {
    setPriorities(ps => ps.map(p => p.id === id ? { ...p, level: p.level === "عاجلة" ? "متابعة" : "عاجلة", confirmed: true } : p));
    notify("تم تعديل الأولوية وتأكيدها");
  }

  function takeAction(excId, actionId) {
    const exc = exceptions.find(x => x.id === excId);
    if (!exc) return;
    let resolutionNote = "";

    if (exc.type === "credit_decision") {
      resolutionNote = actionId === "extend" ? `تم تمديد المهلة لـ ${exc.customer} — متابعة ${exc.owner}` : `تم تجميد الحد الائتماني لـ ${exc.customer}`;
    } else if (exc.type === "order_blocked") {
      resolutionNote = actionId === "alternative" ? `تمت الموافقة على بديل — سيُبلَّغ ${exc.owner}` : actionId === "urgent" ? `تم تعليم الطلب عاجلًا — أولوية لدى ${exc.owner}` : `تمت إعادة الجدولة — سيُبلَّغ العميل`;
    } else if (exc.type === "escalated_complaint") {
      resolutionNote = actionId === "compensate" ? `تم اعتماد تعويض للعميل — تنفيذ ${exc.owner}` : actionId === "close" ? "تم إغلاق الشكوى كمحلولة" : "تم طلب متابعة إضافية قبل الإغلاق";
    } else if (exc.type === "team_execution") {
      if (actionId === "develop") {
        setDevelopment(ds => [...ds, { id: "dev-" + Date.now(), employee: exc.owner, team: exc.team, evidence: exc.why, action: "خطة تطوير لمدة أسبوعين بمتابعة أسبوعية", owner: "المشرف والمدير", followUp: "بعد أسبوعين", status: "open" }]);
        resolutionNote = `تم تكليف ${exc.owner} بخطة تطوير إضافية`;
      } else {
        resolutionNote = "تم تأكيد أن المشرف يتابع الحالة — لا يلزم تدخل إضافي الآن";
      }
    } else if (exc.type === "inactive_customer") {
      resolutionNote = actionId === "approve_offer" ? `تم اعتماد عرض تفعيل خاص لـ ${exc.customer}` : actionId === "assign_rep" ? `تم تكليف مندوب ميداني بزيارة ${exc.customer}` : "تم إغلاق فرصة إعادة التنشيط";
    } else if (exc.type === "market_observation") {
      resolutionNote = actionId === "pricing" ? "تم تعميم توجيه تسعير مؤقت على الفريق" : actionId === "assign_team" ? "تم تكليف الفريق بالتواصل مع العملاء المتأثرين" : "لا يوجد إجراء الآن — سيُراقَب الوضع";
    }

    const resolved = ACTION_RESOLVES_WORK[exc.type]?.[actionId] ?? true;
    setExceptions(xs => xs.map(x => x.id === excId ? { ...x, status: "actioned", stillOpen: !resolved, resolutionNote } : x));
    setActionsTakenCount(n => n + 1);
    notify(resolutionNote);
  }

  const content = (
    <>
      {tab === "review" && (
        <>
          {topUndecided ? (
            <div className="hero">
              <div className="hero-eyebrow">التالي الآن</div>
              <div className="hero-title">{topUndecided.what}</div>
              <div className="hero-meta">{topUndecided.owner}{topUndecided.customer ? " · " + topUndecided.customer : ""}</div>
            </div>
          ) : topContinuing ? (
            <div className="hero">
              <div className="hero-eyebrow">متابعة التنفيذ</div>
              <div className="hero-title">{topContinuing.what}</div>
              <div className="hero-meta">{topContinuing.resolutionNote}</div>
            </div>
          ) : (
            <div className="attn-row attn-ok"><span className="rail-node node-completed" /><span>لا يوجد ما يستدعي قرارك حاليًا</span></div>
          )}

          <div className="checkpoint-switch">
            {CHECKPOINTS.map(c => <button key={c.id} className={checkpoint === c.id ? "cp-btn active" : "cp-btn"} onClick={() => setCheckpoint(c.id)}>{c.label}</button>)}
          </div>
          <div className="section-label">{checkpoint === "morning" ? "هل نحن جاهزون وبالأولويات الصحيحة؟" : checkpoint === "midday" ? "أين ينحرف التنفيذ عن الخطة؟" : "ما الذي يتبقى بلا قرار؟"}</div>
          <CheckpointPanel rows={checkpointData[checkpoint]} />
        </>
      )}

      {tab === "priorities" && (
        <>
          <div className="section-label">أولويات المدير اليوم</div>
          <ManagerPriorityList priorities={priorities} onConfirm={confirmPriority} onAdjust={adjustPriority} />

          <div className="section-label">استثناءات تحتاج قرارًا</div>
          <ExceptionQueue exceptions={exceptions} open={openException} onToggle={id => setOpenException(openException === id ? null : id)} onAction={takeAction} />

          <div className="section-label">الفرق</div>
          <div className="reg-list">
            {TEAMS.map(t => <TeamRow key={t.id} team={t} exceptions={exceptions} development={development} open={openTeam === t.id} onToggle={() => setOpenTeam(openTeam === t.id ? null : t.id)} />)}
          </div>
        </>
      )}

      {tab === "customers" && <CustomersTab exceptions={exceptions} />}
      {tab === "reports" && <ReportsTab exceptions={exceptions} development={development} actionsTakenCount={actionsTakenCount} />}
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
                <div className="brand-name">مساحة تشغيل المدير</div>
                <div className="brand-date nums">الخميس، ١٤ أغسطس</div>
              </div>
            </div>
            <div className="appbar-actions">
              <button className="icon-btn" aria-label="بحث"><Search size={18} /></button>
              <button className="icon-btn" aria-label="الإشعارات"><Bell size={18} /><span className="dot-badge" /></button>
            </div>
          </div>
          <div className="role-row">
            <div className="role-select"><UserRound size={14} /><span>مدير مبيعات</span></div>
            <div className="device-toggle">
              <button className={!isTablet ? "dev-btn active" : "dev-btn"} onClick={() => setDevice("mobile")}><Smartphone size={13} /> هاتف</button>
              <button className={isTablet ? "dev-btn active" : "dev-btn"} onClick={() => setDevice("tablet")}><Monitor size={13} /> لوحة إشراف</button>
            </div>
          </div>
        </header>

        {isTablet ? (
          <div className="split">
            <div className="split-list">
              <div className="section-label">استثناءات تحتاج قرارًا</div>
              <div className="reg-list">
                {exceptions.map(x => (
                  <div className="reg-row" key={x.id}>
                    <button className="reg-head cust-row" onClick={() => setSelectedExc(x.id)}>
                      <span className={"reg-mark " + (x.status === "open" ? (x.severity === "urgent" ? "mark-urgent" : "mark-caution") : x.stillOpen ? "mark-caution" : "mark-normal")} />
                      <span className="reg-text">
                        <span className="reg-label">{x.what}</span>
                        <span className="reg-age">{x.owner}{x.status !== "open" ? (x.stillOpen ? " · قرار متخذ — العمل مستمر" : " · تم الحل بالكامل") : ""}</span>
                      </span>
                      <ChevronLeft size={15} color="var(--ink-300)" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="section-label">الفرق</div>
              <div className="reg-list">
                {TEAMS.map(t => <TeamRow key={t.id} team={t} exceptions={exceptions} development={development} open={openTeam === t.id} onToggle={() => setOpenTeam(openTeam === t.id ? null : t.id)} />)}
              </div>
            </div>
            <div className="split-detail">
              <div className="detail-pane-body">
                {selectedExc ? (
                  <>
                    <div className="section-label">تفاصيل الاستثناء والقرار</div>
                    <ExceptionDetail exc={exceptions.find(x => x.id === selectedExc)} onAction={takeAction} />
                  </>
                ) : (
                  <div className="tab-placeholder">
                    <PackageCheck size={22} color="var(--ink-300)" />
                    <div className="tab-placeholder-title">اختر استثناءً من القائمة لعرض تفاصيله واتخاذ القرار</div>
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
/*  CSS — same tokens/primitives as Artifacts 0–4                          */
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

.attn-row{display:flex; align-items:center; gap:10px; padding:10px 2px; font-size:12.5px;}
.attn-ok{color:var(--success);}
.attn-reason{font-size:12.5px; color:var(--ink-800); line-height:1.5;}

/* checkpoint switcher */
.checkpoint-switch{display:flex; background:var(--canvas-alt); border:1px solid var(--rule); border-radius:8px; padding:3px; gap:2px; margin-top:14px;}
.cp-btn{flex:1; font-size:12px; font-weight:600; color:var(--ink-500); padding:8px 4px; border-radius:6px; min-height:36px;}
.cp-btn.active{background:var(--ink-900); color:#fff;}
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
.cust-row{width:100%;}

/* exception detail */
.exc-detail{padding:4px 0 6px;}
.flag-list{display:flex; flex-direction:column; gap:6px;}
.flag-row{display:flex; align-items:flex-start; gap:6px; font-size:12px; line-height:1.5; padding:8px 10px; border-radius:8px; background:var(--canvas-alt);}
.flag-issue{color:var(--ink-700);}
.hint-line{display:flex; align-items:center; gap:5px; font-size:11.5px; color:var(--ink-500); margin-top:6px; line-height:1.5;}
.chip-row{display:flex; flex-wrap:wrap; gap:8px;}
.reason-chip{font-size:12.5px; font-weight:600; color:var(--ink-700); border:1px solid var(--rule); border-radius:7px; padding:7px 12px; min-height:36px;}
.reason-chip.active{color:var(--action); border-color:var(--action); background:var(--quiet-blue);}
.resolved-note{display:flex; align-items:center; gap:6px; font-size:12px; color:var(--success); margin-top:10px; padding:9px 11px; background:var(--success-bg); border-radius:8px;}
.resolved-note.in-progress{color:var(--caution); background:var(--caution-bg);}

/* decision framing (reused from Artifact 0/2 manager pattern) */
.decision-row{display:flex; align-items:center; gap:8px; flex-wrap:wrap;}
.decision-opt{font-size:12.5px; font-weight:700; color:var(--stamp); border-bottom:1.5px solid var(--stamp-bg); padding-bottom:1px;}
.decision-or{font-size:11px; color:var(--ink-400);}

/* order lifecycle mini-rail (reused from Artifact 2) */
.lifecycle{display:flex; flex-direction:column; gap:2px; margin:10px 0;}
.lifecycle-step{display:flex; align-items:center; gap:8px; padding:4px 0;}
.lifecycle-mark{width:9px; height:9px; border-radius:50%; border:2px solid var(--ink-300); background:var(--canvas); flex-shrink:0;}
.lifecycle-step.done .lifecycle-mark{border-color:var(--success); background:var(--success);}
.lifecycle-step.current .lifecycle-mark{border-color:var(--action); background:var(--action);}
.lifecycle-step .lifecycle-label{font-size:12px; color:var(--ink-400);}
.lifecycle-step.done .lifecycle-label{color:var(--ink-700);}
.lifecycle-step.current .lifecycle-label{color:var(--ink-900); font-weight:700;}
.lifecycle-exception{display:flex; align-items:center; gap:6px; font-size:12px; color:var(--danger); font-weight:600; margin-top:6px; padding:8px 10px; background:var(--danger-bg); border-radius:8px;}
.lifecycle-closure{display:flex; align-items:flex-start; gap:6px; font-size:11.5px; line-height:1.5; margin-top:6px; padding:8px 10px; border-radius:8px;}
.lifecycle-closure.pending{color:var(--caution); background:var(--caution-bg);}
.lifecycle-closure.closed{color:var(--success); background:var(--success-bg);}

/* rail node (frozen, used only for the all-clear state) */
.rail-node{width:12px; height:12px; flex-shrink:0; box-sizing:border-box;}
.node-completed{border-radius:50%; background:var(--success); box-shadow:inset 0 0 0 2px var(--canvas);}

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
