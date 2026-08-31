import "./globals.css";

export const metadata = {
  title: "SkillSwap — Peer Skill Exchange & Mentorship",
  description:
    "Zero-cost peer-to-peer skill exchange platform. Teach what you know, learn what matters. Omnikon National Hackathon 2026.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SkillSwap",
  },
  openGraph: {
    title: "SkillSwap — Trade Skills, Grow Together",
    description: "AI-powered peer-to-peer skill exchange. Teach what you know, learn what you don't.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#FF3B30",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-[#09090D] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
