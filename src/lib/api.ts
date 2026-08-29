export type SessionIdentity = {
  employee: { id: string; displayName: string; role: string };
  csrfToken: string;
};
const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? "http://127.0.0.1:8787";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { headers, body, ...rest } = init ?? {};
  const requestHeaders = new Headers(headers);
  if (body !== undefined && !requestHeaders.has("content-type"))
    requestHeaders.set("content-type", "application/json");
  const response = await fetch(`${apiOrigin}${path}`, {
    credentials: "include",
    ...rest,
    body,
    headers: requestHeaders,
  });
  if (!response.ok)
    throw new Error(
      (await response.json().catch(() => null))?.message ?? "تعذر إتمام الطلب.",
    );
  return response.status === 204
    ? (undefined as T)
    : (response.json() as Promise<T>);
}
export const login = (email: string, password: string) =>
  request<SessionIdentity>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
export const getSession = () => request<SessionIdentity>("/api/auth/me");
export const logout = (csrfToken: string) =>
  request<void>("/api/auth/logout", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
  });
export type WorkspaceNotification = {
  id: string;
  title: string;
  detail: string;
  attention: "normal" | "caution" | "urgent";
  at?: string | null;
  sourceType: string;
  sourceId: string;
  customerId?: string | null;
};
export const workspaceNotifications = () =>
  request<WorkspaceNotification[]>("/api/notifications");
export type AccountProfile = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  active: boolean;
  dateOfBirth: string | null;
  avatarDataUrl: string | null;
};
export const accountProfile = () => request<AccountProfile>("/api/profile");
export const updateAccountProfile = (
  csrfToken: string,
  input: Pick<AccountProfile, "displayName" | "dateOfBirth" | "avatarDataUrl">,
) =>
  request<AccountProfile>("/api/profile", {
    method: "PATCH",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify(input),
  });
export type CustomerRow = {
  id: string;
  name: string;
  customerCode: string | null;
  classification: string;
  operationalStatus: string;
  isActive: boolean;
  openCommitments: number;
};
export type Commitment = {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  urgency: string;
  completionEvidence?: string;
  resultingCommitmentId?: string;
  attention: string;
};
export type LifecycleSummary = {
  id: string;
  status: string;
  blockedReason?: string | null;
  responsibleParty?: string | null;
  followUpAt?: string | null;
  closedAt?: string | null;
  resolvedAt?: string | null;
  updatedAt?: string | null;
  classification?: string;
};
export type CustomerFile = {
  customer: CustomerRow & {
    contactName?: string;
    phone?: string;
    city?: string;
    operationalNotes?: string;
  };
  commitments: Commitment[];
  orders: LifecycleSummary[];
  complaints: LifecycleSummary[];
  collections: Array<{id:string;outcome:string;amountCollected:string;promiseAmount?:string|null;promiseDueAt?:string|null;evidence:string;commitmentId?:string|null;createdAt:string}>;
  opportunities: Array<{id:string;kind:string;productReference?:string|null;note:string;status:string;commitmentId?:string|null;createdAt:string}>;
  observations: Array<{id:string;competitor?:string|null;productReference?:string|null;competitorPrice?:string|null;offer?:string|null;observationType:string;note:string;observedAt:string}>;
};
export const customers = () => request<CustomerRow[]>("/api/customers");
export const createCustomer = (
  csrfToken: string,
  input: Record<string, unknown>,
) =>
  request<{ id: string; name: string }>("/api/customers", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify(input),
  });
export const searchCustomers = (query: string) =>
  request<CustomerRow[]>(`/api/customers?q=${encodeURIComponent(query)}`);
export const customerFile = (id: string) =>
  request<CustomerFile>(`/api/customers/${id}`);
export const updateCustomer = (
  id: string,
  csrfToken: string,
  input: Record<string, unknown>,
) =>
  request<{ id: string }>(`/api/customers/${id}`, {
    method: "PATCH",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify(input),
  });
export type RepDay = {
  visits: Array<{
    id: string;
    customerId: string;
    customerName: string;
    plannedAt: string;
    purpose: string;
    status: string;
    outcome?: string;
    classification: string;
    operationalStatus: string;
    isActive: boolean;
    contactName?: string | null;
    phone?: string | null;
    city?: string | null;
    operationalNotes?: string | null;
    openComplaints: number;
    openOrders: number;
    openCommitments: number;
  }>;
  commitments: Array<{
    id: string;
    title: string;
    dueAt: string;
    status: string;
    urgency: string;
  }>;
  close: Record<string, number>;
};
export const representativeDay = () =>
  request<RepDay>("/api/representative/day");
export type RepresentativeActivity = {
  id: string;
  kind:
    | "visit"
    | "order"
    | "collection"
    | "complaint"
    | "opportunity"
    | "observation"
    | "commitment";
  sourceId: string;
  at: string;
  title: string;
  detail: string;
  attention: "normal" | "caution" | "urgent" | "success";
};
export const representativeActivity = () =>
  request<RepresentativeActivity[]>("/api/representative/activity");
export const representativeProducts = () =>
  request<Array<{ id: string; name: string; referenceCode: string }>>(
    "/api/products",
  );
export const startVisit = (id: string, csrfToken: string) =>
  request(`/api/visits/${id}/start`, {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
  });
export const completeVisit = (
  id: string,
  csrfToken: string,
  input: {
    outcome: string;
    evidence: string;
    followUpTitle?: string;
    followUpDueAt?: string;
  },
) =>
  request(`/api/visits/${id}/complete`, {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify(input),
  });
export const captureOperational = (
  type: "opportunity" | "collection" | "complaint" | "observation",
  csrfToken: string,
  input: Record<string, unknown>,
) =>
  request(`/api/${type === "opportunity" ? "opportunities" : `${type}s`}`, {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify(input),
  });
export const createOrder = (
  csrfToken: string,
  input: Record<string, unknown>,
) =>
  request("/api/orders", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify(input),
  });
export const initiateReactivation = (
  id: string,
  csrfToken: string,
  input: Record<string, unknown>,
) =>
  request(`/api/customers/${id}/reactivation`, {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify(input),
  });
export type LifecycleDetail = {
  order?: any;
  complaint?: any;
  history: Array<any>;
  resultingWork: Array<any>;
};
export const orderLifecycle = (id: string) =>
  request<LifecycleDetail>(`/api/orders/${id}/lifecycle`);
export const complaintLifecycle = (id: string) =>
  request<LifecycleDetail>(`/api/complaints/${id}/lifecycle`);
export const transitionOrder = (
  id: string,
  csrf: string,
  input: Record<string, unknown>,
) =>
  request<LifecycleDetail>(`/api/orders/${id}/lifecycle`, {
    method: "POST",
    headers: { "x-csrf-token": csrf },
    body: JSON.stringify(input),
  });
export const transitionComplaint = (
  id: string,
  csrf: string,
  input: Record<string, unknown>,
) =>
  request<any>(`/api/complaints/${id}/lifecycle`, {
    method: "POST",
    headers: { "x-csrf-token": csrf },
    body: JSON.stringify(input),
  });
export type TelesalesCall = {
  id: string;
  customerId: string;
  customerName: string;
  purpose: string;
  priorityReason: string;
  scheduledAt: string;
  state: string;
  todayNoAnswers?: number;
};
export type TelesalesDetail = {
  call: TelesalesCall & {
    classification?: string;
    operationalStatus?: string;
    isActive?: boolean;
    contactName?: string;
    phone?: string;
    city?: string;
    operationalNotes?: string;
    openComplaints?: number;
    openOrders?: number;
  };
  attempts: Array<{
    outcome: string;
    result: string;
    evidence: string;
    attemptedAt: string;
  }>;
  commitments: Array<{
    id: string;
    title: string;
    dueAt: string;
    status: string;
    evidence?: string;
  }>;
  allowedOutcomes: string[];
};
export const telesalesQueue = () =>
  request<TelesalesCall[]>("/api/telesales/queue");
export const telesalesDetail = (id: string) =>
  request<TelesalesDetail>(`/api/telesales/calls/${id}`);
export const telesalesDay = () =>
  request<Record<string, number>>("/api/telesales/day");
export type TelesalesActivity = {
  id: string;
  outcome?: string | null;
  result?: string | null;
  evidence: string;
  at: string;
  priorityReason?: string | null;
  customerName: string;
  kind?: string;
  sourceId?: string;
  title?: string;
  detail?: string;
  attention?: "normal" | "caution" | "urgent" | "success";
};
export const telesalesActivity = () =>
  request<TelesalesActivity[]>("/api/telesales/activity");
export const startTelesalesCall = (id: string, csrfToken: string) =>
  request(`/api/telesales/calls/${id}/start`, {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
  });
export const completeTelesalesCall = (
  id: string,
  csrfToken: string,
  input: { outcome: string; evidence: string; callbackAt?: string },
) =>
  request<{ id: string; result: string; nextCallId?: string }>(
    `/api/telesales/calls/${id}/complete`,
    {
      method: "POST",
      headers: { "x-csrf-token": csrfToken },
      body: JSON.stringify(input),
    },
  );
export const telesalesProducts = () =>
  request<Array<{ id: string; name: string; referenceCode: string }>>(
    "/api/telesales/products",
  );
export const telesalesCapture = (
  callId: string,
  kind: "order" | "collection" | "complaint" | "opportunity" | "reactivation",
  csrfToken: string,
  input: Record<string, unknown>,
) =>
  request<any>(`/api/telesales/calls/${callId}/${kind}`, {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify(input),
  });
export type SupervisorWorkspace = {
  team: Array<{
    id: string;
    displayName: string;
    queuedCalls: number;
    completedCalls: number;
  }>;
  exceptions: Array<{
    id: string;
    kind: string;
    severity: string;
    summary: string;
    evidence: string;
    requiredNextAction: string;
    status: string;
    version: number;
    sourceType: string;
    sourceId: string;
    createdAt?: string;
    employeeName?: string;
    customerName?: string;
    priorAction?: string;
    priorActionEvidence?: string;
    actionActorName?: string;
    followUpAt?: string;
    resultingCommitment?: { id: string };
    operationallyOpen: boolean;
  }>;
  checkpoints: Array<{
    checkpoint: string;
    evidence: string;
    readinessState: string;
    at: string;
  }>;
  quality: Array<{
    id: string;
    employeeName: string;
    evidence: string;
    result: string;
    observation: string;
    at?: string;
  }>;
  coaching: Array<{
    id: string;
    employeeName: string;
    topic: string;
    evidence: string;
    agreedAction: string;
    dueAt?: string;
    at?: string;
    status: string;
  }>;
};
export const supervisorWorkspace = () =>
  request<SupervisorWorkspace>("/api/supervisor/workspace");
export const supervisorAction = (
  id: string,
  csrf: string,
  input: Record<string, unknown>,
) =>
  request<any>(`/api/supervisor/exceptions/${id}/actions`, {
    method: "POST",
    headers: { "x-csrf-token": csrf },
    body: JSON.stringify(input),
  });
export const supervisorCheckpoint = (
  csrf: string,
  input: Record<string, unknown>,
) =>
  request<any>("/api/supervisor/checkpoints", {
    method: "POST",
    headers: { "x-csrf-token": csrf },
    body: JSON.stringify(input),
  });
export const supervisorQuality = (
  csrf: string,
  input: Record<string, unknown>,
) =>
  request<any>("/api/supervisor/quality-reviews", {
    method: "POST",
    headers: { "x-csrf-token": csrf },
    body: JSON.stringify(input),
  });
export const supervisorCoaching = (
  csrf: string,
  input: Record<string, unknown>,
) =>
  request<any>("/api/supervisor/coaching", {
    method: "POST",
    headers: { "x-csrf-token": csrf },
    body: JSON.stringify(input),
  });
export type ManagerWorkspace = {
  teams: Array<{
    id: string;
    name: string;
    activeEmployees: number;
    completedVisits: number;
    completedCalls: number;
    queuedCalls: number;
    openExceptions: number;
    openCommitments: number;
  }>;
  priorities: Array<{
    id: string;
    customerId?: string;
    title: string;
    reason: string;
    successCondition: string;
    evidence: string;
    dueAt: string;
    createdAt?: string;
    updatedAt?: string;
    urgency: string;
    status: string;
    version: number;
    sourceType?: string;
    sourceId?: string;
    customerName?: string;
    ownerName?: string;
    decisionKind?: string;
    decisionEvidence?: string;
    decisionActorName?: string;
    decisionAt?: string;
    followUpAt?: string;
    resultingCommitment?: { id: string };
    operationallyOpen: boolean;
  }>;
  exceptions: Array<{
    id: string;
    customerId?: string;
    summary: string;
    evidence: string;
    severity: string;
    status: string;
    sourceType?: string;
    sourceId?: string;
    createdAt?: string;
    ownerName?: string;
    customerName?: string;
    requiredNextAction: string;
  }>;
};
export const managerWorkspace = () =>
  request<ManagerWorkspace>("/api/manager/workspace");
export const createManagerPriority = (
  csrf: string,
  input: Record<string, unknown>,
) =>
  request<any>("/api/manager/priorities", {
    method: "POST",
    headers: { "x-csrf-token": csrf },
    body: JSON.stringify(input),
  });
export const decideManagerPriority = (
  id: string,
  csrf: string,
  input: Record<string, unknown>,
) =>
  request<any>(`/api/manager/priorities/${id}/decisions`, {
    method: "POST",
    headers: { "x-csrf-token": csrf },
    body: JSON.stringify(input),
  });
export type ManagerReport = {
  definitionStatus: "TEST_DEMO";
  periodStart: string;
  periodEnd: string;
  metrics: Array<{
    metricKey: string;
    displayName: string;
    definitionStatus: "TEST_DEMO";
    value: number;
    unit: string;
    evidenceIds: string[];
    source: string;
    timeBoundary: string;
    target?: {
      id: string;
      definitionId: string;
      value: string;
      unit: string;
      periodStart: string;
      periodEnd: string;
      version: number;
      definitionStatus: "TEST_DEMO";
    } | null;
  }>;
};
export const managerReport = (start: string, end: string) =>
  request<ManagerReport>(
    `/api/manager/reports?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
  );
