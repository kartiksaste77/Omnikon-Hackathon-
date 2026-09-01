"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { INITIAL_USERS } from "@/lib/seedData";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("alex@skillswap.edu");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const res = await login(email, password);
    if (!res.success) {
      setErrorMessage(res.error || "Authentication failed.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  const handleQuickLogin = async (demoUser) => {
    setLoading(true);
    setErrorMessage("");
    const res = await login(demoUser.email, "password123");
    if (res.success) {
      router.push("/dashboard");
    } else {
      setErrorMessage(res.error || "Quick login failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090d16] bg-radial relative">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10 space-y-6 animate-in fade-in">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 shadow-lg shadow-indigo-500/30 mb-2">
            <Sparkles className="h-6 w-6 text-white" />
          </Link>
          <h2 className="text-2xl font-bold text-white">Welcome back to SkillSwap</h2>
          <p className="text-xs text-slate-400">Secure JWT Authentication with time-bank wallet sync</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in shake">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Demo Student Switcher */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block text-center">
            ⚡ 1-Click Instant Demo Login:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {INITIAL_USERS.slice(0, 4).map((u) => (
              <button
                key={u.id}
                onClick={() => handleQuickLogin(u)}
                className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-transparent text-left transition-all group"
              >
                <img src={u.avatar} alt={u.name} className="h-7 w-7 rounded-full object-cover" />
                <div className="overflow-hidden">
                  <p className="text-[11px] font-semibold text-white truncate group-hover:text-indigo-300">{u.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{u.role.split("&")[0]}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Standard Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Campus Email Address</label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-2.5 text-xs text-white"
                placeholder="student@skillswap.edu"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-2.5 text-xs text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            {loading ? "Verifying Credentials..." : "Sign In to Dashboard"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Don't have an account yet?{" "}
          <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Create Campus Profile
          </Link>
        </p>

      </div>
    </div>
  );
}
