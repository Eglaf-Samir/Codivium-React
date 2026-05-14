// mcq-shared/mcqAdapters.js
//
// Shape adapters between the existing Code-Adept backend (Cosmos
// `McqQuestion` documents + `McqTimeLog` blob) and the quiz UI's flatter
// representation (`options[6]` + `correctIndices[]`).
//
// Why these exist:
//   - Backend `GET /api/v1/mcq/GetAllbyfilterAsync` returns an array of
//     McqQuestion docs where each option lives in `questionOptions[]` with
//     `OptionName / IsAnswers / IsCoding / OptionId`. The UI is built around
//     a flat `options: string[]` + `correctIndices: int[]` shape.
//   - Backend `POST /api/v1/mcqtimelog/CreateMCQLog` expects the entire
//     mutated answer array back inside `userMcqExcerciseAnswers` (JSON
//     string). UserMCQDashboardUseCases parses these blobs for analytics so
//     we MUST preserve the per-option / per-question fields it reads.
//
// All keys are lowercased in the reverse adapter to match what
// UserMCQDashboardUseCases looks for (`mcqQuestionId`, `isRightAnswer`,
// `categoriedetails.id`, `questionOptions[].isAnswers`, etc.).

// Forward: backend McqQuestion → flat quiz question.
// Keeps the original `_raw` so the reverse adapter can rebuild the exact
// shape the backend expects on submit without recomputing fields like
// categoriedetails / difficultyLevel.
export function adaptBackendQuestion(bq, fallbackIndex = 0) {
  if (!bq || typeof bq !== 'object') return null;
  const opts = Array.isArray(bq.questionOptions) ? bq.questionOptions : [];
  const options = opts.map(o => o?.optionName ?? '');
  const correctIndices = opts
    .map((o, i) => (o?.isAnswers ? i : -1))
    .filter(i => i >= 0);
  const optionMeta = opts.map(o => ({
    optionId:   o?.optionId ?? null,
    isCoding:   !!o?.isCoding,
    isAnswers:  !!o?.isAnswers,
    optionName: o?.optionName ?? '',
  }));
  return {
    // Stable identifier — McqQuestionId is the Cosmos partition key value
    // and the field UserMCQDashboardUseCases joins on. `id` is the doc id.
    id:            bq.mcqQuestionId || (bq.id ? String(bq.id) : `q_${fallbackIndex}`),
    docId:         bq.id || null,
    mcqQuestionId: bq.mcqQuestionId || null,
    category:      bq?.categoriedetails?.name || bq?.categories?.name || bq?.category || '',
    categoryId:    bq?.categoriedetails?.id || bq?.categories?.id || null,
    difficulty:    bq?.difficultyLevel?.name || '',
    question:      bq.question || '',
    options,
    optionMeta,                // preserved so the renderer can apply isCoding per option
    correctIndices,
    explanation:   bq.description || '',  // backend has no nanoTutorial — keep null
    nanoTutorial:  null,
    isMultipleAnswer: !!(bq.isMultipleAnswer || bq.ismultipleAnswer),
    _raw:          bq,         // kept for the reverse adapter
  };
}

export function adaptBackendQuestions(list) {
  if (!Array.isArray(list)) return [];
  return list.map((q, i) => adaptBackendQuestion(q, i)).filter(Boolean);
}

// Reverse: a quiz answer entry → the McqQuestion-shaped blob that
// UserMCQDashboardUseCases knows how to parse. `answer` is one item from
// useQuiz's `state.answers` array (has q, selected, isPeek, isCorrect, …)
// and `index` is its position in the quiz.
export function buildBackendAnswerEntry(answer, index) {
  if (!answer?.q) return null;
  const q = answer.q;
  const raw = q._raw || {};
  const opts = Array.isArray(q.optionMeta) ? q.optionMeta : [];

  // Mark each option's isselected flag. For peeks we record no selection
  // (matches the OLD project — selectedIndices is [] when peeked).
  const selectedIdxSet = new Set(answer.isPeek ? [] : (Array.isArray(answer.selected) ? answer.selected : []));
  const questionOptions = opts.map((o, i) => ({
    optionId:   o.optionId,
    optionName: o.optionName,
    isAnswers:  o.isAnswers,
    isCoding:   o.isCoding,
    isselected: selectedIdxSet.has(i),
  }));

  // The OLD project mutates the original McqQuestion object and adds two
  // run-time flags (`isQuestionDone`, `isRightAnswer`), then sends the whole
  // thing back. We rebuild the equivalent shape here using `_raw` as the
  // source of truth for category/difficulty/etc. fields.
  return {
    ...raw,
    questionOptions,
    isQuestionDone: true,
    isRightAnswer:  !!answer.isCorrect,
    isPeek:         !!answer.isPeek,
    questionIndex:  typeof index === 'number' ? index : 0,
    submittedAt:    answer.submittedAt || new Date().toISOString(),
  };
}

// Build the full payload for POST /api/v1/mcqtimelog/CreateMCQLog. Mirrors
// the body shape Code-Adept-React's McqTest.jsx assembles. The backend
// stores `userMcqExcerciseAnswers` as a JSON string in McqTimeLog table.
export function buildResultsPayload({ answers, totalSeconds, userId }) {
  const finalitem = (answers || [])
    .map((a, i) => buildBackendAnswerEntry(a, i))
    .filter(Boolean);
  return {
    id: 0,
    totalSeconds: Math.max(0, Math.round(totalSeconds || 0)),
    userId,
    createdBy: userId,
    modifiedBy: userId,
    isdeleted: false,
    userMcqExcerciseAnswers: JSON.stringify(finalitem),
  };
}
