import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKYG Template Academy",
  description: "Aprende con los mejores cursos digitales. Educación profesional en línea.",
  openGraph: {
    title: "SKYG Template Academy",
    description: "Aprende con los mejores cursos digitales.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="noise-bg min-h-screen">
        {children}
      </body>
    </html>
  );
}
