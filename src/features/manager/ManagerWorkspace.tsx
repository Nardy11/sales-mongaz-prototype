import { useRef, useState } from "react";
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
  createManagerPriority,
  decideManagerPriority,
  managerReport,
  managerWorkspace,
  type ManagerWorkspace,
  type SessionIdentity,
} from "../../lib/api";
import {
  ActivityCalendar,
  type ActivityEvidence,
} from "../../design-system/ActivityCalendar";

const labels: Record<string, string> = {
  open: "مفتوحة",
  actioned: "قرار مسجل — العمل مستمر",
  resolved: "مكتملة",
  decision: "قرار إداري",
  resolve: "حل فعلي",
};
const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("ar-EG", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

export function ManagerWorkspace({
  session,
  activeTab,
}: {
  session: SessionIdentity;
  activeTab: "review" | "priorities" | "reports";
}) {
  const client = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [checkpoint, setCheckpoint] = useState<"morning" | "midday" | "eod">(
    "morning",
  );
  const [evidence, setEvidence] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const priorityKeys = useRef(new Map<string, string>());
  const query = useQuery({ queryKey: ["manager"], queryFn: managerWorkspace });
  const [reportOffset, setReportOffset] = useState(0);
  const reportPeriod = (() => {
    const now = new Date();
    const end = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1 + reportOffset,
      ),
    );
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 1);
    return { start: start.toISOString(), end: end.toISOString() };
  })();
  const report = useQuery({
    queryKey: ["manager", "report", reportPeriod.start, reportPeriod.end],
    queryFn: () => managerReport(reportPeriod.start, reportPeriod.end),
    enabled: activeTab === "reports",
  });
  const mutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      decideManagerPriority(id, session.csrfToken, body),
    onSuccess: () => {
      setEvidence("");
      setNotice("تم حفظ القرار وتحديث الأدلة؛ العمل لا يُغلق تلقائياً.");
      client.invalidateQueries({ queryKey: ["manager"] });
    },
    onError: (error) =>
      setNotice(error instanceof Error ? error.message : "تعذر حفظ القرار."),
  });
  const createPriority = useMutation({
    mutationFn: (item: ManagerWorkspace["exceptions"][number]) => {
      const idempotencyKey =
        priorityKeys.current.get(item.id) ?? crypto.randomUUID();
      priorityKeys.current.set(item.id, idempotencyKey);
      return createManagerPriority(session.csrfToken, {
        customerId: item.customerId,
        sourceType: "supervisor_exception",
        sourceId: item.id,
        title: item.summary,
        reason: item.requiredNextAction,
        successCondition: "اكتمال العمل التشغيلي الناتج مع دليل محفوظ",
        evidence: item.evidence,
        dueAt: new Date(Date.now() + 86_400_000).toISOString(),
        urgency: item.severity === "urgent" ? "urgent" : "caution",
        idempotencyKey,
      });
    },
    onSuccess: () => {
      setNotice("تم تسجيل الأولوية من الدليل التشغيلي وتحديث مساحة الإدارة.");
      client.invalidateQueries({ queryKey: ["manager"] });
    },
    onError: (error) =>
      setNotice(
        error instanceof Error ? error.message : "تعذر تسجيل الأولوية.",
      ),
  });
  if (query.isLoading)
    return (
      <StatePanel
        kind="loading"
        title="جارٍ تحميل مراجعة الإدارة"
        detail="يتم جلب الأولويات والأدلة التشغيلية."
      />
    );
  if (query.isError)
    return (
      <StatePanel
        kind="error"
        title="تعذر تحميل مراجعة الإدارة"
        detail="أعد المحاولة للوصول إلى الأولويات."
        retry={() => query.refetch()}
      />
    );
  const workspace = query.data!;
  const priority =
    workspace.priorities.find((item) => item.id === selected) ??
    workspace.priorities[0];
  const openPriorities = workspace.priorities.filter(
    (item) => item.operationallyOpen,
  ).length;
  const urgentPriorities = workspace.priorities.filter(
    (item) => item.operationallyOpen && item.urgency === "urgent",
  ).length;
  const decisionsRecorded = workspace.priorities.filter(
    (item) => item.decisionAt && item.decisionEvidence,
  ).length;
  const openDecisions = workspace.priorities.filter(
    (item) => item.operationallyOpen && item.decisionAt,
  ).length;
  const linkedFollowUps = workspace.priorities.filter(
    (item) => item.operationallyOpen && item.resultingCommitment,
  ).length;
  const checkpointCopy = {
    morning: {
      question: "هل نحن جاهزون للأولويات الصحيحة؟",
      rows: [
        ["أولويات اليوم", "أولوية تشغيلية مفتوحة ضمن نطاق الإدارة", openPriorities],
        ["استثناءات تحتاج قرارًا", "أدلة تشغيلية محفوظة قبل القرار", workspace.exceptions.length],
        ["قضايا عاجلة", "تحتاج قرارًا مبكرًا ولا تُغلق تلقائيًا", urgentPriorities],
      ],
    },
    midday: {
      question: "أين انحرف التنفيذ عن خطة اليوم؟",
      rows: [
        ["عمل تشغيلي ما زال مفتوحًا", "يشمل ما تم اتخاذ قرار بشأنه دون اكتمال التنفيذ", openPriorities],
        ["استثناءات تحت المتابعة", "بحسب الأدلة المرفوعة من الإشراف", workspace.exceptions.length],
        ["قرارات مسجلة والعمل مستمر", "القرار لا يساوي الحل أو الإغلاق", openDecisions],
      ],
    },
    eod: {
      question: "ما الذي سيظل مفتوحًا دون متابعة واضحة؟",
      rows: [
        ["أولويات لم تُغلق فعليًا", "تُرحّل بمسؤول ودليل متابعة", openPriorities],
        ["قرارات مسجلة اليوم", "قرارات موثقة على الأدلة التشغيلية", decisionsRecorded],
        ["متابعات ناتجة مرتبطة", "التزامات محفوظة للعمل التالي", linkedFollowUps],
      ],
    },
  } as const;
  const activeCheckpoint = checkpointCopy[checkpoint];
  const activityEvidence: ActivityEvidence[] = [
    ...workspace.priorities.map((item) => ({
      id: `priority-${item.id}`,
      at: item.createdAt,
      title: `أولوية إدارية — ${item.title}`,
      detail: `${item.evidence} · ${item.ownerName ?? "مسؤول مسجل"}`,
      attention: item.operationallyOpen
        ? item.urgency === "urgent"
          ? ("urgent" as const)
          : ("caution" as const)
        : ("success" as const),
    })),
    ...workspace.priorities
      .filter((item) => item.decisionAt && item.decisionEvidence)
      .map((item) => ({
        id: `decision-${item.id}`,
        at: item.decisionAt,
        title: `قرار إداري — ${item.title}`,
        detail: `${item.decisionEvidence} · ${item.decisionActorName ?? "مسؤول مسجل"}`,
        attention: item.operationallyOpen
          ? ("caution" as const)
          : ("success" as const),
      })),
    ...workspace.exceptions.map((item) => ({
      id: `exception-${item.id}`,
      at: item.createdAt,
      title: `استثناء تشغيلي — ${item.summary}`,
      detail: `${item.evidence} · ${item.requiredNextAction}`,
      attention:
        item.severity === "urgent" ? ("urgent" as const) : ("caution" as const),
    })),
  ];
  const prioritySourceIds = new Set(
    workspace.priorities
      .filter((item) => item.sourceType === "supervisor_exception")
      .map((item) => item.sourceId),
  );
  const save = (kind: "decision" | "resolve") => {
    if (!priority || evidence.trim().length < 2) {
      setNotice("يلزم تسجيل دليل القرار.");
      return;
    }
    const body: Record<string, unknown> = {
      kind,
      evidence,
      version: priority.version,
    };
    if (kind === "decision")
      Object.assign(body, {
        followUpAt: new Date(Date.now() + 86400000).toISOString(),
        followUpTitle: priority.title,
        idempotencyKey: crypto.randomUUID(),
      });
    mutation.mutate({ id: priority.id, body });
  };
  return (
    <section className="supervisor-workspace" aria-label="مساحة مدير المبيعات">
      {activeTab !== "reports" && (
        <NextActionHero
          eyebrow="مراجعة الإدارة"
          title={
            workspace.priorities.find((item) => item.operationallyOpen)
              ?.title ?? "لا توجد أولويات مفتوحة"
          }
          detail="الدليل وشرط النجاح قبل القرار؛ القرار لا يعني إغلاق التنفيذ."
        />
      )}
      {notice && (
        <StatePanel kind="loading" title="حالة القرار" detail={notice} />
      )}
      {activeTab === "reports" && (
        <ActivityCalendar
          title="تقويم النشاط الإداري"
          evidence={activityEvidence}
        />
      )}
      <section
        id="manager-review"
        className="artifact5-manager-dashboard"
        hidden={activeTab !== "review"}
      >
        <div className="artifact5-checkpoints" aria-label="نقاط المتابعة">
          {([
            ["morning", "الصباح"],
            ["midday", "منتصف اليوم"],
            ["eod", "نهاية اليوم"],
          ] as const).map(([id, label]) => (
            <button
              type="button"
              key={id}
              className={checkpoint === id ? "active" : ""}
              aria-pressed={checkpoint === id}
              onClick={() => setCheckpoint(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <h2>{activeCheckpoint.question}</h2>
        {activeCheckpoint.rows.map(([label, detail, value]) => (
          <LedgerRow
            key={label}
            label={label}
            detail={detail}
            status={<strong>{value}</strong>}
          />
        ))}
        <p>
          الأرقام مشتقة من الأدلة التشغيلية المحفوظة وليست مؤشرات أداء معتمدة.
        </p>
      </section>
      <section hidden={activeTab !== "review"}>
        <h2>استثناءات تحتاج قراراً</h2>
        {workspace.exceptions.length ? (
          workspace.exceptions.map((item) => (
            <div className="manager-exception-row" key={item.id}>
              <LedgerRow
                label={item.summary}
                detail={
                  item.evidence + " · " + (item.ownerName ?? "مسؤول مسجل")
                }
                status={
                  <StatusLabel
                    attention={
                      item.severity === "urgent" ? "urgent" : "caution"
                    }
                  >
                    {item.requiredNextAction}
                  </StatusLabel>
                }
              />
              <button
                className="production-secondary"
                disabled={
                  prioritySourceIds.has(item.id) || createPriority.isPending
                }
                onClick={() => createPriority.mutate(item)}
              >
                {prioritySourceIds.has(item.id)
                  ? "مسجلة كأولوية"
                  : "تسجيل كأولوية"}
              </button>
            </div>
          ))
        ) : (
          <StatePanel
            kind="empty"
            title="لا توجد استثناءات"
            detail="لا يوجد عمل تشغيلي يحتاج قراراً الآن."
          />
        )}
      </section>
      <section id="manager-priorities" hidden={activeTab === "reports"}>
        <h2>أولويات الإدارة</h2>
        {workspace.priorities.length ? (
          workspace.priorities.map((item) => (
            <button
              className="supervisor-exception"
              key={item.id}
              onClick={() => setSelected(item.id)}
            >
              <StatusLabel
                attention={
                  item.operationallyOpen
                    ? item.urgency === "urgent"
                      ? "urgent"
                      : "caution"
                    : "success"
                }
              >
                {labels[item.status]}
              </StatusLabel>
              <strong>{item.title}</strong>
              <span>
                {(item.ownerName ?? "مسؤول مسجل") + " · " + date(item.dueAt)}
              </span>
            </button>
          ))
        ) : (
          <StatePanel
            kind="empty"
            title="لا توجد أولويات"
            detail="لا توجد أولوية إدارية محفوظة ضمن نطاقك."
          />
        )}
      </section>
      {priority && (
        <section className="supervisor-detail" hidden={activeTab === "reports"}>
          <h2>الدليل وشرط النجاح</h2>
          <LedgerRow label="سبب الأولوية" detail={priority.reason} />
          <LedgerRow label="شرط النجاح" detail={priority.successCondition} />
          <LedgerRow
            label="الدليل المحفوظ"
            detail={priority.evidence}
            status={
              <StatusLabel
                attention={priority.operationallyOpen ? "caution" : "success"}
              >
                {priority.operationallyOpen ? "مفتوح تشغيلياً" : "مكتمل فعلياً"}
              </StatusLabel>
            }
          />
          {priority.decisionEvidence && (
            <>
              <LedgerRow
                label={
                  "قرار الإدارة: " +
                  (labels[priority.decisionKind ?? ""] ?? priority.decisionKind)
                }
                detail={
                  priority.decisionEvidence +
                  " · " +
                  (priority.decisionActorName ?? "مسؤول مسجل")
                }
              />
              {priority.followUpAt && (
                <LedgerRow
                  label="موعد المتابعة الناتجة"
                  detail={date(priority.followUpAt)}
                />
              )}
              {priority.resultingCommitment && (
                <CommitmentRail>
                  <CommitmentRailItem
                    state="caution"
                    time={date(priority.followUpAt)}
                    title="التزام متابعة ناتج محفوظ"
                    meta={
                      "معرّف الالتزام: " +
                      priority.resultingCommitment.id +
                      " · القرار لا يغلق العمل"
                    }
                  />
                </CommitmentRail>
              )}
            </>
          )}
          {priority.operationallyOpen && (
            <>
              <label>
                دليل قرار المدير
                <KeyboardTextarea
                  value={evidence}
                  onChange={(event) => setEvidence(event.target.value)}
                />
              </label>
              <div className="supervisor-actions">
                <button
                  className="production-secondary"
                  onClick={() => save("decision")}
                >
                  تسجيل قرار ومتابعة
                </button>
                <button
                  className="production-primary"
                  onClick={() => save("resolve")}
                >
                  تسجيل حل فعلي
                </button>
              </div>
            </>
          )}
        </section>
      )}
      {activeTab === "reports" && (
        <section
          id="manager-reports"
          aria-label="التقارير التشغيلية"
          className="manager-reporting"
        >
          <h2>التقارير التشغيلية</h2>
          <p>TEST_DEMO — تعريفات وتهيئة توضيحية وليست مؤشرات أعمال معتمدة.</p>
          <div className="supervisor-actions">
            <button
              className="production-secondary"
              onClick={() => setReportOffset((value) => value - 1)}
            >
              الفترة السابقة
            </button>
            <button
              className="production-secondary"
              onClick={() => setReportOffset((value) => value + 1)}
            >
              الفترة التالية
            </button>
          </div>
          <p>
            الفترة المطلوبة: {date(reportPeriod.start)} —{" "}
            {date(reportPeriod.end)} · UTC [start, end)
          </p>
          {report.isLoading ? (
            <StatePanel
              kind="loading"
              title="جارٍ تحميل التقرير"
              detail="يتم جلب الأدلة والقيم الفعلية من السجل التشغيلي."
            />
          ) : report.isError ? (
            <StatePanel
              kind="error"
              title="تعذر تحميل التقرير"
              detail="أعد المحاولة لجلب التقرير من الخادم."
              retry={() => report.refetch()}
            />
          ) : report.data!.metrics.length === 0 ? (
            <StatePanel
              kind="empty"
              title="لا توجد تعريفات تقرير ضمن نطاقك"
              detail="لا توجد بيانات تقرير متاحة للفترة المطلوبة."
            />
          ) : (
            report.data!.metrics.map((metric) => (
              <div className="manager-reporting-metric" key={metric.metricKey}>
                <LedgerRow
                  label={metric.displayName}
                  detail={`القيمة الفعلية من الأدلة المحفوظة: ${metric.value} · ${metric.evidenceIds.length ? `معرّفات الأدلة: ${metric.evidenceIds.join("، ")}` : "لا توجد أدلة في الفترة المطلوبة"}`}
                  status={
                    <StatusLabel attention="caution">TEST_DEMO</StatusLabel>
                  }
                />
                {metric.target ? (
                  <p>
                    تهيئة هدف TEST_DEMO: {metric.target.value}{" "}
                    {metric.target.unit} · الإصدار {metric.target.version} ·{" "}
                    {date(metric.target.periodStart)} —{" "}
                    {date(metric.target.periodEnd)}
                  </p>
                ) : (
                  <p>لا يوجد هدف TEST_DEMO محفوظ لهذه الفترة.</p>
                )}
              </div>
            ))
          )}
        </section>
      )}
    </section>
  );
}
