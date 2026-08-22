import React, { useState, useMemo } from "react";
import {
  Sun, ListChecks, Users, Activity, Bell, Search, ChevronDown, ChevronRight,
  ChevronLeft, PhoneCall, PhoneOff, PhoneMissed, CheckCircle2,
  AlertTriangle, X, UserRound, ArrowUpRight, MessageCircleWarning,
  Clock, Sparkles, Info, Plus, Minus, CalendarClock,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  NAV (same shape as the frozen Telesales nav in Artifact 0)             */
/* ---------------------------------------------------------------------- */

const NAV = [
  { id: "day", label: "اليوم", icon: Sun },
  { id: "mine", label: "عملي", icon: ListChecks },
  { id: "customers", label: "العملاء", icon: Users },
  { id: "activity", label: "النشاط", icon: Activity },
];

/* ---------------------------------------------------------------------- */
/*  SUPERVISOR CONTEXT — the employee-side reflection of Artifact 3        */
/*  (no supervisor controls here, only the resulting instruction)          */
/* ---------------------------------------------------------------------- */

const COACHING_NOTE = {
  point: "وضّح الالتزام التالي بدقة قبل إنهاء المكالمة",
  from: "ملاحظة من المشرف — سارية اليوم",
};

/* ---------------------------------------------------------------------- */
/*  CALL PLAN — six contrasting call purposes, not a contact list          */
/* ---------------------------------------------------------------------- */

const PURPOSE_META = {
  supervisor_priority: { label: "أولوية من المشرف", rank: 100 },
  collection: { label: "متابعة تحصيل", rank: 90 },
  complaint_followup: { label: "متابعة شكوى", rank: 80 },
  reactivation: { label: "إعادة تنشيط", rank: 60 },
  opportunity: { label: "فرصة بيع", rank: 40 },
  sales: { label: "مكالمة تغطية", rank: 20 },
};

const SEED_QUEUE = [
  {
    id: "q5", customer: "مجموعة الرواد للمقاولات", contact: "وليد سامي", phone: "01277712033",
    purpose: "supervisor_priority", reason: "أولوية من المشرف: تأكيد العرض قبل نهاية الأسبوع",
    classification: "عميل نشط", lastInteraction: "منذ أسبوعين", lastOutcome: "عرض العروض الموسمية الحالية",
    balance: null, complaint: null, opportunity: null, todayAttempts: 0, state: "queued",
  },
  {
    id: "q2", customer: "شركة النور للتجارة والتوزيع", contact: "هدير جمال", phone: "01166612022",
    purpose: "collection", reason: "وعد سداد مستحق اليوم",
    classification: "عميل يتطلب متابعة", lastInteraction: "منذ 3 أسابيع", lastOutcome: "وعد بالسداد",
    balance: { outstanding: "2,150 ج.م", promiseDate: "اليوم" }, complaint: null, opportunity: null, todayAttempts: 0, state: "queued",
  },
  {
    id: "q4", customer: "سوبر ماركت الأمانة - فرع 2", contact: "منى أحمد", phone: "01088812044",
    purpose: "complaint_followup", reason: "متابعة شكوى تأخير توصيل مفتوحة",
    classification: "عميل فضي", lastInteraction: "أمس", lastOutcome: "شكوى تأخير توصيل مسجَّلة",
    balance: null, complaint: { description: "تأخير توصيل عن الموعد المتفق عليه", owner: "قسم التوزيع", status: "قيد المعالجة" }, opportunity: null, todayAttempts: 0, state: "queued",
  },
  {
    id: "q3", customer: "بقالة النصر", contact: "سيد فوزي", phone: "01099988006",
    purpose: "reactivation", reason: "عميل متوقف منذ 4 أشهر — فرصة عودة بعد تسوية خلاف الأسعار",
    classification: "عميل متوقف", lastInteraction: "منذ 4 أشهر", lastOutcome: "توقف الشراء بعد خلاف على الأسعار",
    balance: null, complaint: null, opportunity: { note: "فرصة عودة محتملة بعد تسوية الخلاف" },
    priorAttempts: ["مكالمة تفعيل منذ شهر — لم يتم الرد"], todayAttempts: 0, state: "queued",
  },
  {
    id: "q6", customer: "مصنع الأمل للأغذية", contact: "طارق حلمي", phone: "01011122005",
    purpose: "opportunity", reason: "عميل جديد — أول اتصال تعريفي وفرصة بيع منتج جديد",
    classification: "عميل جديد", lastInteraction: "لا توجد مكالمات سابقة", lastOutcome: null,
    balance: null, complaint: null, opportunity: { note: "أول اتصال تعريفي مطلوب" }, todayAttempts: 0, state: "queued",
  },
  {
    id: "q1", customer: "مصنع الدلتا للبلاستيك", contact: "أحمد فتحي", phone: "01055512011",
    purpose: "sales", reason: "مكالمة تغطية دورية شهرية",
    classification: "عميل نشط", lastInteraction: "منذ شهر", lastOutcome: "تم تأكيد طلبية سابقة",
    balance: null, complaint: null, opportunity: null, todayAttempts: 0, state: "queued",
  },
];

const CALL_STAGES = [
  { id: "open", label: "الافتتاحية" },
  { id: "confirm", label: "تأكيد بيانات العميل" },
  { id: "discover", label: "استكشاف الاحتياج" },
  { id: "discuss", label: "مناقشة الحل" },
  { id: "objection", label: "الاعتراضات" },
  { id: "agree", label: "الاتفاق والنتيجة" },
];

const PRODUCT_PRESETS = ["منظف أرضيات 5 لتر", "صابون سائل 1 لتر", "معطر جو", "منتج موسمي جديد"];
const NEED_CATEGORIES = ["منتجات تنظيف", "عناية شخصية", "أغذية ومشروبات", "أخرى"];
const COMPLAINT_CLASS = ["تأخير توصيل", "جودة منتج", "خطأ فاتورة", "أخرى"];
const COMPLAINT_OWNERS = ["قسم التوزيع", "قسم المبيعات", "الحسابات"];

function sortedQueue(queue) {
  return [...queue].sort((a, b) => {
    const ra = PURPOSE_META[a.purpose].rank, rb = PURPOSE_META[b.purpose].rank;
    if (a.state !== b.state) return a.state === "queued" ? -1 : 1;
    return rb - ra;
  });
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

function QueueRow({ entry, onOpen }) {
  const meta = PURPOSE_META[entry.purpose];
  const mark = entry.state !== "queued" ? "normal" : meta.rank >= 80 ? "urgent" : meta.rank >= 60 ? "caution" : "normal";
  return (
    <button className="reg-head cust-row" onClick={() => onOpen(entry.id)} disabled={entry.state !== "queued"}>
      <span className={"reg-mark " + mark} />
      <span className="reg-text">
        <span className="reg-label">{entry.customer}</span>
        <span className="reg-age">{meta.label} · {entry.reason}</span>
      </span>
      {entry.state !== "queued" ? <span className="type-flag flag-done"><CheckCircle2 size={11} /> تم</span> : <ChevronLeft size={15} color="var(--ink-300)" />}
    </button>
  );
}

function CustomerFlags({ entry }) {
  const flags = [];
  if (entry.balance) flags.push({ cls: "flag-promise", icon: CalendarClock, text: `وعد سداد ${entry.balance.outstanding} — ${entry.balance.promiseDate}` });
  if (entry.complaint) flags.push({ cls: "flag-issue", icon: MessageCircleWarning, text: `شكوى مفتوحة — ${entry.complaint.description} (${entry.complaint.status})` });
  if (entry.opportunity) flags.push({ cls: "flag-opp", icon: Sparkles, text: entry.opportunity.note });
  if (!flags.length) return null;
  return (
    <div className="flag-list">
      {flags.map((f, i) => { const Icon = f.icon; return <div key={i} className={"flag-row " + f.cls}><Icon size={13} /><span>{f.text}</span></div>; })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  PRE-CALL SNAPSHOT                                                       */
/* ---------------------------------------------------------------------- */

function PreCallSnapshot({ entry, onStart, onClose }) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div>
            <div className="sheet-kind">{PURPOSE_META[entry.purpose].label}</div>
            <div className="sheet-title">{entry.customer}</div>
            <div className="sheet-sub">{entry.contact} · <span className="nums">{entry.phone}</span></div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
        </div>
        <div className="sheet-scroll">
          <div className="reason-banner"><Info size={13} /> سبب الاتصال اليوم: {entry.reason}</div>
          <div className="snap-grid">
            <div className="snap-cell"><span className="snap-label">التصنيف</span><span className="snap-value">{entry.classification}</span></div>
            <div className="snap-cell"><span className="snap-label">آخر تواصل</span><span className="snap-value">{entry.lastInteraction}</span></div>
          </div>
          {entry.lastOutcome && <div className="hint-line"><Clock size={12} /> آخر نتيجة: {entry.lastOutcome}</div>}
          {entry.priorAttempts && entry.priorAttempts.map((a, i) => <div key={i} className="hint-line"><ArrowUpRight size={12} /> {a}</div>)}
          <CustomerFlags entry={entry} />
        </div>
        <div className="sheet-actions">
          <button className="btn-primary" onClick={onStart}><PhoneCall size={16} /> بدء المكالمة</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  LIVE CALL — genuinely different from a visit: a live, transient state  */
/* ---------------------------------------------------------------------- */

function LiveCall({ entry, onEnd }) {
  const [covered, setCovered] = useState([]);
  const [notes, setNotes] = useState("");
  const showCoachingReminder = covered.includes("agree") === false;

  function toggleStage(id) {
    setCovered(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);
  }

  return (
    <div className="live-call">
      <div className="live-row" style={{ marginBottom: 12 }}>
        <span className="live-dot" />
        <PhoneCall size={13} />
        <span>المكالمة جارية — {entry.contact}</span>
      </div>
      <div className="reason-banner"><Info size={13} /> {entry.reason}</div>
      <CustomerFlags entry={entry} />

      <div className="section-label small">مراحل استرشادية (اختياري)</div>
      <div className="chip-row">
        {CALL_STAGES.map(s => (
          <button key={s.id} className={"reason-chip" + (covered.includes(s.id) ? " active" : "")} onClick={() => toggleStage(s.id)}>
            {covered.includes(s.id) && <CheckCircle2 size={11} />} {s.label}
          </button>
        ))}
      </div>

      {covered.includes("agree") && (
        <div className="coach-note"><Sparkles size={12} /> {COACHING_NOTE.point} — {COACHING_NOTE.from}</div>
      )}

      <div className="section-label small">ملاحظات سريعة</div>
      <textarea className="ledger-textarea" rows={2} placeholder="أي تفاصيل تريد تذكرها..." value={notes} onChange={e => setNotes(e.target.value)} />

      <button className="btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={() => onEnd(notes)}>
        <PhoneOff size={16} /> إنهاء المكالمة وتسجيل النتيجة
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  CALL OUTCOME — telesales-specific vocabulary, not Artifact 1's reused  */
/*  set. Options are conditional on what the customer actually has open.   */
/* ---------------------------------------------------------------------- */

function CallOutcome({ entry, existingOrders, onSave, onCancel }) {
  const [outcome, setOutcome] = useState(null);
  const [successAction, setSuccessAction] = useState(null);

  // order — item starts unselected so "choose a product" is a real requirement,
  // not a pre-filled default that silently satisfies validation.
  const [orderItem, setOrderItem] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  const [triedSaveOrder, setTriedSaveOrder] = useState(false);
  const [duplicateStage, setDuplicateStage] = useState(false); // false | "warn"

  // opportunity
  const [needCategory, setNeedCategory] = useState(null);

  // collection
  const [fullyCollected, setFullyCollected] = useState(false);
  const [collected, setCollected] = useState("");
  const [newPromiseDate, setNewPromiseDate] = useState("الأسبوع القادم");

  // no answer / unavailable
  const [callbackWhen, setCallbackWhen] = useState("غدًا صباحًا");

  // complaint
  const [complaintClass, setComplaintClass] = useState(null);
  const [complaintOwner, setComplaintOwner] = useState(null);
  const [action, setAction] = useState("");
  const [escalate, setEscalate] = useState(false);

  const canOfferPromise = !!entry.balance;
  const canBeNotInterested = entry.purpose === "reactivation" || entry.purpose === "opportunity";
  const willEscalateNoAnswer = entry.todayAttempts + 1 >= 3;

  // Lightweight internal validation — no ERP/inventory involved, just the
  // obvious operational mistakes: no item chosen, no quantity, or an order
  // for the same customer and item already recorded earlier today.
  const missingOrderInfo = !orderItem || orderQty < 1;
  const isDuplicateOrder = !missingOrderInfo && (existingOrders || []).some(o => o.customer === entry.customer && o.items.startsWith(orderItem));

  function handleOrderSave() {
    setTriedSaveOrder(true);
    if (missingOrderInfo) return;
    if (isDuplicateOrder && duplicateStage !== "warn") { setDuplicateStage("warn"); return; }
    finish();
  }

  function finish() {
    // outcomeType preserves WHAT actually happened on the call (no_answer,
    // unavailable, success, promise, complaint, not_interested) — kept
    // separate from lastResultType, which is the follow-up/escalation
    // classification derived from it. Collapsing these was the bug: a
    // retried no-answer became "followup" and a third one became
    // "escalated", so no result ever stayed identifiable as a no-answer.
    const consequences = { outcomeType: outcome, commitments: [], order: null, collection: null, complaint: null, reactivation: null, opportunity: null, noAnswerEscalated: false, sameDayRequeue: false, requeueReason: null };
    const base = { time: "اليوم", customer: entry.customer, contact: entry.contact };

    if (outcome === "success") {
      if (successAction === "order") {
        const value = `${orderQty * 300} ج.م تقديريًا`;
        consequences.order = { ...base, id: entry.id + "-o-" + Date.now(), items: `${orderItem} × ${orderQty}`, value, status: "قيد المراجعة", responsible: "قسم الائتمان", next: "مراجعة الحد الائتماني قبل التجهيز" };
        consequences.commitments.push({ kind: "متابعة تسليم", reason: `تأكيد تسليم الطلبية (${value})`, due: "غدًا" });
      } else if (successAction === "opportunity") {
        consequences.opportunity = { ...base, id: entry.id + "-n-" + Date.now(), category: needCategory || "غير محدد", note: entry.opportunity?.note || "فرصة جديدة أثناء المكالمة" };
        consequences.commitments.push({ kind: "متابعة فرصة بيع", reason: `إرسال عرض سعر — ${needCategory || "فئة غير محددة"}`, due: "الأسبوع القادم" });
      }
      if (entry.purpose === "reactivation") {
        consequences.reactivation = { ...base, id: entry.id + "-r-" + Date.now(), result: "مهتم بالعودة" };
      }
    } else if (outcome === "promise") {
      consequences.collection = { ...base, id: entry.id + "-k-" + Date.now(), outstanding: entry.balance.outstanding, collected: fullyCollected ? entry.balance.outstanding : (collected || "0 ج.م"), promiseDate: fullyCollected ? null : newPromiseDate };
      if (!fullyCollected) consequences.commitments.push({ kind: "متابعة تحصيل", reason: `متابعة تحصيل الرصيد المتبقي — وعد ${newPromiseDate}`, due: newPromiseDate });
    } else if (outcome === "no_answer") {
      if (willEscalateNoAnswer) {
        consequences.noAnswerEscalated = true;
      } else {
        // Same-day retry: the consequence re-enters TODAY's queue rather than
        // just being a note, so the rhythm of "no answer → retry" is actually
        // experienced, not only reported at Close Day.
        consequences.commitments.push({ kind: "إعادة محاولة", reason: `محاولة اتصال رقم ${entry.todayAttempts + 2}`, due: "خلال ساعتين" });
        consequences.sameDayRequeue = true;
        consequences.requeueReason = `إعادة محاولة — رقم ${entry.todayAttempts + 2} اليوم`;
      }
    } else if (outcome === "unavailable") {
      consequences.commitments.push({ kind: "معاودة اتصال مجدولة", reason: "العميل طلب التواصل في وقت آخر", due: callbackWhen });
      if (callbackWhen !== "غدًا صباحًا") {
        consequences.sameDayRequeue = true;
        consequences.requeueReason = `معاودة اتصال مجدولة — ${callbackWhen}`;
      }
    } else if (outcome === "complaint") {
      consequences.complaint = { ...base, id: entry.id + "-x-" + Date.now(), classification: complaintClass, owner: complaintOwner, action: action || "بانتظار تحديد الإجراء", status: escalate ? "مُصعَّدة للمشرف" : "قيد المعالجة" };
      consequences.commitments.push({ kind: "متابعة شكوى", reason: action || "متابعة حل المشكلة", due: "غدًا" });
    } else if (outcome === "not_interested") {
      if (entry.purpose === "reactivation") consequences.reactivation = { ...base, id: entry.id + "-r-" + Date.now(), result: "غير مهتم حاليًا — إغلاق الفرصة" };
      // no commitment: loop closes
    }

    onSave(consequences);
  }

  const canSave = outcome === "success" ? (successAction === "none" || (successAction === "order" ? true : successAction === "opportunity" ? !!needCategory : false))
    : outcome === "complaint" ? (!!complaintClass && !!complaintOwner)
    : !!outcome;

  return (
    <div className="outcome">
      <div className="section-label">نتيجة المكالمة</div>
      <div className="option-list">
        <button className="option-row" onClick={() => setOutcome("success")}>
          <span className={"option-mark" + (outcome === "success" ? " checked" : "")} />
          <span className="option-text"><span className="option-label">تم التواصل بنجاح</span><span className="option-helper">طلبية، فرصة بيع، أو مجرد تغطية</span></span>
        </button>
        {canOfferPromise && (
          <button className="option-row" onClick={() => setOutcome("promise")}>
            <span className={"option-mark" + (outcome === "promise" ? " checked" : "")} />
            <span className="option-text"><span className="option-label">وعد بالدفع</span><span className="option-helper">تحصيل كامل أو جزئي أو وعد جديد</span></span>
          </button>
        )}
        <button className="option-row" onClick={() => setOutcome("no_answer")}>
          <span className={"option-mark" + (outcome === "no_answer" ? " checked" : "")} />
          <span className="option-text"><span className="option-label"><PhoneMissed size={13} /> لا رد</span><span className="option-helper">محاولة رقم {entry.todayAttempts + 1}</span></span>
        </button>
        <button className="option-row" onClick={() => setOutcome("unavailable")}>
          <span className={"option-mark" + (outcome === "unavailable" ? " checked" : "")} />
          <span className="option-text"><span className="option-label">العميل غير متاح الآن</span><span className="option-helper">يطلب معاودة الاتصال</span></span>
        </button>
        <button className="option-row" onClick={() => setOutcome("complaint")}>
          <span className={"option-mark" + (outcome === "complaint" ? " checked" : "")} />
          <span className="option-text"><span className="option-label">شكوى / مشكلة</span><span className="option-helper">ظهرت أثناء المكالمة</span></span>
        </button>
        {canBeNotInterested && (
          <button className="option-row" onClick={() => setOutcome("not_interested")}>
            <span className={"option-mark" + (outcome === "not_interested" ? " checked" : "")} />
            <span className="option-text"><span className="option-label">غير مهتم حاليًا</span><span className="option-helper">إغلاق الفرصة بدون متابعة</span></span>
          </button>
        )}
      </div>

      {outcome === "success" && (
        <div className="outcome-section">
          <div className="section-label small">هل نتج عن المكالمة إجراء إضافي؟</div>
          <div className="chip-row">
            <button className={"reason-chip" + (successAction === "order" ? " active" : "")} onClick={() => setSuccessAction("order")}>تسجيل طلبية</button>
            <button className={"reason-chip" + (successAction === "opportunity" ? " active" : "")} onClick={() => setSuccessAction("opportunity")}>فرصة بيع</button>
            <button className={"reason-chip" + (successAction === "none" ? " active" : "")} onClick={() => setSuccessAction("none")}>لا يوجد</button>
          </div>

          {successAction === "order" && (
            <>
              <div className="hint-line"><Info size={12} /> العميل: {entry.customer} — معروف ومحدد</div>
              <div className="chip-row" style={{ marginTop: 10 }}>
                {PRODUCT_PRESETS.map(p => <button key={p} className={"reason-chip" + (orderItem === p ? " active" : "")} onClick={() => { setOrderItem(p); setDuplicateStage(false); }}>{p}</button>)}
              </div>
              {triedSaveOrder && !orderItem && <div className="hint-line hint-danger"><AlertTriangle size={12} /> اختر صنفًا قبل الحفظ</div>}
              <div className="qty-row">
                <span className="toggle-text">الكمية</span>
                <div className="qty-stepper">
                  <button onClick={() => setOrderQty(q => Math.max(1, q - 1))}><Minus size={13} /></button>
                  <span className="nums">{orderQty}</span>
                  <button onClick={() => setOrderQty(q => q + 1)}><Plus size={13} /></button>
                </div>
              </div>
              {triedSaveOrder && orderItem && orderQty < 1 && <div className="hint-line hint-danger"><AlertTriangle size={12} /> الكمية غير صحيحة</div>}
              {duplicateStage === "warn" && (
                <div className="hint-line hint-danger"><AlertTriangle size={12} /> يوجد بالفعل طلب مسجَّل اليوم لنفس العميل ونفس الصنف — تأكد قبل التكرار</div>
              )}
            </>
          )}
          {successAction === "opportunity" && (
            <div className="chip-row" style={{ marginTop: 10 }}>
              {NEED_CATEGORIES.map(c => <button key={c} className={"reason-chip" + (needCategory === c ? " active" : "")} onClick={() => setNeedCategory(c)}>{c}</button>)}
            </div>
          )}
        </div>
      )}

      {outcome === "promise" && (
        <div className="outcome-section">
          <div className="snap-grid two"><div className="snap-cell"><span className="snap-label">الرصيد المستحق</span><span className="snap-value nums">{entry.balance.outstanding}</span></div></div>
          <button className="toggle-row" onClick={() => setFullyCollected(v => !v)}>
            <span className="toggle-text">تم تحصيل كامل المبلغ</span>
            <span className={"toggle-switch" + (fullyCollected ? " on" : "")}><span className="toggle-knob" /></span>
          </button>
          {!fullyCollected && (
            <>
              <input className="ledger-input nums" inputMode="numeric" placeholder="المبلغ المُحصَّل جزئيًا (اختياري)" value={collected} onChange={e => setCollected(e.target.value)} />
              <div className="chip-row" style={{ marginTop: 8 }}>
                {["الأسبوع القادم", "بعد أسبوعين"].map(d => <button key={d} className={"reason-chip" + (newPromiseDate === d ? " active" : "")} onClick={() => setNewPromiseDate(d)}>{d}</button>)}
              </div>
            </>
          )}
        </div>
      )}

      {outcome === "no_answer" && (
        <div className="outcome-section">
          {willEscalateNoAnswer ? (
            <div className="hint-line hint-danger"><AlertTriangle size={12} /> هذه المحاولة الثالثة دون رد — سيتم إبلاغ المشرف بدلاً من محاولة أخرى</div>
          ) : (
            <div className="hint-line"><Info size={12} /> سيتم جدولة محاولة أخرى خلال ساعتين تلقائيًا</div>
          )}
        </div>
      )}

      {outcome === "unavailable" && (
        <div className="outcome-section">
          <div className="chip-row">
            {["خلال ساعة", "بعد الظهر", "غدًا صباحًا"].map(t => <button key={t} className={"reason-chip" + (callbackWhen === t ? " active" : "")} onClick={() => setCallbackWhen(t)}>{t}</button>)}
          </div>
        </div>
      )}

      {outcome === "complaint" && (
        <div className="outcome-section">
          <div className="chip-row">{COMPLAINT_CLASS.map(c => <button key={c} className={"reason-chip" + (complaintClass === c ? " active" : "")} onClick={() => setComplaintClass(c)}>{c}</button>)}</div>
          <div className="section-label small">الجهة المسؤولة</div>
          <div className="chip-row">{COMPLAINT_OWNERS.map(o => <button key={o} className={"reason-chip" + (complaintOwner === o ? " active" : "")} onClick={() => setComplaintOwner(o)}>{o}</button>)}</div>
          <textarea className="ledger-textarea" rows={2} placeholder="الإجراء المطلوب..." value={action} onChange={e => setAction(e.target.value)} />
          <button className="toggle-row" onClick={() => setEscalate(v => !v)}>
            <span className="toggle-text">تصعيد للمشرف مباشرة</span>
            <span className={"toggle-switch" + (escalate ? " on" : "")}><span className="toggle-knob" /></span>
          </button>

          {/* Recording a complaint is not the same as resolving it — make the
              resulting chain of ownership explicit before saving, reusing the
              same consequence-preview primitive used for next commitments. */}
          {complaintClass && complaintOwner && (
            <div className="next-preview">
              <span className="rail-node node-urgent" />
              <div className="next-preview-body">
                <div className="rail-kind">تم تسجيل الشكوى — لم تُحل بعد</div>
                <div className="rail-sub">المسؤول: {complaintOwner} · الإجراء المطلوب: {action || "لم يُحدَّد بعد"}</div>
                <div className="rail-sub">الحالة: {escalate ? "مُصعَّدة للمشرف" : "قيد المعالجة"} · متابعتك: تأكيد التنفيذ غدًا</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="outcome-actions">
        <button className="btn-secondary text-btn" onClick={onCancel}><ChevronRight size={15} /> رجوع</button>
        <button className="btn-primary" disabled={!canSave} onClick={outcome === "success" && successAction === "order" ? handleOrderSave : finish}>
          {outcome === "success" && successAction === "order" && duplicateStage === "warn" ? "تأكيد الحفظ رغم التكرار" : "حفظ النتيجة"}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  BETWEEN CALLS — the continuous-rhythm mechanic, the core difference    */
/*  from Artifact 1: the employee never lands back on a generic home tab.  */
/* ---------------------------------------------------------------------- */

function BetweenCalls({ lastResult, next, onContinue, onGoToClose }) {
  return (
    <div className="between-panel">
      <div className="resolved-note"><CheckCircle2 size={14} /> {lastResult}</div>
      {next ? (
        <>
          <div className="section-label small">التالي في القائمة</div>
          <div className="next-preview">
            <span className="rail-node node-normal" />
            <div className="next-preview-body">
              <div className="rail-kind">{PURPOSE_META[next.purpose].label}</div>
              <div className="rail-sub">{next.customer} — {next.reason}</div>
            </div>
          </div>
          <button className="btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={onContinue}>بدء المكالمة التالية</button>
        </>
      ) : (
        <>
          <div className="hint-line" style={{ marginTop: 10 }}><Info size={12} /> لا توجد مكالمات مخططة أخرى اليوم</div>
          <button className="btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={onGoToClose}>الانتقال إلى الإغلاق اليومي</button>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  ACTIVITY + CLOSE DAY (rep. pattern reused, tele-specific rows)          */
/* ---------------------------------------------------------------------- */

function ActivityTab({ orders, collections, complaints, reactivations, opportunities, done }) {
  return (
    <>
      <div className="section-label">مكالمات منجزة</div>
      <div className="evidence-list">
        {done.length ? done.map(d => <div key={d.id} className="evidence-row"><span className="evidence-time nums">{d.result}</span><span className="evidence-body"><span className="rail-kind">{d.customer}</span><span className="evidence-text">{PURPOSE_META[d.purpose].label}</span></span></div>)
          : <div className="empty-note">لا توجد مكالمات منجزة بعد</div>}
      </div>
      <div className="section-label">طلبات مسجلة</div>
      <div className="evidence-list">{orders.length ? orders.map(o => <div key={o.id} className="evidence-row"><span className="evidence-time nums">{o.time}</span><span className="evidence-body"><span className="rail-kind">{o.customer}</span><span className="evidence-text">{o.items}</span></span><span className="rail-amount nums">{o.value}</span></div>) : <div className="empty-note">لا توجد طلبات بعد</div>}</div>
      <div className="section-label">تحصيل ووعود</div>
      <div className="evidence-list">{collections.length ? collections.map(k => <div key={k.id} className="evidence-row"><span className="evidence-time nums">{k.time}</span><span className="evidence-body"><span className="rail-kind">{k.customer}</span><span className="evidence-text">{k.promiseDate ? `وعد جديد — ${k.promiseDate}` : "تم التحصيل بالكامل"}</span></span><span className="rail-amount nums">{k.collected}</span></div>) : <div className="empty-note">لا توجد متابعات تحصيل بعد</div>}</div>
      <div className="section-label">شكاوى ومشاكل</div>
      <div className="evidence-list">{complaints.length ? complaints.map(x => <div key={x.id} className="evidence-row"><span className="evidence-time nums">{x.time}</span><span className="evidence-body"><span className="rail-kind">{x.customer}</span><span className="evidence-text">{x.classification} — {x.status}</span></span></div>) : <div className="empty-note">لا توجد شكاوى مسجلة اليوم</div>}</div>
      <div className="section-label">إعادة تنشيط</div>
      <div className="evidence-list">{reactivations.length ? reactivations.map(r => <div key={r.id} className="evidence-row"><span className="evidence-time nums">{r.time}</span><span className="evidence-body"><span className="rail-kind">{r.customer}</span><span className="evidence-text">{r.result}</span></span></div>) : <div className="empty-note">لا توجد محاولات تفعيل اليوم</div>}</div>
      <div className="section-label">فرص بيع</div>
      <div className="evidence-list">{opportunities.length ? opportunities.map(n => <div key={n.id} className="evidence-row"><span className="evidence-time nums">{n.time}</span><span className="evidence-body"><span className="rail-kind">{n.customer}</span><span className="evidence-text">{n.category}</span></span></div>) : <div className="empty-note">لا توجد فرص مسجلة اليوم</div>}</div>
    </>
  );
}

function CloseDayTab({ queue, orders, collections, complaints, reactivations, opportunities, tomorrowCount, dayClosed, onClose }) {
  const [open, setOpen] = useState("calls");
  const done = queue.filter(q => q.state === "done");
  const planned = queue.length;
  const noAnswer = queue.filter(q => q.lastOutcomeType === "no_answer").length;
  const rows = [
    { id: "calls", severity: "normal", count: done.length, label: `مكالمات منجزة من أصل ${planned}`, sub: `${planned - done.length} متبقية`, items: queue.map(q => `${q.customer} — ${q.state === "done" ? "منجزة" : "قيد الانتظار"}`) },
    { id: "noanswer", severity: noAnswer ? "caution" : "normal", count: noAnswer, label: "محاولات بلا رد", sub: noAnswer ? "بعضها قد يحتاج محاولة أخرى غدًا" : "لا يوجد", items: queue.filter(q => q.lastOutcomeType === "no_answer").map(q => q.customer) },
    { id: "collections", severity: "normal", count: collections.length, label: "تحصيل ووعود", sub: collections.length ? "تم تسجيلها اليوم" : "لا يوجد", items: collections.map(k => `${k.customer} — ${k.collected}`) },
    { id: "complaints", severity: complaints.length ? "caution" : "normal", count: complaints.length, label: "شكاوى ومشاكل", sub: complaints.length ? "بانتظار المتابعة" : "لا يوجد", items: complaints.map(x => `${x.customer} — ${x.classification}`) },
    { id: "orders", severity: "normal", count: orders.length, label: "طلبات مسجلة", sub: orders.length ? "بانتظار مراجعة الائتمان" : "لا يوجد", items: orders.map(o => `${o.customer} — ${o.value}`) },
    { id: "react", severity: "normal", count: reactivations.length, label: "إعادة تنشيط", sub: reactivations.length ? "تم التواصل" : "لا يوجد", items: reactivations.map(r => `${r.customer} — ${r.result}`) },
    { id: "opp", severity: "normal", count: opportunities.length, label: "فرص بيع", sub: opportunities.length ? "تحتاج متابعة" : "لا يوجد", items: opportunities.map(n => `${n.customer} — ${n.category}`) },
    { id: "tomorrow", severity: "normal", count: tomorrowCount, label: "متابعات غدًا", sub: tomorrowCount ? "أُنشئت تلقائيًا من نتائج اليوم" : "لا يوجد", items: [] },
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
      <div className="demo-note"><Info size={12} /> هدف تجريبي: 6 مكالمات يوميًا · بيانات تجريبية لأغراض العرض فقط</div>
      <button className="btn-primary close-day-btn" disabled={dayClosed} onClick={onClose}>
        {dayClosed ? (<><CheckCircle2 size={16} /> تم إغلاق اليوم</>) : "تأكيد إغلاق اليوم"}
      </button>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/*  MAIN APP                                                                */
/* ---------------------------------------------------------------------- */

export default function App() {
  const [tab, setTab] = useState("day");
  const [queue, setQueue] = useState(SEED_QUEUE);
  const [openId, setOpenId] = useState(null); // pre-call sheet
  const [stage, setStage] = useState("idle"); // idle | live | outcome | between
  const [lastResult, setLastResult] = useState(null);
  const [orders, setOrders] = useState([]);
  const [collections, setCollections] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [reactivations, setReactivations] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [toast, setToast] = useState(null);
  const [dayClosed, setDayClosed] = useState(false);

  const ordered = sortedQueue(queue);
  const nextEntry = ordered.find(q => q.state === "queued") || null;
  const activeEntry = queue.find(q => q.id === openId) || null;

  function notify(msg) {
    setToast(msg);
    window.clearTimeout(window.__toastT);
    window.__toastT = window.setTimeout(() => setToast(null), 3400);
  }

  function openPreCall(id) { setOpenId(id); setStage("precall"); }
  function closeSheet() { setOpenId(null); setStage("idle"); }
  function startCall() { setStage("live"); }
  function endCall() { setStage("outcome"); }

  function saveOutcome(consequences) {
    const entry = activeEntry;
    if (consequences.order) setOrders(o => [...o, consequences.order]);
    if (consequences.collection) setCollections(c => [...c, consequences.collection]);
    if (consequences.complaint) setComplaints(c => [...c, consequences.complaint]);
    if (consequences.reactivation) setReactivations(r => [...r, consequences.reactivation]);
    if (consequences.opportunity) setOpportunities(o => [...o, consequences.opportunity]);

    const resultType = consequences.noAnswerEscalated ? "escalated" : (consequences.commitments[0] ? "followup" : "closed");
    const newTodayAttempts = entry.todayAttempts + (consequences.commitments.some(c => c.kind === "إعادة محاولة") ? 1 : 0);

    setQueue(qs => {
      const updated = qs.map(q => q.id === entry.id ? { ...q, state: "done", todayAttempts: newTodayAttempts, lastResultType: resultType, lastOutcomeType: consequences.outcomeType, sameDayRequeue: consequences.sameDayRequeue } : q);
      // A same-day retry or callback is a real next call, not just a note —
      // it re-enters today's live queue so the rhythm actually continues.
      if (consequences.sameDayRequeue) {
        updated.push({ ...entry, id: entry.id + "-rq-" + Date.now(), reason: consequences.requeueReason, lastInteraction: "اليوم", lastOutcome: entry.lastOutcome, todayAttempts: newTodayAttempts, state: "queued" });
      }
      return updated;
    });

    const summary = consequences.noAnswerEscalated
      ? `لا رد بعد 3 محاولات — تم إبلاغ المشرف بشأن ${entry.customer}`
      : consequences.commitments.length
        ? `تم حفظ النتيجة — التزام جديد: ${consequences.commitments[0].reason}`
        : `تم حفظ النتيجة — لا يوجد التزام تالٍ`;
    setLastResult(summary);
    setStage("between");
    notify("تم حفظ نتيجة المكالمة");
  }

  function continueToNext() {
    const remaining = sortedQueue(queue).find(q => q.state === "queued");
    if (remaining) openPreCall(remaining.id);
    else { setStage("idle"); setOpenId(null); }
  }

  const doneEntries = queue.filter(q => q.state === "done");
  const tomorrowCount = doneEntries.filter(q => q.lastResultType === "followup" && !q.sameDayRequeue).length;

  return (
    <div className="sr-app" dir="rtl">
      <style>{CSS}</style>
      <div className="frame frame-mobile">
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
              <button className="icon-btn" aria-label="الإشعارات"><Bell size={18} /><span className="dot-badge" /></button>
            </div>
          </div>
          <div className="role-row">
            <div className="role-select"><UserRound size={14} /><span>موظف مبيعات هاتفية</span></div>
          </div>
        </header>

        <main className="content">
          {tab === "day" && (
            <>
              {nextEntry && stage === "idle" && (
                <button className="hero" onClick={() => openPreCall(nextEntry.id)}>
                  <div className="hero-eyebrow">التالي الآن</div>
                  <div className="hero-title">{nextEntry.customer}</div>
                  <div className="hero-meta">{PURPOSE_META[nextEntry.purpose].label} · {nextEntry.reason}</div>
                </button>
              )}
              {!nextEntry && stage === "idle" && (
                <div className="attn-row attn-ok"><span className="rail-node node-completed" /><span>تم الانتهاء من كل المكالمات المخططة اليوم</span></div>
              )}
              <div className="coach-note" style={{ marginTop: 10 }}><Sparkles size={12} /> {COACHING_NOTE.point} — {COACHING_NOTE.from}</div>

              <div className="section-label">خطة مكالمات اليوم</div>
              <div className="reg-list">
                {ordered.map(q => <div className="reg-row" key={q.id}><QueueRow entry={q} onOpen={openPreCall} /></div>)}
              </div>
            </>
          )}

          {tab === "mine" && (
            <CloseDayTab queue={queue} orders={orders} collections={collections} complaints={complaints} reactivations={reactivations} opportunities={opportunities} tomorrowCount={tomorrowCount} dayClosed={dayClosed}
              onClose={() => { setDayClosed(true); notify("تم إغلاق اليوم"); }} />
          )}

          {tab === "customers" && (
            <>
              <div className="section-label">عملاء اليوم</div>
              <div className="reg-list">
                {queue.map(q => <div className="reg-row" key={q.id}><QueueRow entry={q} onOpen={openPreCall} /></div>)}
              </div>
            </>
          )}

          {tab === "activity" && (
            <ActivityTab orders={orders} collections={collections} complaints={complaints} reactivations={reactivations} opportunities={opportunities}
              done={doneEntries.map(q => ({ id: q.id, customer: q.customer, purpose: q.purpose, result: q.lastResultType === "escalated" ? "تم التصعيد" : q.lastResultType === "followup" ? "بمتابعة" : "أُغلقت" }))} />
          )}
        </main>

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

        {activeEntry && stage === "precall" && (
          <PreCallSnapshot entry={activeEntry} onStart={startCall} onClose={closeSheet} />
        )}

        {activeEntry && (stage === "live" || stage === "outcome" || stage === "between") && (
          <div className="sheet-overlay" onClick={() => {}}>
            <div className="sheet" onClick={e => e.stopPropagation()}>
              <div className="sheet-handle" />
              <div className="sheet-head">
                <div>
                  <div className="sheet-kind">{PURPOSE_META[activeEntry.purpose].label}</div>
                  <div className="sheet-title">{activeEntry.customer}</div>
                  <div className="sheet-sub">{activeEntry.contact}</div>
                </div>
                {stage !== "between" && <button className="icon-btn" onClick={closeSheet} aria-label="إغلاق"><X size={18} /></button>}
              </div>
              <div className="sheet-scroll">
                {stage === "live" && <LiveCall entry={activeEntry} onEnd={endCall} />}
                {stage === "outcome" && <CallOutcome entry={activeEntry} existingOrders={orders} onSave={saveOutcome} onCancel={() => setStage("live")} />}
                {stage === "between" && (
                  <BetweenCalls
                    lastResult={lastResult}
                    next={sortedQueue(queue).find(q => q.state === "queued" && q.id !== activeEntry.id) || null}
                    onContinue={continueToNext}
                    onGoToClose={() => { setStage("idle"); setOpenId(null); setTab("mine"); }}
                  />
                )}
              </div>
            </div>
          </div>
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
/*  CSS — same tokens/primitives as Artifacts 0–3                          */
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
.sr-app button:disabled{cursor:default;}
.sr-app *:focus-visible{outline:2px solid var(--action); outline-offset:2px; border-radius:4px;}
.nums{font-variant-numeric:tabular-nums; font-feature-settings:"tnum"; letter-spacing:.2px;}

.frame{background:var(--canvas); border:1px solid var(--rule); overflow:hidden; display:flex; flex-direction:column; box-shadow:0 1px 2px rgba(29,51,88,.04);}
.frame-mobile{width:390px; max-width:100%; height:780px; border-radius:22px;}

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
.role-row{padding:10px 0 12px;}
.role-select{display:flex; align-items:center; gap:6px; font-size:12px; color:var(--ink-700); background:var(--canvas-alt); border:1px solid var(--rule); padding:6px 10px; border-radius:8px; min-height:32px; width:fit-content;}
.chev{transition:transform .15s ease;}
.chev.open{transform:rotate(180deg);}

.content{flex:1; overflow-y:auto; padding:16px 16px 24px;}
.section-label{font-family:'Tajawal',sans-serif; font-weight:700; font-size:13px; color:var(--ink-700); margin:20px 2px 10px; border-inline-start:2px solid var(--stamp); padding-inline-start:8px;}
.section-label.small{font-size:12px; margin:14px 2px 6px;}

/* hero (frozen) */
.hero{display:block; width:100%; background:var(--ink-900); color:#fff; border-radius:8px; border-top:3px solid var(--stamp); padding:16px 18px; text-align:right; min-height:44px;}
.hero:hover{background:var(--ink-700);}
.hero-eyebrow{font-size:11px; color:var(--stamp-soft); margin-bottom:6px; letter-spacing:.3px; font-weight:600;}
.hero-title{font-family:'Tajawal',sans-serif; font-weight:700; font-size:17px; line-height:1.35;}
.hero-meta{font-size:12px; color:#C9D8EC; margin-top:6px;}

.attn-row{display:flex; align-items:center; gap:10px; padding:10px 2px; font-size:12.5px;}
.attn-ok{color:var(--success);}
.coach-note{display:flex; align-items:flex-start; gap:6px; font-size:12px; color:var(--stamp); background:var(--stamp-bg); border-radius:8px; padding:9px 11px; line-height:1.5;}

/* ledger register (frozen) */
.reg-list{display:flex; flex-direction:column;}
.reg-row{border-top:1px solid var(--rule);}
.reg-row:first-child{border-top:none;}
.reg-head{display:flex; align-items:center; gap:12px; width:100%; padding:12px 4px; min-height:44px;}
.reg-head:disabled{opacity:.6;}
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
.type-flag{display:inline-flex; align-items:center; gap:3px; font-size:10.5px; font-weight:700; padding:2px 6px; border-radius:5px; flex-shrink:0;}
.flag-done{color:var(--success); background:var(--success-bg);}

/* flags (frozen) */
.flag-list{display:flex; flex-direction:column; gap:6px; margin:10px 0;}
.flag-row{display:flex; align-items:flex-start; gap:6px; font-size:12px; line-height:1.5; padding:8px 10px; border-radius:8px; background:var(--canvas-alt);}
.flag-promise{color:var(--caution);}
.flag-issue{color:var(--danger);}
.flag-opp{color:var(--stamp);}

/* reason banner (pre-call / live call context) */
.reason-banner{display:flex; align-items:flex-start; gap:6px; font-size:12.5px; color:var(--ink-800); background:var(--quiet-blue); border-radius:8px; padding:10px 12px; margin-bottom:12px; line-height:1.5;}

/* sheet (frozen) */
.sheet-overlay{position:absolute; inset:0; background:rgba(22,40,63,.35); display:flex; align-items:flex-end; z-index:50; border-radius:22px;}
.sheet{background:var(--canvas); width:100%; max-height:88%; border-radius:18px 18px 0 0; display:flex; flex-direction:column;}
.sheet-handle{width:36px; height:4px; border-radius:3px; background:var(--rule); margin:10px auto 4px;}
.sheet-head{display:flex; align-items:flex-start; justify-content:space-between; padding:8px 18px 14px; border-bottom:1px solid var(--rule);}
.sheet-kind{font-size:11.5px; color:var(--ink-500); margin-bottom:3px;}
.sheet-title{font-family:'Tajawal',sans-serif; font-weight:700; font-size:16.5px;}
.sheet-sub{font-size:12.5px; color:var(--ink-500); margin-top:2px;}
.sheet-scroll{overflow-y:auto; padding:16px 18px; flex:1;}
.sheet-actions{display:flex; gap:8px; padding:12px 18px 16px; border-top:1px solid var(--rule);}

/* live call */
.live-row{display:flex; align-items:center; gap:8px; font-size:13px; color:var(--ink-700);}
.live-dot{width:8px; height:8px; border-radius:50%; background:var(--success); animation:pulse 1.6s ease infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.35;}}

/* snapshot grid (frozen) */
.snap-grid{display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--rule); border:1px solid var(--rule); margin-bottom:14px; border-radius:8px; overflow:hidden;}
.snap-grid.two{grid-template-columns:1fr; margin-bottom:12px;}
.snap-cell{background:var(--canvas); padding:9px 11px; display:flex; flex-direction:column; gap:4px;}
.snap-label{font-size:11px; color:var(--ink-500);}
.snap-value{font-size:13px; font-weight:600; color:var(--ink-900);}
.hint-line{display:flex; align-items:center; gap:5px; font-size:11.5px; color:var(--ink-500); margin-top:6px; line-height:1.5;}
.hint-line.hint-danger{color:var(--danger); font-weight:600;}

/* outcome capture (mostly frozen from Artifact 1) */
.outcome-section{padding:12px 0; border-top:1px solid var(--rule); margin-top:10px;}
.option-list{display:flex; flex-direction:column;}
.option-row{display:flex; align-items:flex-start; gap:10px; width:100%; padding:10px 4px; min-height:44px; border-top:1px dashed var(--rule);}
.option-row:first-child{border-top:none;}
.option-mark{width:14px; height:14px; border-radius:50%; border:2px solid var(--action); background:var(--canvas); flex-shrink:0; margin-top:2px;}
.option-mark.checked{background:var(--action); box-shadow:inset 0 0 0 2px var(--canvas);}
.option-text{display:flex; flex-direction:column; gap:2px; text-align:right;}
.option-label{display:flex; align-items:center; gap:5px; font-size:13.5px; font-weight:600; color:var(--ink-900);}
.option-helper{font-size:11.5px; color:var(--ink-500);}
.chip-row{display:flex; flex-wrap:wrap; gap:8px;}
.reason-chip{display:inline-flex; align-items:center; gap:4px; font-size:12.5px; font-weight:600; color:var(--ink-700); border:1px solid var(--rule); border-radius:7px; padding:7px 12px; min-height:36px;}
.reason-chip.active{color:var(--action); border-color:var(--action); background:var(--quiet-blue);}
.qty-row{display:flex; align-items:center; justify-content:space-between; padding:8px 4px; min-height:36px;}
.qty-stepper{display:flex; align-items:center; gap:10px;}
.qty-stepper button{width:26px; height:26px; border-radius:6px; background:var(--canvas-alt); border:1px solid var(--rule); display:flex; align-items:center; justify-content:center; color:var(--ink-700);}
.toggle-text{font-size:12.5px; color:var(--ink-700); font-weight:600;}
.toggle-row{display:flex; align-items:center; justify-content:space-between; width:100%; min-height:40px; padding:2px 4px;}
.toggle-switch{width:34px; height:20px; border-radius:11px; background:var(--rule); position:relative; flex-shrink:0; transition:background-color .12s ease;}
.toggle-switch.on{background:var(--action);}
.toggle-knob{position:absolute; top:2px; right:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform .12s ease; box-shadow:0 1px 2px rgba(22,40,63,.2);}
.toggle-switch.on .toggle-knob{transform:translateX(-14px);}
.ledger-input{border:none; border-bottom:1.5px solid var(--rule); background:transparent; font-size:15px; font-weight:700; color:var(--ink-900); padding:8px 2px; width:100%; text-align:right; font-family:inherit; margin-top:8px;}
.ledger-input:focus{border-bottom-color:var(--action);}
.ledger-input::placeholder{color:var(--ink-300); font-weight:500;}
.ledger-textarea{border:none; border-bottom:1.5px solid var(--rule); background:transparent; font-size:13.5px; color:var(--ink-900); padding:8px 2px; width:100%; text-align:right; font-family:inherit; resize:none; margin-top:6px;}
.ledger-textarea:focus{border-bottom-color:var(--action);}
.outcome-actions{display:flex; gap:8px; padding-top:16px;}

/* next-commitment preview (frozen) */
.next-preview{display:flex; align-items:flex-start; gap:10px; margin-top:10px; padding:12px; background:var(--canvas-alt); border-radius:8px;}
.next-preview .rail-node{margin-top:3px;}
.next-preview-body{flex:1; display:flex; flex-direction:column; gap:4px;}
.rail-node{width:12px; height:12px; flex-shrink:0; box-sizing:border-box;}
.node-normal{border-radius:50%; border:2px solid var(--action); background:var(--canvas);}
.node-urgent{border-radius:2px; background:var(--danger); transform:rotate(45deg);}
.node-completed{border-radius:50%; background:var(--success); box-shadow:inset 0 0 0 2px var(--canvas);}
.rail-kind{font-size:11px; color:var(--ink-500); font-weight:500;}
.rail-sub{font-size:12.5px; color:var(--ink-700); line-height:1.5;}
.rail-amount{font-size:12px; font-weight:700; color:var(--ink-900);}

/* between-calls panel */
.between-panel{padding:4px 0;}
.resolved-note{display:flex; align-items:center; gap:6px; font-size:12.5px; color:var(--success); padding:10px 11px; background:var(--success-bg); border-radius:8px;}

/* buttons (frozen) */
.btn-primary{flex:1; background:var(--action); color:#fff; border-radius:9px; padding:0 16px; min-height:46px; font-weight:700; font-size:13.5px; display:flex; align-items:center; justify-content:center; gap:6px;}
.btn-primary:hover{background:var(--ink-900);}
.btn-primary:disabled{background:var(--ink-300); cursor:not-allowed;}
.btn-secondary{background:var(--canvas-alt); border:1px solid var(--rule); border-radius:9px; min-height:46px; padding:0 16px; display:flex; align-items:center; justify-content:center; gap:6px; color:var(--ink-700);}
.close-day-btn{width:100%; margin-top:16px;}

/* evidence log (activity tab, reused from Artifact 1) */
.evidence-list{display:flex; flex-direction:column;}
.evidence-row{display:flex; align-items:center; gap:10px; padding:10px 2px; border-top:1px solid var(--rule);}
.evidence-list .evidence-row:first-child{border-top:none;}
.evidence-time{font-size:11px; color:var(--ink-500); flex-shrink:0; min-width:40px;}
.evidence-body{flex:1; display:flex; flex-direction:column; gap:2px;}
.evidence-text{font-size:12.5px; color:var(--ink-700);}
.empty-note{font-size:12px; color:var(--ink-300); padding:10px 2px;}

/* demo labeling */
.demo-note{display:flex; align-items:center; gap:6px; font-size:11px; color:var(--ink-400); margin-top:16px; padding:10px 4px; border-top:1px dashed var(--rule);}

/* bottom nav (frozen) */
.bottom-nav{display:flex; border-top:1px solid var(--rule); background:var(--canvas); flex-shrink:0;}
.nav-btn{flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:9px 0 10px; color:var(--ink-300); font-size:10.5px; min-height:44px;}
.nav-btn.active{color:var(--action);}
.nav-btn span{font-weight:600;}

/* toast (frozen) */
.toast{position:fixed; bottom:28px; left:50%; transform:translateX(-50%); background:var(--ink-900); color:#fff; padding:12px 18px; border-radius:10px; display:flex; align-items:center; gap:8px; font-size:12.5px; box-shadow:0 10px 30px rgba(22,40,63,.28); z-index:100; max-width:320px;}

@media (prefers-reduced-motion: reduce){
  .sr-app *{animation:none !important; transition:none !important;}
}
`;
