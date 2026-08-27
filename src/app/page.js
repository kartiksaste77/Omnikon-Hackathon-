"use client";
import Link from "next/link";
import { Zap, ArrowRight, BookOpen, Users, Brain, MessageSquare, Trophy, Shield, Sparkles, CheckCircle2, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090D] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="bg-dots absolute inset-0 opacity-30 pointer-events-none" />

      {/* Nav */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/30">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight font-[Outfit]">Skill<span className="text-red-500">Swap</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-secondary text-sm px-4 py-2">Log In</Link>
          <Link href="/auth/register" className="btn-primary text-sm px-5 py-2">Get Started Free</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-20 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          Omnikon National Hackathon 2026 — EdTech & Skill Development
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight font-[Outfit]">
          Teach what you know.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-amber-400">Learn what matters.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Zero-cost peer-to-peer skill exchange platform powered by AI matching. Every hour you teach earns you an hour to learn — no money needed.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/register" className="btn-primary text-base px-8 py-3.5 rounded-xl shadow-xl shadow-red-600/25">
            <Zap className="h-5 w-5" /> Start Swapping Skills <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/auth/login" className="btn-secondary text-base px-8 py-3.5">
            I Already Have an Account
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500 font-mono">1 Hour Taught = 1 SkillCoin Earned = 1 Hour Learned</p>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center font-[Outfit] mb-12">How SkillSwap Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: "01", icon: <BookOpen className="h-6 w-6" />, title: "Declare Your Edge", desc: "List the skills you can teach and the skills you want to learn with proficiency levels." },
            { step: "02", icon: <Brain className="h-6 w-6" />, title: "AI-Powered Matching", desc: "Our AI finds peers with complementary skills, overlapping schedules, and shared interests." },
            { step: "03", icon: <MessageSquare className="h-6 w-6" />, title: "Connect & Schedule", desc: "Send connection requests, chat with peers, and schedule 1:1 skill exchange sessions." },
            { step: "04", icon: <Trophy className="h-6 w-6" />, title: "Exchange & Grow", desc: "Teach, learn, earn SkillCoins, collect badges, and climb the leaderboard." },
          ].map((item) => (
            <div key={item.step} className="glass glass-hover rounded-2xl p-6 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/30">{item.icon}</div>
              <div className="text-xs font-mono text-red-400 font-bold">STEP {item.step}</div>
              <h3 className="text-lg font-bold text-white">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center font-[Outfit] mb-4">Everything You Need</h2>
        <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">A complete platform for peer-to-peer skill exchange, powered by AI and gamification.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: <Brain className="h-5 w-5 text-red-400" />, title: "AI Skill Matching", desc: "Intelligent matching that understands related skills — not just exact keywords.", color: "red" },
            { icon: <BookOpen className="h-5 w-5 text-emerald-400" />, title: "AI Learning Roadmap", desc: "Personalized learning paths with milestones, resources, and timeline estimates.", color: "emerald" },
            { icon: <MessageSquare className="h-5 w-5 text-sky-400" />, title: "Real-Time Chat", desc: "Message your peers, share session info, and coordinate skill exchanges.", color: "sky" },
            { icon: <Users className="h-5 w-5 text-amber-400" />, title: "Session Scheduling", desc: "Book 1:1 sessions, pick date/time, track upcoming & completed exchanges.", color: "amber" },
            { icon: <Star className="h-5 w-5 text-purple-400" />, title: "Reviews & Ratings", desc: "Rate sessions, give feedback, and build your reputation on campus.", color: "purple" },
            { icon: <Trophy className="h-5 w-5 text-yellow-400" />, title: "SkillCoins & Badges", desc: "Earn coins by teaching, unlock badges, maintain streaks, top the leaderboard.", color: "yellow" },
          ].map((f, i) => (
            <div key={i} className="glass glass-hover rounded-xl p-5 space-y-2">
              <div className={`h-9 w-9 rounded-lg bg-${f.color}-500/10 border border-${f.color}-500/20 flex items-center justify-center`}>{f.icon}</div>
              <h3 className="text-base font-bold text-white">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="glass-red rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "49+", label: "Skills Available" },
            { value: "8+", label: "Active Users" },
            { value: "100%", label: "Free Forever" },
            { value: "AI", label: "Powered Matching" },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl font-black text-white font-mono">{s.value}</div>
              <div className="text-sm text-slate-300 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-white font-[Outfit] mb-4">Ready to Start Swapping Skills?</h2>
        <p className="text-slate-400 mb-8">Join the peer-to-peer skill revolution. Zero cost. Maximum growth.</p>
        <Link href="/auth/register" className="btn-primary text-base px-10 py-4 rounded-xl shadow-xl shadow-red-600/25">
          <Zap className="h-5 w-5" /> Create Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#060609] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-red-500" />
            <span className="font-bold text-white font-[Outfit]">SkillSwap</span>
            <span className="text-slate-500">•</span>
            <span>Omnikon National Hackathon 2026</span>
          </div>
          <div className="font-mono">
            Team <strong className="text-white">kartiksaste11</strong> (Kartik Saste & Karan Rathod)
          </div>
        </div>
      </footer>
    </div>
  );
}
