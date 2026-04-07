import { useEffect } from "react";
import Header from "../components/Header";
function Landing() {
    useEffect(() => {
        document.body.setAttribute("data-page", "landing");

        const loadScript = (src) => {
            return new Promise((resolve) => {
                const script = document.createElement("script");
                script.src = src;
                script.defer = true;
                script.onload = resolve;
                document.body.appendChild(script);
            });
        };

        let isMounted = true;

        (async () => {
            await loadScript("/assets/js/landing/landing.js");
            await loadScript("/assets/js/landing/section4-init.js");
            await loadScript("/assets/js/cv-cube.08d05a23.js");
        })();

        return () => {
            document.body.removeAttribute("data-page");
            document.querySelectorAll("script[src*='assets/js']").forEach(s => s.remove());
            isMounted = false;
        };
    }, []);
    return (
        <>
            <Header />
            <main role="main" id="mainContent">
                <section id="section1">
                    <div className="section-inner">
                        <div className="hero-grid">
                            <div>
                                <div className="hero-kicker">Neuroscience-informed practice. Precision algorithmic coaching.<br />Structured for elite Python performance.</div>
                                <h1 className="hero-title hero-title-offset">Achieve Elite<br />Python Mastery</h1>
                                <div className="hero-cta-row">
                                    <a className="cta" href="/join">Begin Elite Training</a>
                                </div>
                            </div>
                            <div>
                                <div aria-label="Section 1 image" className="hero-image">
                                    <picture>
                                        <source srcset="assets/img/section1Image.webp" type="image/webp" />
                                        <img alt="Laptop screen with code (Codivium hero image)" decoding="async" draggable="false" fetchpriority="high" height="2160" loading="eager" src="assets/img/section1Image.jpg" width="3840" />
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
                <section id="section2b">
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
                        <iframe className="constellation-frame" src="/assets/constellation-embed.html" title="Codivium constellation"></iframe>
                    </div>
                </section>
                <section className="cfx-s4 cfx-s4--interactive" id="showcaseCoverflow">
                    <div className="cfx-s4-spacer" id="cfxS4Spacer">
                        <div className="cfx-s4-sticky">
                            <div className="cfx-s4-shell">
                                <div className="cfx-s4-stage-wrap">
                                    <div aria-live="off" className="cfx-s4-stage" id="cfxS4Stage"><article className="cfx-s4-card is-active" data-index="0">
                                        <div className="cfx-s4-card__inner cfx-s4-card__inner--title">
                                            <div className="cfx-s4-titleOnly">
                                                <div className="cfx-s4-titleOnly__text">The Codivium Training Arc</div>
                                            </div>
                                        </div>
                                    </article>
                                        <article className="cfx-s4-card is-next" data-index="1">
                                            <div className="cfx-s4-card__inner">
                                                <div className="cfx-s4-copy">
                                                    <h2>Practice</h2>
                                                    <p><strong>One training surface.</strong> Timed pressure, deliberate drills — and fast verification.</p>
                                                    <p className="cfx-s4-gap">Train the way elite performance is built: attempt first, execute under constraints, validate instantly, then refine. Codivium supports both <em>interview-grade questions</em> and <em>micro-challenges</em> in the same environment — so your workflow stays consistent while your skill compounds.</p>
                                                    <ul className="cfx-s4-bullets">
                                                        <li><strong>Editor built for flow</strong>: stay locked on the solution, not the tooling.</li>
                                                        <li><strong>Unit tests that mirror evaluation</strong>: instant pass/fail signal, including edge cases.</li>
                                                        <li><strong>REPL for rapid iteration</strong>: validate assumptions, debug with intent, move faster.</li>
                                                        <li><strong>Mini performance snapshot on pass</strong>: attempts-to-success, time-to-completion, and a trend view on repeat runs.</li>
                                                    </ul>
                                                    <p className="cfx-s4-gap cfx-s4-muted">Result: you’re not just “done” — you’re improving with measurable signal.</p>
                                                </div>
                                                <div className="cfx-s4-media">
                                                    <div className="cfx-s4-image">
                                                        <picture>
                                                            <source srcset="assets/img/panel1_editor.webp" type="image/webp" />
                                                            <img alt="Codivium editor" decoding="async" height="1139" loading="lazy" src="assets/img/panel1_editor.jpg" width="2887" />
                                                        </picture>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                        <article className="cfx-s4-card is-far-right" data-index="2">
                                            <div className="cfx-s4-card__inner">
                                                <div className="cfx-s4-copy">
                                                    <h2>Review</h2>
                                                    <p><strong>Every completion becomes signal.</strong> Don’t just finish — improve.</p>
                                                    <p className="cfx-s4-gap">The moment you pass, Codivium shows a clean performance readout — and it tracks improvement across repeat attempts on the <em>same</em> exercise. Deliberate practice is driven by feedback: your first completion becomes the baseline, and every revisit shows whether you’re getting sharper — and how.</p>
                                                    <ul className="cfx-s4-bullets">
                                                        <li><strong>Multi-attempt success</strong>: captures how many submissions it took to reach a full pass.</li>
                                                        <li><strong>Repeat-attempt trends</strong>: compare performance across your 2nd, 3rd, 8th attempt — and beyond.</li>
                                                        <li><strong>Time + run-count charts</strong>: see speed and efficiency improving across attempts.</li>
                                                        <li><strong>Improvement summary</strong>: a compact before/after since your first completion.</li>
                                                    </ul>
                                                    <p className="cfx-s4-gap cfx-s4-muted">Result: objective proof of mastery forming — not vibes, not streaks.</p>
                                                </div>
                                                <div className="cfx-s4-media">
                                                    <div className="cfx-s4-image">
                                                        <picture>
                                                            <source srcset="assets/img/panel2_feedback.webp" type="image/webp" />
                                                            <img alt="Codivium review feedback" decoding="async" height="781" loading="lazy" src="assets/img/panel2_feedback.jpg" width="1050" />
                                                        </picture>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                        <article className="cfx-s4-card is-far-right" data-index="3">
                                            <div className="cfx-s4-card__inner">
                                                <div className="cfx-s4-copy">
                                                    <h2>Diagnose</h2>
                                                    <p><strong>MCQs that expose real gaps — not trivia.</strong></p>
                                                    <p className="cfx-s4-gap">Coding interviews don’t only test writing code. They test whether your fundamentals are strong enough to make the right decisions quickly — under pressure. Codivium uses retrieval-first concept checks to surface fragile understanding before it costs you in a timed solve.</p>
                                                    <ul className="cfx-s4-bullets">
                                                        <li><strong>Interview-relevant concept checks</strong>: complexity, data structures, Python gotchas, and reasoning.</li>
                                                        <li><strong>Immediate feedback</strong>: know what you got wrong and why, right when it matters.</li>
                                                        <li><strong>Stronger fundamentals, fewer mistakes</strong>: fix gaps that cause avoidable failures.</li>
                                                        <li><strong>Built for momentum</strong>: quick sessions that pair perfectly with coding drills.</li>
                                                    </ul>
                                                    <p className="cfx-s4-gap cfx-s4-muted">Sharpen fundamentals so your coding speed and accuracy improve together.</p>
                                                </div>
                                                <div className="cfx-s4-media">
                                                    <div className="cfx-s4-image">
                                                        <picture>
                                                            <source srcset="assets/img/panel3_mcq.webp" type="image/webp" />
                                                            <img alt="Codivium MCQ diagnosis" decoding="async" height="1200" loading="lazy" src="assets/img/panel3_mcq.jpg" width="1563" />
                                                        </picture>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                        <article className="cfx-s4-card is-far-right" data-index="4">
                                            <div className="cfx-s4-card__inner">
                                                <div className="cfx-s4-copy">
                                                    <h2>Measure</h2>
                                                    <p><strong>Your training, measured. Your weaknesses, obvious.</strong></p>
                                                    <p className="cfx-s4-gap">Most people practice blindly. Codivium turns every attempt into signal: what you’re strong at, what’s holding you back, and what to train next. Your dashboard is built for data-driven deliberate practice — it recommends the next drill and provides CTAs that jump you straight into it.</p>
                                                    <ul className="cfx-s4-bullets">
                                                        <li><strong>Performance trends over time</strong>: see improvement you can trust — not vibes, not streaks.</li>
                                                        <li><strong>Topic-level visibility</strong>: pinpoint exactly where you’re leaking points across patterns and categories.</li>
                                                        <li><strong>Attempt analytics</strong>: track accuracy and consistency across sessions.</li>
                                                        <li><strong>Clear direction</strong>: convert results into the next best practice target — what to train next and why.</li>
                                                    </ul>
                                                    <p className="cfx-s4-gap cfx-s4-muted">Stop guessing. Start training with precision.</p>
                                                </div>
                                                <div className="cfx-s4-media">
                                                    <div className="cfx-s4-image">
                                                        <picture>
                                                            <source srcset="assets/img/panel4_dashboard.webp" type="image/webp" />
                                                            <img alt="Codivium dashboard analytics" decoding="async" height="1150" loading="lazy" src="assets/img/panel4_dashboard.jpg" width="2694" />
                                                        </picture>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                        <article className="cfx-s4-card is-far-right" data-index="5">
                                            <div className="cfx-s4-card__inner">
                                                <div className="cfx-s4-copy">
                                                    <h2>Refine</h2>
                                                    <p><strong>Precision guidance — exactly when it matters.</strong></p>
                                                    <p className="cfx-s4-gap">Every Codivium exercise is paired with a short, high-signal tutorial designed for the moment you’re working — not “someday when you watch a course.” <strong>Interview coding challenges</strong> include <strong>Mini Tutorials</strong> (end-to-end strategy and execution). <strong>Micro-challenges</strong> include <strong>Micro Tutorials</strong> (atomic drills that sharpen one mental model at a time).</p>
                                                    <ul className="cfx-s4-bullets">
                                                        <li><strong>Exercise-specific, not generic</strong>: the exact technique stack required for <em>this</em> problem.</li>
                                                        <li><strong>Elite clarity, zero fluff</strong>: crisp explanation, clean reasoning, no filler.</li>
                                                        <li><strong>Built for immediate execution</strong>: learn → apply → ship.</li>
                                                        <li><strong>Format-matched support</strong>: Mini Tutorials for interview challenges; Micro Tutorials for micro-challenges.</li>
                                                    </ul>
                                                    <p className="cfx-s4-gap cfx-s4-muted">Platform promise: Codivium will endeavour to ensure every exercise includes the appropriate tutorial (Mini or Micro).</p>
                                                </div>
                                                <div className="cfx-s4-media">
                                                    <div className="cfx-s4-image cfx-s4-image--final">
                                                        <picture>
                                                            <source srcset="assets/img/panel5_minitutorial.webp" type="image/webp" />
                                                            <img alt="Codivium tutorial guidance" decoding="async" height="1132" loading="lazy" src="assets/img/panel5_minitutorial.jpg" width="1320" />
                                                        </picture>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
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
                                <a className="s5-cta" href="/join">Join Codivium</a>
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
                            <a href="/articles">Articles</a>
                            <a href="/contact">Contact</a>
                            <a href="/pricing">Prices</a>
                            <a href="/faq">FAQ</a>
                            <a href="/legal#terms_conditions">Terms &amp; Conditions</a>
                            <a href="/legal#privacy_policy">Privacy Policy</a>
                        </div>
                        <a aria-label="Back to top" className="to-top" href="#section1" id="toTopBtn">↑</a>
                    </div>
                </section>
            </main>  </>
    );
}

export default Landing;