import { useMemo, useState } from "react";
import { LedgerRow, StatePanel, StatusLabel } from "./foundation";
import "./activity-calendar.css";

export type ActivityEvidence = {
  id: string;
  at?: string | null;
  title: string;
  detail: string;
  attention?: "normal" | "caution" | "urgent" | "success";
};

const utcKey = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
};

export function ActivityCalendar({ title, evidence }: { title: string; evidence: ActivityEvidence[] }) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const todayKey = utcKey(now);
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const monthLabel = new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1)));
  const byDay = useMemo(() => {
    const result = new Map<string, ActivityEvidence[]>();
    evidence.forEach((item) => {
      if (!item.at) return;
      const key = utcKey(item.at);
      if (!key.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) return;
      result.set(key, [...(result.get(key) ?? []), item]);
    });
    return result;
  }, [evidence, month, year]);
  const selected = byDay.get(selectedKey) ?? [];
  const activeDays = byDay.size;
  const monthEvidenceCount = [...byDay.values()].reduce((total, items) => total + items.length, 0);
  return <section className="activity-calendar" aria-label={title}>
    <header className="activity-calendar__title"><div><h2>{title}</h2><p>{monthLabel}</p></div><StatusLabel>{monthEvidenceCount} أدلة</StatusLabel></header>
    <div className="activity-calendar__panel">
      <strong>كثافة الأدلة المحفوظة خلال أيام العمل</strong>
      <div className="activity-calendar__weekdays" aria-hidden="true">{["ح", "ن", "ث", "ر", "خ", "ج", "س"].map(day => <span key={day}>{day}</span>)}</div>
      <div className="activity-calendar__grid">
        {Array.from({ length: firstWeekday }, (_, index) => <span className="activity-calendar__blank" key={`blank-${index}`} />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = byDay.get(key)?.length ?? 0;
          const level = Math.min(count, 4);
          return <button type="button" key={key} className={`activity-calendar__day activity-calendar__day--${level} ${selectedKey === key ? "selected" : ""}`} aria-label={`${day} ${monthLabel} — ${count} أدلة محفوظة`} aria-pressed={selectedKey === key} onClick={() => setSelectedKey(key)}><span>{day}</span></button>;
        })}
      </div>
      <div className="activity-calendar__legend"><span>أقل نشاط</span><div>{[0, 1, 2, 3, 4].map(level => <i key={level} className={`activity-calendar__swatch activity-calendar__day--${level}`} />)}</div><span>أعلى نشاط</span></div>
      <p className="activity-calendar__hint">اضغط على أي يوم لمراجعة الأدلة المسجلة</p>
    </div>
    <div className="activity-calendar__key"><strong>مفتاح الألوان</strong><span>لا دليل · دليل واحد · دليلان · 3 أدلة · 4 أدلة فأكثر</span></div>
    <section className="activity-calendar__details">
      <h2>تفاصيل اليوم المحدد</h2>
      {selected.length ? selected.map(item => <LedgerRow key={item.id} label={item.title} detail={item.detail} status={<StatusLabel attention={item.attention ?? "normal"}>دليل محفوظ</StatusLabel>} />) : <StatePanel kind="empty" title="لا يوجد نشاط محفوظ في هذا اليوم" detail="اختر يوماً ملوّناً لمراجعة الأدلة المسجلة." />}
    </section>
    <section className="activity-calendar__summary"><div><strong>{activeDays} أيام بها نشاط محفوظ</strong><span>{monthEvidenceCount} أدلة تشغيلية ضمن البيانات المتاحة</span></div><StatusLabel>{monthLabel}</StatusLabel></section>
  </section>;
}
