import React, { useEffect, useRef, useState } from "react";
import Topbar from "../components/Topbar";
import { Link } from "react-router-dom";

const CARDS = [
    { index: 0, isTitleCard: true },
    {
        index: 1, heading: 'Practice',
        intro: <><strong>One training surface.</strong> Timed pressure, deliberate drills — and fast verification.</>,
        body: <>
            <p className="cfx-s4-gap">Train the way elite performance is built: attempt first, execute under constraints, validate instantly, then refine. Codivium supports both <em>interview-grade questions</em> and <em>micro-challenges</em> in the same environment — so your workflow stays consistent while your skill compounds.</p>
            <ul className="cfx-s4-bullets">
                <li><strong>Editor built for flow</strong>: stay locked on the solution, not the tooling.</li>
                <li><strong>Unit tests that mirror evaluation</strong>: instant pass/fail signal, including edge cases.</li>
                <li><strong>REPL for rapid iteration</strong>: validate assumptions, debug with intent, move faster.</li>
                <li><strong>Mini performance snapshot on pass</strong>: attempts-to-success, time-to-completion, and a trend view on repeat runs.</li>
            </ul>
            <p className="cfx-s4-gap cfx-s4-muted">Result: you're not just "done" — you're improving with measurable signal.</p>
        </>,
        imgSrc: '/assets/img/panel1_editor.jpg',
        imgWebp: '/assets/img/panel1_editor.webp',
        imgAlt: 'Codivium editor', imgW: 2887, imgH: 1139,
    },
    {
        index: 2, heading: 'Review',
        intro: <><strong>Every completion becomes signal.</strong> Don't just finish — improve.</>,
        body: <>
            <p className="cfx-s4-gap">The moment you pass, Codivium shows a clean performance readout — and it tracks improvement across repeat attempts on the <em>same</em> exercise. Deliberate practice is driven by feedback: your first completion becomes the baseline, and every revisit shows whether you're getting sharper.</p>
            <ul className="cfx-s4-bullets">
                <li><strong>Multi-attempt success</strong>: captures how many submissions it took to reach a full pass.</li>
                <li><strong>Repeat-attempt trends</strong>: compare performance across your 2nd, 3rd, 8th attempt — and beyond.</li>
                <li><strong>Time + run-count charts</strong>: see speed and efficiency improving across attempts.</li>
                <li><strong>Improvement summary</strong>: a compact before/after since your first completion.</li>
            </ul>
            <p className="cfx-s4-gap cfx-s4-muted">Result: objective proof of mastery forming — not vibes, not streaks.</p>
        </>,
        imgSrc: '/assets/img/panel2_feedback.jpg',
        imgWebp: '/assets/img/panel2_feedback.webp',
        imgAlt: 'Codivium review feedback', imgW: 1050, imgH: 781,
    },
    {
        index: 3, heading: 'Diagnose',
        intro: <><strong>MCQs that expose real gaps — not trivia.</strong></>,
        body: <>
            <p className="cfx-s4-gap">Coding interviews don't only test writing code. They test whether your fundamentals are strong enough to make the right decisions quickly — under pressure. Codivium uses retrieval-first concept checks to surface fragile understanding before it costs you in a timed solve.</p>
            <ul className="cfx-s4-bullets">
                <li><strong>Interview-relevant concept checks</strong>: complexity, data structures, Python gotchas, and reasoning.</li>
                <li><strong>Immediate feedback</strong>: know what you got wrong and why, right when it matters.</li>
                <li><strong>Stronger fundamentals, fewer mistakes</strong>: fix gaps that cause avoidable failures.</li>
                <li><strong>Built for momentum</strong>: quick sessions that pair perfectly with coding drills.</li>
            </ul>
            <p className="cfx-s4-gap cfx-s4-muted">Sharpen fundamentals so your coding speed and accuracy improve together.</p>
        </>,
        imgSrc: '/assets/img/panel3_mcq.jpg',
        imgWebp: '/assets/img/panel3_mcq.webp',
        imgAlt: 'Codivium MCQ diagnosis', imgW: 1563, imgH: 1200,
    },
    {
        index: 4, heading: 'Measure',
        intro: <><strong>Your training, measured. Your weaknesses, obvious.</strong></>,
        body: <>
            <p className="cfx-s4-gap">Most people practice blindly. Codivium turns every attempt into signal: what you're strong at, what's holding you back, and what to train next. Your dashboard is built for data-driven deliberate practice — it recommends the next drill and provides CTAs that jump you straight into it.</p>
            <ul className="cfx-s4-bullets">
                <li><strong>Performance trends over time</strong>: see improvement you can trust — not vibes, not streaks.</li>
                <li><strong>Topic-level visibility</strong>: pinpoint exactly where you're leaking points across patterns and categories.</li>
                <li><strong>Attempt analytics</strong>: track accuracy and consistency across sessions.</li>
                <li><strong>Clear direction</strong>: convert results into the next best practice target — what to train next and why.</li>
            </ul>
            <p className="cfx-s4-gap cfx-s4-muted">Stop guessing. Start training with precision.</p>
        </>,
        imgSrc: '/assets/img/panel4_dashboard.jpg',
        imgWebp: '/assets/img/panel4_dashboard.webp',
        imgAlt: 'Codivium dashboard analytics', imgW: 2694, imgH: 1150,
    },
    {
        index: 5, heading: 'Refine',
        intro: <><strong>Precision guidance — exactly when it matters.</strong></>,
        body: <>
            <p className="cfx-s4-gap">Every Codivium exercise is paired with a short, high-signal tutorial designed for the moment you're working. <strong>Interview coding challenges</strong> include <strong>Mini Tutorials</strong> (end-to-end strategy and execution). <strong>Micro-challenges</strong> include <strong>Micro Tutorials</strong> (atomic drills that sharpen one mental model at a time).</p>
            <ul className="cfx-s4-bullets">
                <li><strong>Exercise-specific, not generic</strong>: the exact technique stack required for <em>this</em> problem.</li>
                <li><strong>Elite clarity, zero fluff</strong>: crisp explanation, clean reasoning, no filler.</li>
                <li><strong>Built for immediate execution</strong>: learn → apply → ship.</li>
                <li><strong>Format-matched support</strong>: Mini Tutorials for interview challenges; Micro Tutorials for micro-challenges.</li>
            </ul>
            <p className="cfx-s4-gap cfx-s4-muted">Platform promise: Codivium will endeavour to ensure every exercise includes the appropriate tutorial.</p>
        </>,
        imgSrc: '/assets/img/panel5_minitutorial.jpg',
        imgWebp: '/assets/img/panel5_minitutorial.webp',
        imgAlt: 'Codivium tutorial guidance', imgW: 1320, imgH: 1132,
    },
];

const SNAP_THRESHOLD = 0.10;

function getCardClass(idx, current, total) {
    if (idx === current) return 'cfx-s4-card is-active';
    if (idx === current - 1) return 'cfx-s4-card is-prev';
    if (idx === current + 1) return 'cfx-s4-card is-next';
    if (idx < current) return 'cfx-s4-card is-far-left';
    return 'cfx-s4-card is-far-right';
}

function useCoverflowScroll(spacerRef, stageRef, panelCount) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const spacer = spacerRef.current;
        const stage = stageRef.current;
        if (!spacer || !stage) return;

        const scrollRoot = document.scrollingElement || document.documentElement;

        // Cached layout values — only updated on resize, never on scroll
        let cachedSpacerHeight = 0;
        let cachedSectionStart = 0;

        function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
        function getScrollTop() {
            return scrollRoot ? scrollRoot.scrollTop : (window.scrollY || 0);
        }

        function recalc() {
            const stepScroll = Math.max(72, Math.round(window.innerHeight * 0.22));
            const requiredHeight = Math.max(
                Math.round(window.innerHeight * 1.12),
                Math.round(window.innerHeight + (panelCount - 1) * stepScroll)
            );
            spacer.style.height = `${requiredHeight}px`;
            cachedSpacerHeight = spacer.offsetHeight;
            cachedSectionStart = getScrollTop() + spacer.getBoundingClientRect().top;
        }

        function progressToIndex(progress) {
            if (panelCount <= 1) return 0;
            const raw = clamp(progress, 0, 1) * (panelCount - 1);
            const base = Math.floor(raw);
            const frac = raw - base;
            return clamp(base + (frac >= SNAP_THRESHOLD ? 1 : 0), 0, panelCount - 1);
        }

        function updateFromScroll() {
            const total = Math.max(1, cachedSpacerHeight - window.innerHeight);
            const scrolled = clamp(getScrollTop() - cachedSectionStart, 0, total);
            const progress = total > 0 ? scrolled / total : 0;
            setCurrentIndex(progressToIndex(progress));
            // data-step for CSS counter
            stage.setAttribute('data-step', String(progressToIndex(progress)));
        }

        let ticking = false;
        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => { updateFromScroll(); ticking = false; });
        }
        function onResize() { recalc(); updateFromScroll(); }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        window.addEventListener('load', onResize);

        // ResizeObserver: re-measure when async CSS injection (PublicWrapper)
        // changes section layout after initial mount. Without this, cachedSectionStart
        // captures the pre-CSS position and the scroll math stays wrong for the page's lifetime.
        const ro = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(onResize) : null;
        if (ro) ro.observe(document.documentElement);

        recalc();
        updateFromScroll();
        // Also recalc after a tick in case CSS lands between sync render and now
        const t1 = setTimeout(onResize, 100);
        const t2 = setTimeout(onResize, 600);

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('load', onResize);
            if (ro) ro.disconnect();
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [spacerRef, stageRef, panelCount]);

    return currentIndex;
}

// ─── Flow arrow hooks for section 2b ──────────────────────────────────────
function useFlowArrows(sectionRef) {
    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const svgMain = section.querySelector('#flowArrowSvg');
        const svgSpecial = section.querySelector('#flowSpecialArrow');
        const pathSpecial = section.querySelector('#flowSpecialPath');
        const steps = section.querySelector('.flow-steps');
        const topMicro = section.querySelector('.flow-topmicro');
        const iconCards = Array.from(section.querySelectorAll('.flow-step .flow-iconcard')).slice(0, 5);
        const sideWins = Array.from(section.querySelectorAll('.flow-step .flow-sidewin')).slice(0, 5);
        const icon1 = section.querySelector('.flow-iconcard');
        const micro2 = section.querySelector('.flow-sidecard');

        if (!svgMain || !steps) return;

        let pathPool = [];
        let pending = false;
        let inView = true;

        function resetPaths() {
            pathPool.forEach(p => { if (p.parentNode === svgMain) svgMain.removeChild(p); });
        }
        function usePath(i, d) {
            let p = pathPool[i];
            if (!p) {
                p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                p.setAttribute('class', 'flow-arrowpath');
                p.setAttribute('marker-end', 'url(#flowArrowHeadGold)');
                pathPool[i] = p;
            }
            p.setAttribute('d', d);
            svgMain.appendChild(p);
        }

        function drawMain() {
            const s = svgMain.getBoundingClientRect();
            const w = Math.max(1, s.width);
            const h = Math.max(1, s.height);
            svgMain.setAttribute('viewBox', `0 0 ${w} ${h}`);
            resetPaths();
            let pi = 0;

            const xMid = r => (r.left - s.left) + r.width / 2;
            const yMid = r => (r.top - s.top) + r.height / 2;
            const xL = r => r.left - s.left;
            const xR = r => (r.left - s.left) + r.width;
            const yTop = r => r.top - s.top;
            const yBot = r => (r.top - s.top) + r.height;

            if (topMicro && iconCards[0]) {
                const a = topMicro.getBoundingClientRect();
                const b = iconCards[0].getBoundingClientRect();
                usePath(pi++, `M ${xMid(b)} ${yBot(a)} V ${yTop(b)}`);
            }
            for (let i = 0; i < Math.min(iconCards.length, sideWins.length); i++) {
                const icon = iconCards[i].getBoundingClientRect();
                const win = sideWins[i].getBoundingClientRect();
                const y = yMid(win);
                if (win.right <= icon.left) {
                    usePath(pi++, `M ${xR(win)} ${y} H ${xL(icon)}`);
                } else if (win.left >= icon.right) {
                    usePath(pi++, `M ${xL(win)} ${y} H ${xR(icon)}`);
                }
            }
            for (let i = 0; i < iconCards.length - 1; i++) {
                const a = iconCards[i].getBoundingClientRect();
                const b = iconCards[i + 1].getBoundingClientRect();
                usePath(pi++, `M ${xMid(a)} ${yBot(a)} V ${yTop(b)}`);
            }
        }

        function drawSpecial() {
            if (!svgSpecial || !pathSpecial || !icon1 || !micro2) return;
            const box = steps.getBoundingClientRect();
            const a = icon1.getBoundingClientRect();
            const b = micro2.getBoundingClientRect();
            const w = Math.max(1, box.width);
            const h = Math.max(1, box.height);
            svgSpecial.setAttribute('viewBox', `0 0 ${w} ${h}`);
            const x1 = a.left - box.left;
            const y1 = (a.top - box.top) + a.height / 2;
            const x2 = (b.left - box.left) + b.width / 2;
            const y2 = (b.top - box.top) + b.height / 2;
            pathSpecial.setAttribute('d', `M ${x1} ${y1} H ${x2} V ${y2}`);
        }

        function schedule() {
            if (pending) return;
            pending = true;
            requestAnimationFrame(() => { pending = false; drawMain(); drawSpecial(); });
        }

        // IntersectionObserver — only draw when visible
        let io;
        if ('IntersectionObserver' in window) {
            io = new IntersectionObserver(entries => {
                inView = entries.some(e => e.isIntersecting);
                if (inView) schedule();
            }, { root: null, threshold: 0.01 });
            io.observe(section);
        }

        // ResizeObserver — redraw when layout changes
        const ro = new ResizeObserver(() => { if (inView) schedule(); });
        ro.observe(steps);
        if (topMicro) ro.observe(topMicro);
        iconCards.forEach(el => ro.observe(el));
        sideWins.forEach(el => ro.observe(el));

        const onResize = () => { if (inView) schedule(); };
        window.addEventListener('resize', onResize, { passive: true });

        schedule();
        setTimeout(() => { if (inView) schedule(); }, 140);
        setTimeout(() => { if (inView) schedule(); }, 320);

        return () => {
            window.removeEventListener('resize', onResize);
            ro.disconnect();
            if (io) io.disconnect();
        };
    }, [sectionRef]);
}

function Landing() {
    // useEffect(() => {
    //     document.body.setAttribute("data-page", "landing");

    //     const loadScript = (src) => {
    //         return new Promise((resolve) => {
    //             const script = document.createElement("script");
    //             script.src = src;
    //             script.defer = true;
    //             script.onload = resolve;
    //             document.body.appendChild(script);
    //         });
    //     };

    //     let isMounted = true;

    //     (async () => {
    //         await loadScript("/assets/js/landing/landing.bundle.1b3e87c7.js");
    //         await loadScript("/assets/js/landing/section4-init.js");
    //     })();

    //     return () => {
    //         document.body.removeAttribute("data-page");
    //         document.querySelectorAll("script[src*='assets/js']").forEach(s => s.remove());
    //         isMounted = false;
    //     };
    // }, []);

    
    useEffect(() => {
        document.body.setAttribute('data-page', 'landing');
        return () => document.body.removeAttribute('data-page');
    }, []);

    const spacerRef = useRef(null);
    const stageRef = useRef(null);
    const s2bRef = useRef(null);

    const panelCount = CARDS.length;
    const currentIndex = useCoverflowScroll(spacerRef, stageRef, panelCount);
    useFlowArrows(s2bRef);

    return (
        <>
            <style>{`.skip-link{position:absolute;top:-100px;left:0;background:#f6d58a;color:#05070c;padding:8px 16px;font-family:serif;font-size:14px;z-index:10000;border-radius:0 0 4px 0}.skip-link:focus{top:0}`}</style>
            <a className="skip-link" href="#mainContent">Skip to main content</a>
            <noscript>
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', background: '#1a1a2e', color: '#f6d58a', textAlign: 'center', padding: '14px 20px', zIndex: 9999, fontFamily: 'serif', fontSize: '14px' }}>
                    JavaScript is required for this page. Please enable JavaScript in your browser settings.
                </div>
            </noscript>
            <Topbar />
            <main role="main" id="mainContent" data-page="landing">

                <section id="section1">
                    <div className="section-inner">
                        <div className="hero-grid">
                            <div>
                                <div className="hero-kicker">Neuroscience-informed practice. Precision algorithmic coaching.<br />Structured for elite Python performance.</div>
                                <h1 className="hero-title hero-title-offset">Achieve Elite<br />Python Mastery</h1>
                                <div className="hero-cta-row">
                                    {/* <a className="cta" href="/join">Begin Elite Training</a> */}
                                    <Link className="cta" to="/join">
                                        Begin Elite Training
                                    </Link>
                                </div>
                            </div>
                            <div>
                                <div aria-label="Section 1 image" className="hero-image">
                                    <picture>
                                        <source srcSet="/assets/img/section1Image.webp" type="image/webp" />
                                        <img alt="Laptop screen with code (Codivium hero image)" decoding="async" draggable="false" fetchpriority="high" height="2160" loading="eager" src="/assets/img/section1Image.jpg" width="3840" />
                                    </picture>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="section2">
                    <div className="section-inner">
                        <div className="section-title">
                            <h2>What Sets Us Apart?</h2>
                            <div className="section-tagline">Deliberate practice, guided by performance analytics and cognitive science.</div>
                            <p>Codivium is not a content library. It’s a performance system: you train specific skills, get measurable feedback, and refine with intent. The platform is built for <strong>attempt‑first</strong> practice — you start by doing, not by reading — with layered help that unlocks as you engage. Your dashboard then turns your data into <strong>data‑driven deliberate practice</strong>: clear diagnosis, targeted drills, and next‑step CTAs that take you straight to what you should train next.</p>
                        </div>
                        <div className="s2-topwrap">
                            <div aria-label="Precision target icon" className="s2-sideicon s2-topicon">
                                <svg aria-label="Precision target icon" className="s2-bigicon" role="img" viewBox="0 0 64 64">
                                    <circle cx="32" cy="32" r="22"></circle>
                                    <circle cx="32" cy="32" r="12"></circle>
                                    <circle cx="32" cy="32" r="4"></circle>
                                    <path d="M32 6v10M32 48v10M6 32h10M48 32h10"></path>
                                </svg>
                            </div>
                            <div className="hero-moved-card">
                                <h3>Precision Training, Real Signal</h3>
                                <p>Train with precision, perform under pressure, and keep advancing toward true mastery.</p>
                                <p>Codivium is an elite practice environment for Python: interview‑grade exercises, micro‑challenges that build durable mental models, and concept pressure‑tests that reveal what you really know.</p>
                                <p>Codivium is intentionally <strong>attempt‑first</strong>. Tutorials and solutions are there — but they’re designed to support your practice loop, not replace it. When you finish, your dashboard converts performance signals into specific next‑step actions and takes you directly to the right drill.</p>
                            </div>
                        </div>
                        <div className="s2-alt">
                            <div className="s2-row left">
                                <div className="s2-card"><div className="feature-card">
                                    <h3>Micro-Challenges</h3>
                                    <p>Micro-challenges are short, high-precision drills built to sharpen one technique at a time — exactly the way elite performers train. You isolate a single skill (parsing, loop invariants, slicing, dict counting, edge-case handling), practise it with tight constraints, and repeat until it’s fluent. Codivium then interleaves those skills into interview-grade questions so speed and correctness transfer under pressure.</p>
                                </div></div>
                                <div className="s2-sideicon"><svg aria-hidden="true" className="s2-bigicon" viewBox="0 0 64 64">
                                    <path d="M14 24v16"></path>
                                    <path d="M20 20v24"></path>
                                    <path d="M44 20v24"></path>
                                    <path d="M50 24v16"></path>
                                    <path d="M22 32h20"></path>
                                    <path d="M10 26v12M54 26v12"></path>
                                </svg></div>
                            </div>
                            <div className="s2-row right">
                                <div className="s2-sideicon"><svg aria-hidden="true" className="s2-bigicon" viewBox="0 0 64 64">
                                    <path d="M24 12h16"></path>
                                    <path d="M24 12a6 6 0 0 0-6 6v34a6 6 0 0 0 6 6h16a6 6 0 0 0 6-6V18a6 6 0 0 0-6-6"></path>
                                    <path d="M26 36l5 5 11-13"></path>
                                    <path d="M26 18h12"></path>
                                </svg></div>
                                <div className="s2-card"><div className="feature-card">
                                    <h3>MCQ Mastery</h3>
                                    <p>Our MCQs aren’t trivia — they’re targeted conceptual pressure tests. They surface the silent gaps that sabotage interviews: Python data model details, mutability traps, complexity intuition, and pattern recognition. Each quiz is retrieval-first, with immediate explanation, so your mental models become stable and your coding decisions become deliberate.</p>
                                </div></div>
                            </div>
                            <div className="s2-row left">
                                <div className="s2-card"><div className="feature-card">
                                    <h3>Data-Driven Deliberate Practice</h3>
                                    <p>Codivium analyses your performance to identify strengths and target areas for improvement. It records multiple signals as you work — accuracy, time, retries, tests passed, hint usage, and solution views — then turns them into <strong>next‑step guidance</strong>. Your dashboard offers <strong>CTA shortcuts</strong> that take you straight to the exercises that will raise your breadth or depth fastest.</p>
                                </div></div>
                                <div className="s2-sideicon"><svg aria-hidden="true" className="s2-bigicon" viewBox="0 0 64 64">
                                    <path d="M14 50V18"></path>
                                    <path d="M14 50h36"></path>
                                    <path d="M20 40l10-10 8 8 14-16"></path>
                                    <path d="M50 22v6h-6"></path>
                                </svg></div>
                            </div>
                            <div className="s2-row right">
                                <div className="s2-sideicon"><svg aria-hidden="true" className="s2-bigicon" viewBox="0 0 64 64">
                                    <path d="M10 34h12l5-14 10 28 6-14h11"></path>
                                    <path d="M10 24h8"></path>
                                    <path d="M46 24h8"></path>
                                </svg></div>
                                <div className="s2-card"><div className="feature-card">
                                    <h3>Real-Time Feedback</h3>
                                    <p>Get immediate, actionable feedback so you can see what broke and why. Codivium keeps feedback minimal during the attempt (tests and high‑signal hints), then delivers a clean post‑mortem: error type, root cause, and the shortest drill that fixes it. Mini tutorials and suggested solutions are presented as <strong>layered support</strong> — designed to reinforce the attempt‑first loop.</p>
                                </div></div>
                            </div>
                            <div className="s2-row left">
                                <div className="s2-card"><div className="feature-card">
                                    <h3>Technical Interview Practice</h3>
                                    <p>Train on interview-grade Python problems designed to build correctness, speed, and clarity under pressure. You practise in an in‑browser environment with verification that keeps you honest — and a history that tracks whether you’re getting sharper on repeat attempts, not just completing new items.</p>
                                </div></div>
                                <div className="s2-sideicon"><svg aria-hidden="true" className="s2-bigicon" viewBox="0 0 64 64">
                                    <rect height="32" rx="6" ry="6" width="44" x="10" y="16"></rect>
                                    <path d="M20 30l6 6-6 6"></path>
                                    <path d="M30 42h14"></path>
                                </svg></div>
                            </div>
                            <div className="s2-row right">
                                <div className="s2-sideicon"><svg aria-hidden="true" className="s2-bigicon" viewBox="0 0 64 64">
                                    <circle cx="32" cy="32" r="22"></circle>
                                    <path d="M26 38l4-12 12-4-4 12-12 4z"></path>
                                    <path d="M32 10v6M32 48v6M10 32h6M48 32h6"></path>
                                </svg></div>
                                <div className="s2-card"><div className="feature-card">
                                    <h3>Interview-Focused Learning</h3>
                                    <p>Go beyond “writing code.” Build pattern recognition, problem‑solving strategy, and the interview technique used in top environments. Codivium mixes deliberate drills with timed challenges, so the interview feels familiar — and your execution stays calm, fast, and correct.</p>
                                </div></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="section2b" ref={s2bRef}>
                    <div className="section-inner">
                        <div className="howitworks-title">
                            <h2>How does it work?</h2>
                        </div>
                        <div aria-label="How it works flow + principle" className="flow-bodygrid">
                            <div aria-label="How it works flow chart" className="flow-premium">
                                <div className="flow-card">
                                    <div className="flow-steps">
                                        <svg aria-hidden="true" className="flow-arrowsvg" id="flowArrowSvg">
                                            <defs>
                                                <marker
                                                    id="flowArrowHeadGold"
                                                    markerHeight="4.5"
                                                    markerUnits="strokeWidth"
                                                    markerWidth="4.5"
                                                    orient="auto"
                                                    refX="4.5"
                                                    refY="2.25"
                                                >
                                                    <path d="M0,0 L4.5,2.25 L0,4.5 Z" fill="rgb(1, 3, 12)" />
                                                </marker>
                                            </defs>
                                        </svg>
                                        <svg aria-hidden="true" className="flow-special-arrow" id="flowSpecialArrow">
                                            <defs>
                                                <marker id="flowArrowHead" markerHeight="7.5" markerUnits="strokeWidth" markerWidth="7.5" orient="auto" refx="5.25" refy="2.25">
                                                    <path d="M0,0 L8,3 L0,6" fill="none" stroke="rgb(1, 3, 12)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                                                </marker>
                                            </defs>
                                            <path id="flowSpecialPath" markerEnd="url(#flowArrowHead)"></path>
                                        </svg>
                                        <div aria-hidden="true" className="flow-topmicro">
                                            <div className="flow-topmicro-inner">Select Skill + Level</div>
                                        </div>
                                        <div className="flow-step">
                                            <div className="flow-iconcard"><div className="flow-iconwrap">
                                                <svg aria-hidden="true" className="flow-icon" viewBox="0 0 64 64">
                                                    <path d="M14 26v12"></path>
                                                    <path d="M18 24v16"></path>
                                                    <path d="M22 28v8"></path>
                                                    <path d="M22 32h20"></path>
                                                    <path d="M42 28v8"></path>
                                                    <path d="M46 24v16"></path>
                                                    <path d="M50 26v12"></path>
                                                </svg>
                                                <div aria-label="Side window 1" className="flow-sidewin flow-sidewin-left">
                                                    <div className="flow-sidewin-inner">Deliberate Drill</div>
                                                </div>
                                            </div></div>
                                        </div>
                                        <div aria-hidden="true" className="flow-connector">
                                            <div className="flow-arrowwrap">
                                                <svg aria-hidden="true" className="flow-branch flow-branch-left" viewBox="0 0 308 64">
                                                    <path d="M254 10V32H176"></path>
                                                    <path d="M176 24H164V40H176"></path>
                                                </svg>
                                                <div aria-hidden="true" className="flow-sidecard flow-side-left"><svg aria-hidden="true" className="flow-sideglyph" viewBox="0 0 64 64">
                                                    <path d="M32 10l4 12 12 4-12 4-4 12-4-12-12-4 12-4 4-12z"></path>
                                                </svg></div>
                                            </div>
                                        </div>
                                        <div className="flow-step">
                                            <div className="flow-iconcard"><div className="flow-iconwrap">
                                                <svg aria-hidden="true" className="flow-icon" viewBox="0 0 64 64">
                                                    <path d="M18 18h28a10 10 0 0 1 10 10v10a10 10 0 0 1-10 10H32l-10 8v-8H18a10 10 0 0 1-10-10V28a10 10 0 0 1 10-10z"></path>
                                                    <path d="M24 34l5 5 12-13"></path>
                                                </svg>
                                                <div aria-label="Side window 2" className="flow-sidewin flow-sidewin-right">
                                                    <div className="flow-sidewin-inner">Review &amp; Reflect</div>
                                                </div>
                                            </div></div>
                                        </div>
                                        <div aria-hidden="true" className="flow-connector">
                                            <div className="flow-arrowwrap">
                                                <svg aria-hidden="true" className="flow-branch flow-branch-right" viewBox="0 0 220 64">
                                                    <path d="M54 10V32H132"></path>
                                                    <path d="M132 24H144V40H132"></path>
                                                </svg>
                                                <div aria-hidden="true" className="flow-sidecard flow-side-right"><svg aria-hidden="true" className="flow-sideglyph" viewBox="0 0 64 64">
                                                    <path d="M32 10l4 12 12 4-12 4-4 12-4-12-12-4 12-4 4-12z"></path>
                                                </svg></div>
                                            </div>
                                        </div>
                                        <div className="flow-step">
                                            <div className="flow-iconcard"><div className="flow-iconwrap">
                                                <svg aria-hidden="true" className="flow-icon" viewBox="0 0 64 64">
                                                    <path d="M14 50V18"></path>
                                                    <path d="M14 50h38"></path>
                                                    <path d="M22 46V34"></path>
                                                    <path d="M32 46V26"></path>
                                                    <path d="M42 46V30"></path>
                                                    <path d="M22 34l10-10 10 8 10-14"></path>
                                                    <path d="M52 18v8h-8"></path>
                                                </svg>
                                                <div aria-label="Side window 3" className="flow-sidewin flow-sidewin-left">
                                                    <div className="flow-sidewin-inner">Performance Analytics</div>
                                                </div>
                                            </div></div>
                                        </div>
                                        <div aria-hidden="true" className="flow-connector">
                                            <div className="flow-arrowwrap">
                                                <svg aria-hidden="true" className="flow-branch flow-branch-left" viewBox="0 0 308 64">
                                                    <path d="M254 10V32H176"></path>
                                                    <path d="M176 24H164V40H176"></path>
                                                </svg>
                                                <div aria-hidden="true" className="flow-sidecard flow-side-left"><svg aria-hidden="true" className="flow-sideglyph" viewBox="0 0 64 64">
                                                    <path d="M32 10l4 12 12 4-12 4-4 12-4-12-12-4 12-4 4-12z"></path>
                                                </svg></div>
                                            </div>
                                        </div>
                                        <div className="flow-step">
                                            <div className="flow-iconcard"><div className="flow-iconwrap">
                                                <svg aria-hidden="true" className="flow-icon" viewBox="0 0 64 64">
                                                    <path d="M32 22v30"></path>
                                                    <path d="M12 22h16a6 6 0 0 1 6 6v26a6 6 0 0 0-6-6H12z"></path>
                                                    <path d="M52 22H36a6 6 0 0 0-6 6v26a6 6 0 0 1 6-6h16z"></path>
                                                    <path d="M18 30h10"></path>
                                                    <path d="M18 38h10"></path>
                                                </svg>
                                                <div aria-label="Side window 4" className="flow-sidewin flow-sidewin-right">
                                                    <div className="flow-sidewin-inner">Mini Tutorial</div>
                                                </div>
                                            </div></div>
                                        </div>
                                        <div aria-hidden="true" className="flow-connector">
                                            <div className="flow-arrowwrap">
                                                <svg aria-hidden="true" className="flow-branch flow-branch-right" viewBox="0 0 220 64">
                                                    <path d="M54 10V32H132"></path>
                                                    <path d="M132 24H144V40H132"></path>
                                                </svg>
                                                <div aria-hidden="true" className="flow-sidecard flow-side-right"><svg aria-hidden="true" className="flow-sideglyph" viewBox="0 0 64 64">
                                                    <path d="M32 10l4 12 12 4-12 4-4 12-4-12-12-4 12-4 4-12z"></path>
                                                </svg></div>
                                            </div>
                                        </div>
                                        <div className="flow-step">
                                            <div className="flow-iconcard"><div className="flow-iconwrap">
                                                <svg aria-hidden="true" className="flow-icon" viewBox="0 0 64 64">
                                                    <path d="M22 14h20a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8V22a8 8 0 0 1 8-8z"></path>
                                                    <path d="M22 26h14"></path>
                                                    <path d="M22 34h14"></path>
                                                    <path d="M40 26a4.5 4.5 0 0 1 4.5 4.5c0 3.2-4.5 4.2-4.5 7.5"></path>
                                                    <path d="M40 44h0"></path>
                                                    <circle cx="40" cy="44" r="1.6"></circle>
                                                </svg>
                                                <div aria-label="Side window 5" className="flow-sidewin flow-sidewin-left">
                                                    <div className="flow-sidewin-inner">MCQ: Diagnose Gaps</div>
                                                </div>
                                            </div></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div aria-label="Aristotle quote about habit" className="flow-quote">
                        <div className="q-title">Principle</div>
                        <p className="q-greek">ἡ δ’ ἠθικὴ ἐξ ἔθους περιγίνεται.</p>
                        <p className="q-translation">“Moral excellence comes about from habit.”</p>
                        <div className="q-attrib">Aristotle · <em>Nicomachean Ethics</em> (Book II)</div>
                    </div>
                </section>

                <section id="section3">
                    <div className="section-inner">
                        <h2>Codivium Content Mindmap</h2>
                        <p className="panel-copy panel-copy-muted panel-copy-wide">Explore the skill graph: topics cluster by category, and links show how techniques connect across your training — so deliberate practice stays structured, not random.</p>
                        <iframe className="constellation-frame" src="/assets/components/codivium-constellation/constellation-embed.html" title="Codivium constellation"></iframe>
                    </div>
                </section>

                <section className="cfx-s4 cfx-s4--interactive" id="showcaseCoverflow">
                    <div className="cfx-s4-spacer" id="cfxS4Spacer" ref={spacerRef}>
                        <div className="cfx-s4-sticky">
                            <div className="cfx-s4-shell">
                                <div className="cfx-s4-stage-wrap">
                                    <div aria-live="off" className="cfx-s4-stage" id="cfxS4Stage"
                                        ref={stageRef} data-step={String(currentIndex)}>
                                        {CARDS.map(card => (
                                            <article key={card.index}
                                                className={getCardClass(card.index, currentIndex, panelCount)}
                                                data-index={card.index}>
                                                {card.isTitleCard ? (
                                                    <div className="cfx-s4-card__inner cfx-s4-card__inner--title">
                                                        <div className="cfx-s4-titleOnly">
                                                            <div className="cfx-s4-titleOnly__text">The Codivium Training Arc</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="cfx-s4-card__inner">
                                                        <div className="cfx-s4-copy">
                                                            <h2>{card.heading}</h2>
                                                            <p>{card.intro}</p>
                                                            {card.body}
                                                        </div>
                                                        <div className="cfx-s4-media">
                                                            <div className={`cfx-s4-image${card.index === 5 ? ' cfx-s4-image--final' : ''}`}>
                                                                <picture>
                                                                    <source srcSet={card.imgWebp} type="image/webp" />
                                                                    <img alt={card.imgAlt} decoding="async"
                                                                        height={card.imgH} loading="lazy"
                                                                        src={card.imgSrc} width={card.imgW} />
                                                                </picture>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="section5">
                    <div className="section-inner">
                        <h2>Ready to Begin Your Journey To Elite Mastery?</h2>
                        <p className="q-translation q-translation-muted">Codivium is built for <strong>data‑driven deliberate practice</strong>: timed coding, micro‑drills for mental models, concept pressure tests, and feedback loops that make improvement obvious. It’s an <strong>attempt‑first</strong> system — start by doing, then use targeted tutorials and solutions to refine — and let dashboard CTAs take you directly to the next session, based on your analytics.</p>
                        <div aria-label="High intent call to action" className="s5-window" role="region">
                            <div className="s5-left">
                                <h2>Start Elite Training Today</h2>
                                <p>If you want measurable progress — not vague “learning” — this is your environment. Train the exact skills interviews expose, track the signal, and refine with precision through deliberate practice.</p>
                                <ul className="s5-bullets">
                                    <li><strong>Attempt‑first training</strong> with layered support (hints → mini tutorial → suggested solution).</li>
                                    <li><strong>Data‑driven deliberate practice</strong> powered by performance signals (time, attempts, tests, hints).</li>
                                    <li><strong>Targeted micro‑drills</strong> to build mental models and fluency.</li>
                                    <li><strong>Dashboard CTAs</strong> that jump you straight to the next best exercise.</li>
                                </ul>
                            </div>
                            <div className="s5-right">
                                <div className="s5-badge">Premium Training Loop</div>
                                <div className="s5-metric">
                                    <div className="s5-metric-label">What you get</div>
                                    <div className="s5-metric-value">Measurable Mastery</div>
                                </div>
                                {/* <a className="s5-cta" href="/join">Join Codivium</a> */}
                                <Link className="s5-cta" to="/join">
                                    Join Codivium
                                </Link>
                                <div className="s5-sub">Early access. High signal. Built for mastery.</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="section6">
                    <div className="footer-inner">
                        <div className="footer-left">
                            © Codivium <span id="footerYear">2026</span>. All rights reserved.
                        </div>
                        <div aria-label="Footer links" className="footer-links">
                            <Link to="/articles">Articles</Link>
                            <Link to="/contact">Contact</Link>
                            <Link to="/pricing">Prices</Link>
                            <Link to="/faq">FAQ</Link>
                            <Link to="/legal#terms_conditions">Terms &amp; Conditions</Link>
                            <Link to="/legal#privacy_policy">Privacy Policy</Link>
                        </div>
                        <a aria-label="Back to top" className="to-top" href="#section1" id="toTopBtn">↑</a>
                    </div>
                </section>
            </main>  </>
    );
}

export default Landing;