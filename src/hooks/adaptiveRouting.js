// utils/routing.js — SPA version: all URLs use React Router paths (no .html)

export const ORIENTATION_CONFIG = {
  difficultyMap: {
    beginner:     'basic',
    basic:        'basic',
    intermediate: 'intermediate',
    advanced:     'advanced',
  },
  questionCountByTime: { 5: 5, 20: 10, 60: 15 },
  defaultQuestionCount: 10,
  exploringSession: {
    categoryMode:      'curated',
    categoryCount:      4,
    totalQuestions:    24,
    curatedCategories: [
      'Language Basics', 'Functions', 'Data Types & Data Structures', 'Performance',
    ],
  },
};

export const BUILDING_MODE_THRESHOLD = 12;

export function buildOrientationUrl(answers) {
  const cfg  = ORIENTATION_CONFIG;
  const goal  = answers.goal  || 'explore';
  const level = answers.level || 'beginner';
  const time  = parseInt(answers.time || '20', 10);

  const difficulty = cfg.difficultyMap[level] || 'basic';
  const count      = cfg.questionCountByTime[time] || cfg.defaultQuestionCount;

  try {
    localStorage.setItem('cv_adaptive_onboarding', JSON.stringify({
      goal, level, time, difficulty, count, answeredAt: new Date().toISOString(),
    }));
  } catch (_) {}

  if (goal === 'explore') return _buildExploreUrl(difficulty, cfg.exploringSession);

  const track = goal === 'interview' ? 'interview' : 'micro';
  const params = new URLSearchParams({ track, difficulty, source: 'adaptive', orient: 'true' });

  if (goal === 'interview') return `/menu?${params.toString()}`;

  // go to MCQ setup with pre-filled params
  const mcqParams = new URLSearchParams({ difficulty, count: String(count), source: 'adaptive', orient: 'true' });
  return `/mcq?${mcqParams.toString()}`;
}

function _buildExploreUrl(difficulty, cfg) {
  const curated   = cfg.curatedCategories || [];
  const useRandom = cfg.categoryMode !== 'curated' || curated.length === 0;
  let cats;

  if (useRandom) {
    const available = (window.__CODIVIUM_DEMO_CATEGORIES__ || []).sort(() => Math.random() - 0.5);
    cats = available.slice(0, cfg.categoryCount);
  } else {
    cats = curated.slice(0, cfg.categoryCount);
  }

  const params = new URLSearchParams({
    categories: cats.join(','),
    difficulty,
    count:      String(cfg.totalQuestions),
    source:     'adaptive',
    orient:     'true',
  });
  return `/mcq?${params.toString()}`;
}

export function getOnboardingGoal() {
  try {
    const raw = localStorage.getItem('cv_adaptive_onboarding');
    if (!raw) return null;
    return JSON.parse(raw).goal || null;
  } catch (_) { return null; }
}

export function buildGhostHref(goal) {
  if (goal === 'interview') return '/menu?track=interview';
  if (goal === 'improve' || goal === 'gaps') return '/menu?track=micro';
  return '/mcq';
}
