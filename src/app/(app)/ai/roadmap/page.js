"use client";
import { useState } from "react";
import aiService from "@/lib/aiService";
import db from "@/lib/mockDatabase";
import { Map, Play, CheckCircle2, BookOpen } from "lucide-react";

export default function AIRoadmapPage() {
  const [skill, setSkill] = useState("");
  const [level, setLevel] = useState("beginner");
  const [goal, setGoal] = useState("");
  const [hours, setHours] = useState(5);
  const [roadmap, setRoadmap] = useState(null);

  const allSkills = db.getSkills();

  const handleGenerate = (e) => {
    e.preventDefault();
    const skillName = allSkills.find(s => s.id === skill)?.name || skill || "this skill";
    const result = aiService.generateLearningRoadmap(skillName, level, goal, hours);
    setRoadmap(result);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white font-[Outfit] flex items-center gap-2"><Map className="h-6 w-6 text-red-400" /> AI Learning Roadmap</h1>
        <p className="text-sm text-slate-400 mt-1">Generate a personalized learning path based on your goals</p>
      </div>

      <form onSubmit={handleGenerate} className="glass rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Desired Skill</label>
            <select value={skill} onChange={e => setSkill(e.target.value)} required className="input-base text-sm">
              <option value="">Select a skill...</option>
              {allSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Current Level</label>
            <select value={level} onChange={e => setLevel(e.target.value)} className="input-base text-sm">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Learning Goal</label>
            <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Build production apps" className="input-base text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Hours/Week Available</label>
            <input type="number" min={1} max={40} value={hours} onChange={e => setHours(Number(e.target.value))} className="input-base text-sm" />
          </div>
        </div>
        <button type="submit" className="btn-primary text-sm"><Play className="h-4 w-4" /> Generate Roadmap</button>
      </form>

      {roadmap && (
        <div className="space-y-4 animate-slide-up">
          <div className="glass-red rounded-2xl p-5">
            <h2 className="text-xl font-bold text-white font-[Outfit]">{roadmap.skill} Learning Roadmap</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-300 font-mono">
              <span>Level: <strong className="text-white">{roadmap.currentLevel}</strong></span>
              <span>Duration: <strong className="text-white">{roadmap.totalWeeks} weeks</strong></span>
              <span>Commitment: <strong className="text-white">{roadmap.hoursPerWeek} hrs/week</strong></span>
            </div>
            {roadmap.goal && <p className="text-sm text-slate-300 mt-2">🎯 Goal: {roadmap.goal}</p>}
          </div>

          {/* Milestones */}
          <div className="space-y-3">
            {roadmap.milestones.map((m, i) => (
              <div key={i} className="glass rounded-xl p-5 border-l-4 border-l-red-500/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">WEEK {m.week}</span>
                    {m.title}
                  </h3>
                </div>
                <ul className="space-y-1.5">
                  {m.tasks.map((task, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Resources */}
          {roadmap.resources && (
            <div className="glass rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-400" /> Recommended Resources</h3>
              <ul className="space-y-1">
                {roadmap.resources.map((r, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-center gap-2">• {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
