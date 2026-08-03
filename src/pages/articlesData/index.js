// Registry of all published articles (Python Mastery Series).
// Each entry pairs the listing/meta fields with the reading-page body HTML.
// Add a new article by dropping in a new module here — Articles.jsx and
// Article.jsx both read from this single source of truth.
import * as article01 from './01-beyond-tutorials-and-projects.js';
import * as article02 from './02-mental-models-of-python-mastery.js';
import * as article03 from './03-practice-of-python-mastery.js';
import * as article04 from './04-deliberate-practice-and-the-science-of-expertise.js';

const MODULES = [article01, article02, article03, article04];

export const ARTICLES = MODULES.map(m => ({ ...m.meta, bodyHtml: m.bodyHtml }));

export function getArticleBySlug(slug) {
  return ARTICLES.find(a => a.slug === slug) || null;
}
