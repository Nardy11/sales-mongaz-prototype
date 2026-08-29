import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyboardInput, KeyboardTextarea, useKeyboard } from "../../mobile";
import {
  CommitmentRail,
  CommitmentRailItem,
  LedgerRow,
  NextActionHero,
  StatePanel,
} from "../../design-system/foundation";
import { ActivityCalendar, type ActivityEvidence } from "../../design-system/ActivityCalendar";
import {
  completeTelesalesCall,
  startTelesalesCall,
  telesalesActivity,
  telesalesCapture,
  telesalesDay,
  telesalesDetail,
  telesalesProducts,
  telesalesQueue,
  type SessionIdentity,
} from "../../lib/api";
import "./telesales.css";
import { customerClassificationLabel } from "../../lib/presentation";
const label: Record<string, string> = {
  supervisor_priority: "أولوية المشرف",
  collection: "وعد سداد",
  complaint_followup: "شكوى مفتوحة",
  reactivation: "إعادة تنشيط",
  opportunity: "فرصة",
  routine: "متابعة",
  successful_contact: "تم التواصل",
  payment_promise: "وعد سداد",
  complaint: "شكوى",
  callback: "إعادة اتصال",
  no_answer: "لا رد",
  not_interested: "غير مهتم",
  followup: "متابعة مفتوحة",
  escalated: "تم التصعيد",
  completed: "مكتملة",
};
const dayLabel:Record<string,string>={planned:"مكالمات مخططة",completed:"مكالمات مكتملة",successful:"تواصل ناجح",noAnswer:"بدون إجابة",callbacks:"إعادات اتصال",escalations:"تصعيدات",tomorrowCarryover:"عمل محمول للغد",openWork:"عمل مفتوح"};
const formatEvidenceTime=(value:string)=>new Intl.DateTimeFormat("ar-EG",{dateStyle:"short",timeStyle:"short"}).format(new Date(value));
export function TelesalesWorkspace({
  session,
  onCustomer,
  activeTab,
}: {
  session: SessionIdentity;
  onCustomer: (id: string) => void;
  activeTab: "day" | "customers" | "activity" | "mine";
}) {
  const [id, setId] = useState<string | null>(null),
    [outcome, setOutcome] = useState(""),
    [evidence, setEvidence] = useState(""),
    [callbackAt, setCallbackAt] = useState(""),
    [notice, setNotice] = useState("");
  const tab=activeTab==="day"?"today":activeTab==="mine"?"work":activeTab;
  const keyboard=useKeyboard();
  const qc = useQueryClient();
  useEffect(() => {
    if (tab === "today") return;
    keyboard.hide();
    setId(null);
    setOutcome("");
    setEvidence("");
    setCallbackAt("");
  }, [tab]);
  const queue = useQuery({ queryKey: ["tq"], queryFn: telesalesQueue, enabled: tab === "today" });
  const detail = useQuery({
    queryKey: ["td", id],
    queryFn: () => telesalesDetail(id!),
    enabled: tab === "today" && !!id,
  });
  const day = useQuery({ queryKey: ["ty"], queryFn: telesalesDay, enabled: tab === "work" });
  const activity = useQuery({ queryKey: ["ta"], queryFn: telesalesActivity, enabled: tab === "activity" });
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["tq"] }),
      qc.invalidateQueries({ queryKey: ["ty"] }),
      qc.invalidateQueries({ queryKey: ["ta"] }),
    ]);
  if (tab === "activity" && activity.isLoading)
    return <StatePanel kind="loading" title="جارٍ تحميل نشاط المبيعات الهاتفية" detail="يتم جلب الأدلة التشغيلية المحفوظة من الخادم." />;
  if (tab === "activity" && activity.isError)
    return <StatePanel kind="error" title="تعذر تحميل النشاط" detail="أعد المحاولة لجلب الأدلة المصرح بها." retry={() => void activity.refetch()} />;
  if (tab === "activity") {
    const activityEvidence:ActivityEvidence[]=(activity.data??[]).map((item)=>({
      id:item.id,
      at:item.at,
      title:item.title??`${item.customerName} — ${item.outcome?(label[item.outcome]??item.outcome):"دليل تشغيلي"}`,
      detail:item.detail??`${item.result?(label[item.result]??item.result):"نتيجة محفوظة"} · ${item.evidence}${item.priorityReason?` · ${item.priorityReason}`:""}`,
      attention:item.attention??(item.result==="escalated"?"urgent":item.result==="followup"?"caution":"success"),
    }));
    return <ActivityCalendar title="تقويم نشاط المبيعات الهاتفية" evidence={activityEvidence}/>;
  }
  if (tab === "work" && day.isLoading)
    return <StatePanel kind="loading" title="جارٍ تحميل عملي" detail="يتم اشتقاق الإغلاق اليومي من السجلات المحفوظة." />;
  if (tab === "work" && day.isError)
    return <StatePanel kind="error" title="تعذر تحميل عملي" detail="أعد المحاولة لجلب ملخص اليوم." retry={() => void day.refetch()} />;
  if (tab === "today" && queue.isLoading)
    return <StatePanel kind="loading" title="جارٍ تحميل الأولويات" detail="" />;
  if (tab === "today" && queue.isError)
    return (
      <StatePanel
        kind="error"
        title="تعذر تحميل العمل"
        detail=""
        retry={() => void queue.refetch()}
      />
    );
  const call = detail.data?.call;
  const complete = async () => {
    if (!id || !outcome || !evidence) return;
    keyboard.hide();
    try {
      const r = await completeTelesalesCall(id, session.csrfToken, {
        outcome,
        evidence,
        callbackAt: callbackAt ? new Date(callbackAt).toISOString() : undefined,
      });
      setNotice(
        r.result === "escalated"
          ? "تم التصعيد مع الاحتفاظ بنتيجة لا رد."
          : r.nextCallId
            ? "تم حفظ النتيجة والعمل التالي في قائمة اليوم."
            : "تم حفظ النتيجة والعمل الناتج.",
      );
      setId(null);
      setOutcome("");
      setEvidence("");
      await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "تعذر الحفظ");
    }
  };
  return (
    <section className="telesales-workspace">
      {notice && (
        <StatePanel kind="loading" title="بين المكالمات" detail={notice} />
      )}{" "}
      {tab === "today" && id && detail.isLoading ? (
        <StatePanel
          kind="loading"
          title="ما قبل الاتصال"
          detail="جارٍ تحميل الأدلة"
        />
      ) : tab === "today" && id && detail.isError ? (
        <StatePanel kind="error" title="تعذر تحميل سياق المكالمة" detail="أعد المحاولة لجلب الأدلة السابقة." retry={() => void detail.refetch()} />
      ) : tab === "today" && id && call ? (
        <div className="telesales-call">
          <button
            type="button"
            className="artifact4-back"
            onClick={() => {
              keyboard.hide();
              setId(null);
              setOutcome("");
              setEvidence("");
            }}
          >
            <span aria-hidden="true">›</span> العودة إلى خطة المكالمات
          </button>
          <NextActionHero
            eyebrow={label[call.purpose]}
            title={call.customerName}
            detail={call.priorityReason}
          />
          <section className="artifact4-precall" aria-label="ملخص ما قبل الاتصال">
            <div><small>جهة الاتصال</small><strong>{call.contactName || "غير مسجل"}</strong></div>
            <div><small>الهاتف</small><strong dir="ltr">{call.phone || "—"}</strong></div>
            <p>{call.operationalNotes || "لا توجد ملاحظات تشغيلية إضافية."}</p>
          </section>
          <CommitmentRail>
            {detail.data!.commitments.map((x) => (
              <CommitmentRailItem
                key={x.id}
                state="caution"
                title={x.title}
                meta="التزام محفوظ"
                time={x.dueAt}
              />
            ))}
            {detail.data!.attempts.map((x, i) => (
              <CommitmentRailItem
                key={i}
                state={x.result === "escalated" ? "urgent" : "normal"}
                title={label[x.outcome]}
                meta={`${label[x.result]??x.result}: ${x.evidence}`}
                time={formatEvidenceTime(x.attemptedAt)}
              />
            ))}
          </CommitmentRail>
          {call.state === "queued" ? (
            <button
              className="production-primary"
              onClick={async () => {
                await startTelesalesCall(call.id, session.csrfToken);
                await detail.refetch();
              }}
            >
              بدء الاتصال
            </button>
          ) : (
            <>
              <div className="artifact4-live-state">
                <span aria-hidden="true" />
                <strong>المكالمة جارية</strong>
                <small>المراحل التالية استرشادية ولا تمنع حفظ النتيجة.</small>
              </div>
              <div className="artifact4-guided-stages">
                <label>
                  <input type="checkbox" /> مراجعة السياق
                </label>
                <label>
                  <input type="checkbox" /> توثيق النقاط
                </label>
              </div>
              <label>
                النتيجة
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                >
                  <option value="">اختر</option>
                  {detail.data!.allowedOutcomes.map((x) => (
                    <option key={x} value={x}>
                      {label[x]}
                    </option>
                  ))}
                </select>
              </label>
              <Capture
                purpose={call.purpose}
                outcome={outcome}
                callId={call.id}
                csrf={session.csrfToken}
                onSaved={async (message) => {
                  setNotice(message);
                  await refresh();
                  await detail.refetch();
                }}
              />
              {outcome === "callback" && (
                <label>
                  موعد إعادة الاتصال
                  <KeyboardInput
                    type="datetime-local"
                    value={callbackAt}
                    onChange={(e) => setCallbackAt(e.target.value)}
                  />
                </label>
              )}
              <label>
                الدليل
                <KeyboardTextarea
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                />
              </label>
              <button
                className="production-primary"
                disabled={!outcome || !evidence}
                onClick={() => void complete()}
              >
                حفظ النتيجة
              </button>
            </>
          )}
        </div>
      ) : tab === "work" ? (
        <section className="artifact4-close-day">
          <NextActionHero
            eyebrow="إقفال اليوم"
            title="عملي"
            detail="أدلة تشغيلية محفوظة"
          />
          <div className="artifact4-section-title"><span />ملخص التنفيذ المحفوظ</div>
          <div className="artifact4-day-ledger">{Object.entries(day.data ?? {}).map(([k, v]) => (
            <LedgerRow key={k} label={dayLabel[k]??k} detail="مشتق من السجل التشغيلي" status={<strong>{String(v)}</strong>} />
          ))}</div>
        </section>
      ) : tab === "customers" ? (
        <Customers onOpen={onCustomer} />
      ) : (
        <section className="artifact4-call-queue">
          {queue.data?.length ? <>
            <button type="button" className="artifact4-next-action" onClick={() => setId(queue.data![0].id)}>
              <span className="artifact4-next-kicker">التالي الآن</span>
              <strong>{queue.data[0].customerName}</strong>
              <small>{label[queue.data[0].purpose]} · {queue.data[0].priorityReason}</small>
              <span className="artifact4-next-footer"><i aria-hidden="true" /> افتح دليل ما قبل الاتصال <b aria-hidden="true">‹</b></span>
            </button>
            <div className="artifact4-queue-summary" aria-label="ملخص قائمة اليوم">
              <span><b>{queue.data.length}</b><small>مكالمة مفتوحة</small></span>
              <span><b>{queue.data.filter(x => (x.todayNoAnswers ?? 0) > 0).length}</b><small>إعادة محاولة</small></span>
              <span><b>{queue.data.filter(x => ["supervisor_priority","collection","complaint_followup"].includes(x.purpose)).length}</b><small>تحتاج انتباه</small></span>
            </div>
            <p className="artifact4-queue-note"><span aria-hidden="true">✦</span><b>ملاحظة الإشراف</b> وضّح الالتزام التالي قبل إنهاء المكالمة. سبب أولوية اليوم محفوظ مع كل عميل.</p>
            <div className="artifact4-section-title"><span />خطة مكالمات اليوم</div>
            <div className="artifact4-queue-list">{queue.data.map((x) => (
              <button
                className="telesales-row"
                key={x.id}
                onClick={() => setId(x.id)}
              >
                <span className={`artifact4-queue-mark artifact4-queue-mark--${["supervisor_priority","collection","complaint_followup"].includes(x.purpose)?"urgent":x.purpose==="reactivation"?"caution":"normal"}`} aria-hidden="true" />
                <span className="artifact4-queue-copy"><strong>{x.customerName}</strong><small>{label[x.purpose]} · {x.priorityReason}</small></span>
                <span className="artifact4-queue-meta"><time>{new Intl.DateTimeFormat("ar-EG",{hour:"numeric",minute:"2-digit"}).format(new Date(x.scheduledAt))}</time>{(x.todayNoAnswers ?? 0)>0&&<small>{x.todayNoAnswers} لا رد</small>}</span>
                <span className="artifact4-queue-chevron" aria-hidden="true">‹</span>
              </button>
            ))}</div>
          </>:<StatePanel kind="empty" title="لا توجد مكالمات مفتوحة" detail="قائمة اليوم خالية ولا توجد أولوية مصطنعة للعرض."/>}
        </section>
      )}
    </section>
  );
}
function Capture({
  purpose,
  outcome,
  callId,
  csrf,
  onSaved,
}: {
  purpose: string;
  outcome: string;
  callId: string;
  csrf: string;
  onSaved: (x: string) => void | Promise<void>;
}) {
  const [product, setProduct] = useState(""),
    [quantity, setQuantity] = useState(""),
    [amount, setAmount] = useState(""),
    [due, setDue] = useState(""),
    [note, setNote] = useState(""),
    [override, setOverride] = useState(false),
    [error, setError] = useState("");
  const products = useQuery({
    queryKey: ["tp"],
    queryFn: telesalesProducts,
    enabled: purpose === "routine" || purpose === "supervisor_priority",
  });
  let kind = "";
  if (outcome === "payment_promise") kind = "collection";
  else if (outcome === "complaint") kind = "complaint";
  else if (purpose === "reactivation" && outcome === "not_interested")
    kind = "reactivation";
  else if (
    purpose === "opportunity" &&
    (outcome === "successful_contact" || outcome === "not_interested")
  )
    kind = "opportunity";
  else if (outcome === "successful_contact") kind = "order";
  if (!kind) return null;
  const save = async () => {
    try {
      setError("");
      if (kind === "order" && (!product || Number(quantity) <= 0))
        throw new Error("اختر المنتج وأدخل كمية موجبة.");
      if (kind === "collection" && (!amount || !due))
        throw new Error("المبلغ وموعد الوعد مطلوبان.");
      if (kind === "reactivation" && !due)
        throw new Error("موعد المتابعة مطلوب.");
      const input: any =
        kind === "order"
          ? {
              productId: product,
              quantity: Number(quantity),
              requestNote: note,
              duplicateOverrideReason: override
                ? "تأكيد الموظف للتكرار"
                : undefined,
            }
          : kind === "collection"
            ? {
                outcome: "promise",
                promiseAmount: Number(amount),
                promiseDueAt: new Date(due).toISOString(),
                evidence: note || "وعد سداد",
                followUpTitle: "متابعة وعد سداد",
                followUpDueAt: new Date(due).toISOString(),
              }
            : kind === "complaint"
              ? {
                  classification: "general",
                  description: note || "شكوى مسجلة",
                  responsibleParty: "فريق خدمة العملاء",
                  requiredAction: "متابعة الشكوى",
                  evidence: note || "شكوى مسجلة",
                  followUpTitle: "متابعة شكوى",
                  followUpDueAt: new Date(Date.now() + 86400000).toISOString(),
                }
              : kind === "reactivation"
                ? {
                    evidence: note || "متابعة إعادة تنشيط",
                    title: "متابعة إعادة تنشيط",
                    dueAt: new Date(due).toISOString(),
                  }
                : {
                    kind: "cross_sell",
                    note: note || "فرصة مسجلة",
                    evidence: note || "فرصة مسجلة",
                    followUpTitle: "متابعة فرصة",
                    followUpDueAt: new Date(
                      Date.now() + 86400000,
                    ).toISOString(),
                  };
      await telesalesCapture(callId, kind as any, csrf, input);
      await onSaved(
        kind === "complaint"
          ? "تم تسجيل الشكوى؛ مسجلة وليست محلولة."
          : `تم حفظ ${kind} كعمل ناتج.`,
      );
    } catch (e: any) {
      if (e?.message?.includes("recent order") && !override) {
        setOverride(true);
        setError("يوجد طلب حديث؛ أكد التجاوز صراحة.");
      } else setError(e?.message ?? "تعذر الحفظ");
    }
  };
  return (
    <fieldset>
      <legend>التقاط نتيجة التواصل</legend>
      {kind === "order" && (
        <>
          <select value={product} onChange={(e) => setProduct(e.target.value)}>
            <option value="">المنتج</option>
            {(products.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <KeyboardInput
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="الكمية"
          />
          {override && (
            <label>
              <input
                type="checkbox"
                checked={override}
                onChange={(e) => setOverride(e.target.checked)}
              />{" "}
              تأكيد تسجيل طلب مكرر
            </label>
          )}
        </>
      )}
      {kind === "collection" && (
        <>
          <KeyboardInput
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="المبلغ"
          />
          <KeyboardInput
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </>
      )}
      {kind === "reactivation" && (
        <KeyboardInput
          type="datetime-local"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
      )}
      <KeyboardTextarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="تفاصيل/دليل"
      />
      <button type="button" onClick={() => void save()}>
        حفظ العمل الناتج
      </button>
      {error && <p>{error}</p>}
    </fieldset>
  );
}
function Customers({ onOpen }: { onOpen: (id: string) => void }) {
  const q = useQuery({
    queryKey: ["customers"],
    queryFn: () => import("../../lib/api").then((x) => x.customers()),
  });
  return (
    <section className="artifact4-customers">
      <div className="artifact4-section-title"><span />العملاء داخل نطاقك</div>
      {q.isLoading ? <StatePanel kind="loading" title="جارٍ تحميل العملاء" detail="يتم جلب سجل العملاء المصرح به."/> : q.isError ? <StatePanel kind="error" title="تعذر تحميل العملاء" detail="أعد المحاولة لجلب سجل العملاء." retry={() => void q.refetch()}/> : q.data?.length ? q.data.map((c) => (
        <button
          className="telesales-row"
          key={c.id}
          onClick={() => onOpen(c.id)}
        >
          <LedgerRow
            label={c.name}
            detail={`${customerClassificationLabel(c.classification)} · ${c.openCommitments} التزامات`}
            status={<span className="artifact4-customer-open">فتح الملف ‹</span>}
          />
        </button>
      )) : <StatePanel kind="empty" title="لا يوجد عملاء" detail="لا يوجد عملاء داخل نطاق الوصول المصرح به."/>}
    </section>
  );
}
