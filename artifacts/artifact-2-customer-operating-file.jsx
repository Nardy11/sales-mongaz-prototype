import React, { useState, useMemo } from "react";
import {
  Bell, Search, ChevronLeft, ChevronDown, ChevronRight, Phone,
  CheckCircle2, AlertTriangle, Lock, UserRound,
  Monitor, Smartphone, ArrowUpRight, PackageCheck,
  MessageCircleWarning, Clock, Radar, UserMinus,
  Sparkles, Info, Pencil
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  ROLES (shared switcher — Artifact 2 is one customer model,             */
/*  four role-appropriate emphases, not four screens)                      */
/* ---------------------------------------------------------------------- */

const ROLES = [
  { id: "rep", label: "مندوب مبيعات" },
  { id: "tele", label: "موظف مبيعات هاتفية" },
  { id: "sup", label: "مشرف مبيعات هاتفية" },
  { id: "mgr", label: "مدير مبيعات" },
];

/* ---------------------------------------------------------------------- */
/*  CUSTOMER DATA — four contrasting operational scenarios                 */
/*  (same customers/team roster as Artifacts 0–1, for narrative continuity)*/
/* ---------------------------------------------------------------------- */

const ORDER_STEPS = ["مسجلة", "مراجعة الحسابات", "معتمدة", "التجهيز", "تجهيز التسليم", "تم التسليم", "مغلق"];

const SEED_CUSTOMERS = [
  {
    id: "c1", name: "سوبر ماركت الأمانة", contact: "كريم منصور", phone: "01012345001",
    area: "فيصل، الجيزة", classification: "عميل ذهبي", type: "active", assignedRep: "وليد سامي",
    balance: { outstanding: "لا يوجد رصيد مستحق", promises: [] },
    visits: [{ id: "v1", time: "اليوم 09:00", kind: "زيارة تغطية", note: "زيارة دورية — تم تسجيل طلبية وعرض منتج تنظيف جديد" }],
    orders: [
      { id: "o1", time: "اليوم 09:00", items: "منظف أرضيات 5 لتر × 12، صابون سائل 1 لتر × 24", value: "6,800 ج.م", currentStep: 5, responsible: "قسم التوزيع", next: "تأكيد استلام العميل ثم إغلاق السجل التشغيلي", exception: null, closure: { status: "pending", owner: "وليد سامي", recordedAt: "اليوم 14:30", note: "تم التسليم للعميل؛ بانتظار تأكيد الاستلام والإغلاق التشغيلي." } },
      { id: "o0", time: "أمس 10:15", items: "معطر جو × 6", value: "1,200 ج.م", currentStep: 6, responsible: "وليد سامي", next: "أُغلق تشغيليًا", exception: null, closure: { status: "closed", owner: "وليد سامي", recordedAt: "أمس 16:10", note: "تم تأكيد الاستلام وإغلاق الطلب بعد اكتمال التنفيذ." } },
    ],
    complaints: [],
    opportunities: [{ id: "n1", time: "اليوم", category: "منتجات تنظيف", note: "أبدى اهتمامًا بمنتج التنظيف الجديد", owner: "وليد سامي", next: "إرسال عينة ومتابعة الأسبوع القادم" }],
    marketObs: [{ id: "g1", time: "اليوم", competitor: "شركة النجاح للتوزيع", product: "منظف أرضيات", competitorPrice: "أقل بنحو 8٪", promo: "خصم 10٪ عند الشراء بالجملة", note: "ذكر العميل عرض المنافس أثناء الزيارة", reporter: "وليد سامي" }],
    statusChanges: [],
    reactivationAttempts: [],
    nextCommitment: { kind: "متابعة تسليم", due: "غدًا الساعة 10:00 ص", next: "تأكيد تسليم الطلبية للعميل", owner: "وليد سامي" },
  },
  {
    id: "c2", name: "صيدليات الشفاء", contact: "هبة الشناوي", phone: "01098765002",
    area: "الهرم، الجيزة", classification: "عميل يتطلب متابعة", type: "active", assignedRep: "سارة عادل",
    balance: {
      outstanding: "4,200 ج.م",
      promises: [
        { id: "p1", date: "الخميس القادم", amount: "4,200 ج.م", status: "overdue", daysOverdue: 3 },
        { id: "p0", date: "منذ 3 أسابيع", amount: "2,000 ج.م", status: "kept" },
      ],
    },
    visits: [{ id: "v1", time: "منذ 3 أيام", kind: "زيارة تحصيل", note: "العميل طلب تأجيل السداد لظروف تشغيلية" }],
    orders: [], complaints: [], opportunities: [], marketObs: [], statusChanges: [], reactivationAttempts: [],
    nextCommitment: { kind: "زيارة تحصيل", due: "متأخرة 40 دقيقة", next: "تحصيل 4,200 ج.م أو تجديد الوعد كتابيًا", owner: "سارة عادل" },
  },
  {
    id: "c3", name: "توكيلات الشرق للسيارات", contact: "ياسمين توفيق", phone: "01234567004",
    area: "المهندسين، الجيزة", classification: "عميل فضي", type: "active", assignedRep: "محمد الطيب",
    balance: { outstanding: "لا يوجد رصيد مستحق", promises: [] },
    visits: [{ id: "v1", time: "منذ يومين", kind: "زيارة متابعة", note: "العميل اشتكى من تأخير توصيل قطعة غيار" }],
    orders: [{ id: "o2", time: "منذ 5 أيام", items: "طقم فحمات فرامل × 4", value: "2,300 ج.م", currentStep: 4, responsible: "قسم التوزيع", next: "تسريع الشحنة وتأكيد موعد جديد", exception: "تأخر عن الموعد المتفق عليه 5 أيام", closure: null }],
    complaints: [{ id: "x1", time: "منذ يومين", description: "تأخر وصول قطعة غيار عن الموعد المتفق عليه بخمسة أيام", classification: "تأخير توصيل", owner: "قسم التوزيع", action: "تسريع الشحنة وتأكيد موعد جديد", followUp: "اليوم قبل الساعة 5", status: "قيد المعالجة", resolved: false, originating: "الطلب #o2" }],
    opportunities: [], marketObs: [], statusChanges: [], reactivationAttempts: [],
    nextCommitment: { kind: "متابعة شكوى", due: "اليوم قبل الساعة 5", next: "تأكيد وصول قطعة الغيار المتأخرة", owner: "محمد الطيب" },
  },
  {
    id: "c4", name: "بقالة النصر", contact: "سيد فوزي", phone: "01099988006",
    area: "إمبابة، الجيزة", classification: "عميل متوقف", type: "inactive", assignedRep: "نهى كامل",
    balance: { outstanding: "لا يوجد رصيد مستحق", promises: [] },
    visits: [{ id: "v1", time: "منذ 4 أشهر", kind: "زيارة تغطية", note: "آخر زيارة قبل توقف الشراء — خلاف على الأسعار" }],
    orders: [], complaints: [],
    opportunities: [{ id: "n2", time: "منذ شهر", category: "إعادة تنشيط", note: "فرصة عودة محتملة بعد تسوية الخلاف", owner: "نهى كامل", next: "زيارة تفعيل ومراجعة الأسعار" }],
    marketObs: [],
    statusChanges: [{ id: "s1", time: "منذ 4 أشهر", text: "أصبح عميل متوقف بعد خلاف على الأسعار" }],
    reactivationAttempts: [{ id: "a1", time: "منذ شهر", text: "مكالمة تفعيل — لم يتم الرد" }],
    nextCommitment: null,
  },
];

/* ---------------------------------------------------------------------- */
/*  EXPLAINABLE RISK + NEXT ACTION                                         */
/*  Every signal is a named piece of evidence — never an opaque score.     */
/* ---------------------------------------------------------------------- */

function computeRisk(cust) {
  const reasons = [];
  const overdue = cust.balance.promises.find(p => p.status === "overdue");
  if (overdue) reasons.push(`وعد سداد متأخر ${overdue.daysOverdue} أيام (${overdue.amount})`);
  const openComplaint = cust.complaints.find(x => !x.resolved);
  if (openComplaint) reasons.push(`شكوى مفتوحة ${openComplaint.time}`);
  const orderIssue = cust.orders.find(o => o.exception);
  if (orderIssue) reasons.push(`استثناء في الطلب — ${orderIssue.exception}`);
  if (cust.type === "inactive") reasons.push("عميل متوقف عن الشراء");
  if (!cust.nextCommitment && cust.type !== "inactive" && reasons.length === 0) reasons.push("لا يوجد التزام قادم محدد");
  const level = reasons.length >= 2 ? "urgent" : reasons.length === 1 ? "watch" : "normal";
  return { level, reasons };
}

function computeNextAction(cust) {
  const overdue = cust.balance.promises.find(p => p.status === "overdue");
  if (overdue) return { label: "متابعة التحصيل", reason: `وعد سداد متأخر (${overdue.amount})`, owner: cust.assignedRep, kind: "collection" };
  const openComplaint = cust.complaints.find(x => !x.resolved);
  if (openComplaint) return { label: "مراجعة الشكوى", reason: "شكوى مفتوحة تحتاج إجراء", owner: openComplaint.owner, kind: "complaint" };
  const orderIssue = cust.orders.find(o => o.exception);
  if (orderIssue) return { label: "متابعة الطلب", reason: orderIssue.exception, owner: orderIssue.responsible, kind: "order" };
  if (cust.type === "inactive") return { label: "إعادة تنشيط العميل", reason: "عميل متوقف — فرصة عودة قائمة", owner: cust.assignedRep, kind: "reactivate" };
  if (cust.opportunities.length) return { label: "متابعة فرصة بيع", reason: cust.opportunities[0].note, owner: cust.assignedRep, kind: "opportunity" };
  if (cust.nextCommitment) return { label: cust.nextCommitment.kind, reason: cust.nextCommitment.next, owner: cust.assignedRep, kind: "visit" };
  return { label: "زيارة العميل", reason: "زيارة تغطية دورية مستحقة", owner: cust.assignedRep, kind: "visit" };
}

/* ---------------------------------------------------------------------- */
/*  SMALL SHARED COMPONENTS (reused vocabulary from Artifacts 0–1)         */
/* ---------------------------------------------------------------------- */

function AttentionRow({ risk }) {
  if (risk.level === "normal") {
    return (
      <div className="attn-row attn-ok">
        <span className="rail-node node-completed" />
        <span>لا يوجد ما يستدعي انتباهًا حاليًا</span>
      </div>
    );
  }
  return (
    <div className={"attn-row " + (risk.level === "urgent" ? "attn-urgent" : "attn-watch")}>
      <span className={"rail-node " + (risk.level === "urgent" ? "node-urgent" : "node-empty")} />
      <div className="attn-body">
        {risk.reasons.map((r, i) => <div key={i} className="attn-reason">{r}</div>)}
      </div>
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
      {exception && (
        <div className="lifecycle-exception"><AlertTriangle size={12} /> {exception}</div>
      )}
      {closure && (
        <div className={"lifecycle-closure " + closure.status}>
          {closure.status === "closed" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          <span><b>{closure.status === "closed" ? "مغلق" : "تم التسليم — بانتظار الإغلاق"}</b> · {closure.owner} · {closure.recordedAt}<br />{closure.note}</span>
        </div>
      )}
    </div>
  );
}

/** A generic expandable ledger row — the same primitive used for supervisor
 *  queues and Close-My-Day in Artifacts 0–1, reused here instead of inventing
 *  a new "CRM section card" pattern. */
function LedgerRegister({ id, open, onToggle, mark = "normal", count, label, sub, children }) {
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

function CollectionCapture({ promise, onSave, onCancel }) {
  const [fullyCollected, setFullyCollected] = useState(false);
  const [collected, setCollected] = useState("");
  const [promiseDate, setPromiseDate] = useState("الأسبوع القادم");
  return (
    <div className="collection-capture">
      <button className="toggle-row" onClick={() => setFullyCollected(v => !v)}>
        <span className="toggle-text">تم تحصيل كامل المبلغ ({promise.amount})</span>
        <span className={"toggle-switch" + (fullyCollected ? " on" : "")}><span className="toggle-knob" /></span>
      </button>
      {!fullyCollected && (
        <>
          <input className="ledger-input nums" inputMode="numeric" placeholder="المبلغ المُحصَّل جزئيًا (اختياري)" value={collected} onChange={e => setCollected(e.target.value)} />
          <div className="section-label small">موعد الوعد الجديد</div>
          <div className="chip-row">
            {["الأسبوع القادم", "بعد أسبوعين"].map(d => (
              <button key={d} className={"reason-chip" + (promiseDate === d ? " active" : "")} onClick={() => setPromiseDate(d)}>{d}</button>
            ))}
          </div>
        </>
      )}
      <div className="outcome-actions">
        <button className="btn-secondary text-btn" onClick={onCancel}><ChevronRight size={15} /> رجوع</button>
        <button className="btn-primary" onClick={() => onSave({ fullyCollected, collected, promiseDate })}>حفظ النتيجة</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CUSTOMER SWITCHER                                                       */
/* ---------------------------------------------------------------------- */

function CustomerSwitcher({ customers, onOpen }) {
  return (
    <>
      <div className="section-label">عملاؤك</div>
      <div className="reg-list">
        {customers.map(c => {
          const risk = computeRisk(c);
          const markClass = c.type === "inactive" ? "mark-empty" : risk.level === "urgent" ? "mark-urgent" : risk.level === "watch" ? "mark-caution" : "mark-normal";
          return (
            <div className="reg-row" key={c.id}>
              <button className="reg-head cust-row" onClick={() => onOpen(c.id)}>
                <span className={"reg-mark " + markClass} />
                <span className="reg-text">
                  <span className="reg-label">{c.name}</span>
                  <span className="reg-age">{c.classification} · {c.area}</span>
                </span>
                {c.type === "inactive" && <span className="type-flag flag-inactive"><UserMinus size={11} /> متوقف</span>}
                <ChevronLeft size={15} color="var(--ink-300)" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/*  CUSTOMER OPERATING FILE                                                 */
/* ---------------------------------------------------------------------- */

function CustomerFile({ cust, roleId, onBack, onUpdate }) {
  const [open, setOpen] = useState(null);
  const [editingClass, setEditingClass] = useState(false);
  const [collectFor, setCollectFor] = useState(null); // promise id being recorded against

  const risk = computeRisk(cust);
  const action = computeNextAction(cust);
  const isFieldRole = roleId === "rep" || roleId === "tele";
  const canEditClassification = roleId === "sup" || roleId === "mgr";

  // Manager sees a genuine credit decision instead of a plain action when the
  // evidence itself calls for one — an overdue payment promise is a real
  // either/or credit call (freeze vs. extend), the same decision vocabulary
  // as the manager's rail in Artifact 0. This is evidence-driven so any
  // customer entering this state gets the same treatment, not just today's
  // demo customer.
  const overduePromise = cust.balance.promises.find(p => p.status === "overdue");
  const showDecision = roleId === "mgr" && !!overduePromise;

  function toggle(section) { setOpen(open === section ? null : section); }

  function saveCollection(promiseId, result) {
    const updated = { ...cust };
    updated.balance = {
      ...cust.balance,
      promises: cust.balance.promises.map(p => p.id === promiseId
        ? { ...p, status: result.fullyCollected ? "kept" : "renewed" }
        : p),
    };
    if (result.fullyCollected) {
      updated.balance.outstanding = "لا يوجد رصيد مستحق";
      updated.nextCommitment = null;
    } else {
      updated.balance.promises = [...updated.balance.promises, { id: "p-" + Date.now(), date: result.promiseDate, amount: result.collected ? `الباقي بعد ${result.collected} ج.م` : cust.balance.outstanding, status: "open", daysOverdue: 0 }];
      updated.nextCommitment = { kind: "زيارة تحصيل", due: `وعد جديد — ${result.promiseDate}`, next: "متابعة تحصيل الرصيد المتبقي", owner: cust.assignedRep };
    }
    setCollectFor(null);
    onUpdate(updated, result.fullyCollected ? "تم تسجيل التحصيل الكامل" : `تم تسجيل تحصيل جزئي — وعد جديد ${result.promiseDate}`);
  }

  function activateCustomer() {
    const updated = { ...cust };
    updated.reactivationAttempts = [...cust.reactivationAttempts, { id: "a-" + Date.now(), time: "اليوم", text: "تم جدولة زيارة تفعيل" }];
    updated.nextCommitment = { kind: "زيارة تفعيل", due: "غدًا الساعة 11:00 ص", next: cust.opportunities[0]?.next || "زيارة تقييم لإعادة التنشيط", owner: cust.assignedRep };
    onUpdate(updated, "تمت جدولة زيارة تفعيل — غدًا الساعة 11:00 ص");
  }

  // Chronological rail mixing past evidence (rings) with open commitments
  // (hollow ring / diamond) so the two are visually distinguishable.
  const railEntries = useMemo(() => {
    const list = [];
    cust.visits.forEach(v => list.push({ id: v.id, time: v.time, kind: v.kind, text: v.note, evidence: true }));
    cust.orders.forEach(o => list.push({ id: o.id, time: o.time, kind: "طلبية", text: `${o.items} — ${o.value}`, evidence: true }));
    cust.complaints.forEach(x => list.push({ id: x.id, time: x.time, kind: "شكوى", text: x.description, evidence: true, unresolved: !x.resolved }));
    cust.statusChanges.forEach(s => list.push({ id: s.id, time: s.time, kind: "تغيّر حالة", text: s.text, evidence: true }));
    if (cust.nextCommitment) {
      list.push({ id: "next", time: cust.nextCommitment.due, kind: cust.nextCommitment.kind, text: cust.nextCommitment.next, evidence: false, urgent: risk.level === "urgent" });
    }
    return list;
  }, [cust, risk.level]);

  return (
    <>
      <button className="back-row" onClick={onBack}><ChevronRight size={16} /> كل العملاء</button>

      {/* IDENTITY — compact, ranks below operational state on purpose */}
      <div className="identity-block">
        <div className="identity-top">
          <div>
            <div className="identity-name">{cust.name}</div>
            <div className="identity-meta">{cust.contact} · {cust.area}</div>
          </div>
          <div className="identity-class">
            {editingClass === true ? (
              <div className="chip-row">
                {["عميل ذهبي", "عميل فضي", "عميل يتطلب متابعة", "عميل متوقف"].map(cl => (
                  <button key={cl} className={"reason-chip" + (cust.classification === cl ? " active" : "")}
                    onClick={() => { onUpdate({ ...cust, classification: cl }, `تم تغيير التصنيف إلى ${cl}`); setEditingClass(false); }}>
                    {cl}
                  </button>
                ))}
              </div>
            ) : (
              <button className="class-tag" onClick={() => canEditClassification ? setEditingClass(true) : setEditingClass(v => v === "locked" ? false : "locked")}>
                {cust.classification} {canEditClassification && <Pencil size={11} />}
              </button>
            )}
          </div>
        </div>
        <div className="identity-foot">
          <span><UserRound size={12} /> {cust.assignedRep}</span>
          <span className="nums"><Phone size={11} /> {cust.phone}</span>
        </div>
        {editingClass === "locked" && (
          <div className="lock-note"><Lock size={12} /> تعديل التصنيف يتطلب صلاحية مشرف أو مدير</div>
        )}
      </div>

      {/* NEXT ACTION — reuses the frozen hero, since this is that same primitive */}
      {showDecision ? (
        <div className="hero">
          <div className="hero-eyebrow">قرار مطلوب</div>
          <div className="hero-title">تعثر سداد — {cust.name}</div>
          <div className="decision-row" style={{ marginTop: 8 }}>
            <span className="decision-opt" style={{ color: "var(--stamp-soft)", borderColor: "rgba(255,255,255,.3)" }}>تجميد الحد الائتماني</span>
            <span className="decision-or" style={{ color: "#C9D8EC" }}>أم</span>
            <span className="decision-opt" style={{ color: "var(--stamp-soft)", borderColor: "rgba(255,255,255,.3)" }}>تمديد المهلة</span>
          </div>
          <div className="hero-meta">المسؤول: {cust.assignedRep}</div>
        </div>
      ) : (
        <div className="hero">
          <div className="hero-eyebrow">التالي الآن</div>
          <div className="hero-title">{action.label}</div>
          <div className="hero-meta">{action.reason} · {action.owner}</div>
        </div>
      )}

      {roleId === "sup" && risk.level !== "normal" && (
        <div className="coach-note"><Sparkles size={12} /> ملاحظة إشرافية: {cust.assignedRep} يحتاج متابعة على هذا الحساب — {risk.reasons[0]}</div>
      )}

      <div className="section-label">الانتباه التشغيلي</div>
      <AttentionRow risk={risk} />

      <div className="section-label">مسار التزامات العميل</div>
      <div className="rail-list">
        {railEntries.map((e, i) => (
          <div className={"rail-item" + (i === 0 ? " rail-item-first" : "")} key={e.id}>
            <div className="rail-spine">
              {i !== 0 && <div className="rail-line rail-line-top" />}
              <span className="rail-time nums">{e.time}</span>
              <span className={"rail-node " + (e.evidence ? "node-completed" : e.urgent ? "node-urgent" : "node-normal")} />
              {i !== railEntries.length - 1 && <div className="rail-line rail-line-bottom" />}
            </div>
            <div className="rail-card no-hover">
              <div className="rail-card-top">
                <span className="rail-kind">{e.kind}</span>
                {e.unresolved && <span className="status-tag" style={{ color: "var(--danger)" }}><AlertTriangle size={12} /> غير محلولة</span>}
                {!e.evidence && <span className="status-tag" style={{ color: e.urgent ? "var(--danger)" : "var(--action)" }}>{e.urgent ? "التزام متأخر" : "التزام قادم"}</span>}
              </div>
              <div className="rail-sub">{e.text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ORDERS */}
      <div className="section-label">الطلبات</div>
      <div className="reg-list">
        <LedgerRegister open={open === "orders"} onToggle={() => toggle("orders")} mark={cust.orders.some(o => o.exception) ? "urgent" : "normal"} count={cust.orders.length} label="طلبات مسجلة" sub={cust.orders.some(o => o.exception) ? "يوجد استثناء يحتاج متابعة" : cust.orders.length ? "قيد التنفيذ" : "لا توجد طلبات"}>
          {cust.orders.length ? cust.orders.map(o => (
            <div className="order-detail" key={o.id}>
              <div className="breakdown-row"><span className="breakdown-who">{o.items}</span><span className="breakdown-count nums">{o.value}</span></div>
              <LifecycleSteps steps={ORDER_STEPS} currentStep={o.currentStep} exception={o.exception} closure={o.closure} />
              <div className="hint-line"><Info size={12} /> {o.responsible} · التالي: {o.next}</div>
            </div>
          )) : <div className="breakdown-row"><span className="breakdown-who">لا توجد طلبات مسجلة لهذا العميل</span></div>}
        </LedgerRegister>

        {/* COLLECTIONS */}
        <LedgerRegister open={open === "collections"} onToggle={() => toggle("collections")} mark={cust.balance.promises.some(p => p.status === "overdue") ? "urgent" : "normal"} count={cust.balance.promises.length} label="التحصيل والوعود" sub={cust.balance.outstanding}>
          {cust.balance.promises.length ? cust.balance.promises.map(p => (
            <div className="promise-row" key={p.id}>
              <span className={"rail-node " + (p.status === "overdue" ? "node-urgent" : p.status === "kept" ? "node-completed" : "node-normal")} />
              <span className="promise-text">
                <span className="breakdown-who nums">{p.amount}</span>
                <span className="breakdown-age">{p.status === "overdue" ? `متأخر ${p.daysOverdue} أيام — ${p.date}` : p.status === "kept" ? `تم الوفاء به — ${p.date}` : p.status === "renewed" ? "تم تحصيل جزء وتجديد الوعد بموعد جديد أدناه" : `وعد جديد — ${p.date}`}</span>
              </span>
              {p.status === "overdue" && collectFor !== p.id && (
                <button className="mini-action" onClick={() => setCollectFor(p.id)}>تسجيل نتيجة</button>
              )}
            </div>
          )) : <div className="breakdown-row"><span className="breakdown-who">لا يوجد رصيد مستحق</span></div>}
          {collectFor && (
            <CollectionCapture
              promise={cust.balance.promises.find(p => p.id === collectFor)}
              onCancel={() => setCollectFor(null)}
              onSave={(r) => saveCollection(collectFor, r)}
            />
          )}
        </LedgerRegister>

        {/* COMPLAINTS */}
        <LedgerRegister open={open === "complaints"} onToggle={() => toggle("complaints")} mark={cust.complaints.some(x => !x.resolved) ? "urgent" : "normal"} count={cust.complaints.length} label="الشكاوى والمشاكل" sub={cust.complaints.some(x => !x.resolved) ? "غير مغلقة" : cust.complaints.length ? "تم الإغلاق" : "لا توجد شكاوى"}>
          {cust.complaints.length ? cust.complaints.map(x => (
            <div className="order-detail" key={x.id}>
              <div className="breakdown-row"><span className="breakdown-who">{x.description}</span></div>
              <div className="flag-list" style={{ marginBottom: 8 }}>
                <div className="flag-row flag-issue"><MessageCircleWarning size={13} /><span>{x.classification} · مسؤول: {x.owner} · {x.status}</span></div>
              </div>
              <div className="hint-line"><Info size={12} /> الإجراء: {x.action} — متابعة {x.followUp}</div>
              {x.originating && <div className="hint-line"><ArrowUpRight size={12} /> ناتجة عن {x.originating}</div>}
            </div>
          )) : <div className="breakdown-row"><span className="breakdown-who">لا توجد شكاوى مسجلة</span></div>}
        </LedgerRegister>

        {/* OPPORTUNITIES */}
        <LedgerRegister open={open === "opportunities"} onToggle={() => toggle("opportunities")} mark="normal" count={cust.opportunities.length} label="الفرص والاحتياجات" sub={cust.opportunities.length ? "تحتاج متابعة" : "لا يوجد"}>
          {cust.opportunities.length ? cust.opportunities.map(n => (
            <div className="order-detail" key={n.id}>
              <div className="flag-row flag-opp"><Sparkles size={13} /><span>{n.note}</span></div>
              <div className="hint-line"><Info size={12} /> {n.category} · مسؤول: {n.owner} · التالي: {n.next}</div>
            </div>
          )) : <div className="breakdown-row"><span className="breakdown-who">لا توجد فرص مسجلة حاليًا</span></div>}
        </LedgerRegister>

        {/* MARKET OBSERVATIONS */}
        <LedgerRegister open={open === "market"} onToggle={() => toggle("market")} mark="normal" count={cust.marketObs.length} label="ملاحظات السوق" sub={cust.marketObs.length ? "رُصدت مؤخرًا" : "لا يوجد"}>
          {cust.marketObs.length ? cust.marketObs.map(g => (
            <div className="order-detail" key={g.id}>
              <div className="breakdown-row"><span className="breakdown-who">{g.competitor}</span><span className="breakdown-age">{g.time}</span></div>
              <div className="hint-line"><Radar size={12} /> {g.product} — {g.competitorPrice}</div>
              {g.promo && <div className="hint-line"><Info size={12} /> {g.promo}</div>}
              <div className="hint-line ink-muted">{g.note} · رصدها {g.reporter}</div>
            </div>
          )) : <div className="breakdown-row"><span className="breakdown-who">لا توجد ملاحظات سوق</span></div>}
        </LedgerRegister>
      </div>

      {/* INACTIVE / REACTIVATION */}
      {cust.type === "inactive" && (
        <>
          <div className="section-label">إعادة التنشيط</div>
          <div className="order-detail" style={{ marginBottom: 12 }}>
            {cust.reactivationAttempts.map(a => (
              <div className="hint-line" key={a.id}><Clock size={12} /> {a.time} — {a.text}</div>
            ))}
            {isFieldRole && (
              <button className="btn-primary" style={{ marginTop: 12, width: "100%" }} onClick={activateCustomer}>
                بدء التفعيل
              </button>
            )}
          </div>
        </>
      )}

      <div className="demo-note"><Info size={12} /> القيم المالية بيانات تجريبية لأغراض العرض فقط</div>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/*  MAIN APP                                                                */
/* ---------------------------------------------------------------------- */

export default function App() {
  const [roleId, setRoleId] = useState("rep");
  const [device, setDevice] = useState("mobile");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [customers, setCustomers] = useState(SEED_CUSTOMERS);
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);

  const isTablet = device === "tablet" && (roleId === "sup" || roleId === "mgr");
  const role = ROLES.find(r => r.id === roleId);
  const selected = customers.find(c => c.id === selectedId) || null;

  function updateCustomer(updated, message) {
    setCustomers(cs => cs.map(c => c.id === updated.id ? updated : c));
    if (message) {
      setToast(message);
      window.clearTimeout(window.__toastT);
      window.__toastT = window.setTimeout(() => setToast(null), 3400);
    }
  }

  React.useEffect(() => {
    if (roleId !== "sup" && roleId !== "mgr" && device === "tablet") setDevice("mobile");
  }, [roleId]); // eslint-disable-line

  return (
    <div className="sr-app" dir="rtl">
      <style>{CSS}</style>

      <div className={"frame " + (isTablet ? "frame-wide" : "frame-mobile")}>
        <header className="appbar">
          <div className="appbar-row">
            <div className="brand">
              <span className="brand-mark">س</span>
              <div className="brand-text">
                <div className="brand-name">ملف العميل التشغيلي</div>
                <div className="brand-date nums">الخميس، ١٤ أغسطس</div>
              </div>
            </div>
            <div className="appbar-actions">
              <button className="icon-btn" aria-label="بحث"><Search size={18} /></button>
              <button className="icon-btn" aria-label="الإشعارات"><Bell size={18} /><span className="dot-badge" /></button>
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
                <button className={device === "mobile" ? "dev-btn active" : "dev-btn"} onClick={() => setDevice("mobile")}><Smartphone size={13} /> هاتف</button>
                <button className={device === "tablet" ? "dev-btn active" : "dev-btn"} onClick={() => setDevice("tablet")}><Monitor size={13} /> لوحة إشراف</button>
              </div>
            )}
          </div>

          {roleMenuOpen && (
            <div className="role-menu">
              {ROLES.map(r => (
                <button key={r.id} className={"role-opt" + (r.id === roleId ? " active" : "")}
                  onClick={() => { setRoleId(r.id); setRoleMenuOpen(false); setSelectedId(null); }}>
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </header>

        {isTablet ? (
          <div className="split">
            <div className="split-list">
              <CustomerSwitcher customers={customers} onOpen={setSelectedId} />
            </div>
            <div className="split-detail">
              <div className="detail-pane-body">
                {selected ? (
                  <CustomerFile key={selected.id} cust={selected} roleId={roleId} onBack={() => setSelectedId(null)} onUpdate={updateCustomer} />
                ) : (
                  <div className="tab-placeholder">
                    <PackageCheck size={22} color="var(--ink-300)" />
                    <div className="tab-placeholder-title">اختر عميلًا من القائمة لعرض ملفه التشغيلي</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <main className="content">
            {selected ? (
              <CustomerFile key={selected.id} cust={selected} roleId={roleId} onBack={() => setSelectedId(null)} onUpdate={updateCustomer} />
            ) : (
              <CustomerSwitcher customers={customers} onOpen={setSelectedId} />
            )}
          </main>
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
/*  CSS — the same tokens and primitives as Artifacts 0 and 1              */
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

.content{flex:1; overflow-y:auto; padding:16px 16px 24px;}
.section-label{font-family:'Tajawal',sans-serif; font-weight:700; font-size:13px; color:var(--ink-700); margin:20px 2px 10px; border-inline-start:2px solid var(--stamp); padding-inline-start:8px;}
.section-label.small{font-size:12px; margin:10px 2px 6px;}

.back-row{display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:var(--ink-500); min-height:36px; margin-bottom:4px;}

/* identity — compact, ranks below operational state */
.identity-block{padding-bottom:14px; border-bottom:1px solid var(--rule); margin-bottom:16px;}
.identity-top{display:flex; align-items:flex-start; justify-content:space-between; gap:10px;}
.identity-name{font-family:'Tajawal',sans-serif; font-weight:700; font-size:16px;}
.identity-meta{font-size:12px; color:var(--ink-500); margin-top:2px;}
.class-tag{display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; color:var(--ink-700); background:var(--canvas-alt); border:1px solid var(--rule); border-radius:7px; padding:5px 9px; min-height:30px;}
.identity-foot{display:flex; align-items:center; gap:14px; font-size:11.5px; color:var(--ink-500); margin-top:10px;}
.identity-foot span{display:inline-flex; align-items:center; gap:4px;}
.lock-note{display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--ink-400); margin-top:8px;}

/* hero (frozen) */
.hero{display:block; width:100%; background:var(--ink-900); color:#fff; border-radius:8px; border-top:3px solid var(--stamp); padding:16px 18px; text-align:right; min-height:44px; margin-bottom:4px;}
.hero-eyebrow{font-size:11px; color:var(--stamp-soft); margin-bottom:6px; letter-spacing:.3px; font-weight:600;}
.hero-title{font-family:'Tajawal',sans-serif; font-weight:700; font-size:17px; line-height:1.35;}
.hero-meta{font-size:12px; color:#C9D8EC; margin-top:6px;}
.decision-row{display:flex; align-items:center; gap:8px; flex-wrap:wrap;}
.decision-opt{font-size:12.5px; font-weight:700; border-bottom:1.5px solid; padding-bottom:1px;}

.coach-note{display:flex; align-items:flex-start; gap:6px; font-size:12px; color:var(--stamp); background:var(--stamp-bg); border-radius:8px; padding:9px 11px; margin-top:10px; line-height:1.5;}

/* attention row */
.attn-row{display:flex; align-items:flex-start; gap:10px; padding:10px 2px;}
.attn-body{display:flex; flex-direction:column; gap:4px;}
.attn-reason{font-size:12.5px; color:var(--ink-800); line-height:1.5;}
.attn-ok{color:var(--success); font-size:12.5px; align-items:center;}
.attn-urgent .attn-reason{color:var(--danger); font-weight:600;}
.attn-watch .attn-reason{color:var(--caution);}

/* rail (frozen) */
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
.rail-line{position:absolute; width:1px; background:var(--rule); right:50%; left:50%; margin:0 auto;}
.rail-line-top{top:0; height:22px;}
.rail-line-bottom{bottom:0; top:33px;}
.rail-card{flex:1; background:transparent; border:none; padding:14px 4px 16px 0; margin:0; display:flex; flex-direction:column; gap:5px;}
.rail-card.no-hover{cursor:default;}
.rail-card-top{display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;}
.rail-kind{font-size:11px; color:var(--ink-500); font-weight:500;}
.status-tag{display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; letter-spacing:.15px;}
.rail-sub{font-size:12.5px; color:var(--ink-700); line-height:1.5;}

/* ledger register (frozen pattern) */
.reg-list{display:flex; flex-direction:column;}
.reg-row{border-top:1px solid var(--rule);}
.reg-row:first-child{border-top:none;}
.reg-head{display:flex; align-items:center; gap:12px; width:100%; padding:12px 4px; min-height:44px;}
.reg-mark{width:10px; height:10px; flex-shrink:0;}
.mark-urgent{background:var(--danger); border-radius:2px; transform:rotate(45deg);}
.mark-caution{background:var(--caution); border-radius:3px;}
.mark-normal{border-radius:50%; border:2px solid var(--action); background:var(--canvas);}
.mark-empty{border-radius:50%; border:1.5px dashed var(--ink-300); background:var(--canvas);}
.reg-count{font-size:16px; font-weight:700; color:var(--ink-900); min-width:22px; text-align:center; flex-shrink:0;}
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
.type-flag{display:inline-flex; align-items:center; gap:3px; font-size:10.5px; font-weight:700; padding:2px 6px; border-radius:5px; flex-shrink:0;}
.flag-inactive{color:var(--ink-500); background:var(--canvas-alt);}

/* order lifecycle mini-rail */
.order-detail{padding:6px 0 14px;}
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
.hint-line{display:flex; align-items:center; gap:5px; font-size:11.5px; color:var(--ink-500); margin-top:6px; line-height:1.5;}
.hint-line.ink-muted{color:var(--ink-400);}

/* collection promises */
.promise-row{display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px dashed var(--rule);}
.promise-row:last-child{border-bottom:none;}
.promise-text{flex:1; display:flex; flex-direction:column; gap:2px;}
.mini-action{font-size:11.5px; font-weight:700; color:var(--action); border:1px solid var(--action); border-radius:7px; padding:6px 10px; min-height:32px; flex-shrink:0;}
.collection-capture{padding:12px 0 4px; border-top:1px dashed var(--rule); margin-top:8px;}

/* flags (frozen) */
.flag-list{display:flex; flex-direction:column; gap:6px;}
.flag-row{display:flex; align-items:flex-start; gap:6px; font-size:12px; line-height:1.5; padding:8px 10px; border-radius:8px; background:var(--canvas-alt);}
.flag-issue{color:var(--danger);}
.flag-opp{color:var(--stamp);}

/* chips / inputs / toggles (frozen) */
.chip-row{display:flex; flex-wrap:wrap; gap:8px;}
.reason-chip{font-size:12.5px; font-weight:600; color:var(--ink-700); border:1px solid var(--rule); border-radius:7px; padding:7px 12px; min-height:36px;}
.reason-chip.active{color:var(--action); border-color:var(--action); background:var(--quiet-blue);}
.ledger-input{border:none; border-bottom:1.5px solid var(--rule); background:transparent; font-size:15px; font-weight:700; color:var(--ink-900); padding:8px 2px; width:100%; text-align:right; font-family:inherit; margin-top:8px;}
.ledger-input:focus{border-bottom-color:var(--action);}
.ledger-input::placeholder{color:var(--ink-300); font-weight:500;}
.toggle-row{display:flex; align-items:center; justify-content:space-between; width:100%; min-height:40px; padding:2px 4px;}
.toggle-text{font-size:12.5px; color:var(--ink-700); font-weight:600;}
.toggle-switch{width:34px; height:20px; border-radius:11px; background:var(--rule); position:relative; flex-shrink:0; transition:background-color .12s ease;}
.toggle-switch.on{background:var(--action);}
.toggle-knob{position:absolute; top:2px; right:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform .12s ease; box-shadow:0 1px 2px rgba(22,40,63,.2);}
.toggle-switch.on .toggle-knob{transform:translateX(-14px);}
.outcome-actions{display:flex; gap:8px; padding-top:14px;}

/* buttons (frozen) */
.btn-primary{flex:1; background:var(--action); color:#fff; border-radius:9px; padding:0 16px; min-height:46px; font-weight:700; font-size:13.5px; display:flex; align-items:center; justify-content:center; gap:6px;}
.btn-primary:hover{background:var(--ink-900);}
.btn-secondary{background:var(--canvas-alt); border:1px solid var(--rule); border-radius:9px; width:46px; min-height:46px; display:flex; align-items:center; justify-content:center; gap:6px; color:var(--ink-700);}
.btn-secondary.text-btn{width:auto; padding:0 16px; font-size:13px; font-weight:600;}

/* demo labeling + placeholder */
.demo-note{display:flex; align-items:center; gap:6px; font-size:11px; color:var(--ink-400); margin-top:18px; padding:10px 4px; border-top:1px dashed var(--rule);}
.tab-placeholder{display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px; padding:60px 20px; color:var(--ink-500);}
.tab-placeholder-title{font-family:'Tajawal',sans-serif; font-weight:700; font-size:14px; color:var(--ink-700);}

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
