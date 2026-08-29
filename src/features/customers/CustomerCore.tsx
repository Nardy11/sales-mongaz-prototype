import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import "./customer-core.css";
import {
  captureOperational,
  complaintLifecycle,
  customerFile,
  customers,
  initiateReactivation,
  orderLifecycle,
  transitionComplaint,
  transitionOrder,
  updateCustomer,
  type LifecycleSummary,
  type SessionIdentity,
} from "../../lib/api";
import { KeyboardInput, KeyboardTextarea } from "../../mobile";
import {
  CommitmentRail,
  CommitmentRailItem,
  LedgerRow,
  LifecycleMiniRail,
  NextActionHero,
  StatePanel,
  StatusLabel,
} from "../../design-system/foundation";
import { customerClassificationLabel } from "../../lib/presentation";

const orderStages = [
  "recorded",
  "credit_review",
  "approved",
  "preparation",
  "delivery_preparation",
  "delivered",
  "closed",
];
const complaintStages = [
  "recorded",
  "classified",
  "assigned",
  "corrective_action",
  "follow_up",
  "resolved",
  "closed",
];
const ar: any = {
  recorded: "مسجل",
  credit_review: "مراجعة ائتمانية",
  approved: "معتمد",
  preparation: "تجهيز",
  delivery_preparation: "تحضير التسليم",
  delivered: "تم التسليم",
  closed: "مغلق",
  classified: "مصنفة",
  assigned: "مُسندة",
  corrective_action: "إجراء تصحيحي",
  follow_up: "متابعة",
  resolved: "تم الحل",
};
const format = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("ar-EG", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
export function CustomerRegister({ onOpen }: { onOpen: (id: string) => void }) {
  const q = useQuery({ queryKey: ["customers"], queryFn: customers });
  if (q.isLoading)
    return (
      <StatePanel
        kind="loading"
        title="جارٍ تحميل العملاء"
        detail="يتم جلب سجل العملاء التشغيلي."
      />
    );
  if (q.isError)
    return (
      <StatePanel
        kind="error"
        title="تعذر تحميل العملاء"
        detail="تحقق من الاتصال ثم أعد المحاولة."
        retry={() => q.refetch()}
      />
    );
  if (!q.data?.length)
    return (
      <StatePanel
        kind="empty"
        title="لا يوجد عملاء ضمن نطاقك"
        detail="لا توجد سجلات تشغيلية متاحة."
      />
    );
  return (
    <section className="artifact2-customer-register">
      <h2>عملاؤك</h2>
      <div className="artifact2-register-list">
        {q.data.map((c) => {
          const state = !c.isActive
            ? "inactive"
            : c.operationalStatus === "risk"
              ? "urgent"
              : c.operationalStatus === "attention"
                ? "caution"
                : "normal";
          return (
            <button
              className="artifact2-register-row"
              key={c.id}
              onClick={() => onOpen(c.id)}
            >
              <span
                className={`artifact2-register-mark artifact2-register-mark--${state}`}
                aria-hidden="true"
              />
              <span className="artifact2-register-copy">
                <strong>{c.name}</strong>
                <small>
                  {customerClassificationLabel(c.classification)} ·{" "}
                  {c.customerCode ?? "—"}
                </small>
              </span>
              {!c.isActive && (
                <span className="artifact2-register-flag">غير نشط</span>
              )}
              <span className="artifact2-register-chevron" aria-hidden="true">
                ‹
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LifecycleTrack({
  stages,
  status,
}: {
  stages: string[];
  status: string;
}) {
  const current = stages.indexOf(status);
  return (
    <ol className="phase4-track" aria-label="مسار تشغيلي">
      <>
        {stages.map((stage, index) => (
          <li
            className={
              index < current ? "done" : index === current ? "current" : ""
            }
            key={stage}
          >
            <span />
            {ar[stage] ?? stage}
          </li>
        ))}
      </>
    </ol>
  );
}
function LifecycleCard({
  kind,
  item,
  onChanged,
  session,
}: {
  kind: "order" | "complaint";
  item: LifecycleSummary;
  onChanged: () => void;
  session: SessionIdentity;
}) {
  const detail = useQuery({
    queryKey: [kind, item.id],
    queryFn: () =>
      kind === "order" ? orderLifecycle(item.id) : complaintLifecycle(item.id),
  });
  const [open, setOpen] = useState(false),
    [evidence, setEvidence] = useState(""),
    [owner, setOwner] = useState(item.responsibleParty ?? ""),
    [due, setDue] = useState(""),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const model = detail.data?.[kind],
    stages = kind === "order" ? orderStages : complaintStages;
  const next = () => {
    const i = stages.indexOf(model?.status);
    return stages[i + 1];
  };
  const action = async () => {
    if (!model || !next()) return;
    setSaving(true);
    setError("");
    try {
      const to = next(),
        payload: any = {
          to,
          evidence,
          responsibleParty: owner || undefined,
          version: model.version,
        };
      if (kind === "complaint") {
        if (to === "classified") payload.classification = "تشغيلية";
        if (to === "corrective_action") payload.correctiveAction = evidence;
        if (to === "follow_up") {
          payload.createFollowUp = true;
          payload.followUpTitle = "متابعة شكوى العميل";
          payload.followUpAt = new Date(due).toISOString();
        }
      }
      await (kind === "order"
        ? transitionOrder(item.id, session.csrfToken, payload)
        : transitionComplaint(item.id, session.csrfToken, payload));
      setEvidence("");
      setDue("");
      await detail.refetch();
      onChanged();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "تعذر حفظ التحديث التشغيلي",
      );
    } finally {
      setSaving(false);
    }
  };
  const attention =
    model?.status === "closed"
      ? "success"
      : model?.status === "delivered" || model?.status === "resolved"
        ? "caution"
        : model?.block?.active
          ? "urgent"
          : "normal";
  return (
    <article className="phase4-card">
      <button
        className="phase4-card__head"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <LedgerRow
          label={kind === "order" ? "طلب تشغيلي" : "شكوى تشغيلية"}
          detail={`${ar[item.status] ?? item.status} · ${format(item.updatedAt)}`}
          status={
            <StatusLabel attention={attention}>
              {model?.status === "delivered"
                ? "تم التسليم — الإغلاق مطلوب"
                : model?.status === "resolved"
                  ? "تم الحل — الإغلاق مطلوب"
                  : (ar[item.status] ?? item.status)}
            </StatusLabel>
          }
        />
      </button>
      {open && detail.isLoading && (
        <StatePanel
          kind="loading"
          title="جارٍ تحميل دليل المسار"
          detail="يتم جلب السجل المحفوظ."
        />
      )}
      {open && detail.isError && (
        <StatePanel
          kind="error"
          title="تعذر تحميل المسار"
          detail="تحقق من الصلاحية أو الاتصال."
          retry={() => detail.refetch()}
        />
      )}{" "}
      {open && model && (
        <div className="phase4-card__body">
          <LifecycleTrack stages={stages} status={model.status} />
          {kind === "order" && <LifecycleMiniRail />}
          <LedgerRow
            label="الحالة التشغيلية"
            detail={
              model.operationallyOpen
                ? "العمل ما زال مفتوحاً ويحتاج إتماماً صريحاً."
                : "اكتمل الإغلاق التشغيلي مع دليل محفوظ."
            }
            status={
              <StatusLabel
                attention={model.operationallyOpen ? "caution" : "success"}
              >
                {model.operationallyOpen ? "مفتوح" : "مغلق"}
              </StatusLabel>
            }
          />
          {model.block?.active && (
            <section className="phase4-evidence">
              <strong>حظر تشغيلي — لا يعني الإغلاق</strong>
              <p>{model.block.reason}</p>
              <p>
                المسؤول: {model.block.responsibleParty ?? "—"} · الإجراء التالي:{" "}
                {model.block.requiredNextAction ?? "—"}
              </p>
              <p>موعد المتابعة: {format(model.block.followUpAt)}</p>
            </section>
          )}
          {model.correctiveAction && (
            <section className="phase4-evidence">
              <strong>إجراء تصحيحي مسجل — الشكوى ما زالت مفتوحة</strong>
              <p>{model.correctiveAction}</p>
            </section>
          )}
          {model.delivered && (
            <section className="phase4-evidence">
              <strong>تم التسليم — الإغلاق ما زال مطلوباً</strong>
              <p>
                {model.delivered.evidence} · {format(model.delivered.at)}
              </p>
            </section>
          )}
          {model.resolution && (
            <section className="phase4-evidence">
              <strong>تم الحل — ليس مغلقاً بعد</strong>
              <p>
                {model.resolution.evidence} · {format(model.resolution.at)}
              </p>
            </section>
          )}
          {model.closure && (
            <section className="phase4-evidence">
              <strong>دليل الإغلاق</strong>
              <p>{model.closure.evidence}</p>
              <p>
                {model.closure.responsibleParty} · {format(model.closure.at)}
              </p>
            </section>
          )}
          {detail.data!.resultingWork?.length > 0 && (
            <>
              <h3>عمل ناتج مستمر</h3>
              <CommitmentRail>
                {detail.data!.resultingWork.map((work: any) => (
                  <CommitmentRailItem
                    key={work.id}
                    state={work.status === "completed" ? "success" : "caution"}
                    time={format(work.dueAt)}
                    title={work.title}
                    meta={`مرتبط بهذا ${kind === "order" ? "الطلب" : "الشكوى"} · ${work.status === "completed" ? "مكتمل" : "مفتوح"}`}
                  />
                ))}
              </CommitmentRail>
            </>
          )}
          <h3>سجل الدليل</h3>
          <CommitmentRail>
            {detail.data!.history.map((event: any) => (
              <CommitmentRailItem
                key={event.id}
                state={event.to === "closed" ? "success" : "normal"}
                time={format(event.at)}
                title={`${ar[event.from] ?? event.from} ← ${ar[event.to] ?? event.to}`}
                meta={`${event.evidence} · ${event.responsibleParty ?? event.actorName ?? "مسؤول مسجل"}`}
              />
            ))}
          </CommitmentRail>
          {session.employee.role === "sales_representative" &&
            model.status !== "closed" &&
            next() && (
              <section className="phase4-action">
                <h3>الإجراء التشغيلي التالي: {ar[next()]}</h3>
                <label>
                  الدليل المطلوب
                  <KeyboardTextarea
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                  />
                </label>
                <label>
                  المسؤول / الطرف
                  <KeyboardInput
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                  />
                </label>
                {kind === "complaint" && next() === "follow_up" && (
                  <label>
                    موعد المتابعة
                    <KeyboardInput
                      type="datetime-local"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                    />
                  </label>
                )}
                <button
                  className="production-primary"
                  disabled={
                    saving ||
                    !evidence ||
                    (next() === "closed" && !owner) ||
                    (kind === "complaint" && next() === "follow_up" && !due)
                  }
                  onClick={() => void action()}
                >
                  حفظ الإجراء وتحديث الملف
                </button>
                {error && (
                  <StatePanel
                    kind="error"
                    title="تعذر حفظ الإجراء"
                    detail={error}
                  />
                )}
              </section>
            )}
          {session.employee.role !== "sales_representative" &&
            model.status !== "closed" && (
              <StatePanel
                kind="empty"
                title="عرض الدليل فقط"
                detail="يمكنك مراجعة المسار والأدلة ضمن نطاقك، بينما يظل تنفيذ الإجراء لدى المندوب المسؤول."
              />
            )}
        </div>
      )}
    </article>
  );
}
export function CustomerOperatingFile({
  id,
  onBack,
  session,
}: {
  id: string;
  onBack: () => void;
  session: SessionIdentity;
}) {
  const qc = useQueryClient(),
    q = useQuery({
      queryKey: ["customer", id],
      queryFn: () => customerFile(id),
    }),
    [evidence, setEvidence] = useState(""),
    [due, setDue] = useState(""),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [editingClassification, setEditingClassification] = useState(false),
    [collectionOpen, setCollectionOpen] = useState(false),
    [collectionOutcome, setCollectionOutcome] = useState("collected"),
    [collectionAmount, setCollectionAmount] = useState(""),
    [collectionDue, setCollectionDue] = useState(""),
    [collectionEvidence, setCollectionEvidence] = useState("");
  if (q.isLoading)
    return (
      <StatePanel
        kind="loading"
        title="جارٍ تحميل ملف العميل"
        detail="يتم جلب السياق والالتزامات."
      />
    );
  if (q.isError)
    return (
      <StatePanel
        kind="error"
        title="تعذر تحميل ملف العميل"
        detail="لا تملك الوصول أو تعذر الاتصال."
        retry={() => q.refetch()}
      />
    );
  const d = q.data!,
    next = d.commitments.find((c) => c.status !== "completed"),
    attention =
      d.customer.operationalStatus === "risk"
        ? "urgent"
        : d.customer.operationalStatus === "attention" || !d.customer.isActive
          ? "caution"
          : "normal",
    refresh = async () => {
      await q.refetch();
      qc.invalidateQueries({ queryKey: ["rep-day"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    reactivate = async () => {
      setSaving(true);
      setError("");
      try {
        await initiateReactivation(id, session.csrfToken, {
          evidence,
          title: "متابعة إعادة تنشيط العميل",
          dueAt: new Date(due).toISOString(),
        });
        await refresh();
        setEvidence("");
        setDue("");
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "تعذر إنشاء متابعة إعادة التنشيط",
        );
      } finally {
        setSaving(false);
      }
    },
    changeClassification = async (classification: "gold" | "silver" | "follow_up") => {
      setSaving(true);
      setError("");
      try {
        await updateCustomer(id, session.csrfToken, { classification });
        setEditingClassification(false);
        await refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "تعذر تحديث تصنيف العميل");
      } finally {
        setSaving(false);
      }
    },
    saveCollection = async () => {
      const promise = collectionOutcome === "promise";
      const amountRequired = ["collected", "partial", "promise"].includes(collectionOutcome);
      if (!collectionEvidence.trim() || (amountRequired && Number(collectionAmount) <= 0) || (promise && !collectionDue)) {
        setError("أدخل الدليل والمبلغ، وموعد الاستحقاق لوعد السداد.");
        return;
      }
      setSaving(true);
      setError("");
      try {
        await captureOperational("collection", session.csrfToken, {
          customerId: id,
          outcome: collectionOutcome,
          evidence: collectionEvidence,
          amountCollected: ["collected", "partial"].includes(collectionOutcome) ? Number(collectionAmount) : 0,
          promiseAmount: promise ? Number(collectionAmount) : undefined,
          promiseDueAt: promise ? new Date(collectionDue).toISOString() : undefined,
          followUpTitle: promise ? "متابعة وعد سداد" : undefined,
          followUpDueAt: promise ? new Date(collectionDue).toISOString() : undefined,
        });
        setCollectionOpen(false);
        setCollectionAmount("");
        setCollectionDue("");
        setCollectionEvidence("");
        await refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "تعذر تسجيل نتيجة التحصيل");
      } finally {
        setSaving(false);
      }
    };
  const canEditClassification = ["telesales_supervisor", "sales_manager"].includes(session.employee.role);
  return (
    <section className="customer-file artifact2-customer-file">
      <button className="customer-back artifact2-back" onClick={onBack}>
        كل العملاء
      </button>
      <div className="artifact2-identity">
        <div>
          <h1>{d.customer.name}</h1>
          <p>
            {d.customer.contactName ?? "لا يوجد مسؤول اتصال"} ·{" "}
            {d.customer.city ?? "—"}
          </p>
        </div>
        {canEditClassification ? (
          <button className="artifact2-classification" aria-expanded={editingClassification} onClick={() => setEditingClassification((value) => !value)}>
            {customerClassificationLabel(d.customer.classification)} · تعديل
          </button>
        ) : (
          <span className="artifact2-classification">{customerClassificationLabel(d.customer.classification)}</span>
        )}
        {editingClassification && <div className="artifact2-classification-editor" aria-label="تعديل تصنيف العميل">
          {(["gold", "silver", "follow_up"] as const).map((value) => <button key={value} disabled={saving || value === d.customer.classification} onClick={() => void changeClassification(value)}>{customerClassificationLabel(value)}</button>)}
        </div>}
        <div className="artifact2-identity-foot">
          <span>المالك: {d.customer.contactName ?? "مسؤول مسجل"}</span>
          <span>{d.customer.phone ?? "—"}</span>
        </div>
      </div>
      {error && (
        <StatePanel
          kind="error"
          title="تعذر حفظ التحديث"
          detail={error}
          retry={() => setError("")}
        />
      )}
      <NextActionHero
        eyebrow={next ? "التالي الآن" : "السياق التشغيلي"}
        title={next ? next.title : "لا توجد متابعة مفتوحة"}
        detail={
          next
            ? `موعد الاستحقاق: ${format(next.dueAt)} · مسؤول التنفيذ: أنت`
            : (d.customer.operationalNotes ?? "لا توجد ملاحظات تشغيلية.")
        }
      />
      <h2>الانتباه التشغيلي</h2>
      <div className={`artifact2-attention artifact2-attention--${attention}`}>
        <span />
        <div>
          <strong>{d.customer.isActive ? "حساب نشط" : "العميل غير نشط"}</strong>
          <p>{d.customer.operationalNotes ?? "لا توجد ملاحظات تشغيلية."}</p>
        </div>
        <StatusLabel attention={attention}>
          {d.customer.isActive
            ? (ar[d.customer.operationalStatus] ?? d.customer.operationalStatus)
            : "يحتاج متابعة"}
        </StatusLabel>
      </div>
      {!d.customer.isActive &&
        session.employee.role === "sales_representative" && (
          <section className="reactivation">
            <h2>إعادة تنشيط العميل</h2>
            <p>
              يبقى العميل غير نشط حتى يحدث تفعيل صريح؛ هذه متابعة تشغيلية فقط.
            </p>
            <label>
              الدليل أو السياق
              <KeyboardTextarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />
            </label>
            <label>
              موعد المتابعة
              <KeyboardInput
                type="datetime-local"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </label>
            <button
              className="production-primary"
              disabled={!evidence || !due || saving}
              onClick={() => void reactivate()}
            >
              إنشاء متابعة إعادة التنشيط
            </button>
          </section>
        )}
      <h2>مسار التزامات العميل</h2>
      <div className="artifact2-commitment-rail">
        <CommitmentRail>
          {d.commitments.map((c) => (
            <CommitmentRailItem
              key={c.id}
              state={
                c.attention === "overdue"
                  ? "urgent"
                  : c.status === "completed"
                    ? "success"
                    : "normal"
              }
              time={format(c.dueAt)}
              title={c.title}
              meta={
                c.status === "completed"
                  ? `دليل مكتمل: ${c.completionEvidence ?? "دليل مسجل"}`
                  : c.attention === "overdue"
                    ? "التزام متأخر — يحتاج متابعة"
                    : "التزام مفتوح — العمل التالي"
              }
            />
          ))}
        </CommitmentRail>
      </div>
      <h2>التحصيل والوعود</h2>
      {d.collections?.length ? (
        d.collections.map((item) => (
          <LedgerRow
            key={item.id}
            label={
              item.outcome === "promise"
                ? "وعد سداد"
                : item.outcome === "partial"
                  ? "تحصيل جزئي"
                  : item.outcome === "collected"
                    ? "تم التحصيل"
                    : "لم يتم التحصيل"
            }
            detail={`${item.evidence} · ${item.outcome === "promise" ? `${item.promiseAmount} ج.م · ${format(item.promiseDueAt)}` : `${item.amountCollected} ج.م`} · ${format(item.createdAt)}`}
            status={
              <StatusLabel
                attention={
                  item.outcome === "promise" || item.outcome === "no_collection"
                    ? "caution"
                    : "success"
                }
              >
                {item.commitmentId ? "متابعة محفوظة" : "دليل محفوظ"}
              </StatusLabel>
            }
          />
        ))
      ) : (
        <StatePanel
          kind="empty"
          title="لا توجد نتائج تحصيل"
          detail="لا توجد نتيجة تحصيل أو وعد سداد محفوظ لهذا العميل."
        />
      )}
      {session.employee.role === "sales_representative" && (
        <section className="artifact2-collection-capture">
          <button
            className="production-secondary"
            onClick={() => setCollectionOpen((value) => !value)}
          >
            {collectionOpen ? "إلغاء تسجيل النتيجة" : "تسجيل نتيجة تحصيل"}
          </button>
          {collectionOpen && (
            <div className="artifact2-collection-form">
              <label>
                النتيجة
                <select
                  value={collectionOutcome}
                  onChange={(event) => setCollectionOutcome(event.target.value)}
                >
                  <option value="collected">تم التحصيل</option>
                  <option value="partial">تحصيل جزئي</option>
                  <option value="promise">وعد سداد</option>
                  <option value="no_collection">لم يتم التحصيل</option>
                </select>
              </label>
              {collectionOutcome !== "no_collection" && (
                <label>
                  المبلغ
                  <KeyboardInput
                    type="number"
                    min="0"
                    value={collectionAmount}
                    onChange={(event) => setCollectionAmount(event.target.value)}
                  />
                </label>
              )}
              {collectionOutcome === "promise" && (
                <label>
                  موعد الوعد
                  <KeyboardInput
                    type="datetime-local"
                    value={collectionDue}
                    onChange={(event) => setCollectionDue(event.target.value)}
                  />
                </label>
              )}
              <label>
                الدليل
                <KeyboardTextarea
                  value={collectionEvidence}
                  onChange={(event) => setCollectionEvidence(event.target.value)}
                />
              </label>
              <button
                className="production-primary"
                disabled={saving}
                onClick={() => void saveCollection()}
              >
                حفظ نتيجة التحصيل
              </button>
            </div>
          )}
        </section>
      )}
      <h2>الفرص والاحتياجات</h2>
      {d.opportunities?.length ? (
        d.opportunities.map((item) => (
          <LedgerRow
            key={item.id}
            label={item.kind}
            detail={`${item.note} · ${item.productReference ?? "بدون منتج محدد"} · ${format(item.createdAt)}`}
            status={
              <StatusLabel attention={item.status === "won" ? "success" : "normal"}>
                {item.status === "open" ? "مفتوحة" : item.status}
              </StatusLabel>
            }
          />
        ))
      ) : (
        <StatePanel
          kind="empty"
          title="لا توجد فرص محفوظة"
          detail="لم تُسجل فرصة بيع لهذا العميل."
        />
      )}
      <h2>ملاحظات السوق</h2>
      {d.observations?.length ? (
        d.observations.map((item) => (
          <LedgerRow
            key={item.id}
            label={item.observationType}
            detail={`${item.note} · ${item.competitor ?? "دون منافس محدد"} · ${format(item.observedAt)}`}
          />
        ))
      ) : (
        <StatePanel
          kind="empty"
          title="لا توجد ملاحظات سوق"
          detail="لم تُسجل ملاحظة سوق مرتبطة بهذا العميل."
        />
      )}
      <h2>الطلبات</h2>
      {d.orders?.length ? (
        <>
          {d.orders.map((order) => (
            <LifecycleCard
              key={order.id}
              kind="order"
              item={order}
              onChanged={refresh}
              session={session}
            />
          ))}
        </>
      ) : (
        <StatePanel
          kind="empty"
          title="لا توجد طلبات تشغيلية"
          detail="لن يتم إنشاء بيانات بديلة داخل الملف."
        />
      )}
      <h2>الشكاوى</h2>
      {d.complaints?.length ? (
        <>
          {d.complaints.map((complaint) => (
            <LifecycleCard
              key={complaint.id}
              kind="complaint"
              item={complaint}
              onChanged={refresh}
              session={session}
            />
          ))}
        </>
      ) : (
        <StatePanel
          kind="empty"
          title="لا توجد شكاوى تشغيلية"
          detail="لا توجد قضايا محفوظة لهذا العميل."
        />
      )}
    </section>
  );
}
