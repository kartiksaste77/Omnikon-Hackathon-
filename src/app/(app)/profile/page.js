"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import db, { SKILL_CATEGORIES } from "@/lib/mockDatabase";
import { Save, Plus, Trash2, BookOpen, GraduationCap, CheckCircle2, MapPin, Globe, Heart } from "lucide-react";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [languages, setLanguages] = useState(user?.languages?.join(", ") || "");
  const [interests, setInterests] = useState(user?.interests?.join(", ") || "");

  // Skills
  const teachSkills = user ? db.getUserTeachSkills(user.id) : [];
  const learnSkills = user ? db.getUserLearnSkills(user.id) : [];
  const allSkills = db.getSkills();

  const [newTeachId, setNewTeachId] = useState("");
  const [newTeachProf, setNewTeachProf] = useState("intermediate");
  const [newLearnId, setNewLearnId] = useState("");
  const [newLearnProf, setNewLearnProf] = useState("beginner");
  const [, forceUpdate] = useState(0);

  if (!user) return null;

  const handleSaveProfile = () => {
    updateProfile({
      name,
      bio,
      location,
      languages: languages.split(",").map(s => s.trim()).filter(Boolean),
      interests: interests.split(",").map(s => s.trim()).filter(Boolean),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAddTeach = () => {
    if (!newTeachId) return;
    db.addUserSkill(user.id, newTeachId, "teach", newTeachProf);
    setNewTeachId("");
    forceUpdate(n => n + 1);
  };

  const handleRemoveTeach = (skillId) => {
    db.removeUserSkill(user.id, skillId, "teach");
    forceUpdate(n => n + 1);
  };

  const handleAddLearn = () => {
    if (!newLearnId) return;
    db.addUserSkill(user.id, newLearnId, "learn", newLearnProf);
    setNewLearnId("");
    forceUpdate(n => n + 1);
  };

  const handleRemoveLearn = (skillId) => {
    db.removeUserSkill(user.id, skillId, "learn");
    forceUpdate(n => n + 1);
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {saved && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl flex items-center gap-2 text-sm animate-fade-in">
          <CheckCircle2 className="h-4 w-4" /> Profile updated successfully!
        </div>
      )}

      {/* Basic Info */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="text-xl font-bold text-white font-[Outfit]">My Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-base" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country" className="input-base" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell peers about yourself..." className="input-base resize-none" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1"><Globe className="h-3 w-3" /> Languages (comma-separated)</label>
            <input value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Hindi, Spanish" className="input-base" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1"><Heart className="h-3 w-3" /> Interests (comma-separated)</label>
            <input value={interests} onChange={e => setInterests(e.target.value)} placeholder="Open Source, Hackathons, Music" className="input-base" />
          </div>
        </div>
        <button onClick={handleSaveProfile} className="btn-primary text-sm"><Save className="h-4 w-4" /> Save Profile</button>
      </div>

      {/* Skills I Can Teach */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-emerald-400 font-[Outfit] flex items-center gap-2">
          <BookOpen className="h-5 w-5" /> Skills I Can Teach
        </h2>
        <div className="flex flex-wrap gap-2">
          {teachSkills.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-medium">
              {s.skill?.name} <span className="text-emerald-500/60">({s.proficiency})</span>
              <button onClick={() => handleRemoveTeach(s.skillId)} className="text-emerald-400 hover:text-red-400 ml-1"><Trash2 className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <select value={newTeachId} onChange={e => setNewTeachId(e.target.value)} className="input-base text-xs">
              <option value="">Select a skill...</option>
              {SKILL_CATEGORIES.map(cat => (
                <optgroup key={cat} label={cat}>
                  {allSkills.filter(s => s.category === cat).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <select value={newTeachProf} onChange={e => setNewTeachProf(e.target.value)} className="input-base text-xs w-36">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button onClick={handleAddTeach} className="btn-primary text-xs px-3 py-2.5 whitespace-nowrap"><Plus className="h-3.5 w-3.5" /> Add</button>
        </div>
      </div>

      {/* Skills I Want to Learn */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-amber-400 font-[Outfit] flex items-center gap-2">
          <GraduationCap className="h-5 w-5" /> Skills I Want to Learn
        </h2>
        <div className="flex flex-wrap gap-2">
          {learnSkills.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-medium">
              {s.skill?.name} <span className="text-amber-500/60">({s.proficiency})</span>
              <button onClick={() => handleRemoveLearn(s.skillId)} className="text-amber-400 hover:text-red-400 ml-1"><Trash2 className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <select value={newLearnId} onChange={e => setNewLearnId(e.target.value)} className="input-base text-xs">
              <option value="">Select a skill...</option>
              {SKILL_CATEGORIES.map(cat => (
                <optgroup key={cat} label={cat}>
                  {allSkills.filter(s => s.category === cat).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <select value={newLearnProf} onChange={e => setNewLearnProf(e.target.value)} className="input-base text-xs w-36">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button onClick={handleAddLearn} className="btn-primary text-xs px-3 py-2.5 whitespace-nowrap"><Plus className="h-3.5 w-3.5" /> Add</button>
        </div>
      </div>
    </div>
  );
}
