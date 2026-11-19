import { useEffect, useState } from "react";
import { X } from "lucide-react";

const colors = ["#6366f1", "#14b8a6", "#f59e0b", "#ec4899", "#8b5cf6", "#0ea5e9"];

export default function SubjectModal({ subject, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", code: "", instructor: "", target: 75, color: colors[0] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (subject) setForm({ name: subject.name, code: subject.code, instructor: subject.instructor || "", target: subject.target, color: subject.color });
  }, [subject]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave({ ...form, target: Number(form.target) });
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="subject-modal-title">
        <div className="modal-heading"><div><p className="eyebrow">YOUR COURSEWORK</p><h2 id="subject-modal-title">{subject ? "Edit subject" : "Add a subject"}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>
        <form onSubmit={submit} className="form-stack">
          <label>Subject name<input name="name" value={form.name} onChange={change} placeholder="e.g. Data Structures" maxLength="100" required /></label>
          <div className="form-row">
            <label>Subject code<input name="code" value={form.code} onChange={change} placeholder="CS201" maxLength="20" required /></label>
            <label>Target attendance (%)<input name="target" type="number" min="1" max="100" value={form.target} onChange={change} required /></label>
          </div>
          <label>Instructor <span className="optional">Optional</span><input name="instructor" value={form.instructor} onChange={change} placeholder="Instructor name" maxLength="100" /></label>
          <div className="color-field"><span>Accent color</span><div className="color-options">{colors.map((color) => <button key={color} type="button" className={`color-option ${form.color === color ? "selected" : ""}`} style={{ backgroundColor: color }} onClick={() => setForm((current) => ({ ...current, color }))} aria-label={`Select ${color} accent`} />)}</div></div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? "Saving…" : subject ? "Save changes" : "Add subject"}</button></div>
        </form>
      </section>
    </div>
  );
}
