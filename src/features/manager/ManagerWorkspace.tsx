import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyboardTextarea } from "../../mobile";
import { CommitmentRail, CommitmentRailItem, LedgerRow, NextActionHero, StatePanel, StatusLabel } from "../../design-system/foundation";
import { decideManagerPriority, managerWorkspace, type SessionIdentity } from "../../lib/api";

const labels: Record<string, string> = { open: "مفتوحة", actioned: "قرار مسجل — العمل مستمر", resolved: "مكتملة", decision: "قرار إداري", resolve: "حل فعلي" };
const date = (value?: string) => value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";

export function ManagerWorkspace({ session }: { session: SessionIdentity }) {
  const client = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [evidence, setEvidence] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["manager"], queryFn: managerWorkspace });
  const mutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => decideManagerPriority(id, session.csrfToken, body),
    onSuccess: () => { setEvidence(""); setNotice("تم حفظ القرار وتحديث الأدلة؛ العمل لا يُغلق تلقائياً."); client.invalidateQueries({ queryKey: ["manager"] }); },
    onError: error => setNotice(error instanceof Error ? error.message : "تعذر حفظ القرار."),
  });
  if (query.isLoading) return <StatePanel kind="loading" title="جارٍ تحميل مراجعة الإدارة" detail="يتم جلب الأولويات والأدلة التشغيلية." />;
  if (query.isError) return <StatePanel kind="error" title="تعذر تحميل مراجعة الإدارة" detail="أعد المحاولة للوصول إلى الأولويات." retry={() => query.refetch()} />;
  const workspace = query.data!;
  const priority = workspace.priorities.find(item => item.id === selected) ?? workspace.priorities[0];
  const save = (kind: "decision" | "resolve") => {
    if (!priority || evidence.trim().length < 2) { setNotice("يلزم تسجيل دليل القرار."); return; }
    const body: Record<string, unknown> = { kind, evidence, version: priority.version };
    if (kind === "decision") Object.assign(body, { followUpAt: new Date(Date.now() + 86400000).toISOString(), followUpTitle: priority.title, idempotencyKey: crypto.randomUUID() });
    mutation.mutate({ id: priority.id, body });
  };
  return <section className="supervisor-workspace" aria-label="مساحة مدير المبيعات">
    <NextActionHero eyebrow="مراجعة الإدارة" title={workspace.priorities.find(item => item.operationallyOpen)?.title ?? "لا توجد أولويات مفتوحة"} detail="الدليل وشرط النجاح قبل القرار؛ القرار لا يعني إغلاق التنفيذ." />
    {notice && <StatePanel kind="loading" title="حالة القرار" detail={notice} />}
    <section><h2>استثناءات تحتاج قراراً</h2>{workspace.exceptions.length ? workspace.exceptions.map(item => <LedgerRow key={item.id} label={item.summary} detail={item.evidence + " · " + (item.ownerName ?? "مسؤول مسجل")} status={<StatusLabel attention={item.severity === "urgent" ? "urgent" : "caution"}>{item.requiredNextAction}</StatusLabel>} />) : <StatePanel kind="empty" title="لا توجد استثناءات" detail="لا يوجد عمل تشغيلي يحتاج قراراً الآن." />}</section>
    <section><h2>أولويات الإدارة</h2>{workspace.priorities.length ? workspace.priorities.map(item => <button className="supervisor-exception" key={item.id} onClick={() => setSelected(item.id)}><StatusLabel attention={item.operationallyOpen ? (item.urgency === "urgent" ? "urgent" : "caution") : "success"}>{labels[item.status]}</StatusLabel><strong>{item.title}</strong><span>{(item.ownerName ?? "مسؤول مسجل") + " · " + date(item.dueAt)}</span></button>) : <StatePanel kind="empty" title="لا توجد أولويات" detail="لا توجد أولوية إدارية محفوظة ضمن نطاقك." />}</section>
    {priority && <section className="supervisor-detail"><h2>الدليل وشرط النجاح</h2><LedgerRow label="سبب الأولوية" detail={priority.reason} /><LedgerRow label="شرط النجاح" detail={priority.successCondition} /><LedgerRow label="الدليل المحفوظ" detail={priority.evidence} status={<StatusLabel attention={priority.operationallyOpen ? "caution" : "success"}>{priority.operationallyOpen ? "مفتوح تشغيلياً" : "مكتمل فعلياً"}</StatusLabel>} />
      {priority.decisionEvidence && <><LedgerRow label={"قرار الإدارة: " + (labels[priority.decisionKind ?? ""] ?? priority.decisionKind)} detail={priority.decisionEvidence + " · " + (priority.decisionActorName ?? "مسؤول مسجل")} />{priority.followUpAt && <LedgerRow label="موعد المتابعة الناتجة" detail={date(priority.followUpAt)} />}{priority.resultingCommitment && <CommitmentRail><CommitmentRailItem state="caution" time={date(priority.followUpAt)} title="التزام متابعة ناتج محفوظ" meta={"معرّف الالتزام: " + priority.resultingCommitment.id + " · القرار لا يغلق العمل"} /></CommitmentRail>}</>}
      {priority.operationallyOpen && <><label>دليل قرار المدير<KeyboardTextarea value={evidence} onChange={event => setEvidence(event.target.value)} /></label><div className="supervisor-actions"><button className="production-secondary" onClick={() => save("decision")}>تسجيل قرار ومتابعة</button><button className="production-primary" onClick={() => save("resolve")}>تسجيل حل فعلي</button></div></>}
    </section>}
  </section>;
}
