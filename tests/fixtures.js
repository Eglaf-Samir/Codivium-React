/**
 * fixtures.js
 * Minimal dashboard-payload-v2 fixtures for testing.
 * Full payload shape is in demo/demo_data_full.js —
 * these are trimmed-down versions covering only what each test needs.
 */

'use strict';

const MINIMAL_PAYLOAD = {
  version: 'dashboard-payload-v2',
  meta: {
    sessionStartEndpoint: '/api/sessions/start',
    anchorDate: '2026-03-01',
    ui: {
      mode: 'full',
      panels: { scores: true, depth: true, heatmap: true, time: true, allocation: true, mcq: true, infoPane: true }
    }
  },
  overall: {
    metrics: {
      codiviumScore: 55, breadthOverall: 50, breadthMicro: 48, breadthInterview: 46,
      breadthMcq: 52, weightedMcqScore: 70, firstTryPassRate: 45, avgAttemptsToAC: 3.1,
      medianTimeToACMinutes: 30, codiviumPointsAll: 800, codiviumPoints30: 120,
      efficiencyPtsPerHr: 9.0, depthOverall: 60, depthMicro: 58, depthInterview: 56,
    },
    timeOnPlatform: { daily: [{ date: '2026-02-28', minutes: 45 }, { date: '2026-03-01', minutes: 60 }] },
    insights: {},
    recommendedActions: [
      {
        id: 'cta_depth_raise',
        panelId: 'depth',
        label: 'Deepen Trees',
        actionType: 'start_session',
        track: 'micro',
        params: { category: 'Trees', categoryId: 'trees', intent: 'raise_depth', count: 5, timeboxMinutes: 35 }
      },
      {
        id: 'cta_heatmap_focus',
        panelId: 'heatmap',
        label: 'Focus Session',
        actionType: 'start_session',
        track: 'micro',
        params: { category: 'Graphs', categoryId: 'graphs', count: 4, timeboxMinutes: 25 }
      }
    ]
  },
  combinedCoding: {
    allocation: [
      { category: 'Arrays',  minutes: 200, solved: 8 },
      { category: 'Trees',   minutes: 150, solved: 5 },
      { category: 'Graphs',  minutes: 300, solved: 10 },
    ],
    depthByCategory: [
      { category: 'Graphs', depth: 90 },
      { category: 'Arrays', depth: 55 },
      { category: 'Trees',  depth: 45 },
    ],
    depthAvg: 63,
    convergenceHeatmap: {
      categories: ['Arrays', 'Trees', 'Graphs'],
      buckets: ['A1', 'A2', 'A3', 'A4', 'A5'],
      values: [[0.5, 0.7, 0.9, 1.0, 1.0], [0.3, 0.5, null, null, null], [0.6, 0.8, 0.95, 1.0, null]],
      counts: [[10, 8, 6, 4, 2], [8, 5, 0, 0, 0], [12, 9, 6, 4, 0]],
      focus: {
        modes: [
          { id: 'impact', label: 'Impact', description: 'Impact mode', isDefault: true },
          { id: 'worst_convergence', label: 'Worst convergence', description: 'Worst conv', isDefault: false },
        ],
        defaultModeId: 'impact',
        rankings: { impact: ['Trees', 'Arrays', 'Graphs'], worst_convergence: ['Trees', 'Graphs', 'Arrays'] },
        topNDefault: 10,
        topNOptions: [8, 10, 12],
      }
    }
  },
  micro: {
    metrics: { breadth: 48 },
    allocation: [
      { category: 'Arrays', minutes: 120, solved: 5 },
      { category: 'Trees',  minutes: 90,  solved: 3 },
    ],
    depthByCategory: [
      { category: 'Arrays', depth: 58 },
      { category: 'Trees',  depth: 48 },
    ],
    depthAvg: 53,
    convergenceHeatmap: {
      categories: ['Arrays', 'Trees'],
      buckets: ['A1','A2','A3','A4','A5'],
      values: [[0.5, 0.7, 0.9, 1.0, null], [0.3, 0.5, null, null, null]],
      counts: [[10,8,6,4,0],[8,5,0,0,0]],
    }
  },
  interview: {
    metrics: { breadth: 46 },
    allocation: [
      { category: 'Graphs', minutes: 180, solved: 6 },
      { category: 'Trees',  minutes: 60,  solved: 2 },
    ],
    depthByCategory: [
      { category: 'Graphs', depth: 88 },
      { category: 'Trees',  depth: 42 },
    ],
    depthAvg: 65,
    convergenceHeatmap: {
      categories: ['Graphs', 'Trees'],
      buckets: ['A1','A2','A3','A4','A5'],
      values: [[0.6, 0.8, 0.95, 1.0, null], [0.25, 0.45, null, null, null]],
      counts: [[12,9,6,4,0],[6,4,0,0,0]],
    }
  },
  mcq: {
    metrics: { breadth: 52, weightedMcqScore: 70 },
    mcq: {
      byDifficulty: {
        basic:        { Arrays: 80, Trees: 75 },
        intermediate: { Arrays: 60, Trees: 55 },
        advanced:     { Arrays: 40, Trees: 35 },
      },
      overallCorrect: { correct: 150, total: 200 },
      byDifficultyEvidence: {
        basic:        { Arrays: { attempts: 3, questions: 30 }, Trees: { attempts: 3, questions: 30 } },
        intermediate: { Arrays: { attempts: 2, questions: 20 }, Trees: { attempts: 2, questions: 20 } },
        advanced:     { Arrays: { attempts: 2, questions: 20 }, Trees: { attempts: 2, questions: 20 } },
      }
    }
  }
};

const INFO_ONLY_PAYLOAD = Object.assign({}, MINIMAL_PAYLOAD, {
  meta: Object.assign({}, MINIMAL_PAYLOAD.meta, {
    ui: { mode: 'info_only', panels: { scores: false, depth: false, heatmap: false, time: false, allocation: false, mcq: false, infoPane: true } }
  })
});


// ─────────────────────────────────────────────────────────────────────────────
// Edge-case payloads (Step 4 of refactor plan)
// These mirror the backend EC-0x fixtures but as dashboard-payload-v2 outputs
// for frontend rendering tests.
// ─────────────────────────────────────────────────────────────────────────────

// EC-02 equivalent: zero-evidence payload — all scores zero, no charts
const ZERO_EVIDENCE_PAYLOAD = {
  version: 'dashboard-payload-v2',
  meta: {
    sessionStartEndpoint: '/api/sessions/start',
    anchorDate: '2026-03-14',
    ui: {
      mode: 'full',
      panels: { scores: true, depth: true, heatmap: true, time: true, allocation: true, mcq: true, infoPane: true }
    }
  },
  overall: {
    metrics: {
      codiviumScore: 0, breadthOverall: 0, breadthMicro: 0, breadthInterview: 0,
      breadthMcq: 0, weightedMcqScore: 0, firstTryPassRate: 0, avgAttemptsToAC: 0,
      medianTimeToACMinutes: 0, codiviumPointsAll: 0, codiviumPoints30: 0,
      efficiencyPtsPerHr: 0, depthOverall: 0, depthMicro: 0, depthInterview: 0,
    },
    timeOnPlatform: { daily: [] },
    insights: {},
    recommendedActions: []
  },
  combinedCoding: {
    allocation: [],
    depthByCategory: [],
    depthAvg: 0,
    convergenceHeatmap: {
      categories: [], buckets: ['A1','A2','A3','A4','A5'], values: [], counts: [],
      focus: { modes: [], defaultModeId: 'impact', rankings: {}, topNDefault: 12, topNOptions: [8,10,12] }
    }
  },
  micro:     { metrics: { breadth: 0 }, allocation: [], depthByCategory: [], depthAvg: 0,
               convergenceHeatmap: { categories: [], buckets: ['A1','A2','A3','A4','A5'], values: [], counts: [] } },
  interview: { metrics: { breadth: 0 }, allocation: [], depthByCategory: [], depthAvg: 0,
               convergenceHeatmap: { categories: [], buckets: ['A1','A2','A3','A4','A5'], values: [], counts: [] } },
  mcq:       { metrics: { breadth: 0, weightedMcqScore: 0 },
               mcq: { byDifficulty: {}, overallCorrect: { correct: 0, total: 0 }, byDifficultyEvidence: {} } }
};

// EC-09 equivalent: all depth in one category, low breadth due to zero balance
const LOW_BALANCE_PAYLOAD = Object.assign({}, MINIMAL_PAYLOAD, {
  overall: Object.assign({}, MINIMAL_PAYLOAD.overall, {
    metrics: Object.assign({}, MINIMAL_PAYLOAD.overall.metrics, {
      breadthMicro: 8.2,   // low: coverage=1/3, balance=0, conf partial
      breadthOverall: 12.0,
      codiviumScore: 18.0,
    })
  }),
  combinedCoding: Object.assign({}, MINIMAL_PAYLOAD.combinedCoding, {
    depthByCategory: [
      { category: 'Arrays', depth: 82 },  // all evidence here
      { category: 'Trees',  depth: 0 },
      { category: 'Graphs', depth: 0 },
    ],
    depthAvg: 27,
    allocation: [
      { category: 'Arrays', minutes: 480, solved: 18 },  // all time in one category
    ]
  })
});

module.exports = { MINIMAL_PAYLOAD, INFO_ONLY_PAYLOAD, ZERO_EVIDENCE_PAYLOAD, LOW_BALANCE_PAYLOAD };
