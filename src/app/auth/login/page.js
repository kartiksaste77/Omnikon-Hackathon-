"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Invalid email or password.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#09090D] relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="bg-dots absolute inset-0 opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight font-[Outfit]">Skill<span className="text-red-500">Swap</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white font-[Outfit]">Welcome Back</h1>
          <p className="text-sm text-slate-400 mt-1">Log in to continue swapping skills</p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-6">
          {error && (
            <div className="bg-red-950/80 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          {/* Quick demo login hint */}
          <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">🎮 Demo Accounts:</p>
            <p><strong>kartik@campus.edu</strong> / password123</p>
            <p><strong>sarah@campus.edu</strong> / password123</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@campus.edu"
                  className="input-base pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs text-red-400 hover:text-red-300">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? "Signing in..." : "Sign In"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="text-center text-sm text-slate-400">
            Don't have an account? <Link href="/auth/register" className="text-red-400 hover:text-red-300 font-semibold">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
