// Intelligent AI Matching Engine for SkillSwap

/**
 * Calculates a multi-factor compatibility score between current user and candidate mentor/partner
 * @param {Object} currentUser 
 * @param {Object} candidateUser 
 * @returns {Object} detailed match results including percentage score and breakdown
 */
export function calculateMatchScore(currentUser, candidateUser) {
  if (!currentUser || !candidateUser || currentUser.id === candidateUser.id) {
    return { score: 0, reasons: [], complementarySkills: [] };
  }

  let totalScore = 0;
  const reasons = [];
  const complementarySkills = [];

  const myWants = (currentUser.skillsWanted || []).map(s => s.toLowerCase());
  const myOffers = (currentUser.skillsOffered || []).map(s => s.toLowerCase());
  const theirOffers = (candidateUser.skillsOffered || []).map(s => s.toLowerCase());
  const theirWants = (candidateUser.skillsWanted || []).map(s => s.toLowerCase());

  // Factor 1: Candidate can teach what Current User wants (Weight: 45%)
  let teachMatches = 0;
  theirOffers.forEach(offer => {
    myWants.forEach(want => {
      if (offer.includes(want) || want.includes(offer) || isSemanticMatch(offer, want)) {
        teachMatches++;
        complementarySkills.push({
          direction: "LEARN_FROM",
          skill: offer,
          description: `${candidateUser.name} can mentor you in ${offer}`
        });
      }
    });
  });

  if (teachMatches > 0) {
    const teachScore = Math.min(45, teachMatches * 25);
    totalScore += teachScore;
    reasons.push(`Can teach skills you want to learn (+${teachScore}%)`);
  }

  // Factor 2: Mutual Exchange! Current user can teach what candidate wants (Weight: 30%)
  let mutualMatches = 0;
  myOffers.forEach(offer => {
    theirWants.forEach(want => {
      if (offer.includes(want) || want.includes(offer) || isSemanticMatch(offer, want)) {
        mutualMatches++;
        complementarySkills.push({
          direction: "TEACH_TO",
          skill: offer,
          description: `You can teach ${offer} to ${candidateUser.name}`
        });
      }
    });
  });

  if (mutualMatches > 0) {
    const mutualScore = Math.min(30, mutualMatches * 20);
    totalScore += mutualScore;
    reasons.push(`Mutual skill swap opportunity (+${mutualScore}%)`);
  }

  // Factor 3: High Reputation & Reliability Multiplier (Weight: 15%)
  const rating = candidateUser.rating || 4.5;
  const reviews = candidateUser.totalReviews || candidateUser.reviewsCount || 5;
  if (rating >= 4.8 && reviews >= 10) {
    totalScore += 15;
    reasons.push("Top-rated mentor with high completion rate (+15%)");
  } else if (rating >= 4.5) {
    totalScore += 10;
    reasons.push("Strong peer rating (+10%)");
  }

  // Factor 4: Schedule Availability Overlap (Weight: 10%)
  const mySched = currentUser.availability || [];
  const theirSched = candidateUser.availability || [];
  let scheduleOverlap = 0;
  mySched.forEach(slot => {
    const day = slot.split(" ")[0];
    if (theirSched.some(s => s.startsWith(day))) {
      scheduleOverlap++;
    }
  });

  if (scheduleOverlap > 0) {
    const schedScore = Math.min(10, scheduleOverlap * 5);
    totalScore += schedScore;
    reasons.push(`Overlapping weekly availability (+${schedScore}%)`);
  }

  // Baseline floor so all interesting candidates get some compatibility
  if (totalScore === 0) {
    totalScore = 42 + Math.floor((candidateUser.xp || 100) % 25);
    reasons.push("General campus domain synergy");
  }

  // Cap at 99%
  const finalScore = Math.min(99, Math.max(35, totalScore));

  return {
    score: finalScore,
    isHighMatch: finalScore >= 80,
    reasons,
    complementarySkills
  };
}

/**
 * Checks semantic closeness between common technical domains
 */
function isSemanticMatch(s1, s2) {
  const synonyms = [
    ["react", "next.js", "frontend", "web", "javascript", "typescript"],
    ["figma", "ui/ux", "design", "prototyping", "wireframing", "product design"],
    ["python", "ai", "machine learning", "deep learning", "data science", "pytorch"],
    ["c++", "dsa", "algorithms", "data structures", "leetcode", "problem solving"],
    ["flutter", "dart", "mobile", "ios", "android", "react native"],
    ["docker", "kubernetes", "devops", "cloud", "aws", "ci/cd", "linux"],
    ["public speaking", "pitching", "communication", "interview prep", "presentations"]
  ];

  for (const group of synonyms) {
    const inGroup1 = group.some(term => s1.includes(term));
    const inGroup2 = group.some(term => s2.includes(term));
    if (inGroup1 && inGroup2) return true;
  }
  return false;
}
