"use client";
import { useState } from "react";
import Link from "next/link";
import { Zap, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const result = resetPassword(email);
    if (result.success) { setSent(true); } else { setError(result.error); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#09090D] relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight font-[Outfit]">Skill<span className="text-red-500">Swap</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white font-[Outfit]">Reset Password</h1>
          <p className="text-sm text-slate-400 mt-1">Enter your email to receive a reset link</p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-6">
          {sent ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Check Your Email</h3>
              <p className="text-sm text-slate-400">We've sent a password reset link to <strong className="text-white">{email}</strong></p>
              <Link href="/auth/login" className="btn-secondary text-sm inline-flex">Back to Login</Link>
            </div>
          ) : (
            <>
              {error && <div className="bg-red-950/80 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@campus.edu" className="input-base pl-10" />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full py-3">Send Reset Link <ArrowRight className="h-4 w-4" /></button>
              </form>
              <p className="text-center text-sm text-slate-400">
                <Link href="/auth/login" className="text-red-400 hover:text-red-300 font-semibold">Back to Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
