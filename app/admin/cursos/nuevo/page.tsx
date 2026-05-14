import NuevoCursoClient from "@/components/course/NuevoCursoClient";

export default function NuevoCursoPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <a href="/admin/cursos"
          style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
          ← Cursos
        </a>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
        <h1 style={{
          fontSize: 22, fontWeight: 800, color: "#fff", margin: 0,
          fontFamily: "var(--font-display,Sora,sans-serif)",
        }}>
          Nuevo contenido
        </h1>
      </div>
      <NuevoCursoClient />
    </div>
  );
}
