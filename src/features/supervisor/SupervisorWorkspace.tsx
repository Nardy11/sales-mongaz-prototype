import { useState } from "react";
import "./supervisor.css";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyboardTextarea } from "../../mobile";
import {
  CommitmentRail,
  CommitmentRailItem,
  LedgerRow,
  NextActionHero,
  StatePanel,
  StatusLabel,
} from "../../design-system/foundation";
import {
  supervisorAction,
  supervisorCheckpoint,
  supervisorCoaching,
  supervisorQuality,
  supervisorWorkspace,
  type SessionIdentity,
} from "../../lib/api";
import {
  ActivityCalendar,
  type ActivityEvidence,
} from "../../design-system/ActivityCalendar";

const label: Record<string, string> = {
  morning: "الصباح",
  midday: "منتصف اليوم",
  end_of_day: "نهاية اليوم",
  open: "مفتوح",
  actioned: "تم إجراء تدخل — العمل مستمر",
  resolved: "تم الحل",
  acknowledge: "إقرار",
  escalate: "تصعيد",
  reassign: "إعادة إسناد",
  follow_up: "إنشاء متابعة",
  resolve: "حل فعلي",
  ready: "جاهز",
  attention: "انتباه",
  risk: "مخاطرة",
  needs_improvement: "يحتاج تحسين",
};
const format = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("ar-EG", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
export function SupervisorWorkspace({
  session,
  activeTab,
}: {
  session: SessionIdentity;
  activeTab: "day" | "team" | "queues" | "activity";
}) {
  const client = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [evidence, setEvidence] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState("morning");
  const [reassignOwner, setReassignOwner] = useState("");
  const data = useQuery({
    queryKey: ["supervisor"],
    queryFn: supervisorWorkspace,
  });
  const refresh = () => client.invalidateQueries({ queryKey: ["supervisor"] });
  const write = useMutation({
    mutationFn: async ({
      type,
      body,
      id,
    }: {
      type: string;
      body: Record<string, unknown>;
      id?: string;
    }) =>
      type === "action"
        ? supervisorAction(id!, session.csrfToken, body)
        : type === "checkpoint"
          ? supervisorCheckpoint(session.csrfToken, body)
          : type === "quality"
            ? supervisorQuality(session.csrfToken, body)
            : supervisorCoaching(session.csrfToken, body),
    onSuccess: () => {
      setEvidence("");
      setMessage("تم حفظ الدليل التشغيلي وتحديث العرض.");
      refresh();
    },
    onError: (error) =>
      setMessage(error instanceof Error ? error.message : "تعذر حفظ الإجراء."),
  });
  if (data.isLoading)
    return (
      <StatePanel
        kind="loading"
        title="جارٍ تحميل إشراف الفريق"
        detail="يتم جلب الجاهزية والاستثناءات والأدلة."
      />
    );
  if (data.isError)
    return (
      <StatePanel
        kind="error"
        title="تعذر تحميل الإشراف"
        detail="أعد المحاولة للوصول إلى أدلة الفريق."
        retry={() => data.refetch()}
      />
    );
  const workspace = data.data!;
  const exception =
    workspace.exceptions.find((x) => x.id === selected) ??
    workspace.exceptions[0];
  const teamMember = workspace.team[0];
  const openException = workspace.exceptions.find(
    (item) => item.operationallyOpen,
  );
  const activityEvidence: ActivityEvidence[] = [
    ...workspace.checkpoints.map((item, index) => ({
      id: `checkpoint-${item.checkpoint}-${index}`,
      at: item.at,
      title: `نقطة متابعة: ${label[item.checkpoint]}`,
      detail: item.evidence,
      attention:
        item.readinessState === "risk"
          ? ("urgent" as const)
          : item.readinessState === "ready"
            ? ("success" as const)
            : ("caution" as const),
    })),
    ...workspace.quality.map((item) => ({
      id: `quality-${item.id}`,
      at: item.at,
      title: `مراجعة جودة — ${item.employeeName}`,
      detail: `${item.evidence} · ${item.observation}`,
      attention:
        item.result === "needs_improvement"
          ? ("caution" as const)
          : ("success" as const),
    })),
    ...workspace.coaching.map((item) => ({
      id: `coaching-${item.id}`,
      at: item.at,
      title: `تدريب — ${item.employeeName}`,
      detail: `${item.topic} · ${item.evidence}`,
      attention:
        item.status === "open" ? ("caution" as const) : ("success" as const),
    })),
    ...workspace.exceptions.map((item) => ({
      id: `exception-${item.id}`,
      at: item.createdAt,
      title: `استثناء — ${item.summary}`,
      detail: `${item.evidence} · ${item.requiredNextAction}`,
      attention: item.operationallyOpen
        ? item.severity === "urgent"
          ? ("urgent" as const)
          : ("caution" as const)
        : ("success" as const),
    })),
  ];
  const hero =
    activeTab === "team"
      ? {
          eyebrow: "تنفيذ الفريق",
          title: workspace.team.length
            ? `${workspace.team.length} أعضاء ضمن نطاقك`
            : "لا يوجد أعضاء ضمن النطاق",
          detail: "حجم الطابور والإنجاز الفعلي لكل عضو دون خلطه بسجل الجودة.",
        }
      : activeTab === "queues"
        ? {
            eyebrow: "الطوابير والاستثناءات",
            title: openException?.summary ?? "لا توجد استثناءات مفتوحة",
            detail: openException
              ? `${openException.employeeName ?? "فريق المبيعات"} · ${openException.requiredNextAction}`
              : "لا يوجد عمل يحتاج تدخلاً الآن.",
          }
        : activeTab === "activity"
          ? {
              eyebrow: "النشاط الإشرافي",
              title: "مراجعات الجودة والتدريب",
              detail: "أدلة التدخلات المسجلة ونتائجها والعمل الناتج عنها.",
            }
          : {
              eyebrow: "التالي الآن",
              title: openException?.summary ?? "الفريق على المسار الصحيح",
              detail: openException
                ? `${openException.employeeName ?? "فريق المبيعات"} · ${openException.customerName ?? "عمل تشغيلي"}`
                : "لا توجد أولوية تشغيلية مفتوحة.",
            };
  const act = (
    kind: "acknowledge" | "escalate" | "reassign" | "follow_up" | "resolve",
  ) => {
    if (!exception || evidence.trim().length < 2)
      return setMessage("يلزم تسجيل دليل الإجراء.");
    if (kind === "reassign" && !reassignOwner)
      return setMessage("اختر موظفًا مسؤولًا من نطاق الفريق.");
    write.mutate({
      type: "action",
      id: exception.id,
      body: {
        kind,
        evidence,
        version: exception.version,
        ...(["follow_up", "reassign"].includes(kind)
          ? {
              followUpAt: new Date(Date.now() + 86_400_000).toISOString(),
              followUpTitle: exception.requiredNextAction,
            }
          : {}),
        ...(kind === "reassign" ? { ownerEmployeeId: reassignOwner } : {}),
      },
    });
  };
  return (
    <section
      className="supervisor-workspace"
      aria-label="مساحة مشرف المبيعات الهاتفية"
    >
      {activeTab !== "activity" && (
        <NextActionHero
          eyebrow={hero.eyebrow}
          title={hero.title}
          detail={hero.detail}
        />
      )}
      {message && (
        <StatePanel
          kind="error"
          title="حالة الإجراء"
          detail={message}
          retry={() => setMessage(null)}
        />
      )}
      {activeTab === "day" && (
        <section id="supervisor-day" className="supervisor-checkpoint-panel">
          <h2>هل يمكن للفريق البدء بشكل صحيح؟</h2>
          <div className="supervisor-tabs">
            {["morning", "midday", "end_of_day"].map((kind) => {
              const point = workspace.checkpoints.find(
                (x) => x.checkpoint === kind,
              );
              return (
                <button
                  key={kind}
                  className={selectedCheckpoint === kind ? "active" : ""}
                  aria-pressed={selectedCheckpoint === kind}
                  onClick={() => setSelectedCheckpoint(kind)}
                >
                  {label[kind]}
                </button>
              );
            })}
          </div>
          {workspace.checkpoints
            .filter((x) => x.checkpoint === selectedCheckpoint)
            .map((x) => (
              <LedgerRow
                key={x.checkpoint}
                label={label[x.checkpoint]}
                detail={x.evidence}
                status={
                  <StatusLabel
                    attention={
                      x.readinessState === "risk" ? "urgent" : "caution"
                    }
                  >
                    {label[x.readinessState]}
                  </StatusLabel>
                }
              />
            ))}
          <div
            className="supervisor-readiness-ledger"
            aria-label="ملخص جاهزية الفريق"
          >
            <LedgerRow
              label="أعضاء ضمن نطاق الفريق"
              detail="النطاق الفعلي المعروض لهذا المشرف"
              status={<strong>{workspace.team.length}</strong>}
            />
            <LedgerRow
              label="تنفيذ المكالمات"
              detail={`${workspace.team.reduce((total, employee) => total + employee.queuedCalls, 0)} في الطابور`}
              status={
                <strong>
                  {workspace.team.reduce(
                    (total, employee) => total + employee.completedCalls,
                    0,
                  )}
                </strong>
              }
            />
            <LedgerRow
              label="استثناءات مفتوحة"
              detail="تظل مفتوحة حتى تسجيل حل فعلي"
              status={
                <strong>
                  {
                    workspace.exceptions.filter(
                      (item) => item.operationallyOpen,
                    ).length
                  }
                </strong>
              }
            />
            <LedgerRow
              label="أولويات عاجلة"
              detail="تحتاج تدخلاً قبل بقية الطابور"
              status={
                <strong>
                  {
                    workspace.exceptions.filter(
                      (item) =>
                        item.operationallyOpen && item.severity === "urgent",
                    ).length
                  }
                </strong>
              }
            />
          </div>
          <button
            className="production-secondary"
            onClick={() =>
              write.mutate({
                type: "checkpoint",
                body: {
                  checkpoint: selectedCheckpoint,
                  evidence: `دليل ${label[selectedCheckpoint]} — راجع الاستثناءات المفتوحة`,
                  readinessState: workspace.exceptions.some(
                    (x) => x.operationallyOpen && x.severity === "urgent",
                  )
                    ? "risk"
                    : "attention",
                },
              })
            }
          >
            حفظ نقطة المتابعة
          </button>
        </section>
      )}
      {(activeTab === "day" || activeTab === "queues") && (
        <section id="supervisor-queues" className="supervisor-priority-section">
          <h2>أولويات اليوم</h2>
          {workspace.exceptions.length === 0 ? (
            <StatePanel
              kind="empty"
              title="لا توجد استثناءات"
              detail="لا يوجد عمل فريق يحتاج تدخلاً."
            />
          ) : (
            <div className="supervisor-priority-rail">
              {workspace.exceptions.map((x) => (
                <button
                  key={x.id}
                  className={`supervisor-exception ${exception?.id === x.id ? "selected" : ""}`}
                  onClick={() => setSelected(x.id)}
                >
                  <StatusLabel
                    attention={
                      x.status === "resolved"
                        ? "success"
                        : x.severity === "urgent"
                          ? "urgent"
                          : "caution"
                    }
                  >
                    {label[x.status]}
                  </StatusLabel>
                  <strong>{x.summary}</strong>
                  <span>
                    {x.employeeName ?? "فريق المبيعات"} ·{" "}
                    {x.customerName ?? "عمل تشغيلي"}
                  </span>
                  {x.priorAction && (
                    <small>
                      إجراء سابق: {x.priorAction} —{" "}
                      {x.operationallyOpen ? "العمل ما زال مفتوحاً" : "تم الحل"}
                    </small>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      )}
      {(activeTab === "day" || activeTab === "queues") && exception && (
        <section className="supervisor-detail">
          <h2>دليل الاستثناء والإجراء التالي</h2>
          <p>{exception.evidence}</p>
          <p>التالي: {exception.requiredNextAction}</p>
          <StatusLabel
            attention={exception.operationallyOpen ? "caution" : "success"}
          >
            {exception.operationallyOpen ? "مفتوح تشغيلياً" : "محلول فعلياً"}
          </StatusLabel>
          {exception.priorAction && (
            <>
              <LedgerRow
                label={`تدخل المشرف: ${label[exception.priorAction] ?? exception.priorAction}`}
                detail={`الدليل: ${exception.priorActionEvidence ?? "—"} · المسؤول: ${exception.actionActorName ?? "مسؤول مسجل"}`}
                status={
                  <StatusLabel
                    attention={
                      exception.operationallyOpen ? "caution" : "success"
                    }
                  >
                    {exception.operationallyOpen ? "العمل مستمر" : "تم الحل"}
                  </StatusLabel>
                }
              />
              {exception.followUpAt && (
                <LedgerRow
                  label="موعد المتابعة الناتجة"
                  detail={format(exception.followUpAt)}
                />
              )}
              {exception.resultingCommitment && (
                <>
                  <h3>التزام متابعة ناتج</h3>
                  <CommitmentRail>
                    <CommitmentRailItem
                      state="caution"
                      time={format(exception.followUpAt)}
                      title="التزام متابعة ناتج محفوظ"
                      meta={`معرّف الالتزام: ${exception.resultingCommitment.id} · مرتبط بهذا الاستثناء · العمل ما زال مفتوحاً`}
                    />
                  </CommitmentRail>
                </>
              )}
            </>
          )}
          {exception.operationallyOpen && (
            <>
              <label>
                دليل تدخل المشرف
                <KeyboardTextarea
                  value={evidence}
                  onChange={(event) => setEvidence(event.target.value)}
                />
              </label>
              <div className="supervisor-actions">
                <button
                  className="production-secondary"
                  onClick={() => act("acknowledge")}
                >
                  إقرار الدليل
                </button>
                <button
                  className="production-secondary"
                  onClick={() => act("escalate")}
                >
                  تصعيد
                </button>
                <button
                  className="production-secondary"
                  onClick={() => act("follow_up")}
                >
                  إنشاء متابعة
                </button>
                {workspace.team.length > 0 && (
                  <label className="supervisor-reassign">
                    إعادة إسناد ضمن الفريق
                    <select
                      value={reassignOwner}
                      onChange={(event) => setReassignOwner(event.target.value)}
                    >
                      <option value="">اختر الموظف</option>
                      {workspace.team.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.displayName}
                        </option>
                      ))}
                    </select>
                    <button
                      className="production-secondary"
                      onClick={() => act("reassign")}
                    >
                      حفظ إعادة الإسناد
                    </button>
                  </label>
                )}
                <button
                  className="production-primary"
                  onClick={() => act("resolve")}
                >
                  تسجيل حل فعلي
                </button>
              </div>
            </>
          )}
        </section>
      )}
      {(activeTab === "day" || activeTab === "team") && (
        <section id="supervisor-team">
          <h2>تنفيذ الفريق</h2>
          {workspace.team.length === 0 ? (
            <StatePanel
              kind="empty"
              title="لا يوجد أعضاء ضمن نطاقك"
              detail="لا توجد سجلات تنفيذ فريق متاحة لهذا الحساب."
            />
          ) : (
            workspace.team.map((employee) => (
              <LedgerRow
                key={employee.id}
                label={employee.displayName}
                detail={`${employee.completedCalls} مكتملة · ${employee.queuedCalls} في الطابور`}
                status={
                  <StatusLabel
                    attention={employee.queuedCalls ? "caution" : "normal"}
                  >
                    {employee.queuedCalls ? "يحتاج متابعة" : "جاهز"}
                  </StatusLabel>
                }
              />
            ))
          )}
        </section>
      )}
      {activeTab === "activity" && (
        <ActivityCalendar
          title="تقويم النشاط الإشرافي"
          evidence={activityEvidence}
        />
      )}
      {(activeTab === "day" || activeTab === "activity") && (
        <section id="supervisor-activity">
          <h2>مراجعة الجودة والتدريب</h2>
          {workspace.quality.length === 0 &&
            workspace.coaching.length === 0 && (
              <StatePanel
                kind="empty"
                title="لا يوجد نشاط إشرافي مسجل"
                detail="ستظهر هنا مراجعات الجودة والتدريب بعد حفظها."
              />
            )}
          {workspace.quality.map((review) => (
            <LedgerRow
              key={review.id}
              label={review.employeeName}
              detail={`${review.evidence} · ${review.observation}`}
              status={
                <StatusLabel
                  attention={
                    review.result === "needs_improvement" ? "caution" : "normal"
                  }
                >
                  {label[review.result]}
                </StatusLabel>
              }
            />
          ))}
          {workspace.coaching.map((record) => (
            <CommitmentRail key={record.id}>
              <CommitmentRailItem
                state={record.status === "open" ? "caution" : "normal"}
                time={
                  record.dueAt
                    ? new Intl.DateTimeFormat("ar-EG", {
                        dateStyle: "short",
                      }).format(new Date(record.dueAt))
                    : "بدون موعد"
                }
                title={`${record.employeeName} · ${record.topic}`}
                meta={`${record.evidence} · ${record.agreedAction} · ${label[record.status] ?? record.status}`}
              />
            </CommitmentRail>
          ))}
          {teamMember && exception && (
            <div className="supervisor-actions">
              <button
                className="production-secondary"
                onClick={() =>
                  write.mutate({
                    type: "quality",
                    body: {
                      employeeId: teamMember.id,
                      sourceType: "telesales_call",
                      sourceId: exception.sourceId,
                      evidence: "دليل مراجعة جودة المشرف",
                      result: "needs_improvement",
                      observation: "توثيق النتيجة والمتابعة يحتاج تحسينا",
                    },
                  })
                }
              >
                تسجيل مراجعة جودة
              </button>
              <button
                className="production-secondary"
                onClick={() =>
                  write.mutate({
                    type: "coaching",
                    body: {
                      employeeId: teamMember.id,
                      sourceType: "telesales_call",
                      sourceId: exception.sourceId,
                      topic: "وضوح النتيجة والمتابعة",
                      evidence: "دليل تدريب المشرف",
                      agreedAction: "تأكيد النتيجة قبل إنهاء المكالمة",
                      dueAt: new Date(Date.now() + 86_400_000).toISOString(),
                      createFollowUp: true,
                    },
                  })
                }
              >
                تسجيل تدريب ومتابعة
              </button>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
