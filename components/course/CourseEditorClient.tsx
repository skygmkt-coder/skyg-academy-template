"use client";

import { useState, useRef } from "react";
import { Icons } from "@/components/ui/Icons";

// ── TYPES ──────────────────────────────────────────────
type Lesson  = { id: string; title: string; video_url: string | null; is_free_preview: boolean; order_index: number };
type Module  = { id: string; title: string; order_index: number; lessons: Lesson[] };
type Course  = {
  id: string; title: string; slug: string; description: string | null;
  price_cents: number; level: string | null; duration_minutes: number | null;
  published: boolean; scheduled_at: string | null;
  thumbnail_url: string | null; promo_video_url: string | null;
  course_type: string | null; show_in_landing: boolean; show_in_store: boolean;
  modules: Module[];
};

// ── STYLES ─────────────────────────────────────────────
const inputS: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
  padding: "10px 14px", color: "#fff", fontSize: 13,
  outline: "none", boxSizing: "border-box",
};

const cardS: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16, padding: 20,
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>{hint}</p>}
    </div>
  );
}

function getEmbed(url: string) {
  if (!url) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = url.includes("v=") ? url.split("v=")[1]?.split("&")[0] : url.split("/").pop();
    return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
  }
  if (url.includes("vimeo.com")) {
    const id = url.split("/").pop();
    return `https://player.vimeo.com/video/${id}?title=0&byline=0`;
  }
  return null;
}

// ── MAIN COMPONENT ─────────────────────────────────────
export default function CourseEditorClient({ course: initial }: { course: Course }) {
  const [course, setCourse] = useState<Course>(initial);
  const [activeTab, setActiveTab] = useState<"details" | "content" | "restrictions">("details");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const API = `/api/admin/courses/${course.id}`;

  async function save(patch: Partial<Course>) {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(API, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const json = await res.json();
      if (!res.ok) {
        console.error("[save] API error:", json.error);
        alert(`Error al guardar: ${json.error || "Error desconocido"}`);
        setSaving(false);
        return null;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setSaving(false);
      return json; // Return server-confirmed data
    } catch (err) {
      console.error("[save] Network error:", err);
      alert("Error de red al guardar. Verifica tu conexión.");
      setSaving(false);
      return null;
    }
  }

  async function callAction(action: Record<string, any>) {
    const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action) });
    return res.json();
  }

  async function togglePublish() {
    const newVal = !course.published;
    const serverData = await save({
      published: newVal,
      // Clear scheduled_at when publishing manually
      scheduled_at: newVal ? null : course.scheduled_at,
    });
    if (serverData) {
      // Use server-confirmed values — never optimistic on publish
      setCourse(c => ({
        ...c,
        published: serverData.published,
        scheduled_at: serverData.scheduled_at,
        show_in_landing: serverData.show_in_landing ?? c.show_in_landing,
        show_in_store: serverData.show_in_store ?? c.show_in_store,
      }));
    }
  }

  async function deleteCourse() {
    if (!confirm(`¿Eliminar "${course.title}" permanentemente? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    await callAction({ action: "delete_course" });
    window.location.href = "/admin/cursos";
  }

  const tabs = [
    { key: "details",      label: "Detalles",      icon: "📋" },
    { key: "content",      label: "Contenido",      icon: "📚" },
    { key: "restrictions", label: "Restricciones",  icon: "🔒" },
  ];

  const status = course.published ? "Publicado"
    : course.scheduled_at ? "Programado"
    : "Borrador";

  const statusColor = course.published ? "#4ade80"
    : course.scheduled_at ? "#fbbf24"
    : "rgba(255,255,255,0.3)";

  return (
    <div style={{ maxWidth: 860, paddingBottom: 60 }}>

      {/* ── HEADER ──────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <a href="/admin/cursos" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
            ← Cursos
          </a>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{course.title}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "var(--font-display,Sora,sans-serif)", flex: 1, minWidth: 0 }}>
            {course.title}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Status badge */}
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99,
              background: course.published ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${course.published ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.1)"}`,
              color: statusColor,
            }}>
              {status}
            </span>

            {/* Preview */}
            <a href={`/cursos/${course.slug}`} target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 10,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)", textDecoration: "none",
                display: "flex", alignItems: "center", gap: 6,
              }}>
              <Icons.explore size={14} />
              Vista previa
            </a>

            {/* Publish toggle */}
            <button onClick={togglePublish} disabled={saving}
              style={{
                fontSize: 13, fontWeight: 700, padding: "7px 18px", borderRadius: 10,
                background: course.published ? "rgba(232,0,74,0.1)" : "var(--color-primary,#3589F2)",
                border: course.published ? "1px solid rgba(232,0,74,0.25)" : "none",
                color: course.published ? "#E8004A" : "#fff",
                cursor: "pointer", opacity: saving ? 0.6 : 1,
              }}>
              {course.published ? "Despublicar" : "Publicar"}
            </button>

            {/* Save indicator */}
            {saved && (
              <span style={{ fontSize: 12, color: "#4ade80", display: "flex", alignItems: "center", gap: 4 }}>
                <Icons.check size={14} /> Guardado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── TABS ────────────────────────────────── */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {tabs.map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 20px", fontSize: 13, fontWeight: 600,
              background: "none", border: "none", cursor: "pointer",
              borderBottom: activeTab === tab.key ? "2px solid var(--color-primary,#3589F2)" : "2px solid transparent",
              color: activeTab === tab.key ? "#fff" : "rgba(255,255,255,0.4)",
              transition: "all 0.15s", marginBottom: -1,
            }}>
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: DETALLES ───────────────────────── */}
      {activeTab === "details" && (
        <DetailsTab course={course} onChange={setCourse} onSave={save} saving={saving} onDelete={deleteCourse} deleting={deleting} />
      )}

      {/* ── TAB: CONTENIDO ──────────────────────── */}
      {activeTab === "content" && (
        <ContentTab course={course} onChange={setCourse} callAction={callAction} />
      )}

      {/* ── TAB: RESTRICCIONES ──────────────────── */}
      {activeTab === "restrictions" && (
        <RestrictionsTab course={course} onChange={setCourse} onSave={save} saving={saving} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// TAB: DETALLES
// ══════════════════════════════════════════════════════
function DetailsTab({ course, onChange, onSave, saving, onDelete, deleting }: {
  course: Course;
  onChange: (c: Course) => void;
  onSave: (p: Partial<Course>) => Promise<void>;
  saving: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [promoUrl, setPromoUrl] = useState(course.promo_video_url || "");
  const [showPromo, setShowPromo] = useState(false);
  const [coverUrl, setCoverUrl] = useState(course.thumbnail_url || "");
  const fileRef = useRef<HTMLInputElement>(null);

  const embedUrl = getEmbed(promoUrl);
  const isValidVideo = !!embedUrl;

  async function handleSave() {
    await onSave({
      title: (document.getElementById("det-title") as HTMLInputElement)?.value,
      description: (document.getElementById("det-desc") as HTMLTextAreaElement)?.value,
      price_cents: Math.round(parseFloat((document.getElementById("det-price") as HTMLInputElement)?.value || "0") * 100),
      level: (document.getElementById("det-level") as HTMLSelectElement)?.value || null,
      duration_minutes: Math.round(parseFloat((document.getElementById("det-duration") as HTMLInputElement)?.value || "0") * 60) || null,
      promo_video_url: promoUrl || null,
      thumbnail_url: coverUrl || null,
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Basic info */}
      <div style={cardS}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px 0" }}>
          Información básica
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Título">
            <input id="det-title" defaultValue={course.title} style={inputS} />
          </Field>
          <Field label="Descripción">
            <textarea id="det-desc" rows={3} defaultValue={course.description || ""} style={{ ...inputS, resize: "none" }} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Precio (MXN)">
              <input id="det-price" type="number" defaultValue={(course.price_cents / 100).toString()} style={inputS} />
            </Field>
            <Field label="Nivel">
              <select id="det-level" defaultValue={course.level || ""} style={inputS}>
                <option value="">Seleccionar</option>
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </Field>
            <Field label="Duración (horas)">
              <input id="det-duration" type="number" step="0.5"
                defaultValue={course.duration_minutes ? (course.duration_minutes / 60).toString() : ""} style={inputS} />
            </Field>
          </div>
        </div>
      </div>

      {/* Promo video */}
      <div style={cardS}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px 0" }}>
          Video de presentación
        </p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "0 0 14px 0" }}>
          Se muestra en la landing y en la tienda. Pega un link de YouTube o Vimeo.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            type="url"
            value={promoUrl}
            onChange={e => { setPromoUrl(e.target.value); setShowPromo(false); }}
            placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
            style={{
              ...inputS, flex: 1,
              borderColor: promoUrl && !isValidVideo ? "rgba(232,0,74,0.4)"
                : promoUrl && isValidVideo ? "rgba(74,222,128,0.3)"
                : "rgba(255,255,255,0.1)",
            }}
          />
          {isValidVideo && (
            <button type="button" onClick={() => setShowPromo(v => !v)}
              style={{ padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", border: "1px solid rgba(53,137,242,0.3)", background: showPromo ? "rgba(53,137,242,0.2)" : "rgba(53,137,242,0.1)", color: "var(--color-primary,#3589F2)" }}>
              {showPromo ? "Ocultar" : "▶ Preview"}
            </button>
          )}
        </div>

        {promoUrl && (
          <p style={{ fontSize: 11, color: isValidVideo ? "#4ade80" : "#f87171", margin: "0 0 8px 0" }}>
            {isValidVideo ? `✓ ${promoUrl.includes("vimeo") ? "Vimeo" : "YouTube"} detectado` : "⚠ URL no reconocida"}
          </p>
        )}

        {showPromo && embedUrl && (
          <div style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "16/9", background: "#000", border: "1px solid rgba(255,255,255,0.1)" }}>
            <iframe src={embedUrl} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; fullscreen" allowFullScreen />
          </div>
        )}
      </div>

      {/* Cover image */}
      <div style={cardS}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px 0" }}>
          Imagen de portada
        </p>

        {coverUrl && (
          <div style={{ position: "relative", marginBottom: 12, borderRadius: 12, overflow: "hidden", aspectRatio: "16/9", background: `url(${coverUrl}) center/cover`, border: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={() => setCoverUrl("")}
              style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 12, cursor: "pointer" }}>
              × Quitar
            </button>
          </div>
        )}

        <Field label="URL de imagen">
          <input type="url" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" style={inputS} />
        </Field>
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>o</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.12)" }}>
          <Icons.download size={16} />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Subir imagen</span>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) setCoverUrl(URL.createObjectURL(f));
            }} />
        </label>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={handleSave} disabled={saving}
          style={{ flex: 1, padding: "12px 0", borderRadius: 12, fontSize: 13, fontWeight: 700, background: "var(--color-primary,#3589F2)", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        <button onClick={onDelete} disabled={deleting}
          style={{ padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: "rgba(232,0,74,0.08)", border: "1px solid rgba(232,0,74,0.2)", color: "#E8004A", cursor: "pointer" }}>
          {deleting ? "..." : "Eliminar curso"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// TAB: CONTENIDO
// ══════════════════════════════════════════════════════
function ContentTab({ course, onChange, callAction }: {
  course: Course;
  onChange: (c: Course) => void;
  callAction: (a: Record<string, any>) => Promise<any>;
}) {
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(course.modules.map(m => m.id))
  );

  async function handleAddModule() {
    if (!newModuleTitle.trim()) return;
    const res = await callAction({ action: "add_module", title: newModuleTitle });
    if (res.module) {
      onChange({ ...course, modules: [...course.modules, { ...res.module, lessons: [] }] });
      setNewModuleTitle("");
      setAddingModule(false);
      setExpandedModules(s => new Set([...s, res.module.id]));
    }
  }

  async function handleDeleteModule(moduleId: string) {
    if (!confirm("¿Eliminar este módulo y todas sus lecciones?")) return;
    await callAction({ action: "delete_module", module_id: moduleId });
    onChange({ ...course, modules: course.modules.filter(m => m.id !== moduleId) });
  }

  async function handleUpdateModuleTitle(moduleId: string, title: string) {
    await callAction({ action: "update_module", module_id: moduleId, title });
    onChange({ ...course, modules: course.modules.map(m => m.id === moduleId ? { ...m, title } : m) });
  }

  async function handleAddLesson(moduleId: string, title: string, videoUrl: string, isFreePreview: boolean) {
    const res = await callAction({ action: "add_lesson", module_id: moduleId, title, video_url: videoUrl, is_free_preview: isFreePreview });
    if (res.lesson) {
      onChange({
        ...course,
        modules: course.modules.map(m =>
          m.id === moduleId ? { ...m, lessons: [...m.lessons, res.lesson] } : m
        ),
      });
    }
  }

  async function handleDeleteLesson(moduleId: string, lessonId: string) {
    await callAction({ action: "delete_lesson", lesson_id: lessonId });
    onChange({
      ...course,
      modules: course.modules.map(m =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m
      ),
    });
  }

  async function handleUpdateLesson(moduleId: string, lesson: Lesson) {
    await callAction({ action: "update_lesson", lesson_id: lesson.id, title: lesson.title, video_url: lesson.video_url, is_free_preview: lesson.is_free_preview });
    onChange({
      ...course,
      modules: course.modules.map(m =>
        m.id === moduleId ? { ...m, lessons: m.lessons.map(l => l.id === lesson.id ? lesson : l) } : m
      ),
    });
  }

  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
          {course.modules.length} módulos · {totalLessons} lecciones
        </p>
      </div>

      {/* Modules */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
        {course.modules.map((mod, mi) => (
          <ModuleCard
            key={mod.id}
            module={mod}
            index={mi}
            expanded={expandedModules.has(mod.id)}
            onToggle={() => setExpandedModules(s => {
              const n = new Set(s);
              n.has(mod.id) ? n.delete(mod.id) : n.add(mod.id);
              return n;
            })}
            onUpdateTitle={title => handleUpdateModuleTitle(mod.id, title)}
            onDelete={() => handleDeleteModule(mod.id)}
            onAddLesson={(t, v, f) => handleAddLesson(mod.id, t, v, f)}
            onDeleteLesson={lid => handleDeleteLesson(mod.id, lid)}
            onUpdateLesson={lesson => handleUpdateLesson(mod.id, lesson)}
          />
        ))}
      </div>

      {/* Add module */}
      {addingModule ? (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            autoFocus
            value={newModuleTitle}
            onChange={e => setNewModuleTitle(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAddModule(); if (e.key === "Escape") { setAddingModule(false); setNewModuleTitle(""); } }}
            placeholder="Nombre del módulo"
            style={{ ...inputS, flex: 1 }}
          />
          <button onClick={handleAddModule}
            style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "var(--color-primary,#3589F2)", color: "#fff", border: "none", cursor: "pointer" }}>
            Crear
          </button>
          <button onClick={() => { setAddingModule(false); setNewModuleTitle(""); }}
            style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
            ×
          </button>
        </div>
      ) : (
        <button onClick={() => setAddingModule(true)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Icons.plus size={16} /> Agregar módulo
        </button>
      )}
    </div>
  );
}

// ── MODULE CARD ───────────────────────────────────────
function ModuleCard({ module, index, expanded, onToggle, onUpdateTitle, onDelete, onAddLesson, onDeleteLesson, onUpdateLesson }: {
  module: Module; index: number; expanded: boolean;
  onToggle: () => void;
  onUpdateTitle: (t: string) => void;
  onDelete: () => void;
  onAddLesson: (t: string, v: string, f: boolean) => void;
  onDeleteLesson: (id: string) => void;
  onUpdateLesson: (l: Lesson) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [addingLesson, setAddingLesson] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonUrl, setLessonUrl] = useState("");
  const [lessonFree, setLessonFree] = useState(false);

  function confirmTitle() {
    if (title !== module.title) onUpdateTitle(title);
    setEditingTitle(false);
  }

  function handleAddLesson() {
    if (!lessonTitle.trim()) return;
    onAddLesson(lessonTitle, lessonUrl, lessonFree);
    setLessonTitle(""); setLessonUrl(""); setLessonFree(false); setAddingLesson(false);
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
      {/* Module header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(255,255,255,0.02)", cursor: "pointer" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", minWidth: 24 }}>M{index + 1}</span>

        {editingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={confirmTitle}
            onKeyDown={e => { if (e.key === "Enter") confirmTitle(); if (e.key === "Escape") { setTitle(module.title); setEditingTitle(false); } }}
            style={{ ...inputS, flex: 1, padding: "6px 10px", fontSize: 13 }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }} onClick={onToggle}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{module.title}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              · {module.lessons.length} lección{module.lessons.length !== 1 ? "es" : ""}
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: 4 }}>
          {!editingTitle && (
            <button onClick={e => { e.stopPropagation(); setEditingTitle(true); }}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "4px 6px", borderRadius: 6, fontSize: 13 }}>
              ✎
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ background: "none", border: "none", color: "rgba(232,0,74,0.4)", cursor: "pointer", padding: "4px 6px", borderRadius: 6, fontSize: 16, lineHeight: 1 }}>
            ×
          </button>
          <button onClick={onToggle}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "4px 6px", borderRadius: 6, fontSize: 12, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▾
          </button>
        </div>
      </div>

      {/* Lessons */}
      {expanded && (
        <div style={{ padding: "8px 16px 14px" }}>
          {module.lessons.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {module.lessons.map((lesson, li) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  index={li}
                  moduleIndex={index}
                  onDelete={() => onDeleteLesson(lesson.id)}
                  onUpdate={onUpdateLesson}
                />
              ))}
            </div>
          )}

          {addingLesson ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <input
                autoFocus
                value={lessonTitle}
                onChange={e => setLessonTitle(e.target.value)}
                placeholder="Nombre de la lección"
                style={{ ...inputS, padding: "8px 12px" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={lessonUrl}
                  onChange={e => setLessonUrl(e.target.value)}
                  placeholder="Link del video (YouTube o Vimeo)"
                  style={{ ...inputS, flex: 1, padding: "8px 12px", borderColor: lessonUrl && !getEmbed(lessonUrl) ? "rgba(232,0,74,0.4)" : lessonUrl && getEmbed(lessonUrl) ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                  <input type="checkbox" checked={lessonFree} onChange={e => setLessonFree(e.target.checked)}
                    style={{ accentColor: "var(--color-primary,#3589F2)" }} />
                  Preview gratis
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setAddingLesson(false); setLessonTitle(""); setLessonUrl(""); }}
                    style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                    Cancelar
                  </button>
                  <button onClick={handleAddLesson}
                    style={{ padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "var(--color-primary,#3589F2)", color: "#fff", border: "none", cursor: "pointer" }}>
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingLesson(true)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: "1px dashed rgba(53,137,242,0.25)", background: "rgba(53,137,242,0.05)", color: "var(--color-primary,#3589F2)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Icons.plus size={13} /> Agregar lección
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── LESSON ROW ────────────────────────────────────────
function LessonRow({ lesson, index, moduleIndex, onDelete, onUpdate }: {
  lesson: Lesson; index: number; moduleIndex: number;
  onDelete: () => void;
  onUpdate: (l: Lesson) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [url, setUrl] = useState(lesson.video_url || "");
  const [free, setFree] = useState(lesson.is_free_preview);
  const [showPreview, setShowPreview] = useState(false);

  const embedUrl = getEmbed(url);
  const isValid = !!embedUrl;

  function save() {
    onUpdate({ ...lesson, title, video_url: url || null, is_free_preview: free });
    setEditing(false);
    setShowPreview(false);
  }

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: 8, marginBottom: 8 }}>
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", minWidth: 32, paddingTop: 10, fontWeight: 600 }}>
              {moduleIndex + 1}.{index + 1}
            </span>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <input value={title} onChange={e => setTitle(e.target.value)}
                style={{ ...inputS, padding: "7px 10px" }} />
              <div style={{ display: "flex", gap: 6 }}>
                <input value={url} onChange={e => { setUrl(e.target.value); setShowPreview(false); }}
                  placeholder="Link del video (YouTube o Vimeo)"
                  style={{ ...inputS, flex: 1, padding: "7px 10px", fontSize: 12, borderColor: url && !isValid ? "rgba(232,0,74,0.4)" : url && isValid ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)" }} />
                {isValid && (
                  <button type="button" onClick={() => setShowPreview(v => !v)}
                    style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(53,137,242,0.3)", background: "rgba(53,137,242,0.1)", color: "var(--color-primary,#3589F2)", whiteSpace: "nowrap" }}>
                    {showPreview ? "Ocultar" : "▶"}
                  </button>
                )}
              </div>
              {showPreview && embedUrl && (
                <div style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "16/9", background: "#000" }}>
                  <iframe src={embedUrl} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; fullscreen" allowFullScreen />
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 40 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
              <input type="checkbox" checked={free} onChange={e => setFree(e.target.checked)} style={{ accentColor: "var(--color-primary,#3589F2)" }} />
              Preview gratis
            </label>
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => { setTitle(lesson.title); setUrl(lesson.video_url || ""); setFree(lesson.is_free_preview); setEditing(false); setShowPreview(false); }}
                style={{ padding: "4px 10px", borderRadius: 7, fontSize: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={save}
                style={{ padding: "4px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, background: "var(--color-primary,#3589F2)", color: "#fff", border: "none", cursor: "pointer" }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", minWidth: 32, fontWeight: 600 }}>
            {moduleIndex + 1}.{index + 1}
          </span>
          <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.7)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {lesson.title}
          </span>
          {lesson.is_free_preview && (
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "rgba(53,137,242,0.1)", border: "1px solid rgba(53,137,242,0.2)", color: "var(--color-primary,#3589F2)", fontWeight: 600, flexShrink: 0 }}>
              Gratis
            </span>
          )}
          {lesson.video_url ? (
            <span style={{ fontSize: 10, color: "#4ade80", flexShrink: 0 }}>✓ Video</span>
          ) : (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>Sin video</span>
          )}
          <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
            <button onClick={() => setEditing(true)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "3px 5px", borderRadius: 5, fontSize: 13 }}>
              ✎
            </button>
            <button onClick={onDelete}
              style={{ background: "none", border: "none", color: "rgba(232,0,74,0.4)", cursor: "pointer", padding: "3px 5px", borderRadius: 5, fontSize: 16, lineHeight: 1 }}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// TAB: RESTRICCIONES
// ══════════════════════════════════════════════════════
function RestrictionsTab({ course, onChange, onSave, saving }: {
  course: Course;
  onChange: (c: Course) => void;
  onSave: (p: Partial<Course>) => Promise<void>;
  saving: boolean;
}) {
  const [showLanding, setShowLanding] = useState(course.show_in_landing);
  const [showStore, setShowStore]     = useState(course.show_in_store);
  const [scheduledAt, setScheduledAt] = useState(
    course.scheduled_at ? new Date(course.scheduled_at).toISOString().slice(0, 16) : ""
  );

  async function handleSave() {
    await onSave({ show_in_landing: showLanding, show_in_store: showStore, scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null });
    onChange({ ...course, show_in_landing: showLanding, show_in_store: showStore });
  }

  const isPrivate = !showLanding && !showStore;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <div style={cardS}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px 0" }}>
          Visibilidad
        </p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 16px 0" }}>
          Controla dónde aparece este contenido públicamente.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { key: "landing", val: showLanding, set: setShowLanding, label: "Mostrar en la landing", desc: "Aparece en la sección de cursos de la página principal" },
            { key: "store",   val: showStore,   set: setShowStore,   label: "Mostrar en la tienda",  desc: "Aparece en /tienda con precio y botón de compra" },
          ].map(opt => (
            <label key={opt.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${opt.val ? "rgba(53,137,242,0.2)" : "rgba(255,255,255,0.07)"}`, cursor: "pointer", transition: "all 0.15s" }}>
              <input type="checkbox" checked={opt.val} onChange={e => opt.set(e.target.checked)}
                style={{ accentColor: "var(--color-primary,#3589F2)", width: 16, height: 16, marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 1px 0" }}>{opt.label}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {isPrivate && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
            🔒 <strong style={{ color: "#fbbf24" }}>Aula privada</strong> — solo accesible para alumnos con acceso asignado manualmente desde el panel de usuarios.
          </div>
        )}
      </div>

      <div style={cardS}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px 0" }}>
          Programar publicación
        </p>
        <Field label="Fecha y hora" hint="Si se establece una fecha, el curso se publicará automáticamente en ese momento.">
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
            style={{ ...inputS, color: scheduledAt ? "#fff" : "rgba(255,255,255,0.5)" }} />
        </Field>
        {scheduledAt && (
          <button onClick={() => setScheduledAt("")}
            style={{ marginTop: 8, fontSize: 12, color: "rgba(232,0,74,0.6)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            × Quitar fecha programada
          </button>
        )}
      </div>

      <button onClick={handleSave} disabled={saving}
        style={{ padding: "12px 0", borderRadius: 12, fontSize: 13, fontWeight: 700, background: "var(--color-primary,#3589F2)", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
        {saving ? "Guardando..." : "Guardar restricciones"}
      </button>
    </div>
  );
}
