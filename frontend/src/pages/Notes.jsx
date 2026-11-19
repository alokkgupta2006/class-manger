import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, FileImage, FileText, NotebookPen, Plus, Trash2 } from "lucide-react";
import { api } from "../api.js";
import { useToast } from "../components/Toast.jsx";

const localKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const dateLabel = (key) => new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric"
});

const safeFileName = (value) => value
  .normalize("NFKD")
  .replace(/[^\w -]/g, "")
  .trim()
  .replace(/\s+/g, "-")
  .slice(0, 60) || "daily-note";

function downloadNoteImage({ title, content, date }) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image export is not supported in this browser.");

  const width = 1200;
  const padding = 88;
  const bodyFont = "27px Arial, sans-serif";
  const lineHeight = 43;
  const maxWidth = width - padding * 2;
  context.font = bodyFont;
  const lines = [];
  for (const paragraph of content.split(/\r?\n/)) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
  }

  const bodyTop = 320;
  const footerSpace = 110;
  const heading = title.trim() || "Daily note";
  context.font = "700 48px Arial, sans-serif";
  const headingLines = [];
  let headingLine = "";
  for (const word of heading.split(/\s+/)) {
    const candidate = headingLine ? `${headingLine} ${word}` : word;
    if (headingLine && context.measureText(candidate).width > maxWidth) {
      headingLines.push(headingLine);
      headingLine = word;
    } else headingLine = candidate;
  }
  if (headingLine) headingLines.push(headingLine);
  const contentTop = Math.max(bodyTop, 145 + headingLines.length * 58 + 28);
  canvas.width = width;
  canvas.height = Math.max(850, contentTop + lines.length * lineHeight + footerSpace);
  context.fillStyle = "#fbfcff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#5964e8";
  context.fillRect(0, 0, width, 16);
  context.fillStyle = "#7b8393";
  context.font = "600 21px Arial, sans-serif";
  context.fillText("ATTENDLY  /  DAILY NOTES", padding, 96);
  context.fillStyle = "#252b38";
  context.font = "700 48px Arial, sans-serif";
  headingLines.forEach((line, index) => context.fillText(line, padding, 145 + index * 58));
  context.fillStyle = "#858d9a";
  context.font = "22px Arial, sans-serif";
  context.fillText(dateLabel(date), padding, contentTop - 48);
  context.fillStyle = "#414958";
  context.font = bodyFont;
  lines.forEach((line, index) => context.fillText(line, padding, contentTop + index * lineHeight));
  context.fillStyle = "#9aa1ad";
  context.font = "17px Arial, sans-serif";
  context.fillText("A moment captured. A day remembered.", padding, canvas.height - 58);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not create the note image."));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFileName(heading)}-${date}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, "image/png");
  });
}

function openNotePdf({ title, content, date }) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) throw new Error("Allow pop-ups to save your note as a PDF.");

  const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
  const safeTitle = escapeHtml(title.trim() || "Daily note");
  const paragraphs = escapeHtml(content).split(/\r?\n/).map((line) => `<p>${line || "&nbsp;"}</p>`).join("");
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safeFileName(title)}-${date}</title><style>
    *{box-sizing:border-box}body{margin:0;padding:72px;color:#303746;font-family:Arial,sans-serif;background:#f4f6fb}.sheet{max-width:780px;min-height:1000px;margin:0 auto;padding:68px 72px;background:white;border-top:8px solid #5964e8;box-shadow:0 12px 40px #18233a18}.brand{font-size:12px;font-weight:bold;letter-spacing:2px;color:#717a8a}.date{margin:42px 0 12px;color:#8a92a0;font-size:13px}.title{margin:0 0 26px;color:#252b38;font-size:30px;line-height:1.3}.content{border-top:1px solid #e8ebf1;padding-top:18px;font-size:15px;line-height:1.85;overflow-wrap:anywhere}.content p{margin:0 0 8px;white-space:pre-wrap}.footer{margin-top:72px;padding-top:14px;border-top:1px solid #eef0f4;color:#9aa1ad;font-size:11px}@page{size:A4;margin:16mm}@media print{body{padding:0;background:white}.sheet{max-width:none;min-height:0;padding:18mm 16mm;box-shadow:none}.footer{break-inside:avoid}}
    </style></head><body><main class="sheet"><div class="brand">ATTENDLY&nbsp; / &nbsp;DAILY NOTES</div><div class="date">${escapeHtml(dateLabel(date))}</div><h1 class="title">${safeTitle}</h1><section class="content">${paragraphs}</section><footer class="footer">A moment captured. A day remembered.</footer></main><script>window.addEventListener("load",()=>setTimeout(()=>window.print(),250));</script></body></html>`);
  printWindow.document.close();
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(localKey(new Date()));
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = async () => {
    const result = await api.get("/notes");
    setNotes(result.notes);
  };

  useEffect(() => {
    load().catch((error) => toast(error.message, "error")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const note = notes.find((item) => localKey(new Date(item.date)) === selected);
    setTitle(note?.title || "");
    setContent(note?.content || "");
  }, [selected, notes]);

  const noteByDate = useMemo(
    () => new Map(notes.map((note) => [localKey(new Date(note.date)), note])),
    [notes]
  );

  const save = async (event) => {
    event.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await api.post("/notes", { date: selected, title, content });
      await load();
      toast("Daily note saved.");
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const note = noteByDate.get(selected);
    if (!note || !window.confirm("Delete this daily note?")) return;
    try {
      await api.delete(`/notes/${note.id}`);
      await load();
      setTitle("");
      setContent("");
      toast("Note deleted.");
    } catch (error) {
      toast(error.message, "error");
    }
  };

  const shiftDate = (offset) => {
    const date = new Date(`${selected}T12:00:00`);
    date.setDate(date.getDate() + offset);
    setSelected(localKey(date));
  };

  const exportImage = async () => {
    try {
      await downloadNoteImage({ title, content, date: selected });
      toast("Note image downloaded.");
    } catch (error) {
      toast(error.message, "error");
    }
  };

  const exportPdf = () => {
    try {
      openNotePdf({ title, content, date: selected });
    } catch (error) {
      toast(error.message, "error");
    }
  };

  return (
    <div className="page-container notes-page">
      <header className="page-header notes-header">
        <div><p className="eyebrow">PERSONAL JOURNAL</p><h1>Daily notes</h1><p className="page-subtitle">Capture a thought, plan, or reminder for any day.</p></div>
      </header>
      <div className="notes-layout">
        <aside className="notes-date-list">
          <div className="notes-date-heading"><div><CalendarDays size={16} /><span>Note history</span></div><span className="note-count">{notes.length}</span></div>
          {loading ? <div className="notes-loading">Loading notes…</div> : notes.length ? <div className="notes-scroll">
            {notes.map((note) => {
              const key = localKey(new Date(note.date));
              return <button key={note.id} className={`note-date-item ${selected === key ? "active" : ""}`} onClick={() => setSelected(key)}>
                <span className="note-date-dot" />
                <div><strong>{note.title || "Untitled note"}</strong><span>{dateLabel(key)}</span></div>
              </button>;
            })}
          </div> : <div className="notes-empty-list"><NotebookPen size={18} /><span>No notes yet</span></div>}
        </aside>
        <section className="notes-editor">
          <div className="notes-editor-heading">
            <div className="date-controls"><button onClick={() => shiftDate(-1)} aria-label="Previous day"><ChevronLeft size={17} /></button><div><span>Selected date</span><strong>{dateLabel(selected)}</strong></div><button onClick={() => shiftDate(1)} aria-label="Next day"><ChevronRight size={17} /></button></div>
            <input className="native-date" type="date" value={selected} onChange={(event) => event.target.value && setSelected(event.target.value)} aria-label="Choose note date" />
          </div>
          <form onSubmit={save} className="note-form">
            <input className="note-title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Note title" maxLength="120" />
            <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write your note for this day…" maxLength="10000" required />
            <div className="note-actions">
              {noteByDate.has(selected) && <button type="button" className="button note-delete" onClick={remove}><Trash2 size={15} /> Delete</button>}
              <button type="button" className="button note-export" onClick={exportImage} disabled={!content.trim()}><FileImage size={15} /> Image</button>
              <button type="button" className="button note-export" onClick={exportPdf} disabled={!content.trim()}><FileText size={15} /> PDF</button>
              <button type="submit" className="button button-primary" disabled={saving}><Plus size={15} /> {saving ? "Saving…" : "Save note"}</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
