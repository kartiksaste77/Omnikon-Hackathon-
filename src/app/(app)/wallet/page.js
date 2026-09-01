"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock, 
  Gift, 
  Clock, 
  ShieldCheck, 
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { INITIAL_TRANSACTIONS } from "@/lib/seedData";
import confetti from "canvas-confetti";

export default function WalletPage() {
  const { user, modifyCoins } = useAuth();
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [claimedDaily, setClaimedDaily] = useState(false);

  const handleClaimDaily = () => {
    if (claimedDaily) return;
    modifyCoins(5);
    setClaimedDaily(true);
    setTransactions([
      {
        id: `tx_${Date.now()}`,
        userId: user?.id || "user_1",
        amount: 5,
        type: "BONUS",
        description: "Daily campus learning check-in bonus",
        date: new Date().toISOString()
      },
      ...transactions
    ]);

    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
          <Coins className="h-3.5 w-3.5 text-amber-400" />
          Time-Bank Campus Ledger
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">SkillCoin Wallet</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          A zero-cost, equitable time-bank currency where 1 Hour Taught = 10 SkillCoins = 1 Hour Learned.
        </p>
      </div>

      {/* Wallet Balance Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Available Balance */}
        <div className="glass-card p-6 border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Available SkillCoins</span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Coins className="h-5 w-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-amber-300">{user?.coins ?? 50}</span>
            <span className="text-xs text-slate-400 font-medium">SkillCoins</span>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
            <span>Equivalent Value:</span>
            <strong className="text-white">{Math.floor((user?.coins ?? 50) / 10)} Hours of Learning</strong>
          </div>
        </div>

        {/* Escrow Lock Protection */}
        <div className="glass-card p-6 border border-indigo-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Coins in Escrow</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-indigo-300">10</span>
            <span className="text-xs text-slate-400 font-medium">Locked in Active Booking</span>
          </div>

          <div className="pt-2 border-t border-white/5 text-xs text-slate-400">
            Released to mentor upon OTP/Virtual check-in.
          </div>
        </div>

        {/* Daily Community Bonus */}
        <div className="glass-card p-6 border border-emerald-500/20 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Daily Bonus</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Gift className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-300">Claim 5 free SkillCoins daily for campus activity.</p>
          </div>

          <button
            onClick={handleClaimDaily}
            disabled={claimedDaily}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
              claimedDaily
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                : "btn-primary shadow-lg shadow-indigo-600/30"
            }`}
          >
            {claimedDaily ? "✓ Claimed for Today (+5 Coins)" : "Claim Daily Bonus (+5 Coins)"}
          </button>
        </div>

      </div>

      {/* Transaction History Ledger */}
      <div className="glass-card p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            Time-Bank Transaction Ledger
          </h2>
          <span className="text-xs text-slate-400">{transactions.length} Transactions</span>
        </div>

        <div className="divide-y divide-white/5">
          {transactions.map((tx) => {
            const isPositive = tx.amount > 0;
            return (
              <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isPositive
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {isPositive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{tx.description}</p>
                    <p className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleDateString()} • {tx.type}</p>
                  </div>
                </div>

                <div className={`text-xs font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                  {isPositive ? `+${tx.amount}` : tx.amount} Coins
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
