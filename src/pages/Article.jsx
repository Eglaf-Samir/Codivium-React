import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import usePageMeta from "../hooks/usePageMeta";
import { getArticleBySlug } from "./articlesData";
import { setSeoMeta } from "../utils/seo";

const FONT_MIN = 14;
const FONT_MAX = 24;
const FONT_STEP = 1;
const FONT_DEFAULT = 17;

function Article() {
    usePageMeta("article");

    const { slug } = useParams();
    // Static source — no API call. See src/pages/articlesData/index.js.
    const article = useMemo(() => getArticleBySlug(slug), [slug]);

    // Per-article title/description/canonical — PubRoute's fixed "Article"
    // title is a fallback for slugs that don't resolve to anything.
    useEffect(() => {
        if (!article) return;
        setSeoMeta({
            title: article.title,
            description: article.subtitle,
            path: `/articles/${article.slug}`,
            type: 'article',
        });
    }, [article]);

    const [fontSize, setFontSize] = useState(FONT_DEFAULT);
    const [theme, setTheme] = useState("dark"); // 'dark' | 'day'
    const [softMode, setSoftMode] = useState(false);
    const [wideMode, setWideMode] = useState(false);
    const [progress, setProgress] = useState(0);
    const [copied, setCopied] = useState(false);

    const scrollRef = useRef(null);
    const shellRef = useRef(null);

    // Reading-progress bar tracks vertical scroll inside the .ap-scroll container.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onScroll = () => {
            const max = el.scrollHeight - el.clientHeight;
            setProgress(max > 0 ? Math.round((el.scrollTop / max) * 100) : 0);
        };
        onScroll();
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, [slug]);

    // Glow-track follows pointer for the article shell.
    useEffect(() => {
        const el = shellRef.current;
        if (!el) return;
        const onMove = (e) => {
            const r = el.getBoundingClientRect();
            el.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 100).toFixed(2) + "%");
            el.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 100).toFixed(2) + "%");
        };
        el.addEventListener("pointermove", onMove, { passive: true });
        return () => el.removeEventListener("pointermove", onMove);
    }, []);

    const handleCopyLink = useCallback(() => {
        navigator.clipboard?.writeText(window.location.href).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    const handlePrint = useCallback(() => window.print(), []);
    const handleTop = useCallback(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, []);

    const shellClass = [
        "ap-shell glow-track",
        theme === "day" ? "ap-day" : "",
        softMode ? "ap-soft" : "",
        wideMode ? "ap-wide" : "",
    ].filter(Boolean).join(" ");

    return (
        <>
            <Topbar />
            <div aria-hidden="true" className="cv-underbar"></div>
            <div className="stage-shell">
                <div aria-hidden="true" className="watermarks">
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <div key={n} className={`word watermark-word wm-pos-${n}`} data-text="CODIVIUM">CODIVIUM</div>
                    ))}
                </div>
                <main className="stage login-stage" role="main" id="mainContent">
                    <div className="blog-scroll" id="blogScroll">
                        <div aria-label="Codivium Article" className="blog-min">
                            <header className="bm-header">
                                <div className="bm-left">
                                    <div className="bm-kicker">CODIVIUM &bull; JOURNAL</div>
                                    <div aria-level="2" className="bm-title" role="heading">Article</div>
                                </div>
                                <div className="bm-right">
                                    <Link className="bm-read bm-read-plain" to="/articles">
                                        Back to Articles
                                    </Link>
                                </div>
                            </header>
                            <section aria-label="Article layout" className="bm-layout">
                                <aside aria-label="Article context" className="bm-rail">
                                    <div className="bm-panel glow-track">
                                        <div className="bm-panel-head">
                                            <div className="bm-panel-title">Categories</div>
                                            <div className="bm-panel-sub">This article</div>
                                        </div>
                                        <div className="bm-panel-body">
                                            <div className="bm-list">
                                                <button className="bm-item" type="button"><span className="bm-dot"></span><span className="bm-item-text">{article?.category || 'Python Mastery'}</span></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bm-panel glow-track">
                                        <div className="bm-panel-head">
                                            <div className="bm-panel-title">Keywords</div>
                                            <div className="bm-panel-sub">Focus topics</div>
                                        </div>
                                        <div className="bm-panel-body">
                                            <div className="bm-keywords">
                                                {(article?.keywords || []).map((k) => (
                                                    <button key={k} className="bm-key" type="button">{k}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </aside>
                                <section aria-label="Article" className="bm-main">
                                    {!article ? (
                                        <div className="card panel" style={{ padding: 24 }}>
                                            <p className="title">Article not found</p>
                                            <p className="desc">This article may have been moved or unpublished.</p>
                                            <Link className="bm-read" to="/articles">Back to Articles</Link>
                                        </div>
                                    ) : (
                                    <article className={shellClass} id="apShell" ref={shellRef}>
                                        <div aria-hidden="true" className="ap-progress">
                                            <div id="apProg" style={{ width: progress + "%" }}></div>
                                        </div>
                                        <div className="ap-head">
                                            <h1 className="ap-title" id="apTitle">{article.title}</h1>
                                            <div className="ap-meta">
                                                <span id="apCat">{article.category}</span>
                                                <span>&bull;</span>
                                                <span id="apDate">{article.dateLabel}</span>
                                                <span>&bull;</span>
                                                <span id="apTime">{article.readTime}</span>
                                            </div>
                                        </div>
                                        <div aria-label="Reading controls" className="ap-controls">
                                            <button aria-label="Decrease font" className="ap-btn ap-btn-icon" id="fontMinus" type="button"
                                                onClick={() => setFontSize((f) => Math.max(FONT_MIN, f - FONT_STEP))}>&minus;</button>
                                            <button aria-label="Increase font" className="ap-btn ap-btn-icon" id="fontPlus" type="button"
                                                onClick={() => setFontSize((f) => Math.min(FONT_MAX, f + FONT_STEP))}>+</button>
                                            <button className="ap-btn" id="themeToggle" type="button"
                                                onClick={() => setTheme((t) => (t === "dark" ? "day" : "dark"))}>
                                                {theme === "dark" ? "Day" : "Dark"}
                                            </button>
                                            <button className={`ap-btn${softMode ? " is-on" : ""}`} id="softToggle" type="button"
                                                onClick={() => setSoftMode((v) => !v)}>Soft</button>
                                            <button className={`ap-btn${wideMode ? " is-on" : ""}`} id="widthToggle" type="button"
                                                onClick={() => setWideMode((v) => !v)}>Wide</button>
                                            <div className="ap-spacer"></div>
                                            <button className="ap-btn" id="copyLink" type="button" onClick={handleCopyLink}>
                                                {copied ? "Copied!" : "Copy Link"}
                                            </button>
                                            <button className="ap-btn" id="printBtn" type="button" onClick={handlePrint}>Print</button>
                                            <button className="ap-btn" id="topBtn" type="button" onClick={handleTop}>Top</button>
                                        </div>
                                        <div aria-label="Scrollable article" className="ap-scroll" id="apScroll" ref={scrollRef}>
                                            <div className="ap-body-wrap">
                                                <div
                                                    className="ap-reading"
                                                    id="apReading"
                                                    style={{ fontSize: fontSize + "px" }}
                                                    dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
                                                />
                                            </div>
                                        </div>
                                    </article>
                                    )}
                                </section>
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

export default Article;
