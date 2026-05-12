import { useState, useRef, useEffect, useMemo } from "react";
import Topbar from "../components/Topbar";
import usePageMeta from "../hooks/usePageMeta";
import { Link } from "react-router-dom";

const ARTICLES = [
    {
        id: 1,
        title: 'Deliberate Practice: The path to mastery of Software development in Python (Part I)',
        category: 'Python Mastery',
        date: '2026-02-13',
        dateLabel: 'Feb 13, 2026',
        readTime: '~8 min',
        subtitle: 'This is the first of a two-part series on deliberate practice – what it is, the benefits and how it may be leveraged for improving in…',
        href: '/article',
        featured: true,
        popularity: 90,
        keywords: ['Deliberate Practice', 'Mastery', 'Python'],
    },
    {
        id: 2,
        title: 'The deliberate-practice loop for Python mastery',
        category: 'Deliberate Practice',
        date: '2026-01-18',
        dateLabel: 'Jan 18, 2026',
        readTime: '~6 min',
        subtitle: 'How feedback, repetition, and scope control create compounding skill — and how to structure your sessions.',
        href: '/article',
        featured: false,
        popularity: 72,
        keywords: ['Deliberate Practice', 'Practice Loop'],
    },
    {
        id: 3,
        title: 'Mental models: why “small drills” beat long tutorials',
        category: 'Python Mastery',
        date: '2025-12-22',
        dateLabel: 'Dec 22, 2025',
        readTime: '~5 min',
        subtitle: 'A pragmatic way to build correctness-first intuition in Python — without memorizing patterns.',
        href: '/article',
        featured: false,
        popularity: 61,
        keywords: ['Mental Models', 'Python', 'Mastery'],
    },
];

const CATEGORIES = ['Deliberate Practice', 'Python Mastery'];
const KEYWORDS = ['Deliberate Practice', 'Mastery', 'Python', 'Atomic Exercises', 'Mental Models'];

function GlowRow({ article, onMouseEnter, onMouseLeave }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const h = e => {
            const r = el.getBoundingClientRect();
            el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(2) + '%');
            el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(2) + '%');
        };
        el.addEventListener('pointermove', h, { passive: true });
        return () => el.removeEventListener('pointermove', h);
    }, []);

    return (
        <Link
            className="bm-row glow-track bm-article"
            data-date={article.date}
            data-pop={article.popularity}
            data-subtitle={article.subtitle}
            to={article.href}
            role="listitem"
            ref={ref}
            onMouseEnter={() => onMouseEnter(article)}
            onMouseLeave={onMouseLeave}
        >
            <div aria-hidden="true" className="bm-ico">◆</div>
            <div className="bm-row-main">
                <div className="bm-row-title">{article.title}</div>
            </div>
            <div className="bm-row-meta">
                <div className="bm-row-cat">{article.category}</div>
                <div className="bm-row-date">{article.dateLabel}</div>
            </div>
        </Link>
    );
}

function Articles() {
    usePageMeta("articles");

    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('Newest');
    const [activeCat, setActiveCat] = useState(null);
    const [activeKey, setActiveKey] = useState(null);
    const [preview, setPreview] = useState(null);
    const featRef = useRef(null);

    useEffect(() => {
        const el = featRef.current;
        if (!el) return;
        const h = e => {
            const r = el.getBoundingClientRect();
            el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(2) + '%');
            el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(2) + '%');
        };
        el.addEventListener('pointermove', h, { passive: true });
        return () => el.removeEventListener('pointermove', h);
    }, []);

    const filtered = useMemo(() => {
        let list = [...ARTICLES];
        if (activeCat) list = list.filter(a => a.category === activeCat);
        if (activeKey) list = list.filter(a => a.keywords.includes(activeKey));
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(a => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
        }
        if (sort === 'Oldest') list.sort((a, b) => a.date.localeCompare(b.date));
        else if (sort === 'Most Popular') list.sort((a, b) => b.popularity - a.popularity);
        else list.sort((a, b) => b.date.localeCompare(a.date));
        return list;
    }, [search, sort, activeCat, activeKey]);

    const featured = ARTICLES.find(a => a.featured);

    return (
        <>
            <Topbar />
            <div aria-hidden="true" className="cv-underbar"></div>
            <div aria-hidden="true" className="watermark"><div className="word" data-text="CODIVIUM">CODIVIUM</div></div>
            <div className="stage-shell">
                <main className="stage login-stage" role="main" id="mainContent">
                    <div className="blog-scroll" id="blogScroll">
                        <div aria-label="Codivium Articles" className="blog-min">
                            <header className="bm-header" style={{ display: "flex", justifyContent: "space-between" }}>
                                <div className="bm-left">
                                    <div className="bm-kicker">CODIVIUM • JOURNAL</div>
                                    <h1 className="bm-title">Articles</h1>
                                </div>
                                <div className="bm-right">
                                    <label aria-label="Sort articles" className="bm-sort">
                                        <span className="bm-sort-label">Sort</span>
                                        <select
                                            className="bm-sort-select"
                                            id="bmSort"
                                            value={sort}
                                            onChange={e => setSort(e.target.value)}
                                        >
                                            <option>Newest</option>
                                            <option>Oldest</option>
                                            <option>Most Popular</option>
                                        </select>
                                    </label>
                                </div>
                            </header>
                            <section aria-label="Articles layout" className="bm-layout">
                                <aside aria-label="Filters" className="bm-rail">
                                    <div className="bm-panel">
                                        <div className="bm-panel-head">
                                            <div className="bm-panel-title">Search</div>
                                        </div>
                                        <div className="bm-panel-body">
                                            <label aria-label="Search articles" className="bm-search">
                                                <span aria-hidden="true" className="bm-search-ico">⌕</span>
                                                <input
                                                    autoComplete="off"
                                                    id="bmSearch"
                                                    placeholder="Search…"
                                                    type="text"
                                                    value={search}
                                                    onChange={e => setSearch(e.target.value)}
                                                />
                                            </label>
                                            <div className="bm-hint">Search titles and topics.</div>
                                        </div>
                                    </div>
                                    <div className="bm-panel">
                                        <div className="bm-panel-head">
                                            <div className="bm-panel-title">Categories</div>
                                            <div className="bm-panel-sub">Curated pillars</div>
                                        </div>
                                        <div className="bm-panel-body">
                                            <div className="bm-list" id="bmCats">
                                                {CATEGORIES.map(cat => (
                                                    <button
                                                        key={cat}
                                                        className={`bm-item${activeCat === cat ? ' is-active' : ''}`}
                                                        type="button"
                                                        onClick={() => setActiveCat(activeCat === cat ? null : cat)}
                                                    >
                                                        <span className="bm-dot"></span>
                                                        <span className="bm-item-text">{cat}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bm-panel">
                                        <div className="bm-panel-head">
                                            <div className="bm-panel-title">Keywords</div>
                                            <div className="bm-panel-sub">High-signal topics</div>
                                        </div>
                                        <div className="bm-panel-body">
                                            <div aria-label="Suggested keywords" className="bm-keywords">
                                                {KEYWORDS.map(k => (
                                                    <button
                                                        key={k}
                                                        className={`bm-key${activeKey === k ? ' is-active' : ''}`}
                                                        type="button"
                                                        onClick={() => setActiveKey(activeKey === k ? null : k)}
                                                    >
                                                        {k}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </aside>
                                <section aria-label="Article list" className="bm-main">
                                    {featured && (
                                        <section aria-label="Featured article" className="bm-feature">
                                            <Link
                                                className="bm-feature-card glow-track bm-article"
                                                data-date={featured.date}
                                                data-pop={featured.popularity}
                                                data-subtitle={featured.subtitle}
                                                to={featured.href}
                                                ref={featRef}
                                            >
                                                <div className="bm-feature-top">
                                                    <div className="bm-badge">Featured</div>
                                                    <div className="bm-meta">
                                                        <span className="bm-meta-dot"></span>
                                                        <span className="bm-meta-text">{featured.category}</span>
                                                        <span className="bm-meta-sep">•</span>
                                                        <span className="bm-meta-text">{featured.readTime}</span>
                                                    </div>
                                                </div>
                                                <h2 className="bm-feature-title">{featured.title}</h2>
                                                <div className="bm-feature-foot">
                                                    <span className="bm-read">Read</span>
                                                </div>
                                            </Link>
                                        </section>
                                    )}
                                    <section aria-label="All articles" className="bm-listing">
                                        <div className="bm-section-head">
                                            <div className="bm-section-title">All Articles</div>
                                            <div className="bm-section-sub">Hover to preview. Click to read.</div>
                                            <div aria-hidden="true" className="bm-spacer"></div>
                                        </div>
                                        <div className="bm-rows" id="bmRows" role="list">
                                            {filtered.length === 0
                                                ? <div className="bm-empty">No articles match your filters.</div>
                                                : filtered.map(a => (
                                                    <GlowRow
                                                        key={a.id}
                                                        article={a}
                                                        onMouseEnter={setPreview}
                                                        onMouseLeave={() => setPreview(null)}
                                                    />
                                                ))
                                            }
                                        </div>
                                        <div aria-hidden="true" className={`bm-preview${preview ? ' is-visible' : ''}`} id="bmPreview">
                                            <div aria-label="Article preview" className="bm-preview-card" role="note">
                                                <div className="bm-preview-title">Preview</div>
                                                <div className="bm-preview-text" id="bmPreviewText">
                                                    {preview?.subtitle || ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div aria-hidden="true" className="bm-preview-arrow" id="bmPreviewArrow"></div>
                                    </section>
                                </section>
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

export default Articles;
