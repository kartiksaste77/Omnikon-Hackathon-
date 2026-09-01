"use client";

import React from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Coins, 
  Compass, 
  Video, 
  ShieldCheck, 
  Trophy, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Star,
  Flame,
  Layers,
  Code2
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090d16]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Skill<span className="text-gradient">Swap</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/dashboard"
              className="btn-primary text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              Launch Platform
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Glowing Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 animate-pulse">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          Zero-Cost Time-Bank Peer Mentorship Economy
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-white leading-tight">
          Exchange Skills on Campus with <span className="text-gradient">Zero Money</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          <strong className="text-white">1 Hour Taught = 10 SkillCoins = 1 Hour Learned.</strong> Connect with top peer mentors, build AI-powered learning roadmaps, and collaborate in live virtual rooms.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="btn-primary px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2.5 shadow-xl shadow-indigo-500/30 hover:scale-105 transition-all"
          >
            Explore Dashboard Demo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/matches"
            className="btn-secondary px-6 py-3.5 rounded-2xl text-sm font-semibold flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-cyan-400" />
            Calculate AI Match Score
          </Link>
        </div>

        {/* Live Metrics Showcase */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">100%</div>
            <div className="text-xs text-slate-400 mt-1">Zero-Cost Campus Model</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-gradient">98.4%</div>
            <div className="text-xs text-slate-400 mt-1">AI Match Compatibility</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">10 Coins</div>
            <div className="text-xs text-slate-400 mt-1">Per Hour Taught</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">4.95 ★</div>
            <div className="text-xs text-slate-400 mt-1">Average Peer Rating</div>
          </div>
        </div>

      </section>

      {/* Feature Cards Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">Engineered for Seamless Peer Exchange</h2>
          <p className="text-sm text-slate-400 mt-2">Everything students need to teach, learn, and verify skills in one place.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="glass-card p-6 flex flex-col justify-between group hover:border-indigo-500/40">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Match Scoring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our semantic match engine pairs you with mentors based on skill overlaps, schedule availability, and mutual exchange synergy.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs font-semibold text-indigo-400 gap-1">
              Explore Matches <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 flex flex-col justify-between group hover:border-cyan-500/40">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Interactive Virtual Classroom</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Includes WebRTC video feeds, a shared drawing whiteboard, and a real-time JavaScript code playground with instant execution.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs font-semibold text-cyan-400 gap-1">
              Live Conference Room <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 flex flex-col justify-between group hover:border-amber-500/40">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Dual Check-In Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                4-digit OTP codes and animated QR scans prevent no-shows. Escrow coins are released automatically upon mutual check-in.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs font-semibold text-amber-400 gap-1">
              Escrow Protection <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 py-8 px-4 text-center text-xs text-slate-500">
        <p>© 2026 SkillSwap — Peer Skill Exchange & Mentorship Network. Built for students worldwide.</p>
      </footer>

    </div>
  );
}
