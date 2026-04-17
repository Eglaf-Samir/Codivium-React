// utils/routing.js
// Orientation diagnostic URL builder — mirrors buildOrientationUrl in adaptive-practice.js.

export const ORIENTATION_CONFIG = {
  difficultyMap: {
    beginner:     'basic',
    basic:        'basic',
    intermediate: 'intermediate',
    advanced:     'advanced',
  },
  questionCountByTime: {
    5:   5,
    20: 10,
    60: 15,
  },
  defaultQuestionCount: 10,
  exploringSession: {
    categoryMode:      'curated',
    categoryCount:      4,
    totalQuestions:    24,
    curatedCategories: [
      'Language Basics',
      'Functions',
      'Data Types & Data Structures',
      'Performance',
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

  // Persist answers for Phase C continuity
  try {
    localStorage.setItem('cv_adaptive_onboarding', JSON.stringify({
      goal, level, time, difficulty, count,
      answeredAt: new Date().toISOString(),
    }));
  } catch (_) {}

  if (goal === 'explore') return _buildExploreUrl(difficulty, cfg.exploringSession);

  const base = (typeof window.__adaptiveBase === 'string') ? window.__adaptiveBase : '';
  if (base) {
    const demoCats = goal === 'interview'
      ? 'Arrays,String+Manipulation,Tree+Traversal'
      : 'Language+Basics,Functions,Data+Types';
    return `${base}mcq-parent.html?categories=${demoCats}&difficulty=${difficulty}&count=10&source=adaptive&orient=true`;
  }

  const track = goal === 'interview' ? 'interview' : 'micro';
  const params = new URLSearchParams({ track, difficulty, source: 'adaptive', orient: 'true' });
  return `menu-page.html?${params.toString()}`;
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
  const base = (typeof window.__adaptiveBase === 'string') ? window.__adaptiveBase : '';
  return `${base}mcq-parent.html?${params.toString()}`;
}

// Read the onboarding answers from localStorage to determine ghost link destination
export function getOnboardingGoal() {
  try {
    const raw = localStorage.getItem('cv_adaptive_onboarding');
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data.goal || null;
  } catch (_) {
    return null;
  }
}

export function buildGhostHref(goal) {
  if (goal === 'interview') return 'menu-page.html?track=interview';
  if (goal === 'improve' || goal === 'gaps') return 'menu-page.html?track=micro';
  return 'mcq-parent.html';
}
