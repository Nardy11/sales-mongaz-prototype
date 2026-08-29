import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyboardInput } from "../../mobile";
import { accountProfile, type AccountProfile, updateAccountProfile, type SessionIdentity } from "../../lib/api";
import { StatePanel } from "../../design-system/foundation";
import "./profile.css";

const roles: Record<string, string> = {
  sales_representative: "مندوب مبيعات",
  telesales_employee: "موظف مبيعات هاتفية",
  telesales_supervisor: "مشرف مبيعات هاتفية",
  sales_manager: "مدير مبيعات",
};
const age = (dateOfBirth: string | null) => {
  if (!dateOfBirth) return "غير مسجل";
  const birth = new Date(`${dateOfBirth}T00:00:00Z`), today = new Date();
  let years = today.getUTCFullYear() - birth.getUTCFullYear();
  if (today.getUTCMonth() < birth.getUTCMonth() || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())) years--;
  return `${years} سنة`;
};
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("") || "م";

export function ProfilePanel({ session, onClose, onLogout }: { session: SessionIdentity; onClose: () => void; onLogout: () => Promise<void> }) {
  const client = useQueryClient();
  const file = useRef<HTMLInputElement>(null);
  const profileKey = ["account-profile", session.employee.id] as const;
  const profile = useQuery({ queryKey: profileKey, queryFn: accountProfile });
  const [name, setName] = useState("");
  const [birth, setBirth] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const save = useMutation({
    mutationFn: () => updateAccountProfile(session.csrfToken, { displayName: name.trim(), dateOfBirth: birth || null, avatarDataUrl: avatar }),
    onSuccess: (next) => { client.setQueryData(profileKey, next); },
  });
  const current = profile.data;
  useEffect(() => {
    if (current && !loaded) { setLoaded(true); setName(current.displayName); setBirth(current.dateOfBirth); setAvatar(current.avatarDataUrl); }
  }, [current, loaded]);
  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0];
    if (!image) return;
    if (!/^image\/(png|jpeg|webp)$/.test(image.type) || image.size > 300_000) { save.reset(); return; }
    const reader = new FileReader(); reader.onload = () => setAvatar(typeof reader.result === "string" ? reader.result : null); reader.readAsDataURL(image);
  };
  return <section className="account-profile" aria-label="الملف الشخصي">
    <header className="account-profile__head"><button type="button" onClick={onClose}>إغلاق</button><div><p>الحساب الشخصي</p><h1>ملفي</h1></div></header>
    {profile.isLoading && <StatePanel kind="loading" title="جارٍ تحميل الملف الشخصي" detail="يتم جلب بيانات حسابك المحفوظة." />}
    {profile.isError && <StatePanel kind="error" title="تعذر تحميل الملف الشخصي" detail="تحقق من الاتصال ثم أعد المحاولة." retry={() => profile.refetch()} />}
    {current && <>
      <div className="account-profile__identity">
        <button className="account-avatar" type="button" aria-label="تغيير الصورة الشخصية" onClick={() => file.current?.click()}>{avatar ? <img src={avatar} alt="الصورة الشخصية" /> : initials(name || current.displayName)}<span>تغيير</span></button>
        <div><strong>{name || current.displayName}</strong><small>{roles[current.role] ?? current.role}</small><small>{current.email}</small></div>
        <input ref={file} className="account-profile__file" type="file" accept="image/png,image/jpeg,image/webp" onChange={selectPhoto} />
      </div>
      <div className="account-profile__facts"><span>الحالة <b>{current.active ? "نشط" : "غير نشط"}</b></span><span>العمر <b>{age(birth)}</b></span><span>معرّف الحساب <b>{current.id.slice(0, 8)}</b></span></div>
      <form className="account-profile__form" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
        <label>الاسم المعروض<KeyboardInput value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>تاريخ الميلاد<KeyboardInput type="date" value={birth ?? ""} onChange={(event) => setBirth(event.target.value || null)} /></label>
        {save.isError && <StatePanel kind="error" title="تعذر حفظ الملف الشخصي" detail={save.error instanceof Error ? save.error.message : "حاول مرة أخرى."} />}
        {save.isSuccess && <StatePanel kind="loading" title="تم حفظ البيانات" detail="تم تحديث ملفك الشخصي المحفوظ." />}
        <button className="production-primary" disabled={save.isPending || name.trim().length < 2}>{save.isPending ? "جارٍ الحفظ…" : "حفظ التغييرات"}</button>
      </form>
      <button className="account-profile__logout" type="button" onClick={() => void onLogout()}>تسجيل الخروج</button>
    </>}
  </section>;
}
