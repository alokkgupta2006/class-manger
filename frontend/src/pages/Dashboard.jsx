import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BookOpen, CalendarDays, Check, ChevronRight, CircleAlert, Download, Plus, Sparkles } from "lucide-react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../api.js";
import { useToast } from "../components/Toast.jsx";
import SubjectModal from "../components/SubjectModal.jsx";

const health = (percentage) => percentage >= 75 ? "healthy" : percentage >= 65 ? "warning" : "danger";
const localDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function SubjectCard({ subject, onMark, onEdit }) {
  const tone = health(subject.percentage);
  return (
    <article className={`subject-card attendance-${tone}`}>
      <div className="subject-card-header"><span className="subject-icon" style={{ color: subject.color, background: `${subject.color}14` }}><BookOpen size={19} /></span><button className="more-button" onClick={() => onEdit(subject)} aria-label={`Edit ${subject.name}`}>•••</button></div>
      <Link to={`/subject/${subject.id}`} className="subject-title">{subject.name}<ChevronRight size={16} /></Link>
      <div className="subject-subtitle">{subject.code}<span>·</span>{subject.instructor || "Instructor not set"}</div>
      <div className="progress-meta"><span>Attendance</span><strong className={`tone-${tone}`}>{subject.percentage}%</strong></div>
      <div className="progress-track"><div className={`progress-fill tone-bg-${tone}`} style={{ width: `${subject.percentage}%` }} /></div>
      <div className="subject-foot"><span>{subject.attended} of {subject.held} classes</span><span className={`health-label tone-${tone}`}><i />{tone === "healthy" ? "On track" : tone === "warning" ? "At risk" : "Below target"}</span></div>
      <table className="subject-totals" aria-label={`${subject.name} attendance totals`}>
        <thead><tr><th>Present</th><th>Absent</th></tr></thead>
        <tbody><tr><td className="present-total">{subject.attended}</td><td className="absent-total">{subject.missed}</td></tr></tbody>
      </table>
      {subject.mustAttend > 0 && <div className="recovery-hint"><ArrowUpRight size={14} /> Attend next {subject.mustAttend} to reach {subject.target}%</div>}
      {subject.recoveryImpossible && <div className="recovery-hint"><CircleAlert size={14} /> A missed class makes a 100% target unreachable</div>}
      {subject.mustAttend === 0 && subject.canMiss > 0 && <div className="recovery-hint safe"><ArrowDownRight size={14} /> Safe to miss {subject.canMiss} {subject.canMiss === 1 ? "class" : "classes"}</div>}
      <div className="quick-actions"><button onClick={() => onMark(subject.id, "Present")}><Check size={14} /> Present</button><button onClick={() => onMark(subject.id, "Absent")}><Plus size={14} /> Absent</button></div>
    </article>
  );
}

export default function Dashboard() {
  const onAddSubject = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalSubject, setModalSubject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const toast = useToast();

  const loadSubjects = async () => {
    const result = await api.get(`/subjects?today=${localDateKey(new Date())}`);
    setSubjects(result.subjects);
  };

  useEffect(() => {
    loadSubjects().catch((error) => toast(error.message, "error")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!onAddSubject) return;
    onAddSubject(() => () => { setModalSubject(null); setModalOpen(true); });
    return () => onAddSubject(null);
  }, [onAddSubject]);

  useEffect(() => {
    if (location.state?.openSubjectModal) {
      setModalSubject(null);
      setModalOpen(true);
      navigate("/dashboard", { replace: true, state: null });
    }
  }, [location.key, location.state, navigate]);

  const stats = useMemo(() => {
    const attended = subjects.reduce((sum, subject) => sum + subject.attended, 0);
    const missed = subjects.reduce((sum, subject) => sum + subject.missed, 0);
    const held = attended + missed;
    return { attended, missed, percentage: held ? Math.round(attended / held * 100) : 0 };
  }, [subjects]);

  const mark = async (subjectId, status) => {
    const date = localDateKey(new Date());
    const original = subjects;
    setSavingId(subjectId);
    setSubjects((items) => items.map((item) => {
      if (item.id !== subjectId) return item;
      const hadToday = item.todayStatus;
      const attended = item.attended - (hadToday === "Present" ? 1 : 0) + (status === "Present" ? 1 : 0);
      const missed = item.missed - (hadToday === "Absent" ? 1 : 0) + (status === "Absent" ? 1 : 0);
      const held = attended + missed;
      return { ...item, attended, missed, held, todayStatus: status, percentage: held ? Math.round(attended / held * 100) : 0 };
    }));
    try {
      await api.post(`/subjects/${subjectId}/attendance`, { date, status });
      await loadSubjects();
      toast(`Marked ${status.toLowerCase()}.`);
    } catch (error) {
      setSubjects(original);
      toast(error.message, "error");
    } finally { setSavingId(null); }
  };

  const saveSubject = async (data) => {
    if (modalSubject) await api.patch(`/subjects/${modalSubject.id}`, data);
    else await api.post("/subjects", data);
    await loadSubjects();
    setModalOpen(false);
    toast(modalSubject ? "Subject updated." : "Subject added.");
  };

  const exportCsv = async () => {
    try {
      const response = await fetch("/api/subjects/export/csv", { credentials: "include" });
      if (!response.ok) throw new Error("CSV export failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "attendance-export.csv";
      link.click();
      URL.revokeObjectURL(url);
      toast("CSV exported.");
    } catch (error) {
      toast(error.message, "error");
    }
  };

  return (
    <div className={`page-container ambient-dashboard ${health(stats.percentage)}`}>
      <header className="page-header"><div><p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</p><h1>Your overview</h1><p className="page-subtitle">A little progress, every day. Here's where you stand.</p></div><div className="header-actions"><button className="button button-quiet" onClick={exportCsv}><Download size={16} /> Export</button><button className="button button-primary add-subject-button" onClick={() => { setModalSubject(null); setModalOpen(true); }}><Plus size={17} /> Add subject</button></div></header>
      <section className="summary-grid">
        <div className="summary-card overall-card"><div className="summary-label">Overall attendance <span className={`status-pill ${health(stats.percentage)}`}><i />{health(stats.percentage) === "healthy" ? "On track" : "Needs attention"}</span></div><div className="summary-value">{stats.percentage}<span>%</span></div><div className="summary-bottom"><div className="summary-meter"><div className={`summary-meter-fill tone-bg-${health(stats.percentage)}`} style={{ width: `${stats.percentage}%` }} /></div><span>Target 75%</span></div></div>
        <div className="summary-card"><span className="summary-label">Classes attended</span><div className="summary-value">{stats.attended}<span className="value-unit">classes</span></div><div className="summary-caption"><span className="stat-icon present"><Check size={14} /></span> Keep building your streak</div></div>
        <div className="summary-card"><span className="summary-label">Classes missed</span><div className="summary-value">{stats.missed}<span className="value-unit">classes</span></div><div className="summary-caption"><span className="stat-icon absent"><CircleAlert size={14} /></span> Every class is a fresh start</div></div>
        <div className="summary-card bunk-card"><span className="summary-label"><Sparkles size={15} /> Safe bunk / recovery</span><div className="bunk-main">{subjects.some((subject) => subject.mustAttend > 0 || subject.recoveryImpossible) ? <><strong>{subjects.some((subject) => subject.recoveryImpossible) ? "—" : subjects.reduce((sum, subject) => sum + subject.mustAttend, 0)}</strong><span>{subjects.some((subject) => subject.recoveryImpossible) ? "a 100% target can't be recovered" : <>classes to attend<br />to reach your targets</>}</span></> : <><strong>{subjects.length ? subjects.reduce((min, subject) => Math.min(min, subject.canMiss), Infinity) : 0}</strong><span>safe classes to miss<br />in your tightest subject</span></>}</div><div className="summary-caption"><CalendarDays size={14} /> Based on your enrolled subjects</div></div>
      </section>
      <div className="section-heading"><div><h2>Your subjects</h2><p>{subjects.length} {subjects.length === 1 ? "class" : "classes"} this semester</p></div></div>
      {loading ? <div className="subject-grid">{[1, 2, 3].map((item) => <div className="skeleton-card" key={item}><div /><div /><div /><div /></div>)}</div> :
        subjects.length ? <div className="subject-grid">{subjects.map((subject) => <SubjectCard key={subject.id} subject={subject} onMark={mark} onEdit={(item) => { setModalSubject(item); setModalOpen(true); }} />)}</div> :
          <div className="empty-state"><div className="empty-icon"><BookOpen size={22} /></div><h3>Your semester starts here</h3><p>Add your first subject to track attendance and stay ahead of your goals.</p><button className="button button-primary" onClick={() => { setModalSubject(null); setModalOpen(true); }}><Plus size={16} /> Add your first subject</button></div>}
      {modalOpen && <SubjectModal subject={modalSubject} onClose={() => setModalOpen(false)} onSave={saveSubject} />}
      {savingId && <div className="saving-indicator"><span className="spinner" /> Saving attendance…</div>}
    </div>
  );
}
