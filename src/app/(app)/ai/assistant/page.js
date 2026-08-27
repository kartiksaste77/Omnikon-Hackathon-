"use client";
import { useState, useRef, useEffect } from "react";
import aiService from "@/lib/aiService";
import { Brain, Send, Sparkles, BookOpen, Lightbulb, Code, HelpCircle } from "lucide-react";

const SUGGESTIONS = [
  "How do I start learning Python?",
  "What's the best way to learn React?",
  "How can I get into machine learning?",
  "Tips for learning UI/UX design?",
  "How to prepare for coding interviews?",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const handleAsk = (question) => {
    const q = question || input;
    if (!q.trim()) return;

    const userMsg = { role: "user", content: q };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = aiService.askAssistant(q);
      const aiMsg = { role: "assistant", content: response.answer, data: response };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  const handleSubmit = (e) => { e.preventDefault(); handleAsk(); };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-4 sm:-m-6 lg:-m-8 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-[#0A0A10]">
        <h1 className="text-lg font-bold text-white font-[Outfit] flex items-center gap-2"><Brain className="h-5 w-5 text-red-400" /> AI Learning Assistant</h1>
        <p className="text-xs text-slate-400">Ask anything about learning — get steps, resources, exercises, project ideas, and mentor questions.</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-6">
            <Sparkles className="h-12 w-12 text-red-500/50 mx-auto" />
            <h2 className="text-lg font-bold text-white">Ask me anything about learning</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">I can provide learning steps, resources, practice exercises, project ideas, and questions to ask your mentor.</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => handleAsk(s)} className="btn-secondary text-xs px-3 py-2">{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] ${msg.role === "user" ? "bg-red-600 text-white rounded-2xl rounded-br-sm px-4 py-3" : "space-y-3"}`}>
              {msg.role === "user" ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <>
                  <div className="glass rounded-2xl rounded-bl-sm p-4">
                    <p className="text-sm text-slate-200">{msg.content}</p>
                  </div>

                  {msg.data?.learningSteps?.length > 0 && (
                    <div className="glass rounded-xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Learning Steps</h4>
                      <ol className="space-y-1.5 text-sm text-slate-300 list-decimal list-inside">
                        {msg.data.learningSteps.map((step, j) => <li key={j}>{step}</li>)}
                      </ol>
                    </div>
                  )}

                  {msg.data?.exercises?.length > 0 && (
                    <div className="glass rounded-xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1"><Code className="h-3.5 w-3.5" /> Practice Exercises</h4>
                      <ul className="space-y-1 text-sm text-slate-300">
                        {msg.data.exercises.map((ex, j) => <li key={j} className="flex items-start gap-2">• {ex}</li>)}
                      </ul>
                    </div>
                  )}

                  {msg.data?.projectIdeas?.length > 0 && (
                    <div className="glass rounded-xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-sky-400 uppercase flex items-center gap-1"><Lightbulb className="h-3.5 w-3.5" /> Project Ideas</h4>
                      <ul className="space-y-1 text-sm text-slate-300">
                        {msg.data.projectIdeas.map((p, j) => <li key={j} className="flex items-start gap-2">• {p}</li>)}
                      </ul>
                    </div>
                  )}

                  {msg.data?.mentorQuestions?.length > 0 && (
                    <div className="glass rounded-xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-purple-400 uppercase flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5" /> Questions for Your Mentor</h4>
                      <ul className="space-y-1 text-sm text-slate-300">
                        {msg.data.mentorQuestions.map((q, j) => <li key={j} className="flex items-start gap-2">• {q}</li>)}
                      </ul>
                    </div>
                  )}

                  {msg.data?.resources?.length > 0 && (
                    <div className="glass rounded-xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-red-400 uppercase flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Resources</h4>
                      <ul className="space-y-1 text-sm text-slate-300">
                        {msg.data.resources.map((r, j) => <li key={j} className="flex items-start gap-2">• {r}</li>)}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-[#0A0A10] flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about learning any skill..." className="input-base flex-1 text-sm" />
        <button type="submit" disabled={isTyping} className="btn-primary px-4 py-2.5"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}
