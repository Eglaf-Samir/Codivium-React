// hooks/useSafeRedirect.js
// React Router-aware replacement for safeRedirect().
// Maps legacy .html filenames → SPA routes, then uses navigate().
import { useNavigate } from 'react-router-dom';
import { recordRecommendationChoice } from './adaptiveUtils.js';

const HTML_TO_SPA = {
  'mcq-parent.html': '/mcq',
  'mcq-quiz.html':   '/mcq/quiz',
  'menu-page.html':  '/menu',
  'editor.html':     '/editor',
  'adaptive-practice.html': '/adaptive-practice',
  'codivium_insights_embedded.html': '/insights',
  'account-settings.html': '/settings',
};

function toSpaPath(url) {
  if (!url) return null;
  // Already a SPA path
  if (url.startsWith('/') && !url.endsWith('.html')) return url;
  // Strip leading ./ or just filename
  const clean = url.replace(/^\.\//, '');
  // Match filename + optional query
  const match = clean.match(/^([^?#]+\.html)(\?.*)?$/);
  if (match) {
    const file  = match[1].split('/').pop(); // basename
    const query = match[2] || '';
    const spa   = HTML_TO_SPA[file];
    if (spa) return spa + query;
  }
  return url; // unchanged (external or already SPA)
}

export function useSafeRedirect() {
  const navigate = useNavigate();

  return function safeNavigate(url, typeLabel) {
    if (!url) return;
    if (typeLabel) recordRecommendationChoice(typeLabel);
    const spa = toSpaPath(url);
    if (spa && (spa.startsWith('/') || spa.startsWith('#'))) {
      navigate(spa);
    } else if (spa) {
      // External URL — allow
      try {
        const parsed = new URL(spa, window.location.origin);
        if (parsed.origin === window.location.origin) navigate(parsed.pathname + parsed.search + parsed.hash);
        else window.location.href = spa;
      } catch (_) { window.location.href = spa; }
    }
  };
}

export { toSpaPath };
