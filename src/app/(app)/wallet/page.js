"use client";
import { useAuth } from "@/context/AuthContext";
import db from "@/lib/mockDatabase";
import { Coins, ArrowUpRight, ArrowDownLeft, Award, TrendingUp } from "lucide-react";

export default function WalletPage() {
  const { user } = useAuth();
  if (!user) return null;

  const txs = db.getTransactions(user.id);

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <h1 className="text-2xl font-bold text-white font-[Outfit] flex items-center gap-2"><Coins className="h-6 w-6 text-amber-400" /> SkillCoin Wallet</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-red rounded-2xl p-5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-red-300">Balance</span>
          <div className="text-3xl font-extrabold text-white font-mono">{user.skillCoins || 0}</div>
          <span className="text-xs text-slate-300">SkillCoins</span>
        </div>
        <div className="glass rounded-2xl p-5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-emerald-400">Total Earned</span>
          <div className="text-3xl font-extrabold text-white font-mono">
            {txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)}
          </div>
          <span className="text-xs text-slate-400">From teaching & bonuses</span>
        </div>
        <div className="glass rounded-2xl p-5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-red-400">Total Spent</span>
          <div className="text-3xl font-extrabold text-white font-mono">
            {Math.abs(txs.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))}
          </div>
          <span className="text-xs text-slate-400">On learning sessions</span>
        </div>
      </div>

      <div className="glass rounded-xl p-4 text-xs text-slate-300 space-y-1 bg-slate-900/60">
        <div className="font-bold text-white text-sm">How SkillCoins Work</div>
        <p>• Teach 1 hour → <span className="text-emerald-400 font-bold">+10 SkillCoins</span></p>
        <p>• Complete a learning session → <span className="text-emerald-400 font-bold">+5 XP</span></p>
        <p>• Learning streak bonus → <span className="text-amber-400 font-bold">+5 SkillCoins</span></p>
        <p>• 100% free — no money involved</p>
      </div>

      <div className="glass rounded-2xl p-5 space-y-3">
        <h2 className="text-base font-bold text-white">Transaction History</h2>
        {txs.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No transactions yet. Start teaching or learning!</p>
        ) : (
          txs.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-sm">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${tx.amount > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {tx.type === "earned" ? <ArrowDownLeft className="h-4 w-4" /> : tx.type === "bonus" ? <Award className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div>
                  <div className="text-slate-200 font-medium">{tx.description}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{tx.timestamp?.split("T")[0]}</div>
                </div>
              </div>
              <span className={`font-mono font-bold ${tx.amount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {tx.amount > 0 ? "+" : ""}{tx.amount}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
