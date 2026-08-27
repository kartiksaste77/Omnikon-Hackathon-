# SkillSwap — Peer Skill Exchange & Mentorship

**SkillSwap** is a full-stack peer-to-peer student skill exchange application built for the **Omnikon National Hackathon 2026** (EdTech & Skill Development, Problem Statement `Omni_EdTech_10`).

The platform solves the campus skill silo problem by introducing a zero-cost time-bank economy powered by intelligent match scoring, structured learning path roadmaps, an AI assistant, and a dual-verification session check-in system.

---

## 🚀 Key Features

*   **Zero-Cost Economy**: **$1\text{ Hour Taught} = 10\text{ SkillCoins} = 1\text{ Hour Learned}$**. Users earn coins by teaching and spend them to learn from others, with coins held in escrow during active bookings.
*   **AI Match Engine**: Recommends matches with percentage compatibility scores based on teaching skills, learning goals, proficiency matching (beginner/intermediate/advanced), schedule overlap, languages, and interests.
*   **AI Learning Roadmaps**: Generates custom week-by-week learning paths with specific tasks and curated resources based on the user's available weekly hours and goals.
*   **AI Assistant Chat**: Provides educational guidance, structured steps, practice exercises, project ideas, and list of questions to ask mentors.
*   **Dual Verification Session Management**: Virtual sessions run inside an interactive WebRTC simulator (with cameras, screenshare, a shared drawing whiteboard, and a JavaScript playground code runner). In-person sessions use an animated QR scanner and 4-digit OTP system to prevent no-shows.
*   **Reputation Rating Reviews**: Users rate completed sessions out of 5 stars and submit feedback to automatically update public reliability scores and badges.
*   **Gamification Systems**: Leaderboard rankings based on user XP, teaching stats, and streak multipliers. Custom unlockable achievement badges.

---

## 🛠️ Technology Stack

*   **Frontend & Routing**: Next.js 14 (App Router)
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **State & Session Management**: React Context, LocalStorage
*   **AI Simulation Core**: Custom Natural Language & semantic mapping rules in client service layers
*   **Animations**: canvas-confetti, Tailwind CSS keyframes

---

## 📐 Architecture & Closed-Loop System

```
┌───────────────┐     AI Match Score     ┌─────────────────┐
│ User Profile  │───────────────────────▸│  AI Match Card  │
└───────────────┘                        └─────────────────┘
        │                                         │
        │ Availability & Category                 │ Connect Request
        ▼                                         ▼
┌───────────────┐     Confirm & Book     ┌─────────────────┐
│ Browse Skills │◄───────────────────────│  Chat & Connect │
└───────────────┘                        └─────────────────┘
                                                  │
                                                  │ Schedule Session
                                                  ▼
┌───────────────┐     CONFIRM OTP/QR     ┌─────────────────┐
│ Review System │◄───────────────────────│  Active Session │
└───────────────┘   +10 Coins / +5 XP    └─────────────────┘
```

---

## ⚙️ Local Development & Setup

### Prerequisites
*   Node.js 18+
*   npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/kartiksaste77/Omnikon-Hackathon-.git
   cd Omnikon-Hackathon-
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📄 License & Security
Refer to the following files for details:
*   [LICENSE](LICENSE) — MIT License details.
*   [SECURITY.md](SECURITY.md) — Security policy and vulnerability disclosure procedures.

---

## 👥 Team: `kartiksaste11`
*   **Kartik Saste**
*   **Karan Rathod**

*Omnikon National Hackathon 2026 — One mission. Build the impossible.*
