import { Link } from "react-router-dom";
import Topbar from "../components/Topbar";
import usePageMeta from "../hooks/usePageMeta";

function Article() {
    usePageMeta("articles");
    // usePageMeta("article");
    return (
        <>
            <Topbar />
            <div aria-hidden="true" className="cv-underbar"></div>
            <div className="stage-shell">
                <div aria-hidden="true" className="watermarks">
                    <div className="word watermark-word wm-pos-1" data-text="CODIVIUM">CODIVIUM</div>
                    <div className="word watermark-word wm-pos-2" data-text="CODIVIUM">CODIVIUM</div>
                    <div className="word watermark-word wm-pos-3" data-text="CODIVIUM">CODIVIUM</div>
                    <div className="word watermark-word wm-pos-4" data-text="CODIVIUM">CODIVIUM</div>
                    <div className="word watermark-word wm-pos-5" data-text="CODIVIUM">CODIVIUM</div>
                    <div className="word watermark-word wm-pos-6" data-text="CODIVIUM">CODIVIUM</div>
                    <div className="word watermark-word wm-pos-7" data-text="CODIVIUM">CODIVIUM</div>
                </div>
                <main className="stage login-stage" role="main" id="mainContent">
                    <div className="blog-scroll" id="blogScroll">
                        <div aria-label="Codivium Article" className="blog-min">
                            <header ClassName="bm-header">
                                <div className="bm-left">
                                    <div className="bm-kicker">CODIVIUM • JOURNAL</div>
                                    <div aria-level="2" className="bm-title" role="heading">Article</div>
                                </div>
                                <div className="bm-right">
                                    {/* <a className="bm-read bm-read-plain" href="/articles">Back to Articles</a> */}
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
                                                <button className="bm-item" type="button"><span className="bm-dot"></span><span
                                                    className="bm-item-text">Python Mastery</span></button>
                                                <button className="bm-item" type="button"><span className="bm-dot"></span><span
                                                    className="bm-item-text">Deliberate Practice</span></button>
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
                                                <button className="bm-key" type="button">Deliberate Practice</button><button
                                                    className="bm-key" type="button">Mastery</button><button className="bm-key"
                                                        type="button">Python</button><button className="bm-key" type="button">Atomic
                                                            Exercises</button><button className="bm-key" type="button">Mental
                                                                Models</button>
                                            </div>
                                        </div>
                                    </div>
                                </aside>
                                <section aria-label="Article" className="bm-main">
                                    <article className="ap-shell glow-track" id="apShell">
                                        <div aria-hidden="true" className="ap-progress">
                                            <div id="apProg"></div>
                                        </div>
                                        <div className="ap-head">
                                            <h1 className="ap-title" id="apTitle">Deliberate Practice: The path to mastery of
                                                Software development in Python (Part I)</h1>
                                            <div className="ap-meta">
                                                <span id="apCat">Python Mastery</span>
                                                <span>•</span>
                                                <span id="apDate">Mar 2026</span>
                                                <span>•</span>
                                                <span id="apTime">~8 min</span>
                                            </div>
                                        </div>
                                        <div aria-label="Reading controls" className="ap-controls">
                                            <button aria-label="Decrease font" className="ap-btn ap-btn-icon" id="fontMinus"
                                                type="button">−</button>
                                            <button aria-label="Increase font" className="ap-btn ap-btn-icon" id="fontPlus"
                                                type="button">+</button>
                                            <button className="ap-btn" id="themeToggle" type="button">Day</button>
                                            <button className="ap-btn" id="softToggle" type="button">Soft</button>
                                            <button className="ap-btn" id="widthToggle" type="button">Wide</button>
                                            <div className="ap-spacer"></div>
                                            <button className="ap-btn" id="copyLink" type="button">Copy Link</button>
                                            <button className="ap-btn" id="printBtn" type="button">Print</button>
                                            <button className="ap-btn" id="topBtn" type="button">Top</button>
                                        </div>
                                        <div aria-label="Scrollable article" className="ap-scroll" id="apScroll">
                                            <div className="ap-body-wrap">
                                                <div className="ap-reading" id="apReading">
                                                    <h1>Deliberate Practice:<br />The path to mastery of Software development in
                                                        Python (Part I)</h1>
                                                    <div className="meta">By Kashif A. K. Sherwany, Codivium. Mar 2026</div>
                                                    <div className="clearfix"></div>
                                                    <h2>Introduction</h2>
                                                    <p>This is the first of a two-part series on deliberate practice – what it
                                                        is, the benefits and how it may be leveraged for improving in software
                                                        development – with python as the example.</p>
                                                    <p>The best coders in the world attain heights in their discipline which
                                                        most people never glimpse, forged not through talent alone but through
                                                        years of quiet struggle at the edge of their ability. We know the names
                                                        of some of them: Dennis Ritchie, Linus Torvalds, Guido van Rossum and
                                                        James Gosling are a few examples. On the other hand, there are far
                                                        greater numbers of developers who, while forging ahead, never attain
                                                        such heights. What is it about these professionals that sets them apart?
                                                        Many would suggest that these elite technical gurus are talented
                                                        geniuses, that their mental capability or natural talent alone is what
                                                        sets them apart, or perhaps that the intellectual prowess or talent is
                                                        coupled with a supreme work ethic. This, some would say, is what sets
                                                        such people apart. Nothing else is needed, nothing else is involved. In
                                                        fact, programming is not the only disciple with a hyper-achieving elite.
                                                        Chess, sport, music (whether classNameical or modern), entrepreneurship, and
                                                        many other fields, also cultivate an elite className of performers. The
                                                        question of what it takes to become a member of this elite className is an
                                                        intriguing one, and one that has been studied by psychologists.</p>
                                                    <div className="clearfix"></div>
                                                    <h2>Why Many Developers Plateau Without Noticing</h2>
                                                    <p>The completion of individual tasks, culminating in the completion of
                                                        projects, gives us a sense of achievement, and hence can lead one to
                                                        believe that progress is being made. This can give the impression of
                                                        increasing competence – tasks being ticked off, projects going live.
                                                        Despite this, the truth is that if the approach we use in successive
                                                        projects is more or less the same, or we are purely following tutorials,
                                                        copying solutions from google searches, rather than pushing our own
                                                        boundaries – then the plateauing of our competence is more likely than
                                                        not. From a distance, it looks like progress — the tasks keep moving,
                                                        the commits pile up, the surface never cracks. But inside, nothing is
                                                        truly transforming. The flaws remain where they have always been — not
                                                        confronted, not dismantled — merely circled around, hidden behind
                                                        competence and routine. The breaking point comes when the question
                                                        itself changes. When you stop asking, “How do I get this finished?” and
                                                        instead demand of yourself, “Where is my thinking still fragile — and
                                                        how do I sharpen it, again and again, until it no longer breaks?” That
                                                        shift is the threshold. It is the moment you cross from simply producing
                                                        work to forging capability — where effort stops being maintenance, and
                                                        takes the first step on the path to mastery.</p>
                                                    <div className="clearfix"></div>
                                                    <h2>What distinguishes elite achievers</h2>
                                                    <p>Psychologist K. Anders Ericsson spent decades studying how expertise
                                                        develops in fields where performance can be measured and mistakes can be
                                                        examined: musicians in conservatories, chess players, athletes,
                                                        surgeons, memory competitors. What he discovered has a direct relevance
                                                        on the matter this article discusses. Natural talent, he found, is not
                                                        the deciding factor nor for that matter is the blind practice, where the
                                                        hours are put in but direction or structure is lacking. People who kept
                                                        improving, his research found, didn’t just put in more hours. They
                                                        practiced differently:</p>
                                                    <div className="bullets">
                                                        <div className="bullet">• They worked on the skills they were worst at.
                                                        </div>
                                                        <div className="bullet">• They chose tasks just beyond their current
                                                            ability.</div>
                                                        <div className="bullet">• They sought frequent, honest feedback on
                                                            performance.</div>
                                                        <div className="bullet">• They revisited the same difficulty until progress
                                                            was undeniable.</div>
                                                    </div>
                                                    <p>Meanwhile, those who plateaued often practiced for a similar number of
                                                        hours, but those hours were spent in comfort:</p>
                                                    <div className="bullets">
                                                        <div className="bullet">• repeating what they already knew how to do</div>
                                                        <div className="bullet">• staying in familiar routines</div>
                                                        <div className="bullet">• avoiding situations that clearly exposed
                                                            weaknesses</div>
                                                    </div>
                                                    <p>Whilst popular culture has conveniently elevated the concept of 10,000
                                                        hours of practice as the route to elite guru level status, when we look
                                                        at the actual findings in Ericsson’s research, it quickly becomes
                                                        evident that this popular mantra is wholly misleading.
                                                        Ericsson himself clarified: it’s not just about putting in the time;
                                                        it’s about how you use that time. In fact, professionals who coast
                                                        through years on autopilot often plateau early, while those engaging in
                                                        structured, feedback-rich practice continue to improve.</p>
                                                    <div className="clearfix"></div>
                                                    <h2>What Is Deliberate Practice?</h2>
                                                    <p>So, the core message we need to understand from all this is that rather
                                                        than ‘10,000 hours make a master’ it’s more a case of unfocused
                                                        repetition preserves mediocrity, while structured, difficult,
                                                        feedback-rich practice drives improvement. Time alone is not the crucial
                                                        variable – how that time is used is what will decide whether the
                                                        practice is effective or not.</p>
                                                    <div className="figure float-left">
                                                        <picture>
                                                            <source srcset="/assets/codivium-article-assets/figure-01.webp"
                                                                type="image/webp" />
                                                            <img alt="The table: Regular Practice vs Deliberate Practice"
                                                                decoding="async" height="1024" loading="lazy"
                                                                src="/assets/codivium-article-assets/figure-01.png" width="1536" />
                                                        </picture>
                                                        <div className="caption"><b>The table</b> — a quick visual contrast between
                                                            regular practice and deliberate practice.</div>
                                                    </div>
                                                    <p>Deliberate practice is not a conventional model of improvement that
                                                        relies on endurance rather than precision. It's a systematic, highly
                                                        structured and mentally demanding method designed to push you beyond
                                                        your current limits. It is composed of distinct features that
                                                        collectively form the foundation of its effectiveness. To put it a
                                                        little differently, the process of practicing deliberately is very
                                                        different from what might be considered normal practice. At every step,
                                                        in fact, it necessitates a different approach to this tradition. The
                                                        table of differences highlights the main points on which deliberate
                                                        practice diverges from normal practice. The main points are discussed in
                                                        further below:</p>
                                                    <div className="clearfix"></div>
                                                    <h3>Targeted skill-building</h3>
                                                    <p>Focus on specific subskills, not vague goals like “get better at coding.”
                                                        Software development is not itself atomic in nature, on the contrary it
                                                        consists of a plethora of sub-skills - design, unit testing, algorithms,
                                                        data structures being some very obvious, high level, ones. To practice
                                                        deliberately, we drill down, decomposing the disciple into a set of
                                                        component skills, then continue drilling down until we arrive at the set
                                                        of atomic skills that make up our discipline - those which we do
                                                        repeatedly as software engineers. Having identified these core, atomic
                                                        skills, then the practice sessions would address these skills- building
                                                        up the practitioner’s competence in each individual skill. Another
                                                        aspect to keep in mind is that the practice, over the longer term,
                                                        should address the whole set of atomic skills rather than focussing only
                                                        on some.</p>
                                                    <div className="clearfix"></div>
                                                    <h3>Progressive difficulty</h3>
                                                    <p>Practice just beyond your current ability. It should feel challenging.
                                                        The whole point of deliberate practice is to push the practitioner
                                                        beyond his current capabilities – this clearly necessitates that the
                                                        practice exercises are designed to be just beyond the current limit of
                                                        capability.</p>
                                                    <div className="clearfix"></div>
                                                    <h3>Immediate feedback</h3>
                                                    <p>You need to know when you're getting it right—or wrong—so you can adjust
                                                        fast. Here, as well as in the previous steps, a mentor can help
                                                        immensely. The role of the mentor being one of diagnosis and guidance
                                                        rather than motivational. As Ericsson mentions repeatedly, left to their
                                                        devices, learners gravitate toward the familiar and steer clear of what
                                                        feels difficult — and in doing so, they quietly bring their growth to a
                                                        halt – the research does not support isolated practitioners becoming
                                                        elite className: mentorship is crucial in deliberate practice. Ericsson
                                                        further emphasises that in every field studied, elite performers had
                                                        their progress tracked systematically. Eventually, though, the result of
                                                        this process is that true experts transform themselves into their own
                                                        mentors.</p>
                                                    <div className="clearfix"></div>
                                                    <h3>Goal-oriented repetition</h3>
                                                    <p>Repetition with a clear purpose is what builds skill, not just time
                                                        spent. Progress happens when we step just beyond our limits, take on
                                                        something that resists us, and let feedback expose the cracks in our
                                                        thinking. We sharpen the weak edge, refine our approach, and return to
                                                        the challenge again — circling it, testing it, shaping it — until the
                                                        skill holds firm and the effort that once strained us becomes second
                                                        nature.</p>
                                                    <div className="clearfix"></div>
                                                    <h3>Effort over enjoyment</h3>
                                                    <p>Deliberate practice is hard. It’s not always fun—but it’s effective.
                                                        Again and again in Ericsson’s work, the same pattern appears: real
                                                        progress happens in the hard places, where the work is effortful,
                                                        exhausting, and mentally demanding. The practice that truly reshapes
                                                        ability is rarely pleasant in the moment; it drains focus, exposes
                                                        weakness, and refuses comfort. Meanwhile, the activities that feel
                                                        smooth and enjoyable do little more than hold our skills in place — they
                                                        keep us competent, but they do not help us grow. A prime example given
                                                        is the repeated practices of chess grandmasters – who concentrate their
                                                        practice on analysis of positions that expose their own weaknesses,
                                                        problems that they have not yet been able to solve and hence that are
                                                        cognitively intense, rather than enjoyable.</p>
                                                    <div className="clearfix"></div>
                                                    <h3>Mental models</h3>
                                                    <p>The goal is to develop deep mental representations—those internal
                                                        blueprints experts rely on. Over time, the process of deliberate
                                                        practice, if done correctly over many years, shapes the mind in powerful
                                                        ways: patterns begin to reveal themselves more quickly, anticipation
                                                        becomes sharper and more reliable, the underlying structure of the skill
                                                        grows clearer, and the learner develops rich internal maps that guide
                                                        perception and decision-making. As Ericsson says, experts are not merely
                                                        better versions of novices, rather they think in fundamentally different
                                                        ways.</p>
                                                    <div className="clearfix"></div>
                                                    <h2>Conclusion</h2>
                                                    <div className="figure float-right">
                                                        <picture>
                                                            <source srcset="/assets/codivium-article-assets/figure-02.webp"
                                                                type="image/webp" />
                                                            <img alt="Deliberate Practice process flow cycle" decoding="async"
                                                                height="1024" loading="lazy"
                                                                src="/assets/codivium-article-assets/figure-02.png" width="1536" />
                                                        </picture>
                                                        <div className="caption"><b>Deliberate practice cycle</b> — the complete
                                                            practice loop, including mental model formation.</div>
                                                    </div>
                                                    <p>Deliberate practice reframes improvement from something that happens
                                                        passively, over time, into an active process that must be designed and
                                                        pursued with intention – consistently over a long period. To put it into
                                                        practice, we need to stop measuring progress purely by work done or time
                                                        spent, but rather by how your thinking changes. The question is no
                                                        longer whether you are putting in effort, but whether that effort is
                                                        aimed at the specific weaknesses that still limit you. When practice is
                                                        structured in this way — precise, demanding, and guided by immediate
                                                        feedback — a series of short practice sessions can transform your
                                                        approach and the path taken to solve problems and even your perception
                                                        of a problem. The deeper shift, however, is not technical but mental.
                                                        Deliberate practice replaces the comfort of familiarity with a
                                                        willingness to return, again and again, to the edges of your ability —
                                                        where mistakes are visible and learning is unavoidable. Over time, this
                                                        habit changes not just what you can do, but how you approach difficulty
                                                        itself. Challenges become diagnostic rather than threatening; failure
                                                        becomes information rather than verdict. Mastery, in this light, is not
                                                        a destination reached by accumulating hours, but a craft continually
                                                        refined through attention, effort, and the courage to work where
                                                        understanding is still incomplete. In part II we will cover how to make
                                                        a plan to use deliberate practice for coding in python.</p>
                                                    <div className="clearfix"></div>
                                                    <h2>References</h2>
                                                    <div className="panel refs-panel">
                                                        <div className="refs-block">
                                                            <p className="ref-item">Ericsson, K. A., Krampe, R. T., &amp;
                                                                Tesch-Römer, C. (1993). The Role of Deliberate Practice in the
                                                                Acquisition of Expert Performance. Psychological Review, 100(3),
                                                                363-406. This is the seminal research paper that first defined
                                                                deliberate practice and introduced the concept that elite
                                                                performance is the result of prolonged, effortful training
                                                                rather than innate talent.</p>
                                                            <div className="ref-gap"></div>
                                                            <p className="ref-item">Ericsson, K. A. (2007). Deliberate practice and
                                                                the modifiability of body and mind: Toward a science of the
                                                                structure and acquisition of expert and elite performance.
                                                                International Journal of Sport Psychology, 38, 4-34. This work
                                                                explores how the brain and body adapt to the extreme demands of
                                                                deliberate practice.</p>
                                                            <div className="ref-gap"></div>
                                                            <p className="ref-item">Ericsson, K. A., &amp; Pool, R. (2016). Peak:
                                                                Secrets from the New Science of Expertise. This book translates
                                                                academic research into actionable strategies for the general
                                                                public, focusing on the development of high-quality mental
                                                                representations.</p>
                                                            <div className="ref-gap"></div>
                                                            <p className="ref-item">Colvin, Geoff (2016). Talent is Overrated: What
                                                                Really Separates World-ClassName Performers from Everybody Else</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
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