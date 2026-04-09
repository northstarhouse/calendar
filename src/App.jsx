import { useState, useEffect, useRef } from "react";

const KEYS = { handoffs: "cp_handoffs", events: "cp_events", messages: "cp_messages", schedule: "cp_schedule", children: "cp_children" };
const load = async (k, f) => { try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : f; } catch { return f; } };
const save = async (k, v) => { try { await window.storage.set(k, JSON.stringify(v)); } catch {} };

const HANDOFF_STATUS = ["On time", "Early", "Late", "Withheld", "Other"];
const EVENT_TYPES = ["Medical", "School", "Activity", "Other"];
const MSG_TYPES = ["Text", "Call", "Email", "In person", "Other"];
const inp = { width: "100%", boxSizing: "border-box" };

const toYMD = (d) => d.toISOString().split("T")[0];
const todayYMD = toYMD(new Date());

const custodyColors = { Me: "#1D9E75", "Co-parent": "#378ADD", Shared: "#BA7517" };
const typeColors = { Medical: ["var(--color-background-danger)", "var(--color-text-danger)"], School: ["var(--color-background-info)", "var(--color-text-info)"], Activity: ["var(--color-background-success)", "var(--color-text-success)"], Other: ["var(--color-background-secondary)", "var(--color-text-secondary)"] };
const statusColor = { "On time": "var(--color-text-success)", Early: "var(--color-text-info)", Late: "var(--color-text-warning)", Withheld: "var(--color-text-danger)", Other: "var(--color-text-secondary)" };

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#ffffff", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)", width: "100%", maxWidth: wide ? 640 : 480, maxHeight: "90vh", overflowY: "auto", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--color-text-secondary)", padding: "0 4px" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function Badge({ text, bg, color }) {
  return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: bg, color, whiteSpace: "nowrap" }}>{text}</span>;
}

function DayDot({ color }) {
  return <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

// ── Day Detail Modal ──────────────────────────────────────────────────────────
function DayModal({ ymd, handoffs, events, messages, schedule, onClose, onAdd, children, onDeleteHandoff, onDeleteEvent, onDeleteMessage }) {
  const label = new Date(ymd + "T12:00:00").toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" });
  const block = schedule.find(s => s.date <= ymd && s.endDate >= ymd);
  const dayHandoffs = handoffs.filter(h => h.date === ymd);
  const dayEvents = events.filter(e => e.date === ymd);
  const dayMessages = messages.filter(m => m.date === ymd);

  const hasAnything = block || dayHandoffs.length || dayEvents.length || dayMessages.length;

  return (
    <Modal title={label} onClose={onClose} wide>
      {block && (
        <div style={{ padding: "8px 12px", borderRadius: "var(--border-radius-md)", background: custodyColors[block.parent] + "18", border: `0.5px solid ${custodyColors[block.parent]}44`, marginBottom: "1rem", fontSize: 13, color: custodyColors[block.parent], fontWeight: 500 }}>
          Custody: {block.parent}{block.note ? ` · ${block.note}` : ""}
        </div>
      )}

      {dayHandoffs.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Handoffs</p>
          {dayHandoffs.map(h => (
            <div key={h.id} style={{ padding: "10px 12px", marginBottom: 6, borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{h.direction}{h.time ? ` · ${h.time}` : ""}</span>
                <span style={{ color: statusColor[h.status] }}>{h.status}</span>
              </div>
              {h.child && <div style={{ color: "var(--color-text-secondary)" }}>Child: {h.child}</div>}
              {h.wearing && <div style={{ color: "var(--color-text-secondary)" }}>Wearing: {h.wearing}</div>}
              {h.items && <div style={{ color: "var(--color-text-secondary)" }}>Items: {h.items}</div>}
              {h.medName && <div style={{ color: "var(--color-text-secondary)" }}>Medication: {h.medName} {h.medDose}{h.medTime ? ` @ ${h.medTime}` : ""}</div>}
              {h.notes && <div style={{ color: "var(--color-text-secondary)", marginTop: 4 }}>{h.notes}</div>}
              {h.screenshots?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {h.screenshots.map((s, i) => <img key={i} src={s} alt="" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 6, border: "0.5px solid var(--color-border-tertiary)" }} />)}
                </div>
              )}
              <button onClick={() => onDeleteHandoff(h.id)} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 11, padding: "4px 0 0", display: "block" }}>delete</button>
            </div>
          ))}
        </div>
      )}

      {dayEvents.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Events</p>
          {dayEvents.map(e => (
            <div key={e.id} style={{ padding: "10px 12px", marginBottom: 6, borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{e.title}</span>
                <Badge text={e.type} bg={typeColors[e.type][0]} color={typeColors[e.type][1]} />
              </div>
              {e.time && <div style={{ color: "var(--color-text-secondary)" }}>{e.time}</div>}
              {e.child && <div style={{ color: "var(--color-text-secondary)" }}>Child: {e.child}</div>}
              {e.location && <div style={{ color: "var(--color-text-secondary)" }}>Location: {e.location}</div>}
              {e.notes && <div style={{ color: "var(--color-text-secondary)", marginTop: 4 }}>{e.notes}</div>}
              {e.screenshots?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {e.screenshots.map((s, i) => <img key={i} src={s} alt="" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 6, border: "0.5px solid var(--color-border-tertiary)" }} />)}
                </div>
              )}
              <button onClick={() => onDeleteEvent(e.id)} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 11, padding: "4px 0 0", display: "block" }}>delete</button>
            </div>
          ))}
        </div>
      )}

      {dayMessages.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Communication</p>
          {dayMessages.map(m => (
            <div key={m.id} style={{ padding: "10px 12px", marginBottom: 6, borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{m.summary}</span>
                <span style={{ color: "var(--color-text-secondary)", fontSize: 11 }}>{m.type}</span>
              </div>
              {m.outcome && <div style={{ color: "var(--color-text-secondary)" }}>Outcome: {m.outcome}</div>}
              {m.notes && <div style={{ color: "var(--color-text-secondary)", marginTop: 4 }}>{m.notes}</div>}
              {m.screenshots?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {m.screenshots.map((s, i) => <img key={i} src={s} alt="" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 6, border: "0.5px solid var(--color-border-tertiary)" }} />)}
                </div>
              )}
              <button onClick={() => onDeleteMessage(m.id)} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 11, padding: "4px 0 0", display: "block" }}>delete</button>
            </div>
          ))}
        </div>
      )}

      {!hasAnything && <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Nothing logged for this day yet.</p>}

      <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: "1rem", marginTop: "0.5rem", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => onAdd("handoff", ymd)}>+ Handoff</button>
        <button onClick={() => onAdd("event", ymd)}>+ Event</button>
        <button onClick={() => onAdd("message", ymd)}>+ Communication</button>
        <button onClick={() => onAdd("schedule", ymd)}>+ Custody block</button>
      </div>
    </Modal>
  );
}

// ── Add Forms ─────────────────────────────────────────────────────────────────
function HandoffForm({ date, onSave, onClose, children }) {
  const [form, setForm] = useState({ date, time: "", direction: "To co-parent", status: "On time", child: "", wearing: "", items: "", medName: "", medDose: "", medTime: "", notes: "", screenshots: [] });
  const fileRef = useRef();

  const handleFiles = (files) => {
    Array.from(files).forEach(f => {
      const r = new FileReader();
      r.onload = e => setForm(prev => ({ ...prev, screenshots: [...prev.screenshots, e.target.result] }));
      r.readAsDataURL(f);
    });
  };

  return (
    <Modal title="Log handoff" onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        <Field label="Date"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} /></Field>
        <Field label="Time"><input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={inp} /></Field>
      </div>
      <Field label="Direction"><select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })} style={inp}><option>To co-parent</option><option>To me</option></select></Field>
      <Field label="Status"><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inp}>{HANDOFF_STATUS.map(s => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Child">{children.length > 0
        ? <select value={form.child} onChange={e => setForm({ ...form, child: e.target.value })} style={inp}><option value="">— select —</option>{children.map(c => <option key={c}>{c}</option>)}</select>
        : <input value={form.child} onChange={e => setForm({ ...form, child: e.target.value })} placeholder="Child's name" style={inp} />}
      </Field>
      <Field label="What they're wearing"><input value={form.wearing} onChange={e => setForm({ ...form, wearing: e.target.value })} placeholder="e.g. blue jacket, gray pants" style={inp} /></Field>
      <Field label="Items brought"><input value={form.items} onChange={e => setForm({ ...form, items: e.target.value })} placeholder="e.g. backpack, teddy bear" style={inp} /></Field>
      <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 0.5rem" }}>Medication given</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 8px" }}>
        <Field label="Name"><input value={form.medName} onChange={e => setForm({ ...form, medName: e.target.value })} placeholder="Drug" style={inp} /></Field>
        <Field label="Dose"><input value={form.medDose} onChange={e => setForm({ ...form, medDose: e.target.value })} placeholder="5ml" style={inp} /></Field>
        <Field label="Time"><input type="time" value={form.medTime} onChange={e => setForm({ ...form, medTime: e.target.value })} style={inp} /></Field>
      </div>
      <Field label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} /></Field>
      <Field label="Screenshots">
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
        <button onClick={() => fileRef.current.click()} style={{ marginBottom: 8 }}>Upload images</button>
        {form.screenshots.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{form.screenshots.map((s, i) => <img key={i} src={s} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />)}</div>}
      </Field>
      <button onClick={() => { if (form.date) onSave(form); }} style={{ width: "100%" }}>Save handoff</button>
    </Modal>
  );
}

function EventForm({ date, onSave, onClose, children }) {
  const [form, setForm] = useState({ date, time: "", title: "", type: "School", child: "", location: "", notes: "", screenshots: [] });
  const fileRef = useRef();
  const handleFiles = (files) => { Array.from(files).forEach(f => { const r = new FileReader(); r.onload = e => setForm(prev => ({ ...prev, screenshots: [...prev.screenshots, e.target.result] })); r.readAsDataURL(f); }); };

  return (
    <Modal title="Add event" onClose={onClose}>
      <Field label="Title"><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Event name" style={inp} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        <Field label="Date"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} /></Field>
        <Field label="Time"><input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={inp} /></Field>
      </div>
      <Field label="Type"><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inp}>{EVENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Child">{children.length > 0
        ? <select value={form.child} onChange={e => setForm({ ...form, child: e.target.value })} style={inp}><option value="">— select —</option>{children.map(c => <option key={c}>{c}</option>)}</select>
        : <input value={form.child} onChange={e => setForm({ ...form, child: e.target.value })} placeholder="Child's name" style={inp} />}
      </Field>
      <Field label="Location"><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Optional" style={inp} /></Field>
      <Field label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} /></Field>
      <Field label="Screenshots">
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
        <button onClick={() => fileRef.current.click()} style={{ marginBottom: 8 }}>Upload images</button>
        {form.screenshots.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{form.screenshots.map((s, i) => <img key={i} src={s} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />)}</div>}
      </Field>
      <button onClick={() => { if (form.title && form.date) onSave(form); }} style={{ width: "100%" }}>Save event</button>
    </Modal>
  );
}

function MessageForm({ date, onSave, onClose }) {
  const [form, setForm] = useState({ date, type: "Text", summary: "", outcome: "", notes: "", screenshots: [] });
  const fileRef = useRef();
  const handleFiles = (files) => { Array.from(files).forEach(f => { const r = new FileReader(); r.onload = e => setForm(prev => ({ ...prev, screenshots: [...prev.screenshots, e.target.result] })); r.readAsDataURL(f); }); };

  return (
    <Modal title="Log communication" onClose={onClose}>
      <Field label="Date"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} /></Field>
      <Field label="Type"><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inp}>{MSG_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Summary"><input value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="What was discussed" style={inp} /></Field>
      <Field label="Outcome / agreement"><input value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })} placeholder="What was decided" style={inp} /></Field>
      <Field label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} /></Field>
      <Field label="Screenshots">
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
        <button onClick={() => fileRef.current.click()} style={{ marginBottom: 8 }}>Upload images</button>
        {form.screenshots.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{form.screenshots.map((s, i) => <img key={i} src={s} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />)}</div>}
      </Field>
      <button onClick={() => { if (form.summary) onSave(form); }} style={{ width: "100%" }}>Save log</button>
    </Modal>
  );
}

function ScheduleForm({ date, onSave, onClose }) {
  const [form, setForm] = useState({ date, endDate: "", parent: "Me", note: "" });
  return (
    <Modal title="Add custody block" onClose={onClose}>
      <Field label="Start date"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} /></Field>
      <Field label="End date"><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} style={inp} /></Field>
      <Field label="With"><select value={form.parent} onChange={e => setForm({ ...form, parent: e.target.value })} style={inp}><option>Me</option><option>Co-parent</option><option>Shared</option></select></Field>
      <Field label="Note"><input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Optional" style={inp} /></Field>
      <button onClick={() => { if (form.date) onSave({ ...form, endDate: form.endDate || form.date }); }} style={{ width: "100%" }}>Save block</button>
    </Modal>
  );
}

// ── Calendar Tab ──────────────────────────────────────────────────────────────
function CalendarTab({ handoffs, events, messages, schedule, onDayClick, onNav, viewYear, viewMonth }) {
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const monthName = new Date(viewYear, viewMonth).toLocaleString("default", { month: "long" });

  const getDots = (d) => {
    const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dots = [];
    const block = schedule.find(s => s.date <= ymd && s.endDate >= ymd);
    if (block) dots.push(custodyColors[block.parent]);
    if (handoffs.some(h => h.date === ymd)) dots.push("#D85A30");
    if (events.some(e => e.date === ymd)) dots.push("#378ADD");
    if (messages.some(m => m.date === ymd)) dots.push("#7F77DD");
    return { ymd, dots, block };
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <button onClick={() => onNav(-1)}>‹</button>
        <span style={{ fontWeight: 500, fontSize: 16 }}>{monthName} {viewYear}</span>
        <button onClick={() => onNav(1)}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: "0.5rem" }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d} style={{ fontSize: 11, color: "var(--color-text-secondary)", textAlign: "center", padding: "4px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const { ymd, dots, block } = getDots(d);
          const isToday = ymd === todayYMD;
          return (
            <div key={d} onClick={() => onDayClick(ymd)} style={{ cursor: "pointer", minHeight: 44, borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "5px 2px 4px", background: block ? custodyColors[block.parent] + "18" : "var(--color-background-secondary)", border: isToday ? "1.5px solid var(--color-border-info)" : "0.5px solid var(--color-border-tertiary)" }}>
              <span style={{ fontSize: 12, fontWeight: isToday ? 500 : 400, color: block ? custodyColors[block.parent] : "var(--color-text-primary)" }}>{d}</span>
              {dots.length > 0 && (
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                  {dots.slice(0, 4).map((c, i) => <DayDot key={i} color={c} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: "1rem", flexWrap: "wrap" }}>
        {[["Custody (me)", "#1D9E75"], ["Custody (co-parent)", "#378ADD"], ["Handoff", "#D85A30"], ["Event", "#378ADD"], ["Message", "#7F77DD"]].map(([l, c]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-text-secondary)" }}><DayDot color={c} />{l}</div>
        ))}
      </div>
    </div>
  );
}

// ── List Tabs ─────────────────────────────────────────────────────────────────
function HandoffsTab({ handoffs, onAdd, onDelete }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>{handoffs.length} handoff{handoffs.length !== 1 ? "s" : ""}</p>
        <button onClick={() => onAdd("handoff", todayYMD)}>+ Log handoff</button>
      </div>
      {handoffs.length === 0 && <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>No handoffs yet.</p>}
      {[...handoffs].sort((a, b) => b.date.localeCompare(a.date)).map(h => (
        <div key={h.id} style={{ padding: "10px 12px", marginBottom: 8, borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontWeight: 500 }}>{h.date}{h.time ? ` · ${h.time}` : ""}</span>
            <span style={{ color: statusColor[h.status] }}>{h.status}</span>
          </div>
          <div style={{ color: "var(--color-text-secondary)" }}>{h.direction}{h.child ? ` · ${h.child}` : ""}{h.medName ? ` · 💊 ${h.medName}` : ""}</div>
          {h.screenshots?.length > 0 && <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>{h.screenshots.map((s, i) => <img key={i} src={s} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }} />)}</div>}
          <button onClick={() => onDelete("handoff", h.id)} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 11, padding: "4px 0 0", display: "block" }}>delete</button>
        </div>
      ))}
    </div>
  );
}

function EventsTab({ events, onAdd, onDelete }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>{events.length} event{events.length !== 1 ? "s" : ""}</p>
        <button onClick={() => onAdd("event", todayYMD)}>+ Add event</button>
      </div>
      {events.length === 0 && <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>No events yet.</p>}
      {[...events].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
        <div key={e.id} style={{ padding: "10px 12px", marginBottom: 8, borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 500 }}>{e.title}</span>
            <Badge text={e.type} bg={typeColors[e.type][0]} color={typeColors[e.type][1]} />
          </div>
          <div style={{ color: "var(--color-text-secondary)" }}>{e.date}{e.time ? ` · ${e.time}` : ""}{e.child ? ` · ${e.child}` : ""}</div>
          {e.screenshots?.length > 0 && <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>{e.screenshots.map((s, i) => <img key={i} src={s} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }} />)}</div>}
          <button onClick={() => onDelete("event", e.id)} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 11, padding: "4px 0 0", display: "block" }}>delete</button>
        </div>
      ))}
    </div>
  );
}

function MessagesTab({ messages, onAdd, onDelete }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>{messages.length} log{messages.length !== 1 ? "s" : ""}</p>
        <button onClick={() => onAdd("message", todayYMD)}>+ Log communication</button>
      </div>
      {messages.length === 0 && <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>No communication logs yet.</p>}
      {[...messages].sort((a, b) => b.date.localeCompare(a.date)).map(m => (
        <div key={m.id} style={{ padding: "10px 12px", marginBottom: 8, borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontWeight: 500 }}>{m.summary}</span>
            <span style={{ color: "var(--color-text-secondary)", fontSize: 11 }}>{m.type}</span>
          </div>
          <div style={{ color: "var(--color-text-secondary)" }}>{m.date}{m.outcome ? ` · ${m.outcome}` : ""}</div>
          {m.screenshots?.length > 0 && <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>{m.screenshots.map((s, i) => <img key={i} src={s} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }} />)}</div>}
          <button onClick={() => onDelete("message", m.id)} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 11, padding: "4px 0 0", display: "block" }}>delete</button>
        </div>
      ))}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function SettingsModal({ children, onClose, onAddChild, onRemoveChild }) {
  const [val, setVal] = useState("");
  return (
    <Modal title="Settings" onClose={onClose}>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 1rem" }}>Add children to auto-populate dropdowns.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
        <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { onAddChild(val); setVal(""); }}} placeholder="Child's name" style={{ flex: 1 }} />
        <button onClick={() => { onAddChild(val); setVal(""); }}>Add</button>
      </div>
      {children.map(c => (
        <div key={c} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", marginBottom: 6, borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", fontSize: 14 }}>
          {c}<button onClick={() => onRemoveChild(c)} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}>✕</button>
        </div>
      ))}
    </Modal>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
const TABS = [{ id: "calendar", label: "Calendar", icon: "📅" }, { id: "handoffs", label: "Handoffs", icon: "🤝" }, { id: "events", label: "Events", icon: "📋" }, { id: "messages", label: "Messages", icon: "💬" }];

export default function App() {
  const today = new Date();
  const [tab, setTab] = useState("calendar");
  const [handoffs, setHandoffs] = useState([]);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [children, setChildren] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [addForm, setAddForm] = useState(null); // { type, date }
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    (async () => {
      setHandoffs(await load(KEYS.handoffs, []));
      setEvents(await load(KEYS.events, []));
      setMessages(await load(KEYS.messages, []));
      setSchedule(await load(KEYS.schedule, []));
      setChildren(await load(KEYS.children, []));
      setLoaded(true);
    })();
  }, []);

  const nav = (dir) => { const d = new Date(viewYear, viewMonth + dir); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()); };

  const handleAdd = (type, date) => { setSelectedDay(null); setAddForm({ type, date }); };

  const saveHandoff = async (form) => { const u = [{ ...form, id: Date.now() }, ...handoffs]; setHandoffs(u); await save(KEYS.handoffs, u); setAddForm(null); };
  const saveEvent = async (form) => { const u = [{ ...form, id: Date.now() }, ...events]; setEvents(u); await save(KEYS.events, u); setAddForm(null); };
  const saveMessage = async (form) => { const u = [{ ...form, id: Date.now() }, ...messages]; setMessages(u); await save(KEYS.messages, u); setAddForm(null); };
  const saveSchedule = async (form) => { const u = [...schedule, { ...form, id: Date.now() }]; setSchedule(u); await save(KEYS.schedule, u); setAddForm(null); };

  const handleDelete = async (type, id) => {
    if (type === "handoff") { const u = handoffs.filter(x => x.id !== id); setHandoffs(u); await save(KEYS.handoffs, u); }
    if (type === "event") { const u = events.filter(x => x.id !== id); setEvents(u); await save(KEYS.events, u); }
    if (type === "message") { const u = messages.filter(x => x.id !== id); setMessages(u); await save(KEYS.messages, u); }
  };

  const addChild = async (val) => { if (!val?.trim()) return; const u = [...children, val.trim()]; setChildren(u); await save(KEYS.children, u); };
  const removeChild = async (c) => { const u = children.filter(x => x !== c); setChildren(u); await save(KEYS.children, u); };

  if (!loaded) return <div style={{ padding: "2rem", color: "var(--color-text-secondary)", fontSize: 14 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "1rem 1rem 3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Co-Parent Tracker</h1>
          {children.length > 0 && <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>{children.join(", ")}</p>}
        </div>
        <button onClick={() => setShowSettings(true)} style={{ fontSize: 18, padding: "4px 8px" }}>⚙</button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? "var(--color-background-info)" : "var(--color-background-secondary)", color: tab === t.id ? "var(--color-text-info)" : "var(--color-text-primary)", border: `0.5px solid ${tab === t.id ? "var(--color-border-info)" : "var(--color-border-tertiary)"}`, fontWeight: tab === t.id ? 500 : 400, padding: "6px 14px", borderRadius: 20, fontSize: 13 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "calendar" && (
        <>
          <CalendarTab handoffs={handoffs} events={events} messages={messages} schedule={schedule} onDayClick={setSelectedDay} onNav={nav} viewYear={viewYear} viewMonth={viewMonth} />
          <div style={{ marginTop: "1.5rem" }}>
            <button onClick={() => setAddForm({ type: "picker", date: todayYMD })}>+ Add</button>
          </div>
        </>
      )}
      {tab === "handoffs" && <HandoffsTab handoffs={handoffs} onAdd={handleAdd} onDelete={handleDelete} />}
      {tab === "events" && <EventsTab events={events} onAdd={handleAdd} onDelete={handleDelete} />}
      {tab === "messages" && <MessagesTab messages={messages} onAdd={handleAdd} onDelete={handleDelete} />}

      {selectedDay && (
        <DayModal ymd={selectedDay} handoffs={handoffs} events={events} messages={messages} schedule={schedule} onClose={() => setSelectedDay(null)} onAdd={handleAdd} children={children}
          onDeleteHandoff={id => handleDelete("handoff", id)}
          onDeleteEvent={id => handleDelete("event", id)}
          onDeleteMessage={id => handleDelete("message", id)}
        />
      )}

      {addForm?.type === "picker" && (
        <Modal title="What would you like to add?" onClose={() => setAddForm(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["handoff","🤝","Handoff","Log a custody exchange"],["event","📋","Event","Appointment, activity, or school event"],["message","💬","Communication","Log a conversation or agreement"],["schedule","📅","Custody block","Mark custody days on the calendar"]].map(([type, icon, label, desc]) => (
              <button key={type} onClick={() => setAddForm({ type, date: todayYMD })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--border-radius-md)", textAlign: "left", width: "100%", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)" }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 400 }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {addForm?.type === "handoff" && <HandoffForm date={addForm.date} onSave={saveHandoff} onClose={() => setAddForm(null)} children={children} />}
      {addForm?.type === "event" && <EventForm date={addForm.date} onSave={saveEvent} onClose={() => setAddForm(null)} children={children} />}
      {addForm?.type === "message" && <MessageForm date={addForm.date} onSave={saveMessage} onClose={() => setAddForm(null)} />}
      {addForm?.type === "schedule" && <ScheduleForm date={addForm.date} onSave={saveSchedule} onClose={() => setAddForm(null)} />}

      {showSettings && <SettingsModal children={children} onClose={() => setShowSettings(false)} onAddChild={addChild} onRemoveChild={removeChild} />}
    </div>
  );
}
