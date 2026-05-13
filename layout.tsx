import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@supabase/supabase-js";
import NavWrapper from "@/components/layout/NavWrapper";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "SKYG Template Academy",
  description: "Aprende con los mejores cursos digitales.",
};

async function getTheme() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase.from("theme").select("*").eq("id", 1).single();
    return data;
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();

  const displayFont = theme?.font_display || "Sora";
  const bodyFont = theme?.font_body || "DM Sans";
  const fontQuery = [...new Set([displayFont, bodyFont])]
    .map(f => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700;800`)
    .join("&");
  const fontUrl = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;

  const themeCSS = `
    :root {
      --bg-base: ${theme?.bg_color || "#070B12"};
      --bg-surface: ${theme?.surface_color || "#0D1421"};
      --color-primary: ${theme?.primary_color || "#3589F2"};
      --color-accent: ${theme?.accent_color || "#E8004A"};
      --color-text: ${theme?.text_color || "#E8EFF8"};
      --color-muted: ${theme?.muted_color || "#8FA4C4"};
      --glow-color: ${theme?.glow_color || "rgba(53,137,242,0.13)"};
      --glow-accent: ${theme?.glow_accent_color || "rgba(232,0,74,0.07)"};
      --font-display: "${displayFont}", sans-serif;
      --font-body: "${bodyFont}", sans-serif;
    }
    body {
      background-color: var(--bg-base);
      color: var(--color-text);
      font-family: var(--font-body);
    }
    body::before {
      background:
        radial-gradient(ellipse 80% 60% at 50% -10%, var(--glow-color) 0%, transparent 55%),
        radial-gradient(ellipse 50% 50% at 100% 100%, var(--glow-accent) 0%, transparent 55%);
    }
    .font-display { font-family: var(--font-display) !important; }
    .text-primary { color: var(--color-primary) !important; }
    .bg-primary { background-color: var(--color-primary) !important; }
    .bg-primary-dark { background-color: color-mix(in srgb, var(--color-primary) 80%, black) !important; }
    .border-primary { border-color: var(--color-primary) !important; }
    .text-accent { color: var(--color-accent) !important; }
    .bg-accent { background-color: var(--color-accent) !important; }
    .text-muted { color: var(--color-muted) !important; }
    /* Padding for fixed header on desktop */
    .with-header { padding-top: 62px; }
    /* Safe area for mobile bottom nav */
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
    }
  `;

  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={fontUrl} rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
        {theme?.brand_name && <title>{theme.brand_name}</title>}
      </head>
      {/*
        pb-[68px] md:pb-0 → espacio para el nav bottom en móvil
        El Header incluye spacers que empujan el contenido bajo el nav fijo
      */}
      <body className="noise-bg min-h-screen pb-[68px] md:pb-0">
        <NavWrapper>
          <Header />
        </NavWrapper>
        {children}
      </body>
    </html>
  );
}
