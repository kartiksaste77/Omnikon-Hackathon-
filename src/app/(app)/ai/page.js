"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Sparkles, 
  Compass, 
  Bot, 
  Send, 
  CheckCircle2, 
  Circle, 
  Clock, 
  BookOpen, 
  ArrowRight,
  Lightbulb,
  Cpu,
  Layers
} from "lucide-react";
import { INITIAL_ROADMAPS } from "@/lib/seedData";
import { generateRoadmap, generateAiMentorResponse } from "@/lib/aiService";
import confetti from "canvas-confetti";

export default function AiPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("roadmaps"); // 'roadmaps' | 'assistant'
  
  // Roadmap State
  const [roadmaps, setRoadmaps] = useState(INITIAL_ROADMAPS);
  const [targetSkillInput, setTargetSkillInput] = useState("");
  const [weeksInput, setWeeksInput] = useState(4);
  const [hoursInput, setHoursInput] = useState(6);
  const [isGenerating, setIsGenerating] = useState(false);

  // AI Chat Assistant State
  const [messages, setMessages] = useState([
    {
      sender: "AI",
      text: "Hello! I am your **SkillSwap AI Mentor**. I can help you generate personalized learning roadmaps, formulate interview questions for peer mentors, or answer questions about our zero-cost time-bank economy. What are you looking to master today?"
    }
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleGenerateRoadmap = (e) => {
    e.preventDefault();
    if (!targetSkillInput.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateRoadmap(targetSkillInput, weeksInput, hoursInput);
      const newRoadmap = {
        id: `road_${Date.now()}`,
        userId: user?.id || "user_1",
        progress: 0,
        ...generated,
        createdAt: new Date().toISOString()
      };
      setRoadmaps([newRoadmap, ...roadmaps]);
      setIsGenerating(false);
      setTargetSkillInput("");

      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    }, 600);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput("");
    setMessages((prev) => [...prev, { sender: "USER", text: userText }]);

    setTimeout(() => {
      const reply = generateAiMentorResponse(userText);
      setMessages((prev) => [...prev, { sender: "AI", text: reply }]);
    }, 400);
  };

  const toggleTask = (roadmapId, stepIndex, taskIndex) => {
    setRoadmaps((prev) =>
      prev.map((r) => {
        if (r.id !== roadmapId) return r;
        const newSteps = [...r.steps];
        return {
          ...r,
          progress: Math.min(100, (r.progress || 0) + 15)
        };
      })
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            AI Learning Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AI Roadmaps & Mentor Assistant</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Generate tailored multi-week curriculum paths or chat directly with our AI mentor.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-white/10">
          <button
            onClick={() => setActiveTab("roadmaps")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "roadmaps"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            Learning Roadmaps ({roadmaps.length})
          </button>
          <button
            onClick={() => setActiveTab("assistant")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "assistant"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            AI Mentor Chat
          </button>
        </div>
      </div>

      {/* Roadmaps Tab */}
      {activeTab === "roadmaps" && (
        <div className="space-y-8">
          
          {/* Roadmap Generator Form */}
          <div className="glass-card p-6 border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Generate a Custom Multi-Week Learning Path</h2>
            </div>

            <form onSubmit={handleGenerateRoadmap} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  required
                  value={targetSkillInput}
                  onChange={(e) => setTargetSkillInput(e.target.value)}
                  placeholder="What skill do you want to learn? (e.g. Python AI, Figma UI/UX, Docker, Next.js)..."
                  className="w-full glass-input px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <select
                  value={weeksInput}
                  onChange={(e) => setWeeksInput(Number(e.target.value))}
                  className="w-full glass-input px-3 py-2.5 text-xs text-white bg-slate-900"
                >
                  <option value={2}>2 Weeks</option>
                  <option value={4}>4 Weeks</option>
                  <option value={8}>8 Weeks</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <select
                  value={hoursInput}
                  onChange={(e) => setHoursInput(Number(e.target.value))}
                  className="w-full glass-input px-3 py-2.5 text-xs text-white bg-slate-900"
                >
                  <option value={4}>4 hrs / week</option>
                  <option value={6}>6 hrs / week</option>
                  <option value={10}>10 hrs / week</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  {isGenerating ? "Building..." : "Generate AI Path"}
                </button>
              </div>
            </form>
          </div>

          {/* Active Roadmaps List */}
          <div className="space-y-6">
            {roadmaps.map((roadmap) => (
              <div key={roadmap.id} className="glass-card p-6 border border-white/10 space-y-6">
                
                {/* Roadmap Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                      {roadmap.targetWeeks} Weeks • {roadmap.weeklyHours} hrs/week
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1.5">{roadmap.goalSkill}</h3>
                    <p className="text-xs text-slate-400">{roadmap.overview}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-300">{roadmap.progress || 0}% Complete</span>
                      <div className="w-32 bg-slate-800 rounded-full h-2 mt-1">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full transition-all"
                          style={{ width: `${roadmap.progress || 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Steps Accordion / Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roadmap.steps.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400">Week {step.week}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            step.status === "COMPLETED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-indigo-500/10 text-indigo-300"
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>

                      {/* Tasks Checklist */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action Items:</span>
                        {step.tasks.map((task, tIdx) => (
                          <div
                            key={tIdx}
                            onClick={() => toggleTask(roadmap.id, sIdx, tIdx)}
                            className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer hover:text-white transition-colors"
                          >
                            <Circle className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                            <span>{task}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* AI Assistant Chat Tab */}
      {activeTab === "assistant" && (
        <div className="glass-card p-6 border border-white/10 rounded-3xl flex flex-col h-[600px] justify-between">
          
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.sender === "USER" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "AI" && (
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[80%] whitespace-pre-wrap ${
                    msg.sender === "USER"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-slate-900 border border-white/10 text-slate-200 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-2 overflow-x-auto py-2 border-t border-white/10">
            <span className="text-[11px] text-slate-500 shrink-0 font-medium">Try asking:</span>
            {[
              "How does the zero-cost time-bank economy work?",
              "Questions to ask a mentor during my session",
              "React 19 Server Components quick summary",
              "How to build my portfolio on campus?"
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => {
                  setChatInput(prompt);
                }}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 shrink-0 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask the AI mentor anything about skills, roadmaps, or sessions..."
              className="flex-1 glass-input px-4 py-3 text-xs text-white"
            />
            <button
              type="submit"
              className="btn-primary px-5 py-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <Send className="h-4 w-4" />
              Ask AI
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
