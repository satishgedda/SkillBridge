// Standard weights from the SkillBridge scoring framework. Each category is scored 0-10.
export const WEIGHTS = {
  technical: { dsa: 0.25, programming: 0.2, csFundamentals: 0.2, projects: 0.2, problemSolving: 0.15 },
  hr: { communication: 0.3, behavioral: 0.25, confidence: 0.2, teamwork: 0.15, professionalism: 0.1 },
};
export const DEFAULTS = {
  thresholds: [{ name: 'Placement Participant', min: 0 }, { name: 'Needs Improvement', min: 40 }, { name: 'Almost Ready', min: 60 },
    { name: 'Placement Ready', min: 70 }, { name: 'Industry Ready', min: 80 }, { name: 'Elite Candidate', min: 90 }],
  minCertLevel: 'Placement Ready', mentorShare: 0.7,
};
export function evalTotal(type, scores) {
  const w = WEIGHTS[type]; if (!w) throw new Error('Unknown interview type');
  let t = 0;
  for (const k of Object.keys(w)) { const v = Number(scores?.[k]); if (!(v >= 0 && v <= 10)) throw new Error(`Score for ${k} must be 0-10`); t += v * w[k]; }
  return Math.round(t * 100) / 10; // 0-100
}
export const levelFor = (score, thresholds) => [...thresholds].sort((a, b) => a.min - b.min).reduce((l, t) => (score >= t.min ? t.name : l), thresholds[0].name);
export const levelIndex = (name, thresholds) => [...thresholds].sort((a, b) => a.min - b.min).findIndex((t) => t.name === name);
