import { useState } from "react";
import Header from "../components/Header";
import usePageMeta from "../hooks/usePageMeta";

function Articles() {
    usePageMeta("articles");

    return (
        <>
            <Header />
            <div aria-hidden="true" className="cv-underbar"></div>
            <div aria-hidden="true" className="watermark"><div className="word" data-text="CODIVIUM">CODIVIUM</div></div>
            <div className="stage-shell">
                <main className="stage" role="main" id="mainContent">
                    <div className="blog-scroll" id="blogScroll">
                        <div aria-label="Codivium Articles" className="blog-min">
                            <header className="bm-header">
                                <div className="bm-left">
                                    <div className="bm-kicker">CODIVIUM • JOURNAL</div>
                                    <h1 className="bm-title">Articles</h1>
                                </div>
                                <div className="bm-right">
                                    <label aria-label="Sort articles" className="bm-sort">
                                        <span className="bm-sort-label">Sort</span>
                                        <select className="bm-sort-select" id="bmSort">
                                            <option selected="">Newest</option>
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
                                                <input autocomplete="off" id="bmSearch" placeholder="Search…" type="text" />
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
                                                <button className="bm-item" type="button"><span className="bm-dot"></span><span className="bm-item-text">Deliberate Practice</span></button>
                                                <button className="bm-item" type="button"><span className="bm-dot"></span><span className="bm-item-text">Python Mastery</span></button>
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
                                                <button className="bm-key" type="button">Deliberate Practice</button><button className="bm-key" type="button">Mastery</button><button className="bm-key" type="button">Python</button><button className="bm-key" type="button">Atomic Exercises</button><button className="bm-key" type="button">Mental Models</button>
                                            </div>
                                        </div>
                                    </div>
                                </aside>
                                <section aria-label="Article list" className="bm-main">
                                    <section aria-label="Featured article" className="bm-feature">
                                        <a className="bm-feature-card glow-track bm-article" data-date="2026-02-13" data-pop="90" data-subtitle="This is the first of a two-part series on deliberate practice – what it is, the benefits and how it may be leveraged for improving in…" href="/article">
                                            <div className="bm-feature-top">
                                                <div className="bm-badge">Featured</div>
                                                <div className="bm-meta">
                                                    <span className="bm-meta-dot"></span>
                                                    <span className="bm-meta-text">Python Mastery</span>
                                                    <span className="bm-meta-sep">•</span>
                                                    <span className="bm-meta-text">~8 min</span>
                                                </div>
                                            </div>
                                            <h2 className="bm-feature-title">Deliberate Practice: The path to mastery of Software development in Python (Part I)</h2>
                                            <div className="bm-feature-foot">
                                                <span className="bm-read">Read</span>
                                            </div>
                                        </a>
                                    </section>
                                    <section aria-label="All articles" className="bm-listing">
                                        <div className="bm-section-head">
                                            <div className="bm-section-title">All Articles</div>
                                            <div className="bm-section-sub">Hover to preview. Click to read.</div>
                                            <div aria-hidden="true" className="bm-spacer"></div>
                                        </div>
                                        <div className="bm-rows" id="bmRows" role="list">
                                            <a className="bm-row glow-track bm-article" data-date="2026-02-13" data-pop="90" data-subtitle="This is the first of a two-part series on deliberate practice – what it is, the benefits and how it may be leveraged for improving in…" href="/article" role="listitem">
                                                <div aria-hidden="true" className="bm-ico">◆</div>
                                                <div className="bm-row-main">
                                                    <div className="bm-row-title">Deliberate Practice: The path to mastery of Software development in Python (Part I)</div>
                                                </div>
                                                <div className="bm-row-meta">
                                                    <div className="bm-row-cat">Deliberate Practice</div>
                                                    <div className="bm-row-date">Feb 13, 2026</div>
                                                </div>
                                            </a>
                                            <a className="bm-row glow-track bm-article" data-date="2026-01-18" data-pop="72" data-subtitle="How feedback, repetition, and scope control create compounding skill — and how to structure your sessions." href="/article" role="listitem">
                                                <div aria-hidden="true" className="bm-ico">◆</div>
                                                <div className="bm-row-main">
                                                    <div className="bm-row-title">The deliberate-practice loop for Python mastery</div>
                                                </div>
                                                <div className="bm-row-meta">
                                                    <div className="bm-row-cat">Deliberate Practice</div>
                                                    <div className="bm-row-date">Jan 18, 2026</div>
                                                </div>
                                            </a>
                                            <a className="bm-row glow-track bm-article" data-date="2025-12-22" data-pop="61" data-subtitle="A pragmatic way to build correctness-first intuition in Python — without memorizing patterns." href="/article" role="listitem">
                                                <div aria-hidden="true" className="bm-ico">◆</div>
                                                <div className="bm-row-main">
                                                    <div className="bm-row-title">Mental models: why “small drills” beat long tutorials</div>
                                                </div>
                                                <div className="bm-row-meta">
                                                    <div className="bm-row-cat">Python Mastery</div>
                                                    <div className="bm-row-date">Dec 22, 2025</div>
                                                </div>
                                            </a>
                                        </div>
                                        <div aria-hidden="true" className="bm-preview" id="bmPreview">
                                            <div aria-label="Article preview" className="bm-preview-card" role="note">
                                                <div className="bm-preview-title">Preview</div>
                                                <div className="bm-preview-text" id="bmPreviewText"></div>
                                            </div>
                                        </div>
                                        <div aria-hidden="true" className="bm-preview-arrow" id="bmPreviewArrow"></div>
                                    </section>
                                </section></section></div></div></main>
            </div>
        </>
    );
}

export default Articles;