import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "SkillSwap — Peer Skill Exchange & Campus Mentorship",
  description: "Peer-to-peer student skill exchange with zero-cost time-bank economy, AI match scoring, interactive WebRTC video conference, and gamification.",
  keywords: ["SkillSwap", "EdTech", "Peer Mentorship", "Time Bank", "Campus Learning", "AI Roadmaps", "Interactive Whiteboard"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
