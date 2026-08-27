"use client";
import { useState } from "react";
import db, { SKILL_CATEGORIES } from "@/lib/mockDatabase";
import { Search, Grid3X3, Users } from "lucide-react";

export default function SkillsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const skills = query ? db.searchSkills(query) : db.getSkills();
  const filtered = category === "All" ? skills : skills.filter(s => s.category === category);

  // Count users per skill
  const getSkillUserCount = (skillId) => {
    const allUS = db.getUsers();
    const userSkills = allUS.flatMap(u => db.getUserSkills(u.id));
    return userSkills.filter(us => us.skillId === skillId).length;
  };

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <h1 className="text-2xl font-bold text-white font-[Outfit] flex items-center gap-2"><Grid3X3 className="h-6 w-6 text-red-400" /> Browse Skills</h1>

      <div className="glass rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search skills..." className="input-base pl-10 text-sm" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {["All", ...SKILL_CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${category === cat ? "bg-red-600 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
            >{cat}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(s => {
          const count = getSkillUserCount(s.id);
          return (
            <div key={s.id} className="glass glass-hover rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{s.name}</h3>
                <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded font-mono">{s.category}</span>
              </div>
              <p className="text-xs text-slate-400">{s.description}</p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Users className="h-3 w-3" /> {count} user{count !== 1 ? "s" : ""}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">No skills found for "{query}"</div>
      )}
    </div>
  );
}
