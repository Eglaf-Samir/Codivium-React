import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import usePageMeta from "../hooks/usePageMeta";

function Faq() {
    usePageMeta("faq");

    return (
        <>
            <Topbar />
            <div aria-hidden="true" className="cv-underbar"></div>
            <div aria-hidden="true" className="watermark">
                <div className="word" data-text="CODIVIUM">CODIVIUM</div>
            </div>
            <main className="wrap" role="main" id="mainContent">
                <header>
                    <h1>Frequently Asked Questions</h1>
                    <p className="sub">
                        Codivium is a deliberate practice platform focused exclusively on Python — built to accelerate mastery through structured exercises, diagnostics, and feedback.
                    </p>
                </header>
                <section aria-label="Frequently Asked Questions grouped" className="faq-groups">
                    <details className="group">
                        <summary>
                            <div aria-hidden="true" className="group-icon">
                                <svg viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="9"></circle>
                                    <path d="M10 10l7-3-3 7-7 3z"></path>
                                </svg>
                            </div>
                            <div className="group-title">
                                <strong>Overview</strong>
                                <span>Purpose, scope, and what Codivium covers</span>
                            </div>
                            <div aria-hidden="true" className="group-chevron"></div>
                        </summary>
                        <div className="faq">
                            <details>
                                <summary>
                                    <div className="q">What is Codivium?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Codivium is an online platform designed around a deliberate-practice approach to mastery in Python programming.
                                            It helps you practice programming, strengthen technical understanding, and prepare for coding interviews through deliberate, data-driven practice and real-world problem-solving.
                                        </p>
                                        <p>
                                            Today, Codivium focuses on interview preparation, micro-challenges, and multiple-choice diagnostics to identify gaps in knowledge.
                                            Over time, Codivium will expand into modular courses and long-form tutorials spanning beginner, intermediate, and advanced levels.
                                        </p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">How does Codivium work?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Codivium is designed as a training system. You progress by practicing across three complementary modes:
                                        </p>
                                        <ul>
                                            <li><strong>Interview exercises</strong> — code-based problems that develop speed, correctness, and reasoning under pressure.</li>
                                            <li><strong>Python micro-challenges</strong> — small, atomic exercises that isolate specific skills and sharpen mental models.</li>
                                            <li><strong>Multiple-choice diagnostics</strong> — targeted quizzes that surface misconceptions and identify knowledge gaps quickly.</li>
                                        </ul>
                                        <p>
                                            Feedback is central. Codivium provides immediate feedback on individual tasks and a dashboard that summarizes progress, highlights weaknesses, and helps you plan deliberate next steps.
                                        </p>
                                        <div className="note">
                                            Taken together, these tools create a clear path toward mastery — with visibility into what you know, what you don’t, and what to train next.
                                        </div>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">What programming languages does Codivium cover?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>Codivium is a Python specialist. The platform is focused entirely and exclusively on Python.</p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">What does Codivium offer today?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>Currently, Codivium includes:</p>
                                        <ul>
                                            <li><strong>Interview-focused exercises</strong> that test real understanding of Python behavior and edge cases.</li>
                                            <li><strong>Deliberate practice micro-challenges</strong> designed to build correct mental models rather than memorized patterns.</li>
                                            <li><strong>Multiple-choice diagnostics</strong> to identify gaps and misconceptions quickly.</li>
                                            <li><strong>Dashboards</strong> providing immediate feedback and long-term progress tracking.</li>
                                            <li><strong>Mini-tutorials</strong> attached to interview exercises, covering exactly the understanding required — no filler.</li>
                                            <li><strong>Micro Tutorials</strong> attached to Micro Challenges for highly focused learning of atomic-level skills.</li>
                                        </ul>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">What is planned for the future?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>Planned additions include:</p>
                                        <ul>
                                            <li><strong>Modular courses</strong> to develop Python competence in structured stages.</li>
                                            <li><strong>Long-form tutorials</strong> from complete beginner fundamentals through advanced professional topics.</li>
                                            <li>Expanded practice paths that integrate tutorials, challenges, diagnostics, and feedback into guided progressions.</li>
                                        </ul>
                                        <p>
                                            Everything is built around the same philosophy: precise training, deliberate practice, and measurable improvement.
                                        </p>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </details>
                    <details className="group">
                        <summary>
                            <div aria-hidden="true" className="group-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M4 7h10"></path>
                                    <path d="M18 7h2"></path>
                                    <circle cx="16" cy="7" r="2"></circle>
                                    <path d="M4 17h2"></path>
                                    <path d="M10 17h10"></path>
                                    <circle cx="8" cy="17" r="2"></circle>
                                </svg>
                            </div>
                            <div className="group-title">
                                <strong>Platform &amp; Features</strong>
                                <span>Tracking, scope, and practical usage</span>
                            </div>
                            <div aria-hidden="true" className="group-chevron"></div>
                        </summary>
                        <div className="faq">
                            <details>
                                <summary>
                                    <div className="q">What makes Codivium different from other coding platforms?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Codivium uses data-driven deliberate practice to support a focused training journey. You receive precise feedback so you can prioritize the areas with the highest leverage for improvement.
                                        </p>
                                        <p>
                                            Each exercise also includes a mini-tutorial to reinforce the underlying concept — tightly scoped to what you need for that specific skill.
                                        </p>
                                        <p>
                                            Each mini-tutorial also includes brief notes on algorithmic efficiency: the time and space complexity of the solution,
                                            alternative approaches that could be used, and why the selected method is preferable in that context.
                                        </p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">Can I track my progress?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Yes. Codivium tracks progress at both the task level and the system level.
                                            Whenever an individual exercise is attempted, the platform records the submitted solution and key training signals such as
                                            the length of time taken and how many attempts were required to reach a correct outcome. These statistics will be extended over time.
                                        </p>
                                        <p>
                                            Once an exercise is completed, you receive immediate feedback for that specific task. In parallel, a dashboard provides higher-level feedback —
                                            including total time spent on the platform, how that time is split across the different activities, and performance trends across different activity levels.
                                        </p>
                                        <p>
                                            The purpose is not merely to display data: it is to use feedback as a core component of Codivium’s deliberate practice approach to mastery —
                                            helping you identify gaps, tighten mental models, and train with intent.
                                        </p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">How should I use Codivium?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>A typical workflow:</p>
                                        <ul>
                                            <li>Attempt exercises without reference material.</li>
                                            <li>Review feedback and identify misunderstandings.</li>
                                            <li>Read the attached mini-tutorial.</li>
                                            <li>Reattempt related challenges to reinforce the concept.</li>
                                            <li>Use dashboards to guide what to train next.</li>
                                        </ul>
                                        <p>Consistency and reflection matter more than speed.</p>
                                    </div>
                                </div>
                            </details><details>
                                <summary>
                                    <div className="q">What is a more detailed work flow that I could use? provide explanations.</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p><strong>A typical Codivium workflow</strong></p>
                                        <ol>
                                            <li>
                                                <p><strong>Pick the right type of practice (Micro-Challenges vs Interview Exercises vs MCQs)</strong></p>
                                                <ul>
                                                    <li><strong>Micro-Challenges</strong> are tiny, atomic drills designed to sharpen one mental model at a time (e.g., slicing, dict counting, off-by-one logic). They focus on accuracy, clarity, and building reliable instincts.</li>
                                                    <li><strong>Interview Exercises</strong> are full problems that test end-to-end ability: understanding the prompt, designing an approach, handling edge cases, complexity awareness, clean implementation, and explaining your reasoning.</li>
                                                    <li><strong>MCQs</strong> are for fast diagnosis of knowledge gaps. They reveal misconceptions quickly (e.g., what code does, output prediction, complexity intuition, mutability traps).</li>
                                                </ul>
                                                <p><strong>Rule of thumb:</strong> MCQ → identify gaps, Micro-Challenges → repair gaps, Interview Exercises → integrate everything under realistic problem conditions.</p>
                                            </li>
                                            <li>
                                                <p><strong>Start “cold” (no notes) and commit to a first attempt</strong></p>
                                                <p>Before reading anything, try to solve or answer from your current understanding.</p>
                                                <ul>
                                                    <li>For coding tasks, write your first version even if you’re unsure.</li>
                                                    <li>For MCQs, answer based on your first best understanding (don’t research mid-question), because the goal is to surface what you actually believe.</li>
                                                </ul>
                                            </li>
                                            <li>
                                                <p><strong>Use immediate feedback like a diagnostic report</strong></p>
                                                <p>Codivium is designed so you don’t just “submit and hope”—you get fast signals that guide your next step.</p>
                                                <ul>
                                                    <li><strong>Coding exercises:</strong> you see which tests fail, what kind of failure it is likely to be (edge case, parsing/formatting, logic, complexity), and what the incorrect behaviour looks like.</li>
                                                    <li><strong>Micro-Challenges:</strong> you get instant right/wrong plus a tight explanation of the exact concept you missed.</li>
                                                    <li><strong>MCQs:</strong> you get immediate correctness plus an explanation of why the correct answer is correct and why the wrong answers are tempting.</li>
                                                </ul>
                                            </li>
                                            <li>
                                                <p><strong>ClassNameify the mistake (don’t just patch it)</strong></p>
                                                <p>Before changing anything, label the failure type. This is where most improvement comes from:</p>
                                                <ul>
                                                    <li>Misread the prompt / missed a constraint</li>
                                                    <li>Wrong mental model (e.g., slicing boundaries, hashing, truthiness)</li>
                                                    <li>Missing edge case (empty input, duplicates, negatives, off-by-one)</li>
                                                    <li>Implementation slip (indexing, loop conditions, variable reuse)</li>
                                                    <li>Complexity mistake (hidden quadratic, unnecessary nested loops)</li>
                                                </ul>
                                            </li>
                                            <li>
                                                <p><strong>Use the mini-tutorial only after you’ve identified the gap</strong></p>
                                                <p>Read the attached mini-tutorial targeting the specific misunderstanding you just observed. The goal isn’t to learn everything—it’s to fix the one thing that broke your attempt.</p>
                                            </li>
                                            <li>
                                                <p><strong>Reattempt with a clean rewrite (not incremental edits)</strong></p>
                                                <p>Do a fresh solution from scratch. This forces your brain to rebuild the approach correctly instead of layering fixes onto a broken model.</p>
                                                <ul>
                                                    <li>For Interview Exercises, also rewrite your final explanation (approach + complexity + edge cases).</li>
                                                    <li>For Micro-Challenges, aim for correctness in one clean pass.</li>
                                                </ul>
                                            </li>
                                            <li>
                                                <p><strong>Do 2–4 closely related follow-ups to lock the concept in</strong></p>
                                                <p>After a successful attempt, immediately do a few similar items that force you to apply the same underlying idea in slightly different ways. This turns “I solved it once” into “I can solve this className of problem reliably.”</p>
                                            </li>
                                            <li>
                                                <p><strong>Let dashboards choose what to train next (don’t guess)</strong></p>
                                                <p>Use your dashboard to steer your plan:</p>
                                                <ul>
                                                    <li>Revisit topics with repeated failure patterns</li>
                                                    <li>Rotate between Micro-Challenges (repair), MCQs (diagnose), Interview Exercises (integrate)</li>
                                                    <li>Track consistency and repeated misconceptions—not just volume</li>
                                                </ul>
                                            </li>
                                            <li>
                                                <p><strong>Weekly reflection (the multiplier)</strong></p>
                                                <p>Once a week, review:</p>
                                                <ul>
                                                    <li>Your top recurring mistake types</li>
                                                    <li>The concepts that are stabilising (fewer repeats)</li>
                                                    <li>The next 1–2 topics to focus on</li>
                                                </ul>
                                                <p>Consistency and reflection beat speed every time.</p>
                                            </li>
                                        </ol>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">Does Codivium teach frameworks or libraries?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p><strong>Not currently.</strong></p>
                                        <p>
                                            At present, Codivium focuses exclusively on the Python language itself — its semantics, idioms, data model, and core mental models.
                                            This foundation is intentionally prioritized, as it transfers across frameworks and domains far more effectively than framework-specific training.
                                        </p>
                                        <p>
                                            Support for major Python libraries and frameworks such as <strong>NumPy</strong>, <strong>Pandas</strong>, <strong>SciPy</strong>, and <strong>Django</strong> is planned for the future.
                                            When introduced, this material will follow the same philosophy as the rest of the platform: deliberate practice, precise scope, and an emphasis on understanding rather than surface-level usage.
                                        </p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">Do I need special software to use Codivium?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>No. Codivium is entirely web-based. All you need is a computer with an internet connection and a web browser.</p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">What happens if I encounter a bug or technical issue?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            You can report issues directly through the platform, or email support at <strong>support@codivium.com</strong>.
                                        </p>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </details>
                    <details className="group">
                        <summary>
                            <div aria-hidden="true" className="group-icon">
                                <svg viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="9"></circle>
                                    <circle cx="12" cy="12" r="5"></circle>
                                    <circle cx="12" cy="12" r="1"></circle>
                                </svg>
                            </div>
                            <div className="group-title">
                                <strong>Deliberate Practice</strong>
                                <span>What it means and how Codivium applies it</span>
                            </div>
                            <div aria-hidden="true" className="group-chevron"></div>
                        </summary>
                        <div className="faq">
                            <details>
                                <summary>
                                    <div className="q">What is deliberate practice?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Deliberate practice is a structured way to improve performance: you train specific skills, receive clear feedback, and repeat with intent.
                                            The term was popularized by psychologist Anders Ericsson through research on top performers across domains such as sport, music, chess, and business.
                                        </p>
                                        <p>
                                            The same principles apply directly to programming. In coding, deliberate practice means isolating specific skills — such as tracing execution,
                                            reasoning about language semantics, handling edge cases, and designing correct abstractions — then training those skills intentionally with feedback.
                                        </p>
                                        <p>
                                            <strong>Contrast:</strong> common coding practice is often unstructured — writing more code, consuming more tutorials, or solving random problems and moving on.
                                            Deliberate practice is different: it targets a specific weakness, forces precision, and uses feedback to tighten your reasoning before you advance.
                                        </p>
                                        <p>
                                            This is exactly how Codivium’s <strong>micro-challenges</strong> are framed: short, atomic exercises that isolate one concept, stretch it, and reinforce the underlying mental model.
                                            The goal is not volume. The goal is correctness, clarity, and control.
                                        </p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">What is data-driven deliberate practice?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Data-driven deliberate practice is the Codivium approach: the platform collects performance signals as you complete exercises and quizzes,
                                            then turns those signals into actionable feedback.
                                        </p>
                                        <p>It is designed to help you:</p>
                                        <ul>
                                            <li>practice atomic skills that genuinely stretch ability</li>
                                            <li>receive immediate, precise feedback</li>
                                            <li>build stronger mental models over time</li>
                                            <li>focus effort where improvement will be highest</li>
                                        </ul>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">Where can I learn more about deliberate practice?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>Two high-quality introductions are:</p>
                                        <ul>
                                            <li><em>Peak: Secrets from the New Science of Expertise</em> — Anders Ericsson</li>
                                            <li><em>Talent Is Overrated: What Really Separates World-ClassName Performers from Everybody Else</em> — Geoff Colvin</li>
                                        </ul>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </details>
                    <details className="group">
                        <summary>
                            <div aria-hidden="true" className="group-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M9 7V6a3 3 0 0 1 6 0v1"></path>
                                    <path d="M4 7h16v12H4z"></path>
                                    <path d="M4 12h16"></path>
                                </svg>
                            </div>
                            <div className="group-title">
                                <strong>Interview Preparation</strong>
                                <span>How Codivium trains interview-ready reasoning</span>
                            </div>
                            <div aria-hidden="true" className="group-chevron"></div>
                        </summary>
                        <div className="faq">
                            <details>
                                <summary>
                                    <div className="q">How does Codivium help with technical interviews?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Codivium supports interview preparation through carefully designed, interview-style coding questions that reflect how Python is assessed in real technical interviews.
                                        </p>
                                        <p>
                                            These exercises are not designed to reward pattern memorization or familiarity with stock solutions. They are constructed to require precise reasoning about Python’s behavior,
                                            edge cases, and trade-offs — under constraints similar to interview conditions.
                                        </p>
                                        <p>
                                            By repeatedly training this style of problem-solving, developers build the ability to explain intent, reason clearly, and produce correct, defensible solutions — the exact skills interviews are designed to probe.
                                        </p>
                                        <p>
                                            Each associated mini-tutorial also provides brief complexity notes and highlights alternative solution strategies where relevant, so you learn not just <em>what</em> works, but <em>why</em> one approach is superior under typical interview constraints.
                                        </p>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </details>
                    <details className="group">
                        <summary>
                            <div aria-hidden="true" className="group-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M9 3h6v4a2 2 0 1 0 0 4v4H9v-4a2 2 0 1 1 0-4z"></path>
                                    <path d="M9 15v6H3v-6h6"></path>
                                    <path d="M15 15h6v6h-6"></path>
                                </svg>
                            </div>
                            <div className="group-title">
                                <strong>Python Micro-Challenges</strong>
                                <span>Atomic exercises designed to sharpen mental models</span>
                            </div>
                            <div aria-hidden="true" className="group-chevron"></div>
                        </summary>
                        <div className="faq">
                            <details>
                                <summary>
                                    <div className="q">What are Python micro-challenges?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Python micro-challenges are short, atomic exercises designed to isolate a single concept and test it precisely.
                                            Their purpose is not volume — it is accuracy. Each challenge targets a specific mental model: how Python actually behaves.
                                        </p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">How should I use micro-challenges for deliberate practice?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Treat micro-challenges as training, not entertainment. Attempt without references, review feedback, read the attached micro-tutorial,
                                            and repeat with variation until the underlying concept is stable under pressure.
                                        </p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">Do micro-challenges include explanations?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Yes. Each micro-challenge includes a focused micro-tutorial covering exactly the understanding required to solve it correctly — no filler.
                                        </p>
                                        <p>
                                            Each micro-tutorial also provides brief time/space complexity notes for the suggested approach, outlines common alternative methods, and explains why the chosen method is preferable in that scenario.
                                        </p>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </details>
                    <details className="group">
                        <summary>
                            <div aria-hidden="true" className="group-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M9 6h11"></path>
                                    <path d="M9 12h11"></path>
                                    <path d="M9 18h11"></path>
                                    <path d="M4 6l1 1 2-2"></path>
                                    <path d="M4 12l1 1 2-2"></path>
                                    <path d="M4 18l1 1 2-2"></path>
                                </svg>
                            </div>
                            <div className="group-title">
                                <strong>Multiple-Choice Diagnostics</strong>
                                <span>Identify gaps quickly and precisely</span>
                            </div>
                            <div aria-hidden="true" className="group-chevron"></div>
                        </summary>
                        <div className="faq">
                            <details>
                                <summary>
                                    <div className="q">What are the multiple-choice questions used for?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Multiple-choice questions are used as diagnostics. They help surface misconceptions and identify gaps in knowledge efficiently,
                                            especially in areas where developers often have false confidence.
                                        </p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">Are MCQs easier than coding exercises?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Not necessarily. A well-designed MCQ tests understanding, not memory. Many MCQs are built to expose subtle misunderstandings that would otherwise persist unnoticed.
                                        </p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">How do MCQs fit into deliberate practice?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            MCQs help you decide what to train next. When combined with coding exercises and micro-challenges, they create a feedback loop: diagnose gaps, practice deliberately, then verify.
                                        </p>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </details>
                    <details className="group">
                        <summary>
                            <div aria-hidden="true" className="group-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M4 19a2 2 0 0 1 2-2h14"></path>
                                    <path d="M6 3h14v18H6a2 2 0 0 0-2 2V5a2 2 0 0 1 2-2z"></path>
                                </svg>
                            </div>
                            <div className="group-title">
                                <strong>Tutorials</strong>
                                <span>Long-form learning material</span>
                            </div>
                            <div aria-hidden="true" className="group-chevron"></div>
                        </summary>
                        <div className="faq">
                            <details>
                                <summary>
                                    <div className="q">Does Codivium offer long-form tutorials?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Not currently. At present, Codivium focuses on exercises, diagnostics, and tightly scoped mini-tutorials attached to individual tasks.
                                        </p>
                                        <p>
                                            Long-form tutorials are planned for the future and will span multiple levels — including complete beginners in programming through to advanced practitioners.
                                            When introduced, they will follow the same philosophy as the rest of the platform: precision, structure, and practice-first learning.
                                        </p>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </details>
                    <details className="group">
                        <summary>
                            <div aria-hidden="true" className="group-icon">
                                <svg viewBox="0 0 24 24">
                                    <rect height="12" rx="2" width="18" x="3" y="6"></rect>
                                    <path d="M3 10h18"></path>
                                    <path d="M7 15h4"></path>
                                </svg>
                            </div>
                            <div className="group-title">
                                <strong>Subscription &amp; Billing</strong>
                                <span>Plans, cancellation, and refunds</span>
                            </div>
                            <div aria-hidden="true" className="group-chevron"></div>
                        </summary>
                        <div className="faq">
                            <details>
                                <summary>
                                    <div className="q">Is Codivium free to use?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>No. Codivium does not currently offer a free tier.</p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">What are the subscription plans?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Codivium offers single-week, monthly recurring, and annual recurring subscription options. Visit the pricing page for current details.
                                        </p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">How do I cancel my subscription?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            Cancellation is available for monthly and annual subscriptions, but not for the single-week membership.
                                            You can cancel at any time through your account settings. Access remains active until the end of your billing cycle.
                                        </p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">What is the refund policy?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>
                                            There is no refund for weekly or monthly subscriptions.
                                            For annual membership, a refund can be requested within 14 days of the membership starting,
                                            provided premium features have not been extensively used. No refund is available for discounted subscriptions.
                                        </p>
                                        <p>
                                            Please email <strong>membership@codivium.com</strong> from the same email address used to create the account,
                                            including your account details.
                                        </p>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </details>
                    <details className="group">
                        <summary>
                            <div aria-hidden="true" className="group-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7z"></path>
                                    <path d="M9 12l2 2 4-4"></path>
                                </svg>
                            </div>
                            <div className="group-title">
                                <strong>Policies &amp; Misc</strong>
                                <span>Certificates, suggestions, and platform feedback</span>
                            </div>
                            <div aria-hidden="true" className="group-chevron"></div>
                        </summary>
                        <div className="faq">
                            <details>
                                <summary>
                                    <div className="q">Does Codivium offer certificates?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>Not currently. Certificates may be considered in the future if demand exists.</p>
                                    </div>
                                </div>
                            </details>
                            <details>
                                <summary>
                                    <div className="q">Can I recommend a feature or course topic?</div>
                                    <div aria-hidden="true" className="chev"></div>
                                </summary>
                                <div className="answer">
                                    <div className="a">
                                        <p>Yes. Feedback is valued. Contact <strong>contact@codivium.com</strong> with suggestions.</p>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </details>
                </section>
                <div className="footer-bar">
                    Codivium is not a content library. It is an environment for training Python deliberately — with feedback, structure, and intent.
                </div>
                <script defer="" src="/assets/js/pages/faq-01.fad07c96.js"></script>
                <script defer="" src="/assets/js/cv-cube.08d05a23.js"></script>
            </main>
        </>
    );
}

export default Faq;