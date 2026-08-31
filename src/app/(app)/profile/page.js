"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/apiClient";
import { Save, Plus, Trash2, BookOpen, GraduationCap, CheckCircle2, MapPin, Globe, Heart, RefreshCw } from "lucide-react";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState("");
  const [interests, setInterests] = useState("");

  // Skills from API
  const [allSkills, setAllSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  const [newTeachId, setNewTeachId] = useState("");
  const [newTeachProf, setNewTeachProf] = useState("intermediate");
  const [newLearnId, setNewLearnId] = useState("");
  const [newLearnProf, setNewLearnProf] = useState("beginner");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setLanguages(user.languages?.join(", ") || "");
      setInterests(user.interests?.join(", ") || "");
    }
  }, [user]);

  const loadSkills = useCallback(async () => {
    if (!user) return;
    setLoadingSkills(true);
    try {
      const [skillsData, userSkillsData] = await Promise.all([
        apiClient.get("/api/skills"),
        apiClient.get("/api/user-skills"),
      ]);
      setAllSkills(skillsData || []);
      setUserSkills(userSkillsData || []);
    } catch (e) {
      console.warn("Failed to load skills:", e);
    } finally {
      setLoadingSkills(false);
    }
  }, [user]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleSaveProfile = async () => {
    await updateProfile({
      name,
      bio,
      location,
      languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
      interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAddTeach = async () => {
    if (!newTeachId) return;
    setActionLoading(true);
    try {
      await apiClient.post("/api/user-skills", {
        skillId: newTeachId,
        type: "teach",
        proficiency: newTeachProf,
      });
      setNewTeachId("");
      await loadSkills();
    } catch (e) {
      alert(e.message || "Failed to add skill");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveTeach = async (skillId) => {
    try {
      await apiClient.delete(`/api/user-skills?skillId=${skillId}&type=teach`);
      await loadSkills();
    } catch (e) {
      alert(e.message || "Failed to remove skill");
    }
  };

  const handleAddLearn = async () => {
    if (!newLearnId) return;
    setActionLoading(true);
    try {
      await apiClient.post("/api/user-skills", {
        skillId: newLearnId,
        type: "learn",
        proficiency: newLearnProf,
      });
      setNewLearnId("");
      await loadSkills();
    } catch (e) {
      alert(e.message || "Failed to add skill");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveLearn = async (skillId) => {
    try {
      await apiClient.delete(`/api/user-skills?skillId=${skillId}&type=learn`);
      await loadSkills();
    } catch (e) {
      alert(e.message || "Failed to remove skill");
    }
  };

  if (!user) return null;

  const teachSkills = userSkills.filter((s) => s.type === "teach");
  const learnSkills = userSkills.filter((s) => s.type === "learn");

  // Group allSkills by category
  const categories = Array.from(new Set(allSkills.map((s) => s.category))).filter(Boolean);

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
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
              className="input-base"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell peers about yourself and what you want to learn..."
            className="input-base resize-none"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
              <Globe className="h-3 w-3" /> Languages (comma-separated)
            </label>
            <input
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="English, Hindi, Spanish"
              className="input-base"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
              <Heart className="h-3 w-3" /> Interests (comma-separated)
            </label>
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="Open Source, AI, Music"
              className="input-base"
            />
          </div>
        </div>
        <button onClick={handleSaveProfile} className="btn-primary text-sm">
          <Save className="h-4 w-4" /> Save Profile
        </button>
      </div>

      {/* Skills I Can Teach */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-emerald-400 font-[Outfit] flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Skills I Can Teach
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {teachSkills.length} listed
          </span>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          {teachSkills.map((s) => (
            <span
              key={s.id}
              className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-medium"
            >
              {s.skill?.name}{" "}
              <span className="text-emerald-500/60 font-mono text-[10px]">
                ({s.proficiency})
              </span>
              <button
                onClick={() => handleRemoveTeach(s.skillId)}
                className="text-emerald-400 hover:text-red-400 ml-1 transition-colors"
                title="Remove skill"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
          {teachSkills.length === 0 && !loadingSkills && (
            <p className="text-xs text-slate-500">
              Add skills you can teach to start receiving session requests!
            </p>
          )}
        </div>
        <div className="flex gap-2 items-end flex-wrap sm:flex-nowrap pt-2">
          <div className="flex-1 min-w-[200px]">
            <select
              value={newTeachId}
              onChange={(e) => setNewTeachId(e.target.value)}
              className="input-base text-xs"
            >
              <option value="">Select a skill to teach...</option>
              {categories.map((cat) => (
                <optgroup key={cat} label={cat}>
                  {allSkills
                    .filter((s) => s.category === cat)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
          <select
            value={newTeachProf}
            onChange={(e) => setNewTeachProf(e.target.value)}
            className="input-base text-xs w-36"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button
            onClick={handleAddTeach}
            disabled={actionLoading || !newTeachId}
            className="btn-primary text-xs px-3.5 py-2.5 whitespace-nowrap disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add Skill
          </button>
        </div>
      </div>

      {/* Skills I Want to Learn */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-amber-400 font-[Outfit] flex items-center gap-2">
            <GraduationCap className="h-5 w-5" /> Skills I Want to Learn
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {learnSkills.length} listed
          </span>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          {learnSkills.map((s) => (
            <span
              key={s.id}
              className="flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-medium"
            >
              {s.skill?.name}{" "}
              <span className="text-amber-500/60 font-mono text-[10px]">
                ({s.proficiency})
              </span>
              <button
                onClick={() => handleRemoveLearn(s.skillId)}
                className="text-amber-400 hover:text-red-400 ml-1 transition-colors"
                title="Remove skill"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
          {learnSkills.length === 0 && !loadingSkills && (
            <p className="text-xs text-slate-500">
              Add skills you want to learn to get matched with the best mentors!
            </p>
          )}
        </div>
        <div className="flex gap-2 items-end flex-wrap sm:flex-nowrap pt-2">
          <div className="flex-1 min-w-[200px]">
            <select
              value={newLearnId}
              onChange={(e) => setNewLearnId(e.target.value)}
              className="input-base text-xs"
            >
              <option value="">Select a skill you want to learn...</option>
              {categories.map((cat) => (
                <optgroup key={cat} label={cat}>
                  {allSkills
                    .filter((s) => s.category === cat)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
          <select
            value={newLearnProf}
            onChange={(e) => setNewLearnProf(e.target.value)}
            className="input-base text-xs w-36"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button
            onClick={handleAddLearn}
            disabled={actionLoading || !newLearnId}
            className="btn-primary text-xs px-3.5 py-2.5 whitespace-nowrap disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add Skill
          </button>
        </div>
      </div>
    </div>
  );
}
