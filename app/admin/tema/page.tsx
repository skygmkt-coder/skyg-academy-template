import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { saveTheme, resetTheme } from "./actions";

const FONTS = ["Sora","Inter","DM Sans","Plus Jakarta Sans","Nunito","Poppins","Raleway","Montserrat","Lato","Open Sans"];

const iS: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
  padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box",
};

function F({label, children, hint}: {label:string; children:React.ReactNode; hint?:string}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</label>
      {children}
      {hint && <p style={{fontSize:11,color:"rgba(255,255,255,0.2)",margin:0}}>{hint}</p>}
    </div>
  );
}

function ColorField({name,label,defaultValue}: {name:string;label:string;defaultValue:string}) {
  return (
    <F label={label}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <input name={name} type="color" defaultValue={defaultValue}
          style={{width:40,height:40,borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"transparent",cursor:"pointer",padding:2}} />
        <input type="text" defaultValue={defaultValue} readOnly
          style={{...iS,flex:1,fontFamily:"monospace",fontSize:12}} />
      </div>
    </F>
  );
}

export default async function TemaPage({ searchParams }: { searchParams: Promise<{saved?:string}> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles")
    .select("is_super_admin").eq("id", user.id).single();
  if (!profile?.is_super_admin) redirect("/admin");

  // Safe fetch - theme table may not exist yet
  let theme: any = null;
  try {
    const { data } = await supabase.from("theme").select("*").eq("id", 1).single();
    theme = data;
  } catch { /* theme table doesn't exist yet */ }

  const t = theme || {};
  const brand_name = t.brand_name || "SKYG Academy";
  const primary = t.primary_color || "#3589F2";
  const accent = t.accent_color || "#E8004A";
  const bg = t.bg_color || "#070B12";
  const surface = t.surface_color || "#0D1421";
  const glow = t.glow_color || "rgba(53,137,242,0.13)";
  const glowAccent = t.glow_accent_color || "rgba(232,0,74,0.07)";
  const textColor = t.text_color || "#E8EFF8";
  const muted = t.muted_color || "#8FA4C4";
  const fontDisplay = t.font_display || "Sora";
  const fontBody = t.font_body || "DM Sans";

  return (
    <div style={{maxWidth:700}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:"#fff",margin:0,fontFamily:"var(--font-display,Sora,sans-serif)"}}>Tema y marca</h1>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",margin:"4px 0 0 0"}}>Personaliza la identidad visual de tu academia</p>
        </div>
        <form action={resetTheme}>
          <button type="submit" style={{fontSize:12,color:"rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"8px 14px",cursor:"pointer"}}
            onClick={e=>{if(!confirm("¿Restaurar valores por defecto?"))e.preventDefault()}}>
            Restaurar
          </button>
        </form>
      </div>

      {sp.saved && (
        <div style={{marginBottom:20,padding:"12px 16px",borderRadius:12,background:"rgba(22,163,74,0.1)",border:"1px solid rgba(22,163,74,0.2)",color:"#4ade80",fontSize:13}}>
          ✓ Cambios guardados
        </div>
      )}

      {!theme && (
        <div style={{marginBottom:20,padding:"12px 16px",borderRadius:12,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",color:"#fbbf24",fontSize:13}}>
          ⚠ La tabla de tema no existe aún. Ejecuta el SQL de migraciones en Supabase primero.
        </div>
      )}

      <form action={saveTheme} encType="multipart/form-data" style={{display:"flex",flexDirection:"column",gap:16}}>

        {/* Brand */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:24}}>
          <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 16px 0"}}>Identidad de marca</p>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <F label="Nombre de la academia">
              <input name="brand_name" defaultValue={brand_name} style={iS} />
            </F>
            <F label="Logo" hint="PNG, SVG o WebP recomendado">
              {t.logo_url && (
                <div style={{marginBottom:8,padding:8,background:"rgba(255,255,255,0.03)",borderRadius:8,display:"inline-flex",alignItems:"center",gap:8}}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.logo_url} alt="Logo" style={{height:32,objectFit:"contain"}} />
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Logo actual</span>
                </div>
              )}
              <input name="logo_file" type="file" accept="image/*" style={{...iS,padding:"8px 14px",cursor:"pointer"}} />
            </F>
          </div>
        </div>

        {/* Colors */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:24}}>
          <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 16px 0"}}>Colores</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <ColorField name="primary_color" label="Color primario" defaultValue={primary} />
            <ColorField name="accent_color" label="Color acento" defaultValue={accent} />
            <ColorField name="bg_color" label="Fondo base" defaultValue={bg} />
            <ColorField name="surface_color" label="Fondo superficies" defaultValue={surface} />
            <ColorField name="text_color" label="Texto principal" defaultValue={textColor} />
            <ColorField name="muted_color" label="Texto secundario" defaultValue={muted} />
          </div>
        </div>

        {/* Glow */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:24}}>
          <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 6px 0"}}>Efecto de luz (glow)</p>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.3)",margin:"0 0 14px 0"}}>
            Usa formato rgba(r,g,b,opacidad). Para desactivar: rgba(0,0,0,0)
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <F label="Glow superior (color primario)">
              <input name="glow_color" defaultValue={glow} placeholder="rgba(53,137,242,0.13)" style={{...iS,fontFamily:"monospace"}} />
            </F>
            <F label="Glow inferior (color acento)">
              <input name="glow_accent_color" defaultValue={glowAccent} placeholder="rgba(232,0,74,0.07)" style={{...iS,fontFamily:"monospace"}} />
            </F>
          </div>
        </div>

        {/* Typography */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:24}}>
          <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 16px 0"}}>Tipografía</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <F label="Fuente de títulos">
              <select name="font_display" defaultValue={fontDisplay} style={iS}>
                {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
              </select>
            </F>
            <F label="Fuente de texto">
              <select name="font_body" defaultValue={fontBody} style={iS}>
                {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
              </select>
            </F>
          </div>
        </div>

        <button type="submit" style={{padding:"14px 0",borderRadius:12,fontSize:14,fontWeight:700,background:"var(--color-primary,#3589F2)",color:"#fff",border:"none",cursor:"pointer"}}>
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
