"use client";
// ============================================================================
// SkillSwap — AI Service (Mock)
// Simulates: Intelligent Skill Matching, Learning Roadmap, AI Assistant
// Swappable with OpenAI/Gemini API post-hackathon
// ============================================================================

import db from "./mockDatabase";

// Related skills graph — AI understands semantic relationships
const SKILL_RELATIONS = {
  "Frontend Development": ["sk-003", "sk-001", "sk-011", "sk-005", "sk-012"], // React, JS, HTML/CSS, TS, Next.js
  "Backend Development": ["sk-004", "sk-002", "sk-008", "sk-014", "sk-010"], // Node, Python, Go, Django, SQL
  "Web Development": ["sk-001", "sk-003", "sk-004", "sk-005", "sk-011", "sk-012"],
  "Mobile Development": ["sk-013", "sk-003", "sk-001"], // Flutter, React (Native), JS
  "Machine Learning": ["sk-041", "sk-002", "sk-043", "sk-042", "sk-048", "sk-049"], // ML, Python, PyTorch, Data Analysis, LinAlg, Stats
  "Data Science": ["sk-042", "sk-002", "sk-041", "sk-049", "sk-010"],
  "Cloud Computing": ["sk-044", "sk-045", "sk-046"], // Docker, AWS, Linux
  "Design": ["sk-016", "sk-017", "sk-018", "sk-020"], // UI/UX, Figma, Graphic, Motion
  "Cybersecurity": ["sk-046", "sk-008"], // Linux, Go
};

// Skill category mappings for fuzzy matching
const SKILL_CATEGORY_MAP = {
  "sk-001": ["Programming", "Web"], "sk-002": ["Programming", "AI"], "sk-003": ["Programming", "Web", "Frontend"],
  "sk-004": ["Programming", "Backend"], "sk-005": ["Programming", "Web"], "sk-008": ["Programming", "Backend"],
  "sk-010": ["Programming", "Database"], "sk-011": ["Programming", "Web", "Frontend"],
  "sk-012": ["Programming", "Web", "Frontend"], "sk-013": ["Programming", "Mobile"],
  "sk-014": ["Programming", "Backend"], "sk-015": ["Programming", "CS Core"],
  "sk-016": ["Design"], "sk-017": ["Design"], "sk-018": ["Design"],
  "sk-041": ["Data Science", "AI"], "sk-042": ["Data Science"], "sk-043": ["Data Science", "AI"],
  "sk-044": ["DevOps", "Cloud"], "sk-045": ["DevOps", "Cloud"], "sk-046": ["DevOps"],
};

export const aiService = {

  // -----------------------------------------------------------------------
  // 1. INTELLIGENT SKILL MATCHING
  // Understands related skills (e.g., "Frontend Dev" matches React/JS experts)
  // -----------------------------------------------------------------------
  calculateMatchScore(currentUserId, targetUserId) {
    const currentTeach = db.getUserTeachSkills(currentUserId);
    const currentLearn = db.getUserLearnSkills(currentUserId);
    const targetTeach = db.getUserTeachSkills(targetUserId);
    const targetLearn = db.getUserLearnSkills(targetUserId);

    const currentUser = db.getUser(currentUserId);
    const targetUser = db.getUser(targetUserId);
    if (!currentUser || !targetUser) return { score: 0, breakdown: {} };

    // (a) Skill complementarity: their teach ↔ my learn, my teach ↔ their learn
    let skillScore = 0;
    let matchedSkills = [];

    currentLearn.forEach(cl => {
      const directMatch = targetTeach.find(tt => tt.skillId === cl.skillId);
      if (directMatch) {
        skillScore += 25;
        matchedSkills.push(`${directMatch.skill?.name} (direct match)`);
      } else {
        // Check related skills
        const relatedIds = this._getRelatedSkillIds(cl.skillId);
        const relatedMatch = targetTeach.find(tt => relatedIds.includes(tt.skillId));
        if (relatedMatch) {
          skillScore += 15;
          matchedSkills.push(`${relatedMatch.skill?.name} (related to ${cl.skill?.name})`);
        }
      }
    });

    targetLearn.forEach(tl => {
      const directMatch = currentTeach.find(ct => ct.skillId === tl.skillId);
      if (directMatch) {
        skillScore += 25;
        matchedSkills.push(`I can teach ${directMatch.skill?.name}`);
      } else {
        const relatedIds = this._getRelatedSkillIds(tl.skillId);
        const relatedMatch = currentTeach.find(ct => relatedIds.includes(ct.skillId));
        if (relatedMatch) {
          skillScore += 15;
          matchedSkills.push(`I can teach ${relatedMatch.skill?.name} (related)`);
        }
      }
    });

    skillScore = Math.min(skillScore, 40); // cap at 40%

    // (b) Proficiency alignment (20%)
    let profScore = 0;
    currentLearn.forEach(cl => {
      const match = targetTeach.find(tt => tt.skillId === cl.skillId);
      if (match) {
        const levels = { beginner: 1, intermediate: 2, advanced: 3 };
        if ((levels[match.proficiency] || 0) > (levels[cl.proficiency] || 0)) {
          profScore += 10;
        }
      }
    });
    profScore = Math.min(profScore, 20);

    // (c) Schedule overlap (15%)
    const myAvail = db.getUserAvailability(currentUserId);
    const theirAvail = db.getUserAvailability(targetUserId);
    let scheduleOverlap = 0;
    myAvail.forEach(ma => {
      const dayMatch = theirAvail.find(ta => ta.day === ma.day);
      if (dayMatch) {
        const overlapStart = Math.max(parseInt(ma.startTime), parseInt(dayMatch.startTime));
        const overlapEnd = Math.min(parseInt(ma.endTime), parseInt(dayMatch.endTime));
        if (overlapEnd > overlapStart) scheduleOverlap += 5;
      }
    });
    scheduleOverlap = Math.min(scheduleOverlap, 15);

    // (d) Interest & language match (10%)
    let interestScore = 0;
    const sharedInterests = (currentUser.interests || []).filter(i => (targetUser.interests || []).includes(i));
    const sharedLanguages = (currentUser.languages || []).filter(l => (targetUser.languages || []).includes(l));
    interestScore += sharedInterests.length * 3;
    interestScore += sharedLanguages.length * 2;
    interestScore = Math.min(interestScore, 10);

    // (e) Reliability/rating (10%)
    let reliabilityScore = Math.min(((targetUser.rating || 0) / 5) * 10, 10);

    // (f) Location proximity (5%)
    let locationScore = currentUser.location === targetUser.location ? 5 : 0;

    const totalScore = Math.min(Math.round(skillScore + profScore + scheduleOverlap + interestScore + reliabilityScore + locationScore), 100);

    return {
      score: totalScore,
      matchedSkills,
      breakdown: {
        skillOverlap: skillScore,
        proficiency: profScore,
        schedule: scheduleOverlap,
        interests: interestScore,
        reliability: reliabilityScore,
        location: locationScore,
      },
    };
  },

  // Get all matches for a user, sorted by score
  getMatchesForUser(userId) {
    const allUsers = db.getUsers().filter(u => u.id !== userId);
    return allUsers.map(u => {
      const match = this.calculateMatchScore(userId, u.id);
      return {
        user: { ...u, password: undefined },
        ...match,
        teachSkills: db.getUserTeachSkills(u.id),
        learnSkills: db.getUserLearnSkills(u.id),
        availability: db.getUserAvailability(u.id),
      };
    }).sort((a, b) => b.score - a.score);
  },

  // -----------------------------------------------------------------------
  // 2. AI LEARNING ROADMAP
  // -----------------------------------------------------------------------
  generateLearningRoadmap(desiredSkill, currentLevel, goal, hoursPerWeek) {
    const skill = typeof desiredSkill === "string" ? desiredSkill : desiredSkill?.name || "this skill";
    const roadmaps = {
      default: this._buildGenericRoadmap(skill, currentLevel, goal, hoursPerWeek),
    };
    // Add skill-specific roadmaps
    const lowerSkill = skill.toLowerCase();
    if (lowerSkill.includes("python")) return this._buildPythonRoadmap(currentLevel, goal, hoursPerWeek);
    if (lowerSkill.includes("react") || lowerSkill.includes("next")) return this._buildReactRoadmap(currentLevel, goal, hoursPerWeek);
    if (lowerSkill.includes("machine learning") || lowerSkill.includes("ml") || lowerSkill.includes("pytorch")) return this._buildMLRoadmap(currentLevel, goal, hoursPerWeek);
    if (lowerSkill.includes("ui") || lowerSkill.includes("ux") || lowerSkill.includes("design")) return this._buildDesignRoadmap(currentLevel, goal, hoursPerWeek);
    if (lowerSkill.includes("guitar") || lowerSkill.includes("piano") || lowerSkill.includes("music")) return this._buildMusicRoadmap(skill, currentLevel, goal, hoursPerWeek);
    return roadmaps.default;
  },

  _buildGenericRoadmap(skill, level, goal, hours) {
    const weeks = level === "beginner" ? 12 : level === "intermediate" ? 8 : 4;
    return {
      skill,
      currentLevel: level,
      goal: goal || `Become proficient in ${skill}`,
      totalWeeks: weeks,
      hoursPerWeek: hours || 5,
      milestones: [
        { week: 1, title: "Foundation & Setup", tasks: [`Set up ${skill} development environment`, `Learn core concepts and terminology`, `Complete introductory tutorial`, `Join community forums`], status: "upcoming" },
        { week: Math.ceil(weeks * 0.25), title: "Core Concepts", tasks: [`Master fundamental principles`, `Build 2-3 small practice projects`, `Read official documentation`, `Find a study partner on SkillSwap`], status: "upcoming" },
        { week: Math.ceil(weeks * 0.5), title: "Intermediate Skills", tasks: [`Work on a medium-complexity project`, `Learn best practices and design patterns`, `Study real-world examples`, `Get feedback from a SkillSwap mentor`], status: "upcoming" },
        { week: Math.ceil(weeks * 0.75), title: "Advanced Practice", tasks: [`Build a portfolio-worthy project`, `Contribute to open-source or community`, `Teach beginners to solidify knowledge`, `Prepare for professional applications`], status: "upcoming" },
        { week: weeks, title: "Mastery & Showcase", tasks: [`Complete capstone project`, `Write about your learning journey`, `Mentor others on SkillSwap`, `Earn the "${skill} Expert" badge`], status: "upcoming" },
      ],
      resources: [`Official ${skill} Documentation`, `FreeCodeCamp / Coursera courses`, `YouTube tutorials`, `SkillSwap peer mentors`],
    };
  },

  _buildPythonRoadmap(level, goal, hours) {
    return {
      skill: "Python", currentLevel: level, goal: goal || "Master Python for software development",
      totalWeeks: level === "beginner" ? 10 : 6, hoursPerWeek: hours || 5,
      milestones: [
        { week: 1, title: "Python Basics", tasks: ["Install Python & VS Code", "Variables, data types, operators", "Control flow: if/else, loops", "Functions & modules"], status: "upcoming" },
        { week: 3, title: "Data Structures", tasks: ["Lists, tuples, dictionaries, sets", "List comprehensions", "String methods & formatting", "File I/O operations"], status: "upcoming" },
        { week: 5, title: "OOP & Libraries", tasks: ["Classes, inheritance, polymorphism", "Error handling with try/except", "pip & virtual environments", "Popular libraries: requests, pandas"], status: "upcoming" },
        { week: 7, title: "Project Building", tasks: ["Build a CLI tool or web scraper", "Work with APIs (REST)", "Database access with SQLite", "Unit testing with pytest"], status: "upcoming" },
        { week: 10, title: "Advanced & Portfolio", tasks: ["Decorators, generators, context managers", "Async programming basics", "Build a complete project", "Publish to GitHub"], status: "upcoming" },
      ],
      resources: ["Python.org Official Tutorial", "Automate the Boring Stuff", "Real Python", "LeetCode (Python track)"],
    };
  },

  _buildReactRoadmap(level, goal, hours) {
    return {
      skill: "React", currentLevel: level, goal: goal || "Build production-ready React applications",
      totalWeeks: level === "beginner" ? 10 : 6, hoursPerWeek: hours || 5,
      milestones: [
        { week: 1, title: "React Fundamentals", tasks: ["Set up React with Vite or Next.js", "JSX syntax & components", "Props & component composition", "Event handling"], status: "upcoming" },
        { week: 3, title: "State Management", tasks: ["useState & useEffect hooks", "Lifting state up", "useContext for global state", "Forms & controlled components"], status: "upcoming" },
        { week: 5, title: "Routing & APIs", tasks: ["React Router or Next.js routing", "Fetching data with useEffect", "Loading & error states", "Custom hooks"], status: "upcoming" },
        { week: 7, title: "Advanced Patterns", tasks: ["useReducer & complex state", "Performance: React.memo, useMemo", "Component libraries (shadcn/ui)", "Authentication flows"], status: "upcoming" },
        { week: 10, title: "Full-Stack Project", tasks: ["Build a complete web app", "Deploy to Vercel", "SEO & accessibility", "Add to portfolio"], status: "upcoming" },
      ],
      resources: ["React.dev Official Docs", "Next.js Learn Course", "Kent C. Dodds (EpicReact)", "Frontend Masters"],
    };
  },

  _buildMLRoadmap(level, goal, hours) {
    return {
      skill: "Machine Learning", currentLevel: level, goal: goal || "Build and deploy ML models",
      totalWeeks: 14, hoursPerWeek: hours || 6,
      milestones: [
        { week: 1, title: "Math Foundations", tasks: ["Linear algebra refresher", "Probability & statistics basics", "Calculus for optimization", "NumPy & Matplotlib practice"], status: "upcoming" },
        { week: 4, title: "Classical ML", tasks: ["Scikit-learn basics", "Regression & classification", "Decision trees, SVMs, KNN", "Model evaluation & cross-validation"], status: "upcoming" },
        { week: 7, title: "Deep Learning", tasks: ["Neural network fundamentals", "PyTorch basics & tensors", "CNNs for image tasks", "Training loops & optimization"], status: "upcoming" },
        { week: 10, title: "NLP & Advanced", tasks: ["Transformers & attention", "Text classification", "Transfer learning & fine-tuning", "Hugging Face ecosystem"], status: "upcoming" },
        { week: 14, title: "Project & Deployment", tasks: ["End-to-end ML project", "Model serving with FastAPI", "Experiment tracking (MLflow)", "Kaggle competition entry"], status: "upcoming" },
      ],
      resources: ["fast.ai Practical Deep Learning", "Andrew Ng's ML Course", "PyTorch Official Tutorials", "Kaggle Learn"],
    };
  },

  _buildDesignRoadmap(level, goal, hours) {
    return {
      skill: "UI/UX Design", currentLevel: level, goal: goal || "Design beautiful, user-friendly interfaces",
      totalWeeks: 10, hoursPerWeek: hours || 4,
      milestones: [
        { week: 1, title: "Design Fundamentals", tasks: ["Color theory & typography", "Layout principles & grids", "Visual hierarchy", "Figma basics"], status: "upcoming" },
        { week: 3, title: "UX Research", tasks: ["User personas & journey maps", "Wireframing techniques", "Information architecture", "Usability heuristics"], status: "upcoming" },
        { week: 5, title: "UI Design", tasks: ["Design systems & components", "Responsive design", "Accessibility (WCAG)", "Prototyping in Figma"], status: "upcoming" },
        { week: 8, title: "Portfolio Project", tasks: ["Full app redesign case study", "User testing & iteration", "Presentation skills", "Dribbble/Behance portfolio"], status: "upcoming" },
        { week: 10, title: "Advanced & Industry", tasks: ["Motion design basics", "Design tokens & handoff", "Design leadership", "Freelance/job preparation"], status: "upcoming" },
      ],
      resources: ["Google UX Design Certificate", "Refactoring UI", "Laws of UX", "Figma Community"],
    };
  },

  _buildMusicRoadmap(skill, level, goal, hours) {
    return {
      skill, currentLevel: level, goal: goal || `Learn ${skill}`,
      totalWeeks: 12, hoursPerWeek: hours || 3,
      milestones: [
        { week: 1, title: "Getting Started", tasks: [`Get your ${skill} equipment ready`, "Learn to read basic notation", "Practice posture and technique", "Learn 3-4 basic exercises"], status: "upcoming" },
        { week: 4, title: "Building Foundation", tasks: ["Scales and basic theory", "Simple songs and melodies", "Rhythm and timing exercises", "Daily practice routine"], status: "upcoming" },
        { week: 7, title: "Intermediate Skills", tasks: ["Complex chords and progressions", "Play 5 complete songs", "Improvisation basics", "Record yourself for feedback"], status: "upcoming" },
        { week: 10, title: "Performance Ready", tasks: ["Learn a challenging piece", "Play with backing tracks", "Perform for friends/family", "Explore your musical style"], status: "upcoming" },
        { week: 12, title: "Showcase", tasks: ["Record a cover or original piece", "Share on social media", "Teach basics to a peer on SkillSwap", "Plan next musical goals"], status: "upcoming" },
      ],
      resources: [`Justin${skill === "Guitar" ? "Guitar" : "Piano"}.com`, "YouTube music tutorials", "SkillSwap music mentors", "Practice apps"],
    };
  },

  // -----------------------------------------------------------------------
  // 3. AI LEARNING ASSISTANT
  // -----------------------------------------------------------------------
  askAssistant(question) {
    const q = question.toLowerCase();
    let response = {
      answer: "",
      learningSteps: [],
      resources: [],
      exercises: [],
      projectIdeas: [],
      mentorQuestions: [],
    };

    if (q.includes("python")) {
      response = {
        answer: "Python is an excellent choice! It's one of the most versatile and beginner-friendly programming languages. Here's how to get started:",
        learningSteps: [
          "Install Python 3.x from python.org and set up VS Code with the Python extension",
          "Start with variables, data types (int, float, str, list, dict), and basic operators",
          "Learn control flow: if/elif/else statements and for/while loops",
          "Master functions: def, parameters, return values, and scope",
          "Explore built-in modules: os, sys, json, datetime, math",
          "Practice with small projects before moving to frameworks",
        ],
        resources: [
          "python.org/doc/tutorial — Official Python Tutorial",
          "automatetheboringstuff.com — Practical automation with Python",
          "realpython.com — Intermediate to advanced tutorials",
          "exercism.org/tracks/python — Guided exercises with mentoring",
        ],
        exercises: [
          "Build a number guessing game with hints",
          "Create a temperature converter (Celsius ↔ Fahrenheit)",
          "Write a program to find palindromes in a text",
          "Build a simple to-do list CLI app with file storage",
          "Create a web scraper for weather data using requests + BeautifulSoup",
        ],
        projectIdeas: [
          "Personal finance tracker with CSV export",
          "Discord/Telegram bot for study group reminders",
          "URL shortener using Flask",
          "Movie recommendation system using pandas",
          "Automated email sender for class schedules",
        ],
        mentorQuestions: [
          "What projects have you built with Python?",
          "Which libraries do you recommend for beginners?",
          "How should I structure a medium-sized Python project?",
          "What's the best way to handle errors in Python?",
          "Can you review my code and suggest improvements?",
        ],
      };
    } else if (q.includes("react") || q.includes("frontend") || q.includes("next.js")) {
      response = {
        answer: "React is the most popular UI library for building modern web applications. Here's a structured path:",
        learningSteps: [
          "Make sure you know HTML, CSS, and JavaScript basics first",
          "Set up a React project with Vite: npm create vite@latest my-app -- --template react",
          "Learn JSX — it's HTML-like syntax inside JavaScript",
          "Understand components: functional components, props, and composition",
          "Master hooks: useState for state, useEffect for side effects",
          "Build routing with React Router or learn Next.js for full-stack apps",
        ],
        resources: [
          "react.dev — The new official React documentation (excellent!)",
          "nextjs.org/learn — Interactive Next.js tutorial",
          "javascript.info — Modern JavaScript reference",
          "ui.shadcn.com — Beautiful component library for React",
        ],
        exercises: [
          "Build a counter app with increment/decrement buttons",
          "Create a to-do list with add, delete, and complete functionality",
          "Build a weather app that fetches data from an API",
          "Create a multi-page portfolio site with React Router",
          "Build a real-time search filter for a list of items",
        ],
        projectIdeas: [
          "Personal portfolio website deployed to Vercel",
          "Recipe finder app with API integration",
          "Expense tracker with charts (using Recharts)",
          "Social media dashboard with dark mode",
          "E-commerce product catalog with cart functionality",
        ],
        mentorQuestions: [
          "How do you structure components in large projects?",
          "When should I use useContext vs. a state management library?",
          "What's the difference between CSR, SSR, and SSG?",
          "How do you handle authentication in React apps?",
          "What testing tools do you recommend for React?",
        ],
      };
    } else if (q.includes("machine learning") || q.includes("ml") || q.includes("ai") || q.includes("deep learning")) {
      response = {
        answer: "Machine Learning is a fascinating field! Here's how to approach it systematically:",
        learningSteps: [
          "Build math foundations: linear algebra, calculus, probability, statistics",
          "Learn Python well — it's the primary ML language",
          "Start with scikit-learn for classical ML algorithms",
          "Learn data manipulation with pandas and visualization with matplotlib",
          "Move to deep learning with PyTorch or TensorFlow",
          "Practice on Kaggle competitions and real datasets",
        ],
        resources: [
          "fast.ai — Practical deep learning for coders (free course)",
          "coursera.org — Andrew Ng's Machine Learning Specialization",
          "kaggle.com/learn — Bite-sized ML tutorials",
          "pytorch.org/tutorials — Official PyTorch guides",
        ],
        exercises: [
          "Implement linear regression from scratch",
          "Build a spam classifier using Naive Bayes",
          "Train a CNN to classify MNIST digits",
          "Create a sentiment analysis model for movie reviews",
          "Build a simple recommendation system",
        ],
        projectIdeas: [
          "Image classification app for plant species",
          "Chatbot using transformer models",
          "Stock price prediction dashboard",
          "Music genre classifier from audio features",
          "Face detection and recognition system",
        ],
        mentorQuestions: [
          "What math topics are most critical for ML?",
          "PyTorch vs TensorFlow — which should I learn?",
          "How do you approach feature engineering?",
          "What's the workflow for a real-world ML project?",
          "How do you deploy ML models in production?",
        ],
      };
    } else {
      // Generic response
      const topic = question.replace(/how do i (start )?(learn(ing)?|study|get into|begin) ?/i, "").replace(/\?/g, "").trim() || "this topic";
      response = {
        answer: `Great question about ${topic}! Here's a structured approach to get started:`,
        learningSteps: [
          `Research the fundamentals and core concepts of ${topic}`,
          "Find a structured course or tutorial to follow",
          "Set up your learning environment and tools",
          "Practice with small exercises and mini-projects",
          "Find a study buddy or mentor on SkillSwap",
          "Build a portfolio project to demonstrate your skills",
        ],
        resources: [
          `Search for "${topic} beginner guide" on YouTube`,
          `Look for free courses on Coursera, edX, or freeCodeCamp`,
          `Find books and tutorials on the official documentation`,
          `Join communities on Reddit (r/${topic.replace(/\s/g, "")}) and Discord`,
        ],
        exercises: [
          `Complete a "Hello World" equivalent for ${topic}`,
          "Follow along with a tutorial and modify the examples",
          "Explain a core concept in your own words",
          "Build something small without following a guide",
          "Teach what you've learned to someone else",
        ],
        projectIdeas: [
          `Create a beginner-level ${topic} project`,
          `Recreate an existing ${topic} project with your own twist`,
          `Combine ${topic} with another skill you know`,
          `Contribute to an open-source ${topic} project`,
        ],
        mentorQuestions: [
          `What's the most important thing to focus on first in ${topic}?`,
          "How long did it take you to feel comfortable?",
          "What are common mistakes beginners make?",
          "Can you recommend your favorite learning resource?",
          "What projects should I build to practice?",
        ],
      };
    }

    return response;
  },

  // Internal: get related skill IDs for intelligent matching
  _getRelatedSkillIds(skillId) {
    const related = new Set();
    // Check which category groups this skill belongs to
    const categories = SKILL_CATEGORY_MAP[skillId] || [];
    // Find other skills in the same categories
    Object.entries(SKILL_CATEGORY_MAP).forEach(([sid, cats]) => {
      if (sid !== skillId && cats.some(c => categories.includes(c))) {
        related.add(sid);
      }
    });
    // Also check the semantic relations graph
    Object.values(SKILL_RELATIONS).forEach(group => {
      if (group.includes(skillId)) {
        group.forEach(sid => { if (sid !== skillId) related.add(sid); });
      }
    });
    return [...related];
  },
};

export default aiService;
