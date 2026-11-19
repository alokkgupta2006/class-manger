import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { api } from "../api.js";
import { useToast } from "../components/Toast.jsx";

const days = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 7, label: "Sunday", short: "Sun" }
];
const colors = ["#6366f1", "#14b8a6", "#f59e0b", "#ec4899", "#8b5cf6", "#0ea5e9", "#ef6b64"];
const emptyEntry = (dayOfWeek) => ({
  subject: "",
  instructor: "",
  location: "",
  dayOfWeek,
  startTime: "09:00",
  endTime: "10:00",
  color: colors[0]
});

function ClassModal({ entry, dayOfWeek, onClose, onSave }) {
  const [form, setForm] = useState(entry ? { ...entry } : emptyEntry(dayOfWeek));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === "dayOfWeek" ? Number(value) : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(form);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal timetable-modal" role="dialog" aria-modal="true" aria-labelledby="timetable-modal-title">
        <div className="modal-heading">
          <div><p className="eyebrow">YOUR WEEK, YOUR WAY</p><h2 id="timetable-modal-title">{entry ? "Edit class" : "Add a class"}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        <form className="form-stack" onSubmit={submit}>
          <label>Class or subject<input name="subject" value={form.subject} onChange={change} maxLength="100" placeholder="e.g. Data Structures" required /></label>
          <div className="form-row">
            <label>Day<select name="dayOfWeek" value={form.dayOfWeek} onChange={change}>{days.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></label>
            <label>Room / location<input name="location" value={form.location} onChange={change} maxLength="100" placeholder="e.g. Block A · Room 204" /></label>
          </div>
          <div className="form-row">
            <label>Starts<input name="startTime" type="time" value={form.startTime} onChange={change} required /></label>
            <label>Ends<input name="endTime" type="time" value={form.endTime} onChange={change} required /></label>
          </div>
          <label>Instructor <span className="optional">Optional</span><input name="instructor" value={form.instructor} onChange={change} maxLength="100" placeholder="Instructor name" /></label>
          <div className="color-field"><span>Class color</span><div className="color-options">{colors.map((color) => <button key={color} type="button" className={`color-option ${form.color === color ? "selected" : ""}`} style={{ backgroundColor: color }} onClick={() => setForm((current) => ({ ...current, color }))} aria-label={`Select ${color} class color`} />)}</div></div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? "Saving…" : entry ? "Save changes" : "Add to timetable"}</button></div>
        </form>
      </section>
    </div>
  );
}

function ClassCard({ entry, onEdit, onDelete }) {
  return (
    <article className="timetable-class" style={{ "--class-accent": entry.color }}>
      <div className="timetable-class-time"><Clock3 size={13} /><span>{entry.startTime} – {entry.endTime}</span></div>
      <strong className="timetable-class-name">{entry.subject}</strong>
      {entry.instructor && <span className="timetable-class-meta"><UserRound size={12} />{entry.instructor}</span>}
      {entry.location && <span className="timetable-class-meta"><MapPin size={12} />{entry.location}</span>}
      <div className="timetable-class-actions">
        <button onClick={() => onEdit(entry)} aria-label={`Edit ${entry.subject}`}><Pencil size={13} /></button>
        <button onClick={() => onDelete(entry)} aria-label={`Delete ${entry.subject}`}><Trash2 size={13} /></button>
      </div>
    </article>
  );
}

export default function Timetable() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 7);
  const [modalEntry, setModalEntry] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const toast = useToast();

  const load = async () => {
    const result = await api.get("/timetable");
    setEntries(result.entries);
  };

  useEffect(() => {
    load().catch((error) => toast(error.message, "error")).finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const groups = new Map(days.map((day) => [day.value, []]));
    for (const entry of entries) groups.get(entry.dayOfWeek)?.push(entry);
    return groups;
  }, [entries]);

  const save = async (form) => {
    if (form.startTime >= form.endTime) throw new Error("End time must be later than start time.");
    if (modalEntry) await api.patch(`/timetable/${modalEntry.id}`, form);
    else await api.post("/timetable", form);
    await load();
    setModalOpen(false);
    toast(modalEntry ? "Class updated." : "Class added to your timetable.");
  };

  const remove = async (entry) => {
    if (!window.confirm(`Remove ${entry.subject} from your timetable?`)) return;
    try {
      await api.delete(`/timetable/${entry.id}`);
      await load();
      toast("Class removed.");
    } catch (error) {
      toast(error.message, "error");
    }
  };

  const openNew = (dayOfWeek = selectedDay) => {
    setModalEntry(null);
    setSelectedDay(dayOfWeek);
    setModalOpen(true);
  };

  return (
    <div className="page-container timetable-page">
      <header className="page-header">
        <div><p className="eyebrow">YOUR CAMPUS WEEK</p><h1>My timetable</h1><p className="page-subtitle">A flexible view of your weekly classes. Change it whenever your schedule does.</p></div>
        <button className="button button-primary timetable-add-button" onClick={() => openNew()}><Plus size={16} /> Add class</button>
      </header>
      <div className="timetable-toolbar">
        <div className="timetable-week-title"><CalendarDays size={17} /><span>Weekly schedule</span></div>
        <div className="timetable-day-picker" aria-label="Select a day">
          {days.map((day) => <button key={day.value} className={selectedDay === day.value ? "active" : ""} onClick={() => setSelectedDay(day.value)}>{day.short}</button>)}
        </div>
      </div>
      {loading ? <div className="timetable-loading"><span className="spinner" /> Loading your timetable…</div> : entries.length ? (
        <section className="timetable-week" aria-label="Weekly timetable">
          {days.map((day) => {
            const classes = grouped.get(day.value) || [];
            return <div key={day.value} className={`timetable-day ${selectedDay === day.value ? "selected" : ""} ${new Date().getDay() === day.value % 7 ? "today" : ""}`}>
              <button className="timetable-day-heading" onClick={() => setSelectedDay(day.value)}>
                <span>{day.short}</span><strong>{classes.length}</strong>
              </button>
              <div className="timetable-day-classes">
                {classes.length ? classes.map((entry) => <ClassCard key={entry.id} entry={entry} onEdit={(item) => { setModalEntry(item); setModalOpen(true); }} onDelete={remove} />) : <p className="timetable-empty-day">No classes</p>}
                <button className="timetable-add-day" onClick={() => openNew(day.value)}><Plus size={13} /> Add class</button>
              </div>
            </div>;
          })}
        </section>
      ) : <div className="timetable-empty-state"><div><CalendarDays size={22} /></div><h2>Your week, organized</h2><p>Add your college classes to build a weekly timetable. You can edit or remove any class whenever your schedule changes.</p><button className="button button-primary" onClick={() => openNew()}><Plus size={16} /> Add your first class</button></div>}
      {modalOpen && <ClassModal entry={modalEntry} dayOfWeek={selectedDay} onClose={() => setModalOpen(false)} onSave={save} />}
    </div>
  );
}
