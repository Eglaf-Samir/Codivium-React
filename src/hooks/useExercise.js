// hooks/useExercise.js
// Loads exercise detail via real API based on location.state.item + URL track.
// Maps backend response to the shape LeftPane/RightPane expect.
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { marked } from 'marked';

import { GetallInterviewPreprationinerdetails as GetInterviewDetail } from '../api/interviewprepration/apiinterviewprepration';
import { GetallInterviewPreprationinerdetails as GetDeliberateDetail } from '../api/deliberatePractice/apideliberatepractice';

marked.setOptions({ gfm: true, breaks: true });

function sanitizeHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

export function renderMd(text) {
  if (!text) return '';
  try {
    return sanitizeHtml(marked.parse(String(text)));
  } catch (_) {
    return `<pre>${String(text).replace(/</g, '&lt;')}</pre>`;
  }
}

function unitTestsSourceFrom(detail) {
  const list = detail?.unitTests || [];
  if (!list.length) return '';
  return list
    .map((u, i) => {
      const code = u.codeTemplate || u.code || '';
      if (/^\s*def\s+/m.test(code)) return code.trim();
      return `def test_${i + 1}():\n${code
        .split('\n')
        .map((l) => '    ' + l)
        .join('\n')}`;
    })
    .join('\n\n');
}

function difficultyLabel(raw) {
  const s = (raw || '').toLowerCase();
  if (s.includes('beginner') || s.includes('basic')) return 'beginner';
  if (s.includes('advanced')) return 'advanced';
  if (s.includes('intermediate')) return 'intermediate';
  return s;
}

function mapExerciseDetail(detail, item, track) {
  if (!detail) return null;
  return {
    id: detail.id || item?.id,
    name: detail.title || detail.name || item?.title || '',
    category: detail.categories?.name || detail.category || item?.categories?.name || '',
    difficulty: difficultyLabel(
      detail.difficultyLevel?.description ||
        detail.difficultyLevel?.name ||
        item?.difficultyLevel?.description ||
        item?.difficultyLevel?.name ||
        '',
    ),
    testsTotal: (detail.unitTests || []).length,
    problemStatement: detail.instructions || detail.problemStatement || '',
    isInstructionHtml: detail.isInstructionHtml ?? false,
    hints: detail.hints || '',
    miniTutorial: detail.miniTutorial || '',
    isTutorialHtml: detail.isTutorialHtml ?? false,
    codeScaffold:
      detail.codeTemplate ||
      detail.codeScaffold ||
      detail.manualSuggestedSolution ||
      '',
    suggestedSolution:
      detail.suggestedSolution || detail.manualSuggestedSolution || '',
    unitTestsSource: unitTestsSourceFrom(detail),
    unitTests: detail.unitTests || [],
    priorAttempts: item?.runCount || 0,
    track,
    raw: detail,
  };
}

export function useExercise() {
  const location = useLocation();
  const item = location?.state?.item || null;
  const pathname = location?.pathname || '';
  const track = pathname.toLowerCase().includes('interview') ? 'interview' : 'micro';

  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!item) {
      setError('No exercise context found. Please open an exercise from the menu.');
      setLoading(false);
      return;
    }

    try {
      let res;
      if (track === 'interview') {
        const id = item.csInterviewPreprationId;
        const exerciseId = item.excerciseId;
        if (!id || !exerciseId) throw new Error('Missing interview exercise fields');
        res = await GetInterviewDetail(id, exerciseId);
      } else {
        const id = item.deliberatePracticeid;
        const practiceId = item.practiceId;
        if (!id || !practiceId) throw new Error('Missing deliberate practice fields');
        res = await GetDeliberateDetail(id, practiceId);
      }

      if (!res || res.status !== 200 || !res.data) {
        throw new Error(`HTTP ${res?.status || 'error'}`);
      }

      setExercise(mapExerciseDetail(res.data, item, track));
    } catch (err) {
      console.error('useExercise load failed', err);
      setError(err.message || 'Failed to load exercise');
    } finally {
      setLoading(false);
    }
  }, [item, track]);

  useEffect(() => {
    load();
  }, [load]);

  return { exercise, loading, error, reload: load, item, track };
}
