import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, CircleAlert, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api.js";
import { useToast } from "../components/Toast.jsx";

const localDate = (date) => {
  const value = new Date(date);
  return new Date(value.getTime() + value.getTimezoneOffset() * 60000);
};
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function SubjectDetail() {
  const { id } = useParams();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [status, setStatus] = useState("Present");
  const toast = useToast();

  const load = async () => {
    const result = await api.get(`/subjects/${id}`);
    setSubject(result.subject);
  };

  useEffect(() => {
    setLoading(true);
    load().catch((error) => toast(error.message, "error")).finally(() => setLoading(false));
  }, [id]);

  const entries = subject?.attendance || [];
  const filtered = useMemo(() => entries.filter((entry) => filter === "All" || entry.status === filter), [entries, filter]);
  const days = new Map(entries.map((entry) => [dateKey(localDate(entry.date)), entry]));
  const chartData = useMemo(() => {
    const weeks = new Map();
    [...entries].reverse().forEach((entry) => {
      if (entry.status === "Cancelled") return;
      const date = localDate(entry.date);
      const start = new Date(date);
      start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      const label = `${start.getMonth() + 1}/${start.getDate()}`;
      const week = weeks.get(label) || { week: label, present: 0, absent: 0 };
      week[entry.status === "Present" ? "present" : "absent"] += 1;
      weeks.set(label, week);
    });
    return [...weeks.values()].slice(-8);
  }, [entries]);

  const saveEntry = async (event) => {
    event.preventDefault();
    if (!selectedDate) return;
    try {
      await api.post(`/subjects/${id}/attendance`, { date: selectedDate, status });
      await load();
      toast("Attendance log saved.");
    } catch (error) { toast(error.message, "error"); }
  };
  const updateEntry = async (entryId, nextStatus) => {
    try {
      await api.patch(`/attendance/${entryId}`, { status: nextStatus });
      await load();
      toast("Attendance updated.");
    } catch (error) { toast(error.message, "error"); }
  };
  const removeEntry = async (entryId) => {
    if (!window.confirm("Delete this attendance entry?")) return;
    try {
      await api.delete(`/attendance/${entryId}`);
      await load();
      toast("Attendance entry deleted.");
    } catch (error) { toast(error.message, "error"); }
  };

  if (loading) return <div className="page-loading"><span className="spinner" /> Loading subject…</div>;
  if (!subject) return <div className="page-container"><Link className="back-link" to="/dashboard"><ArrowLeft size={16} /> Back to overview</Link><div className="empty-state"><h3>Subject not found</h3><p>This subject may have been removed.</p></div></div>;

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(1 - ((firstDay.getDay() + 6) % 7));
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + index);
    return day;
  });

  return (
    <div className="page-container detail-page">
      <Link className="back-link" to="/dashboard"><ArrowLeft size={16} /> All subjects</Link>
      <header className="detail-header"><div><div className="detail-kicker"><span style={{ background: subject.color }} />{subject.code}{subject.instructor ? ` · ${subject.instructor}` : ""}</div><h1>{subject.name}</h1><p className="page-subtitle">Your attendance history and class trends.</p></div><div className="detail-rate"><strong>{subject.percentage}%</strong><span>attendance</span></div></header>
      <section className="detail-stats"><div><span>Classes attended</span><strong>{subject.attended}</strong></div><div><span>Classes missed</span><strong>{subject.missed}</strong></div><div><span>Classes held</span><strong>{subject.held}</strong></div><div className={subject.mustAttend > 0 || subject.recoveryImpossible ? "target-behind" : "target-ahead"}><span>Target · {subject.target}%</span><strong>{subject.recoveryImpossible ? "100% target unreachable" : subject.mustAttend > 0 ? `Attend ${subject.mustAttend} more` : `Safe to miss ${subject.canMiss}`}</strong></div></section>
      <div className="detail-columns">
        <section className="panel chart-panel"><div className="panel-heading"><div><h2>Attendance trend</h2><p>Weekly class activity</p></div><span className="chart-legend"><i /> Present <i className="legend-absent" /> Absent</span></div>
          {chartData.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} barGap={5} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}><CartesianGrid stroke="#eef0f4" vertical={false} /><XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#98a2b3", fontSize: 11 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#98a2b3", fontSize: 11 }} /><Tooltip cursor={{ fill: "#f7f8fa" }} contentStyle={{ border: "1px solid #e8ebf0", borderRadius: 10, fontSize: 12 }} /><Bar dataKey="present" name="Present" fill="#42b883" radius={[4, 4, 0, 0]} /><Bar dataKey="absent" name="Absent" fill="#f3a5a1" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div> : <div className="chart-empty">Add attendance to see your weekly trend.</div>}
        </section>
        <section className="panel calendar-panel"><div className="panel-heading"><div><h2>Calendar</h2><p>Choose a day to log attendance</p></div><CalendarDays size={18} className="muted-icon" /></div>
          <div className="calendar-month"><strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><div><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month"><ChevronLeft size={17} /></button><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month"><ChevronRight size={17} /></button></div></div>
          <div className="calendar-grid">{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span className="calendar-weekday" key={`${day}-${index}`}>{day}</span>)}{calendarDays.map((day) => { const key = dateKey(day); const entry = days.get(key); return <button key={key} className={`calendar-day ${day.getMonth() !== month.getMonth() ? "outside" : ""} ${selectedDate === key ? "selected" : ""} ${entry ? `day-${entry.status.toLowerCase()}` : ""}`} onClick={() => setSelectedDate(key)} aria-label={`${key}${entry ? `: ${entry.status}` : ""}`}>{day.getDate()}</button>; })}</div>
          <div className="calendar-legend"><span><i className="present-dot" /> Present</span><span><i className="absent-dot" /> Absent</span><span><i className="cancelled-dot" /> No class</span></div>
          <form className="quick-log" onSubmit={saveEntry}><div><label htmlFor="log-status">Log {selectedDate}</label><select id="log-status" value={status} onChange={(event) => setStatus(event.target.value)}><option>Present</option><option>Absent</option><option>Cancelled</option></select></div><button type="submit" className="button button-primary button-small"><Plus size={15} /> Save</button></form>
        </section>
      </div>
      <section className="panel log-panel"><div className="panel-heading"><div><h2>Attendance log</h2><p>{entries.length} recorded {entries.length === 1 ? "class" : "classes"}</p></div><div className="filter-tabs">{["All", "Present", "Absent", "Cancelled"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
        {filtered.length ? <div className="table-scroll"><table><thead><tr><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((entry) => <tr key={entry.id}><td>{localDate(entry.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</td><td><span className={`entry-status ${entry.status.toLowerCase()}`}><i />{entry.status === "Cancelled" ? "No class" : entry.status}</span></td><td><div className="table-actions"><select aria-label={`Change status for ${entry.date}`} value={entry.status} onChange={(event) => updateEntry(entry.id, event.target.value)}><option>Present</option><option>Absent</option><option>Cancelled</option></select><button onClick={() => removeEntry(entry.id)} className="delete-log" aria-label="Delete attendance entry"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div> : <div className="table-empty"><CircleAlert size={20} /><span>No attendance records match this filter.</span></div>}
      </section>
    </div>
  );
}
