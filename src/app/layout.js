import "./globals.css";

export const metadata = {
  title: "SkillSwap — Peer Skill Exchange & Mentorship",
  description: "Zero-cost peer-to-peer skill exchange platform. Teach what you know, learn what matters. Omnikon National Hackathon 2026.",
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
      </head>
      <body className="min-h-screen bg-[#09090D] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
