// mcq-shared/mcqAdapters.js
//
// Shape adapters between the existing Code-Adept backend (Cosmos
// `McqQuestion` documents + `McqTimeLog` row) and the quiz UI's flatter
// representation (`options[6]` + `correctIndices[]`).

import { computeMcqQuality } from './mcqQuality.js';
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

// Helper: pick the first defined value from a list of candidate keys on an
// object. Lets the adapter tolerate both camelCase (default System.Text.Json
// output) and PascalCase (Cosmos raw shape or Newtonsoft default), without
// repeating `a.x || a.X` everywhere.
function pick(obj, ...keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

// Forward: backend McqQuestion → flat quiz question.
// Keeps the original `_raw` so the reverse adapter can rebuild the exact
// shape the backend expects on submit without recomputing fields like
// categoriedetails / difficultyLevel.
export function adaptBackendQuestion(bq, fallbackIndex = 0) {
  if (!bq || typeof bq !== 'object') return null;
  const opts = Array.isArray(pick(bq, 'questionOptions', 'QuestionOptions')) ? pick(bq, 'questionOptions', 'QuestionOptions') : [];
  const options = opts.map(o => pick(o, 'optionName', 'OptionName') ?? '');
  const correctIndices = opts
    .map((o, i) => (pick(o, 'isAnswers', 'IsAnswers') ? i : -1))
    .filter(i => i >= 0);
  const optionMeta = opts.map(o => ({
    optionId:   pick(o, 'optionId', 'OptionId') ?? null,
    isCoding:   !!pick(o, 'isCoding', 'IsCoding'),
    isAnswers:  !!pick(o, 'isAnswers', 'IsAnswers'),
    optionName: pick(o, 'optionName', 'OptionName') ?? '',
  }));
  const mcqQuestionId = pick(bq, 'mcqQuestionId', 'McqQuestionId') || null;
  const docId         = pick(bq, 'id', 'Id') || null;
  const categoryNode  = pick(bq, 'categoriedetails', 'Categoriedetails', 'categories', 'Categories');
  const diffNode      = pick(bq, 'difficultyLevel', 'DifficultyLevel');
  return {
    // Stable identifier — McqQuestionId is the Cosmos partition key value
    // and the field UserMCQDashboardUseCases joins on. `id` is the doc id.
    id:            mcqQuestionId || (docId ? String(docId) : `q_${fallbackIndex}`),
    docId,
    mcqQuestionId,
    category:      pick(categoryNode, 'name', 'Name') || pick(bq, 'category', 'Category') || '',
    categoryId:    pick(categoryNode, 'id', 'Id') ?? null,
    difficulty:    pick(diffNode, 'name', 'Name') || '',
    question:      pick(bq, 'question', 'Question') || '',
    options,
    optionMeta,                // preserved so the renderer can apply isCoding per option
    correctIndices,
    explanation:   pick(bq, 'description', 'Description') || '',
    // Backend `McqQuestion.NanoTutorial` (added 2026-05-14). Existing
    // documents without the field deserialize as null → Tutorial button
    // stays hidden, which is the correct behavior.
    nanoTutorial:  pick(bq, 'nanoTutorial', 'NanoTutorial') || null,
    isMultipleAnswer: !!pick(bq, 'isMultipleAnswer', 'IsMultipleAnswer', 'ismultipleAnswer'),
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
    // Doc-spec field used by analytics + the on-screen quality label.
    // Null when timing wasn't recorded (defensive).
    responseTimeSeconds: typeof answer.responseTimeSeconds === 'number'
      ? answer.responseTimeSeconds : null,
    tutorialViewed: !!answer.tutorialViewed,
  };
}

// Build the full payload for POST /api/v1/mcqtimelog/CreateMCQLog.
//
// As of the 2026-05-14 schema update, `McqTimeLog` carries explicit
// columns for the doc-spec analytics fields (SelectedRecommendationType,
// StartedAt, CompletedAt, TotalQuestions, CorrectAnswers, PeekedAnswers,
// DifficultyLevelId, AverageResponseTimeSeconds, QualityLabel). We send
// those as TOP-LEVEL fields on the request so the backend stores them in
// real columns — queryable without parsing the jsonb blob.
//
// The jsonb `userMcqExcerciseAnswers` still carries the per-question
// answer list (this is what existing parsers like UserMCQDashboardUseCases
// + McqQuestionRepository.skipCorrect iterate). A `_isMeta:true` entry is
// prepended for backwards compatibility with any consumer that already
// expects metadata inside the blob; existing parsers filter on
// `mcqQuestionId` and silently skip the meta entry.
export function buildResultsPayload({ answers, totalSeconds, userId, settings, startedAt, completedAt }) {
  const finalitem = (answers || [])
    .map((a, i) => buildBackendAnswerEntry(a, i))
    .filter(Boolean);

  const recommendationType =
    settings?.source || settings?.selectedRecommendationType || null;
  const difficultyLevelId =
    typeof settings?.difficultyLevelId === 'number' ? settings.difficultyLevelId : null;
  const completedAtIso = completedAt || new Date().toISOString();

  // Tally counts directly from the answer list — keeps the source of
  // truth in one place and removes any drift between the column values
  // and the jsonb blob.
  const peekedAnswers  = finalitem.filter(a => a.isPeek === true).length;
  const correctAnswers = finalitem.filter(a => a.isPeek !== true && a.isRightAnswer === true).length;

  // Quality label — re-computed here from the same shared helper the
  // summary screen uses, so the DB column and the on-screen badge are
  // guaranteed in sync.
  const quality = computeMcqQuality(answers);

  const metaEntry = {
    _isMeta: true,
    selectedRecommendationType: recommendationType,
    startedAt: startedAt || null,
    completedAt: completedAtIso,
    totalQuestions: finalitem.length,
    correctAnswers,
    peekedAnswers,
    difficultyLevelId,
    difficultyName: settings?.difficultyName || null,
    skipCorrect: !!settings?.skipCorrect,
    averageResponseTimeSeconds: quality?.averageResponseTimeSeconds ?? null,
    qualityLabel: quality?.label ?? null,
  };

  return {
    id: 0,
    totalSeconds: Math.max(0, Math.round(totalSeconds || 0)),
    userId,
    createdBy: userId,
    modifiedBy: userId,
    isdeleted: false,
    userMcqExcerciseAnswers: JSON.stringify([metaEntry, ...finalitem]),

    // Top-level fields written to the new McqTimeLog columns. PascalCase
    // matches the C# DTO (McqTimeLogReqest); Newtonsoft's default
    // case-insensitive matching also accepts the camelCase form below.
    selectedRecommendationType: recommendationType,
    startedAt: startedAt || null,
    completedAt: completedAtIso,
    totalQuestions: finalitem.length,
    correctAnswers,
    peekedAnswers,
    difficultyLevelId,
    averageResponseTimeSeconds: quality?.averageResponseTimeSeconds ?? null,
    qualityLabel: quality?.label ?? null,
  };
}
