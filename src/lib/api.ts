export type SessionIdentity = { employee: { id: string; displayName: string; role: string }; csrfToken: string };
const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? "http://127.0.0.1:8787";
async function request<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`${apiOrigin}${path}`, { credentials: "include", headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, ...init }); if (!response.ok) throw new Error((await response.json().catch(() => null))?.message ?? "تعذر إتمام الطلب."); return response.status === 204 ? (undefined as T) : response.json() as Promise<T>; }
export const login = (email: string, password: string) => request<SessionIdentity>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const getSession = () => request<SessionIdentity>("/api/auth/me");
export const logout = (csrfToken: string) => request<void>("/api/auth/logout", { method: "POST", headers: { "x-csrf-token": csrfToken } });
export type CustomerRow={id:string;name:string;customerCode:string|null;classification:string;operationalStatus:string;isActive:boolean;openCommitments:number};
export type Commitment={id:string;title:string;dueAt:string;status:string;urgency:string;completionEvidence?:string;resultingCommitmentId?:string;attention:string};
export type CustomerFile={customer:CustomerRow & {contactName?:string;phone?:string;city?:string;operationalNotes?:string};commitments:Commitment[]};
export const customers=()=>request<CustomerRow[]>("/api/customers"); export const customerFile=(id:string)=>request<CustomerFile>(`/api/customers/${id}`);
export type RepDay={visits:Array<{id:string;customerId:string;customerName:string;plannedAt:string;purpose:string;status:string;outcome?:string}>;commitments:Array<{id:string;title:string;dueAt:string;status:string;urgency:string}>;close:Record<string,number>};
export const representativeDay=()=>request<RepDay>("/api/representative/day");
export const startVisit=(id:string,csrfToken:string)=>request(`/api/visits/${id}/start`,{method:"POST",headers:{"x-csrf-token":csrfToken}});
export const completeVisit=(id:string,csrfToken:string,input:{outcome:string;evidence:string;followUpTitle?:string;followUpDueAt?:string})=>request(`/api/visits/${id}/complete`,{method:"POST",headers:{"x-csrf-token":csrfToken},body:JSON.stringify(input)});
export const captureOperational=(type:"opportunity"|"collection"|"complaint"|"observation",csrfToken:string,input:Record<string,unknown>)=>request(`/api/${type}s`,{method:"POST",headers:{"x-csrf-token":csrfToken},body:JSON.stringify(input)});
export const createOrder=(csrfToken:string,input:Record<string,unknown>)=>request("/api/orders",{method:"POST",headers:{"x-csrf-token":csrfToken},body:JSON.stringify(input)});
export const initiateReactivation=(id:string,csrfToken:string,input:Record<string,unknown>)=>request(`/api/customers/${id}/reactivation`,{method:"POST",headers:{"x-csrf-token":csrfToken},body:JSON.stringify(input)});
