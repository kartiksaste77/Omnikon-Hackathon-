"use client";

import React, { useState } from "react";
import { QrCode, KeyRound, CheckCircle2, ShieldCheck, X, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

export default function QRCheckInModal({ session, onClose, onVerified }) {
  const [activeMode, setActiveMode] = useState("otp"); // 'otp' | 'qr'
  const [otpInput, setOtpInput] = useState(["", "", "", ""]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpInput];
    newOtp[index] = value.slice(-1);
    setOtpInput(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerifyOtp = () => {
    const enteredCode = otpInput.join("");
    if (enteredCode.length !== 4) {
      setErrorMsg("Please enter a complete 4-digit OTP code.");
      return;
    }

    if (session?.otpCode && enteredCode !== session.otpCode) {
      setErrorMsg(`Invalid verification code. (Demo Hint: Use code ${session.otpCode})`);
      return;
    }

    setIsSuccess(true);
    setErrorMsg("");

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    setTimeout(() => {
      if (onVerified) onVerified();
    }, 1500);
  };

  const handleSimulateQrScan = () => {
    setIsSuccess(true);
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    setTimeout(() => {
      if (onVerified) onVerified();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl glass-panel p-6 shadow-2xl border border-white/10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-8 w-8 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-white">Attendance Verified!</h3>
            <p className="text-xs text-slate-300">
              Dual verification passed successfully. <strong>10 SkillCoins</strong> and <strong>+50 XP</strong> have been released to the mentor.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Dual Check-In Verification</h3>
              </div>
              <p className="text-xs text-slate-400">
                Verify peer presence at session start to release escrowed SkillCoins.
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-white/10">
              <button
                onClick={() => setActiveMode("otp")}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeMode === "otp"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                4-Digit OTP
              </button>
              <button
                onClick={() => setActiveMode("qr")}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeMode === "qr"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                Scan QR Code
              </button>
            </div>

            {/* OTP Mode */}
            {activeMode === "otp" && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-xs text-slate-300 mb-1">Enter the 4-digit code provided by your peer:</p>
                  <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    Session Passcode: {session?.otpCode || "4892"}
                  </span>
                </div>

                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      id={`otp-input-${index}`}
                      type="text"
                      maxLength={1}
                      value={otpInput[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="h-12 w-12 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-center font-mono text-lg font-bold text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  ))}
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  onClick={handleVerifyOtp}
                  className="w-full btn-primary py-2.5 rounded-xl text-xs font-semibold"
                >
                  Verify OTP & Check In
                </button>
              </div>
            )}

            {/* QR Mode */}
            {activeMode === "qr" && (
              <div className="space-y-4 text-center">
                <div className="p-6 rounded-2xl bg-white flex items-center justify-center mx-auto w-48 h-48 shadow-lg shadow-white/5 border border-white/20">
                  <div className="relative">
                    <QrCode className="h-36 w-36 text-slate-950" />
                    <div className="absolute inset-x-0 top-0 h-1 bg-indigo-600 animate-bounce" />
                  </div>
                </div>

                <p className="text-xs text-slate-300">
                  Scan this QR code with your mobile camera upon meeting in person on campus.
                </p>

                <button
                  onClick={handleSimulateQrScan}
                  className="w-full btn-primary py-2.5 rounded-xl text-xs font-semibold"
                >
                  Simulate Live Camera Scan
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
