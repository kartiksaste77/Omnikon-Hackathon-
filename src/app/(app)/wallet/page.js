"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/apiClient";
import {
  Coins, ArrowUpRight, ArrowDownLeft, Award, Send, TrendingUp,
  Users, X, CheckCircle2, AlertCircle, Zap, Gift
} from "lucide-react";

const EARN_TIPS = [
  { icon: "🎓", label: "Teach a session", coins: "+10 coins", desc: "Complete a 1-hour teaching session" },
  { icon: "📚", label: "Complete learning", coins: "+5 coins", desc: "Finish learning a skill from a mentor" },
  { icon: "🔥", label: "Daily streak", coins: "+5 coins", desc: "Log in 7 days in a row" },
  { icon: "⭐", label: "Leave a review", coins: "+2 coins", desc: "Review after every session" },
  { icon: "🤝", label: "Refer a friend", coins: "+15 coins", desc: "Invite someone who signs up" },
];

function SparklineBar({ value, max }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="relative w-full h-16 flex items-end">
        <div
          className="w-full rounded-t bg-gradient-to-t from-red-600 to-amber-500 transition-all duration-500"
          style={{ height: `${Math.max(4, pct)}%` }}
        />
      </div>
      <span className="text-[8px] text-slate-600 font-mono">{value}</span>
    </div>
  );
}

export default function WalletPage() {
  const { user, updateProfile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendNote, setSendNote] = useState("");
  const [sendStatus, setSendStatus] = useState(null); // null | "loading" | "success" | "error"
  const [sendError, setSendError] = useState("");
  const [balance, setBalance] = useState(user?.skillCoins || 0);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [txData, connData] = await Promise.all([
        apiClient.get("/api/transactions"),
        apiClient.get("/api/connections"),
      ]);
      setTransactions(txData || []);
      setConnections((connData || []).filter(c => c.status === "accepted"));
    } catch (e) {
      console.warn("Wallet load failed:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setBalance(user?.skillCoins || 0);
  }, [user?.skillCoins]);

  const totalEarned = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalSpent = Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  // Build last-7-days chart data
  const chartData = (() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toDateString();
    });
    return days.map(day => {
      const earned = transactions
        .filter(t => new Date(t.createdAt).toDateString() === day && t.amount > 0)
        .reduce((s, t) => s + t.amount, 0);
      return earned;
    });
  })();
  const chartMax = Math.max(...chartData, 1);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!sendTo || !sendAmount) return;
    const amount = parseInt(sendAmount);
    if (isNaN(amount) || amount < 1) {
      setSendError("Enter a valid amount (minimum 1)");
      return;
    }
    if (amount > balance) {
      setSendError(`You only have ${balance} coins`);
      return;
    }

    setSendStatus("loading");
    setSendError("");
    try {
      const receiver = connections.find(c =>
        (c.sender?.id === sendTo || c.receiver?.id === sendTo)
      );
      const receiverId = receiver
        ? (receiver.sender?.id === user.id ? receiver.receiver?.id : receiver.sender?.id)
        : sendTo;

      const res = await apiClient.post("/api/transactions/send", {
        receiverId,
        amount,
        note: sendNote,
      });
      setBalance(res.newBalance);
      setSendStatus("success");
      setTransactions(prev => [res.transaction, ...prev]);
      setTimeout(() => {
        setShowSend(false);
        setSendStatus(null);
        setSendTo("");
        setSendAmount("");
        setSendNote("");
      }, 2000);
    } catch (err) {
      setSendError(err.message || "Transaction failed");
      setSendStatus("error");
    }
  };

  const txIcon = (type) => {
    const m = {
      earned: <ArrowDownLeft className="h-4 w-4" />,
      spent: <ArrowUpRight className="h-4 w-4" />,
      sent: <Send className="h-4 w-4" />,
      received: <Gift className="h-4 w-4" />,
      bonus: <Award className="h-4 w-4" />,
    };
    return m[type] || <Coins className="h-4 w-4" />;
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white font-[Outfit] flex items-center gap-2">
          <Coins className="h-6 w-6 text-amber-400" /> SkillCoin Wallet
        </h1>
        <button
          id="send-coins-btn"
          onClick={() => setShowSend(true)}
          className="btn-primary text-sm"
        >
          <Send className="h-4 w-4" /> Send Coins
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-red rounded-2xl p-5 space-y-1 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-amber-500/10" />
          <span className="text-[10px] uppercase font-mono text-amber-300">Current Balance</span>
          <div className="text-4xl font-extrabold text-white font-mono tabular-nums">
            {loading ? "—" : balance}
          </div>
          <span className="text-xs text-amber-300/70">SkillCoins</span>
        </div>
        <div className="glass rounded-2xl p-5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-emerald-400">Total Earned</span>
          <div className="text-3xl font-extrabold text-white font-mono">
            {loading ? "—" : totalEarned}
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-400" /> From teaching & bonuses
          </span>
        </div>
        <div className="glass rounded-2xl p-5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-red-400">Total Spent</span>
          <div className="text-3xl font-extrabold text-white font-mono">
            {loading ? "—" : totalSpent}
          </div>
          <span className="text-xs text-slate-400">On learning & transfers</span>
        </div>
      </div>

      {/* 7-Day Earnings Chart */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" /> 7-Day Earnings
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">Last 7 days</span>
        </div>
        <div className="flex items-end gap-1 h-20 w-full">
          {chartData.map((v, i) => (
            <SparklineBar key={i} value={v} max={chartMax} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction History */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-bold text-white">Transaction History</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {loading ? (
              <div className="text-xs text-slate-500 text-center py-4">Loading...</div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No transactions yet. Start teaching or learning!</p>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-sm hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${tx.amount > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                      {txIcon(tx.type)}
                    </div>
                    <div>
                      <div className="text-slate-200 font-medium text-xs leading-snug">{tx.description}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <span className={`font-mono font-bold text-sm shrink-0 ${tx.amount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* How to Earn */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" /> Earn More Coins
          </h2>
          <div className="space-y-2">
            {EARN_TIPS.map((tip, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xl shrink-0">{tip.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{tip.label}</span>
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">{tip.coins}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Send Coins Modal */}
      {showSend && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass rounded-2xl p-6 w-full max-w-md space-y-5 border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-amber-400" /> Send SkillCoins
              </h2>
              <button onClick={() => { setShowSend(false); setSendStatus(null); setSendError(""); }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {sendStatus === "success" ? (
              <div className="text-center py-6 animate-fade-in">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-white font-semibold">Coins sent successfully!</p>
                <p className="text-xs text-slate-400 mt-1">New balance: {balance} coins</p>
              </div>
            ) : (
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Send To</label>
                  <select
                    value={sendTo}
                    onChange={e => setSendTo(e.target.value)}
                    className="input-base text-sm"
                    required
                  >
                    <option value="">Select a connection...</option>
                    {connections.map(c => {
                      const partner = c.sender?.id === user.id ? c.receiver : c.sender;
                      if (!partner) return null;
                      return (
                        <option key={partner.id} value={partner.id}>{partner.name}</option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Amount <span className="text-slate-500 font-normal">(balance: {balance})</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={balance}
                    value={sendAmount}
                    onChange={e => setSendAmount(e.target.value)}
                    placeholder="e.g. 5"
                    className="input-base text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Note (optional)</label>
                  <input
                    type="text"
                    value={sendNote}
                    onChange={e => setSendNote(e.target.value)}
                    placeholder="Thanks for the session! 🎉"
                    className="input-base text-sm"
                    maxLength={100}
                  />
                </div>

                {sendError && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {sendError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowSend(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                  <button
                    type="submit"
                    disabled={sendStatus === "loading"}
                    className="btn-primary flex-1 text-sm disabled:opacity-50"
                  >
                    {sendStatus === "loading" ? "Sending..." : <><Send className="h-3.5 w-3.5" /> Send Coins</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
