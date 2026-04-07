(() => {
  'use strict';

  /* ── URL safety helper ────────────────────────────────────────────
   * Only allow same-origin relative paths or URLs matching the current
   * origin. Rejects open-redirect attempts from manipulated API responses.
   */
  function __apSafeRedirect(url) {
    try {
      if (typeof url !== 'string' || !url.trim()) return;
      // Relative paths starting with alphanumeric, '/', './' or '?' are safe
      if (/^[a-zA-Z0-9_./?=&+%-]/.test(url) && !url.includes('//')) {
        __apSafeRedirect(url);
        return;
      }
      // Absolute URLs must match the current origin
      const parsed = new URL(url, window.location.origin);
      if (parsed.origin === window.location.origin) {
        window.location.href = parsed.href;
      }
    } catch (_) {}
  }

  /* ── Fixture data (Phase B — replace with API call in Phase C) ──
   * Set window.__adaptiveFixture before this script loads to override
   * (used by demo pages to show different user states).
   */
  const FIXTURE = {
    mode: 'orientation',
    sessionCount: 0,
    lastSessionDaysAgo: null,
    lastSessionLabel: 'No sessions yet',
    categories: [],
    primary: null,
    alternatives: [],
    recentSessions: [],
    sessionQuality: {
      level: null,
      levels: [
        { name: 'Foundation',    pct: 0, isCurrent: false },
        { name: 'Consolidation', pct: 0, isCurrent: false },
        { name: 'Proficient',    pct: 0, isCurrent: false },
        { name: 'Fluent',        pct: 0, isCurrent: false },
      ],
    },
  };

  /* ── Phase C: live data source ──────────────────────────────────────────
   * getAdaptiveState() fetches GET /api/user/adaptive-state.
   * Falls back to window.__adaptiveFixture (demo pages) or FIXTURE (default).
   * The fixture path is used automatically when no sessionId cookie/token is
   * present, keeping demo pages working without any code change.
   */
  async function getAdaptiveState() {
    // Demo override always wins (set by demo fixture JS files)
    if (typeof window !== 'undefined' && window.__adaptiveFixture) {
      return window.__adaptiveFixture;
    }
    // Skip network call if no auth token — avoids an 8s timeout before showing demo/fixture
    const hasRealToken = !!(
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('cv_auth_token')) ||
      (typeof localStorage   !== 'undefined' && localStorage.getItem('cv_auth_token'))
    );
    if (!hasRealToken) {
      return FIXTURE;
    }
    try {
      const res = await __cvFetchWithRetry('/api/user/adaptive-state', {
        headers: getAuthHeaders({ 'Accept': 'application/json' })
      }, 8000, 1);
      if (!res.ok) {
        // 401 → user not authenticated; 404 → no state yet (new user)
        // Both fall through to the default fixture
        if (res.status === 401 || res.status === 404) return FIXTURE;
        throw new Error('HTTP ' + res.status);
      }
      return await res.json();
    } catch (err) {
      const msg = err.name === 'AbortError' ? 'timeout — showing default state' : err.message;
      console.warn('[Adaptive] Could not load adaptive state — using fixture:', msg);
      return FIXTURE;
    }
  }


  /* ═══════════════════════════════════════════════════════════════════════════
   * ADAPTIVE PRACTICE — CONFIGURATION CONSTANTS
   * All tunable thresholds are here. Adjust these before wiring the backend
   * rather than searching through rendering functions.
   * See docs/ADAPTIVE_PRACTICE_VOCABULARY.md §4 and §5 for full rationale.
   * ═══════════════════════════════════════════════════════════════════════════ */
  const AP_CONFIG = {

    /* ── AD-01: Session quality thresholds ───────────────────────────────────
     * Four levels: Foundation → Consolidation → Proficient → Fluent.
     * A session achieves a level when ALL three conditions are met.
     * Levels are evaluated top-down; highest matching level is awarded.
     *
     * accuracy      = % of questions answered correctly (not peeked)
     * maxPeekRate   = max peeks as a proportion of total questions (0 = none)
     * maxResponseMs = median response time in ms across non-peeked answers
     */
    sessionQuality: {
      fluent: {
        minAccuracy:     90,   // %  — near-perfect recall
        maxPeekRate:      0,   // %  — zero peeks: fully independent
        maxResponseMs: 20000   // ms — fast, automatic retrieval (≤20 s)
      },
      proficient: {
        minAccuracy:     80,   // %
        maxPeekRate:     10,   // %  — rare peeks allowed
        maxResponseMs: 45000   // ms — reliable but considered (≤45 s)
      },
      consolidation: {
        minAccuracy:     70,   // %
        maxPeekRate:     20,   // %  — some scaffolding still needed
        maxResponseMs: Infinity // ms — no response time gate at this level
      },
      foundation: {
        minAccuracy:     60,   // %  — active recall building; bottom threshold
        maxPeekRate:    100,   // %  — any peek rate accepted
        maxResponseMs: Infinity
      }
    },

    /* ── AD-02: Progression ring fill and drain ──────────────────────────────
     * Ring fill = correct answers at current difficulty / targetCorrect.
     * Ring drains after a grace period of N days without practice.
     * Grace period and drain rate vary by difficulty: harder content is more
     * durably encoded and decays more slowly (backed by spacing-effect research).
     *
     * slowDrainPerDay  = fraction of current ring value lost per day (days 1–7 past grace)
     * fastDrainPerDay  = fraction lost per day (day 8+ past grace)
     *
     * Advancement requires BOTH: ring at 100% AND rolling score above minAdvancementScore
     * over the last advancementSessionsMin sessions.
     */
    ring: {
      targetCorrectAnswers:   30,    // correct answers needed to fill ring to 100%
      minAdvancementScore:    70,    // % rolling average to unlock advancement
      advancementSessionsMin:  5,    // last N sessions used for rolling average

      gracePeriodDays: {
        basic:        14,   // days — foundational content decays faster
        intermediate: 21,   // days — deeper encoding, slower decay
        advanced:     28    // days — most durable; longer grace before drain
      },
      slowDrainPerDay: 0.10, // 10% of remaining ring per day, days 1–7 past grace
      fastDrainPerDay: 0.20  // 20% of remaining ring per day, day 8+ past grace
    },

    /* ── Recommendation engine thresholds ────────────────────────────────────
     * Trigger conditions for each recommendation type.
     * See docs/ADAPTIVE_PRACTICE_VOCABULARY.md §2 and §3 for full rationale.
     */
    triggers: {
      reEntry: {
        absenceDays:         7    // days since last session to fire re-entry
      },
      weaknessSpotlight: {
        minGapPercent:      50,   // % gap between best and worst category score
        minCategories:       3,   // minimum categories attempted
        minQuestionsPerCat:  5    // minimum questions per category
      },
      spacedReview: {
        daysSinceCorrect:   14,   // days since last correct answer in category
        minCorrectAnswers:   5    // minimum correct answers on record
      },
      difficultyProgression: {
        minScorePercent:    70,   // % rolling average to trigger progression
        minSessions:         3    // minimum sessions at current difficulty
      },
      modeSwitch: {
        maxRatio:          1.5,   // MCQ:coding ratio threshold (or inverse)
        minTotalSessions:   10    // minimum total sessions before firing
      },
      stretch: {
        minScorePercent:    70,   // % in current category to suggest stretch
        fallbackOverallScore: 65  // % overall if subcategory taxonomy not populated
      },
      recovery: {
        dropBelowAveragePercent: 30, // % below category average to trigger recovery
        maxAbsenceDays:           3  // only fire if user is still active
      },
    },

    /* ── Orientation diagnostic — first session routing ─────────────────────
     * Controls how the three-question diagnostic maps to a first session.
     *
     * TRACK ROUTING (by goal answer):
     *   'interview' → interview track exercise
     *   'improve'   → micro challenge
     *   'gaps'      → micro challenge (most targeted for gap-filling)
     *   'explore'   → MCQ, multi-category (see exploringSession below)
     *
     * DIFFICULTY MAPPING (comfort → difficulty):
     *   'beginner'     → 'basic'       ─── 'know the basics' maps to basic,
     *   'basic'        → 'basic'           not intermediate, to avoid cold-start
     *   'intermediate' → 'intermediate'    frustration from overconfidence
     *   'advanced'     → 'advanced'
     *
     * QUESTION COUNT (by time answer, in minutes):
     *   5  → questionCountByTime.short
     *   20 → questionCountByTime.medium
     *   60 → questionCountByTime.long
     *
     * EXPLORING SESSION — multi-category MCQ:
     *   categoryMode    'random'  — picks categoryCount categories from all available
     *                  'curated' — uses curatedCategories list; falls back to random
     *                              if list is empty or shorter than categoryCount
     *   categoryCount   how many distinct categories to include
     *   totalQuestions  total question count, divided equally across categories
     *   curatedCategories  displayNames to use when categoryMode is 'curated'
     *                      Set to [] to always use random selection
     */
    orientation: {

      difficultyMap: {
        beginner:     'basic',
        basic:        'basic',
        intermediate: 'intermediate',
        advanced:     'advanced',
      },

      questionCountByTime: {
        5:   5,   // short session (~5 min)
        20: 10,   // medium session (comfortable within 20 min)
        60: 15,   // longer session
      },
      defaultQuestionCount: 10, // fallback when time answer is missing

      exploringSession: {
        categoryMode:      'curated',   // 'random' | 'curated'
        categoryCount:      4,          // number of categories to spread across
        totalQuestions:    24,          // divided equally across chosen categories
        curatedCategories: [            // used when categoryMode is 'curated'
          'Language Basics',            // Set to [] to fall back to random
          'Functions',
          'Data Types & Data Structures',
          'Performance',
        ],
      },
    },
  };

  /* ── Copy template sets (4–5 variants; randomised; last used excluded) ── */
  /* Templates reference FIXTURE values for now; Phase C will populate dynamically */
  const TEMPLATES = {

    weakness_spotlight: [
      {
        headline: "Your {category} knowledge has the most room to grow.",
        context:  "You're scoring {score}% on {category} — {gap} points below your average across all categories. That gap is where focused effort returns the most, right now.",
        sci:      "Deliberate practice produces the fastest improvement when effort targets the specific area of greatest weakness — not the areas already performing well.",
        sciLong:  "Ericsson's research on expert performance across domains consistently found that experts spend disproportionate time on their weakest areas, while non-experts gravitate toward what they already do well. Spending practice time on strengths feels productive but produces little measurable improvement.",
        cta:      "Work on {category} now",
      },
      {
        headline: "The data is clear — {category} is your highest-leverage practice area.",
        context:  "You're scoring {score}% on {category} — {gap} points below your average. That gap is where your practice time returns the most.",
        sci:      "Spending practice time on strengths feels productive but produces little measurable improvement. The same time spent on weaknesses moves the needle significantly.",
        sciLong:  "This is one of the most counterintuitive findings in learning science — and one of the most robust. Practising what you're already good at is comfortable and feels effective, but the performance gains are marginal. The uncomfortable sessions on weaker material are the ones that produce growth.",
        cta:      "Close the {category} gap",
      },
      {
        headline: "{category} is pulling your overall score down.",
        context:  "A {gap}-point gap between your best and weakest categories is significant. Narrowing it is the most direct path to measurable overall improvement.",
        sci:      "The weakest link principle in skill development: overall performance is often limited more by the lowest area than by the average.",
        sciLong:  "In complex skill domains, performance under pressure often collapses to the weakest element. Addressing it now is both the most effective and the most strategically important move.",
        cta:      "Strengthen {category} now",
      },
      {
        headline: "One category is holding your profile back. Let's address it.",
        context:  "{category} at {score}% is your clearest opportunity. Your data says this is where to put your energy today.",
        sci:      "Deliberate practice is defined by its targeting — unfocused practice, however frequent, produces expertise more slowly than focused effort on identified gaps.",
        sciLong:  "The difference between deliberate practice and mere experience is specificity. Your Codivium data gives you exactly the specificity that deliberate practice requires.",
        cta:      "Practice {category}",
      },
    ],

    re_entry: [
      {
        headline: "Welcome back — {n} days away. A short session now recovers what matters most.",
        context:  "The forgetting curve has been working since your last session. A targeted retrieval session on {category} now is the most efficient way to restore that knowledge.",
        sci:      "Retrieval practice at the point of near-forgetting produces significantly more durable memory than re-studying — even when retrieval feels harder.",
        sciLong:  "Ebbinghaus demonstrated in 1885, and hundreds of subsequent studies have confirmed, that memories weaken exponentially without retrieval practice. The good news: relearning after a gap is always faster than first learning. A short retrieval session now resets the decay clock.",
        cta:      "Start recovery session",
      },
      {
        headline: "{n} days away. Your best next move is a short retrieval session.",
        context:  "The categories you were working on have started to decay. The fastest way back is direct retrieval practice — not re-reading, not video, not notes.",
        sci:      "The testing effect: retrieval practice is consistently more effective than re-study for restoring decayed knowledge, even when retrieval feels harder.",
        sciLong:  "The cognitive effort of retrieval, even when you get answers wrong, produces stronger memory consolidation than passive re-exposure to the same material. Struggling to recall something is the mechanism, not a sign that the approach is wrong.",
        cta:      "Jump back in",
      },
      {
        headline: "Welcome back. Let's pick up where the data says matters most.",
        context:  "After {n} days, your {category} knowledge is most at risk. A focused session now stabilises it before the decay accelerates further.",
        sci:      "Spaced retrieval at this interval produces significantly stronger long-term retention — your absence has set up an optimal review moment.",
        sciLong:  "Spaced repetition systems deliberately schedule reviews at the point of maximum forgetting, because memory restoration at that point is more durable than reviewing earlier. Your absence has created exactly that window.",
        cta:      "Review {category}",
      },
      {
        headline: "It's been a while. One session will get you back on track.",
        context:  "Your last activity was {n} days ago. We've identified the area most worth reinforcing right now.",
        sci:      "Consistent, distributed practice is dramatically more effective than massed practice — returning now maintains the spacing pattern that produces lasting retention.",
        sciLong:  "Research on distributed versus massed practice shows that spreading practice over time produces 10-30% better long-term retention than the same amount of practice in a single block. Every session you complete, however short, contributes to that distribution.",
        cta:      "Start a recovery session",
      },
      {
        headline: "Your knowledge is drifting — a short session fixes that.",
        context:  "{n} days without practice means {category} is now below your retention threshold.",
        sci:      "Memory is not static — it requires periodic retrieval to remain accessible. This is not a flaw; it is how human memory prioritises relevant knowledge.",
        sciLong:  "The neuroscience of memory consolidation shows that the hippocampus actively prunes memories that are not retrieved. Retrieval practice signals to the brain that this knowledge is worth keeping. A single session resets the decay clock.",
        cta:      "Reset your {category} score",
      },
    ],

    spaced_review: [
      {
        headline: "{category} is due for review — before it fades.",
        context:  "You haven't practised {category} in {n} days. Your correct answers from that session are starting to decay.",
        sci:      "The forgetting curve is predictable — retrieval at this point produces significantly stronger long-term retention than waiting longer or reviewing earlier.",
        sciLong:  "Spaced repetition systems deliberately time reviews at the point of near-forgetting. The cognitive effort of retrieval at that moment is the mechanism that strengthens the memory trace. This is the optimal review window for your {category} knowledge.",
        cta:      "Review {category} now",
      },
      {
        headline: "You built solid {category} knowledge {n} days ago. Lock it in.",
        context:  "Without a review session now, that knowledge will continue to decay. A short retrieval session at this point is the most efficient thing you can do.",
        sci:      "Memories reviewed at spaced intervals are retained significantly longer than those reviewed immediately or never reviewed at all.",
        sciLong:  "The spacing effect: a review session today extends the next decay interval, meaning you will need to review less frequently in future. Each spaced review makes the knowledge progressively more durable.",
        cta:      "Reinforce {category}",
      },
      {
        headline: "This is the right moment to review {category}.",
        context:  "Not too early, not too late — {n} days is the optimal review interval for knowledge at your level. This session will extend your retention by weeks.",
        sci:      "Reviewing at the optimal spacing interval — just before significant forgetting occurs — produces more durable memory than reviewing more or less frequently.",
        sciLong:  "Research shows the same total study time produces dramatically different retention depending on how it is distributed. Reviews at the right intervals are worth three to four times as many reviews at arbitrary intervals.",
        cta:      "Review {category} at the right time",
      },
      {
        headline: "Don't let {category} slip — a 10-minute review protects weeks of work.",
        context:  "You invested time building your {category} knowledge. A short retrieval session now prevents that investment from decaying.",
        sci:      "Each successful retrieval at the right interval extends the next forgetting boundary — consistent spaced review produces near-permanent retention.",
        sciLong:  "Knowledge reviewed on a spaced schedule becomes progressively easier to recall and increasingly resistant to forgetting. Skipping a review window does not just cost today's retention; it pushes the fluency endpoint further away.",
        cta:      "Protect your {category} knowledge",
      },
    ],

    difficulty_progression: [
      {
        headline: "You're ready for the next level in {category}.",
        context:  "You've averaged {score}% on {difficulty} {category} across your last {n} sessions. The data says you're ready for {nextDifficulty}.",
        sci:      "The zone of proximal development: the optimal learning zone is just beyond current capability — challenging enough to require effort, achievable enough to prevent frustration.",
        sciLong:  "Vygotsky's ZPD and Csikszentmihalyi's flow state research both converge on this: optimal engagement and learning happen at the boundary of current competence. Staying at the current level now would produce comfort but not growth.",
        cta:      "Try {nextDifficulty} {category}",
      },
      {
        headline: "{difficulty} {category} is no longer your challenge. {nextDifficulty} is.",
        context:  "Consistent performance above {score}% means you've consolidated this level. The most productive next step is moving up.",
        sci:      "Once a skill is consolidated at a given difficulty, further practice at that level produces comfort but not growth — the challenge must increase to maintain the learning effect.",
        sciLong:  "Flow state research shows that engagement peaks when challenge slightly exceeds skill. Below that threshold is boredom; above it is anxiety. Your current {difficulty} {category} score places you in the boredom zone — {nextDifficulty} is where the optimal engagement window is.",
        cta:      "Level up in {category}",
      },
      {
        headline: "Your {category} score says you're ready to be challenged more.",
        context:  "{score}% over {n} sessions at {difficulty} is a strong signal. Staying here longer would slow your progress rather than accelerate it.",
        sci:      "Deliberate practice requires that difficulty is continuously calibrated to the learner's current level — practice that is too easy produces no improvement.",
        sciLong:  "This is one of the most important and least intuitive principles of deliberate practice. Most learners stay in the comfortable zone — repeating what they already know. Expert performers consistently seek out the uncomfortable edge. Your data says the edge has moved.",
        cta:      "Advance to {nextDifficulty}",
      },
      {
        headline: "Well done on {difficulty} {category}. Here's what comes next.",
        context:  "Your average score of {score}% over the last {n} sessions confirms you've genuinely consolidated this level — not just got lucky.",
        sci:      "Genuine consolidation — consistent high performance rather than a single good session — is the right threshold for advancement, and that is exactly what your data shows.",
        sciLong:  "The distinction between a good session and genuine consolidation matters enormously. A single 90% score could be luck; an average above {score}% across {n} sessions is evidence of real competency. Advancing too early is as counterproductive as advancing too late.",
        cta:      "Move to {nextDifficulty}",
      },
    ],

    mode_switch: [
      {
        headline: "Your practice has been {dominantMode}-heavy. Time to balance it.",
        context:  "{ratio}x more {dominantMode} than {otherMode} over your last {n} sessions. Adding {otherMode} now will consolidate what your {dominantMode} sessions built.",
        sci:      "Interleaving different practice types produces better transfer and longer retention than blocked practice in one mode — even when blocked practice feels more productive.",
        sciLong:  "The interleaving effect is counterintuitive and well-evidenced. Mixing MCQ (conceptual retrieval) with coding (procedural application) produces better performance on both than doing them in separate blocks.",
        cta:      "Try {otherMode} in {category}",
      },
      {
        headline: "You know the theory. Now apply it.",
        context:  "Strong MCQ scores in {category} — but no coding practice there yet. The next step is applying that knowledge in code.",
        sci:      "The testing effect shows that retrieval practice (MCQ) builds strong conceptual knowledge — but procedural skill requires application practice in a different format.",
        sciLong:  "Learning science distinguishes declarative knowledge (knowing that something is true) from procedural knowledge (knowing how to do it). MCQ practice builds declarative knowledge efficiently. Coding exercises are required to develop procedural fluency.",
        cta:      "Apply {category} in code",
      },
      {
        headline: "You've been coding — your conceptual foundation needs the same attention.",
        context:  "More coding sessions than MCQ recently. A conceptual retrieval session on {category} would reinforce and deepen what your coding practice built.",
        sci:      "Application without conceptual grounding can produce brittle skills — effective in familiar contexts but fragile under novel problems or interview pressure.",
        sciLong:  "Research on transfer of learning shows that skills developed purely through procedural practice do not transfer well to new contexts. Conceptual knowledge — the why behind the how — is what enables flexible application.",
        cta:      "Reinforce {category} with MCQ",
      },
      {
        headline: "Variety in practice is not optional — it's how retention works.",
        context:  "Your recent sessions have all been {dominantMode}. The research is clear: mixing practice types is more effective than repeating the same format.",
        sci:      "Interleaved practice produces better long-term retention and transfer than blocked practice, even though blocked practice feels more productive in the moment.",
        sciLong:  "Students who interleave practice types consistently outperform those who block by format on delayed tests. The difficulty of switching modes is the mechanism — not a problem to avoid.",
        cta:      "Switch mode",
      },
    ],

    stretch: [
      {
        headline: "You're ready for something new — {newCategory} is your next step.",
        context:  "Your {currentCategory} work has built a strong foundation. {newCategory} shares the same core mental models and is the logical next challenge.",
        sci:      "Transfer of learning is accelerated when the transition is timed to coincide with consolidation of the prior domain.",
        sciLong:  "The optimal moment to introduce a related skill is when the foundational skill is consolidated but not over-practiced. Your {currentCategory} progression ring is full — this is exactly that moment. Starting {newCategory} now means your existing knowledge actively supports it.",
        cta:      "Start {newCategory}",
      },
      {
        headline: "{currentCategory} is mastered. Here's the natural next challenge.",
        context:  "Your scores say you've genuinely consolidated {currentCategory}. {newCategory} is the closest step forward — familiar enough to start, challenging enough to grow.",
        sci:      "The zone of proximal development for stretch goals: the most productive next challenge is adjacent to current competency, not distant from it.",
        sciLong:  "Choosing a stretch goal that shares conceptual foundations with what you already know produces rapid early progress, which sustains motivation through the harder later stages.",
        cta:      "Stretch to {newCategory}",
      },
      {
        headline: "Your data suggests you're ready to broaden your range.",
        context:  "Strong performance in {currentCategory}. The next growth opportunity is trying {newCategory} — a logical extension of what you already know.",
        sci:      "Expertise research shows that breadth of knowledge across related domains accelerates depth of understanding in each.",
        sciLong:  "Cognitive load theory explains why adjacent categories are easier to learn once a foundational category is consolidated: the mental schemas built for {currentCategory} provide scaffolding for {newCategory}. You are not starting from zero.",
        cta:      "Expand into {newCategory}",
      },
      {
        headline: "Ready for a new challenge? {newCategory} is waiting.",
        context:  "You've done the work on {currentCategory}. Your profile says this is the right moment to add a new dimension.",
        sci:      "Varied practice across related domains produces more robust overall competency than deep single-domain practice alone.",
        sciLong:  "The analogy from sport: a tennis player who only practises their serve develops a one-dimensional game. Breadth of competency across related skills produces more adaptable, more resilient overall performance.",
        cta:      "Try {newCategory}",
      },
    ],

    milestone: [
      {
        headline: "First session complete. That's the hardest one.",
        context:  "Research consistently shows that starting is the biggest barrier to any new learning habit. You've cleared it.",
        sci:      "Habit formation research shows that the first instance of a new behaviour is disproportionately predictive of long-term continuation.",
        sciLong:  "Fogg's behaviour model and Clear's habit research both converge: the first action is the barrier, not the motivation. Motivation follows action — not the other way around.",
        cta:      "Build on it",
      },
      {
        headline: "{category} — {difficulty} level earned. Well done.",
        context:  "Consistent performance above the threshold has moved you to the next level. Your progression ring confirmed it.",
        sci:      "Advancement to a higher difficulty level is the clearest signal of genuine skill consolidation — not just repeated exposure.",
        sciLong:  "The distinction between genuine consolidation and repeated exposure matters: a user who answers the same easy questions 30 times has not consolidated the skill. Your rolling score confirmed genuine improvement across varied question sets.",
        cta:      "Continue at {nextDifficulty}",
      },
      {
        headline: "10 sessions. The habit is forming.",
        context:  "Habit research suggests 10 consistent repetitions begins to establish an automatic behaviour pattern. You're at that threshold.",
        sci:      "Repeated behaviour at consistent intervals creates neural pathway reinforcement — at 10 sessions, the return becomes meaningfully easier than it was at session one.",
        sciLong:  "The neuroscience of habit formation shows that repeated behaviour creates progressively stronger automatic associations. The activation energy required to start a session decreases measurably with each repetition.",
        cta:      "Keep the momentum",
      },
      {
        headline: "A full week of practice. Exactly what the spacing research prescribes.",
        context:  "Distributed practice across a week produces measurably better retention than the same number of sessions in one or two days.",
        sci:      "The spacing effect is one of the most replicated findings in cognitive science — distributed practice produces 10-30% better long-term retention than massed practice.",
        sciLong:  "Seven days of distributed practice is not just better than one day of massed practice — it is dramatically better. The same total effort, applied with spacing, produces retention that persists for months rather than days.",
        cta:      "Start week two",
      },
    ],

    recovery: [
      {
        headline: "That session was a tough one — and that's useful information.",
        context:  "Your {category} score was {gap}% below your average. A poor session is the most diagnostic event in deliberate practice.",
        sci:      "Errors in deliberate practice are not failures — they are the highest-information events in the learning process, pinpointing exactly where effort needs to go.",
        sciLong:  "Ericsson's research on deliberate practice emphasises that errors are the mechanism of improvement, not evidence of its absence. A session where you struggled on weaknesses produced more learning signal than one where you scored well on things you already knew.",
        cta:      "Act on what this session revealed",
      },
      {
        headline: "Below your average in {category}. Here's the right response.",
        context:  "{score}% vs your usual {average}% in {category}. This gap tells us something specific — let's address it directly.",
        sci:      "Immediate error correction is more effective than deferred correction — acting on a poor session within 24-48 hours produces the strongest recovery.",
        sciLong:  "Memory reconsolidation research shows that the period immediately after a retrieval failure is a particularly effective window for correction. The memory trace that produced the error is temporarily unstable — new information provided during this window integrates more strongly.",
        cta:      "Recovery session — {category}",
      },
      {
        headline: "Your {category} score dropped. Let's find out why.",
        context:  "A {gap}% drop below your average is a signal worth acting on — not a reason to worry, but a reason to look more carefully.",
        sci:      "Targeted error analysis followed by focused retrieval practice is the most efficient correction mechanism in deliberate practice.",
        sciLong:  "The specific questions you struggled with in that session are now the highest-priority items for your next session. Addressing those specifically — rather than repeating the full category — is the most efficient path to recovery.",
        cta:      "Targeted recovery",
      },
    ],

    orientation: [
      {
        headline: "Let's find out exactly where to start.",
        context:  "You haven't completed any sessions yet — so we'll ask you three quick questions.",
        sci:      "Research shows that starting with a targeted first activity dramatically increases the chance of returning for a second session compared to browsing a menu.",
        sciLong:  "Self-determination theory shows that people are more likely to engage when their choices are guided rather than arbitrary. Three questions is enough for a confident first recommendation.",
        cta:      "Start the quick diagnostic",
      },
    ],

  };



  /* ── State ── */
  let lastTemplateIdx = -1;
  let _templateIdxByType = {}; // tracks last-used variant index per recommendation type

  function pickTemplate(type) {
    const set = TEMPLATES[type] || TEMPLATES.weakness_spotlight;
    // Avoid repeating the same variant on consecutive visits (per-type tracking)
    const lastKey = 'lastTplIdx_' + type;
    const lastIdx = typeof _templateIdxByType === 'object'
      ? (_templateIdxByType[lastKey] || -1) : -1;
    let idx;
    do { idx = Math.floor(Math.random() * set.length); }
    while (idx === lastIdx && set.length > 1);
    if (typeof _templateIdxByType === 'object') _templateIdxByType[lastKey] = idx;
    lastTemplateIdx = idx;
    return set[idx];
  }

  function fillTemplate(tpl, vars) {
    let t = JSON.parse(JSON.stringify(tpl));
    Object.entries(vars).forEach(([k,v]) => {
      ['headline','context','cta'].forEach(field => {
        if (t[field]) t[field] = t[field].replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    });
    return t;
  }

  /* ── DOM helpers ── */
  const el   = id => document.getElementById(id);
  const qs   = (sel, parent) => (parent || document).querySelector(sel);
  const qsa  = (sel, parent) => Array.from((parent || document).querySelectorAll(sel));


  /* ── Build SVG ring ── */
  function buildRingSvg(pct, state) {
    const r = 28;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    const gap  = circ - dash;
    const offset = circ / 4; // start at top

    const colors = {
      ready:    'rgba(94,200,172,0.82)',
      draining: 'rgba(255,165,60,0.75)',
      gap:      'rgba(246,213,138,0.70)',
      locked:   'rgba(255,255,255,0.10)',
      normal:   'rgba(246,213,138,0.75)',
    };
    const fillColor = colors[state] || colors.normal;
    const trackColor = 'rgba(255,255,255,0.07)';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '64');
    svg.setAttribute('height', '64');
    svg.setAttribute('viewBox', '0 0 64 64');
    svg.classList.add('ap-ring-svg');

    // Track
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    track.setAttribute('cx', '32'); track.setAttribute('cy', '32'); track.setAttribute('r', r);
    track.setAttribute('fill', 'none'); track.setAttribute('stroke', trackColor); track.setAttribute('strokeWidth', '3.5');
    svg.appendChild(track);

    // Fill arc
    if (pct > 0) {
      const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      arc.setAttribute('cx', '32'); arc.setAttribute('cy', '32'); arc.setAttribute('r', r);
      arc.setAttribute('fill', 'none'); arc.setAttribute('stroke', fillColor); arc.setAttribute('strokeWidth', '3.5');
      arc.setAttribute('stroke-dasharray', `${dash.toFixed(2)} ${gap.toFixed(2)}`);
      arc.setAttribute('stroke-dashoffset', offset.toFixed(2));
      arc.setAttribute('strokeLinecap', 'square');
      arc.setAttribute('transform', 'rotate(-90 32 32)');
      svg.appendChild(arc);
    }

    // Percent label
    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('x', '32'); txt.setAttribute('y', '37');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('font-size', '13');
    txt.setAttribute('font-weight', '600');
    txt.setAttribute('font-family', 'system-ui, sans-serif');
    txt.setAttribute('fill', pct === 0 ? 'rgba(255,255,255,0.18)' : fillColor);
    txt.textContent = pct + '%';
    svg.appendChild(txt);

    return svg;
  }

  /* ── Render difficulty steps ── */
  function buildDiffSteps(diff) {
    const wrap = document.createElement('div');
    wrap.className = 'ap-ring-diff';
    diff.forEach((v, i) => {
      const s = document.createElement('div');
      // earned = previous steps; active = current filled step
      const isActive = v === 1 && (i === diff.length - 1 || diff[i+1] === 0);
      s.className = 'ap-diff-step' + (v === 1 ? (isActive ? ' active' : ' earned') : '');
      wrap.appendChild(s);
    });
    return wrap;
  }

  /* ── Render ring cards ── */
  function renderRings(categories) {
    const container = el('apRingsContainer');
    if (!container) return;
    container.innerHTML = '';
    if (!categories || categories.length === 0) {
      const empty = document.createElement('p');
      empty.style.cssText = 'color:var(--muted);font-size:13px;padding:8px 0;';
      empty.textContent = 'Category data will appear here once you have completed a few sessions.';
      container.appendChild(empty);
      return;
    }
    // Set --ring-count so grid fills the container width exactly
    const ringCount = Math.min(categories.length, 8);
    container.style.setProperty('--ring-count', ringCount);

    categories.slice(0, 8).forEach(cat => {
      const card = document.createElement('div');
      card.className = 'ap-ring-card glow-follow' +
        (cat.state === 'ready' ? ' is-ready' : '') +
        (cat.state === 'draining' ? ' is-draining' : '');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${cat.name} — ${cat.status}`);

      card.appendChild(buildRingSvg(cat.fill, cat.state));

      const name = document.createElement('div');
      name.className = 'ap-ring-name'; name.textContent = cat.name;

      card.appendChild(name);
      card.appendChild(buildDiffSteps(cat.diff));

      const status = document.createElement('div');
      status.className = 'ap-ring-status'; status.textContent = cat.status;
      card.appendChild(status);

      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
      container.appendChild(card);
    });
  }

  /* ── Render session quality sidebar ── */
  function renderQuality(qData) {
    const container = el('apQualityLevels');
    if (!container) return;
    container.innerHTML = '';
    qData.levels.forEach(lv => {
      const item = document.createElement('div');
      item.className = 'ap-quality-item' + (lv.isCurrent ? ' current' : '');
      if (lv.pct > 0) {
        const fill = document.createElement('div');
        fill.className = 'ap-quality-fill';
        fill.style.width = lv.pct + '%';
        item.appendChild(fill);
      }
      const label = document.createElement('span');
      label.className = 'ap-quality-label'; label.textContent = lv.name;
      const pct = document.createElement('span');
      pct.className = 'ap-quality-pct';
      pct.textContent = lv.isCurrent ? 'Current' : (lv.pct > 0 ? lv.pct + '%' : '—');
      item.appendChild(label); item.appendChild(pct);
      container.appendChild(item);
    });
  }

  /* ── Render recent sessions sidebar ── */
  function renderRecent(sessions) {
    const container = el('apRecentList');
    if (!container) return;
    container.innerHTML = '';
    sessions.slice(0, 5).forEach(s => {
      const item = document.createElement('div');
      item.className = 'ap-recent-item';
      const dot = document.createElement('div');
      dot.className = `ap-recent-dot ${s.state}`;
      const cat = document.createElement('span');
      cat.className = 'ap-recent-cat'; cat.textContent = s.cat;
      const score = document.createElement('span');
      score.className = 'ap-recent-score'; score.textContent = s.score;
      item.appendChild(dot); item.appendChild(cat); item.appendChild(score);
      container.appendChild(item);
    });
  }


  /* ── AD-06: Render milestone celebration banner ─────────────────────────────
   * Shown above the primary recommendation when the user has hit a milestone.
   * milestone object shape (from ACTIVE_FIXTURE.milestone or API response):
   *   { type, label, context, category?, difficulty?, nextDifficulty? }
   * If milestone is null or absent, the banner stays hidden.
   */
  function renderMilestone(milestone) {
    const banner = el('apMilestoneBanner');
    if (!banner) return;
    if (!milestone) { banner.hidden = true; return; }

    const tpl = pickTemplate('milestone');
    const vars = Object.assign({
      category:       milestone.category       || '',
      difficulty:     milestone.difficulty     || '',
      nextDifficulty: milestone.nextDifficulty || '',
    }, milestone.templateVars || {});

    const filled = fillTemplate({ headline: tpl.headline, context: tpl.context }, vars);

    banner.innerHTML =
      '<span class="ap-milestone-icon" aria-hidden="true">✦</span>' +
      '<div class="ap-milestone-text">' +
        '<div class="ap-milestone-headline">' + filled.headline + '</div>' +
        '<div class="ap-milestone-sub">' + (milestone.context || filled.context) + '</div>' +
      '</div>';
    banner.hidden = false;
  }

  /* ── Render primary recommendation ── */
  function renderPrimary(data) {
    // Template variables — populated from data.templateVars or sensible defaults.
    // Phase C: pass real values from the API response via data.templateVars.
    const tplVars = Object.assign({
      category:       'Functions',
      score:          '58',
      gap:            '24',
      n:              '9',
      difficulty:     'Basic',
      nextDifficulty: 'Intermediate',
      dominantMode:   'MCQ',
      otherMode:      'coding',
      ratio:          '2',
      currentCategory:'Language Basics',
      newCategory:    'Functions',
      average:        '72',
    }, data.templateVars || {});
    const tpl = fillTemplate(pickTemplate(data.type), tplVars);

    const hEl   = el('apPrimaryHeadline');
    const cEl   = el('apPrimaryContext');
    const sciEl = el('apPrimarySci');
    const sciD  = el('apPrimarySciDetail');
    const ctaEl = el('apPrimaryCta');
    const tag   = el('apPrimaryTag');
    const fill  = el('apEvidenceFill');
    const evVal = el('apEvidenceValue');

    if (tag)   tag.lastChild.textContent = ' ' + data.typeLabel;
    if (hEl)   hEl.textContent  = tpl.headline;
    if (cEl)   cEl.textContent  = tpl.context;
    if (sciEl) sciEl.textContent = tpl.sci;
    if (sciD)  sciD.textContent  = tpl.sciLong;
    if (ctaEl) {
      ctaEl.textContent = tpl.cta + ' →';
      ctaEl.href = data.ctaHref;
      ctaEl.onclick = function() { recordRecommendationChoice(data.type); };
    }
    if (fill)  setTimeout(() => fill.style.width = data.evidencePct + '%', 120);
    if (evVal) evVal.textContent = data.evidence;

    /* ── "Not today" button ──────────────────────────────────────
     * Records a dismissal in localStorage so the API can factor in
     * that the user passed on today's primary recommendation.
     * cv_adaptive_last_choice shape matches recordRecommendationChoice().
     */
    const notTodayBtn = document.querySelector('.ap-cta-row .ghost');
    if (notTodayBtn) {
      notTodayBtn.addEventListener('click', function dismissHandler() {
        // Record the dismissal
        const record = { type: 'dismissed', chosenAt: new Date().toISOString() };
        try { localStorage.setItem('cv_adaptive_last_choice', JSON.stringify(record)); } catch(_) {}

        // Backend POST (fire-and-forget)
        try {
          fetch('/api/user/adaptive-state', {
            method:  'POST',
            headers: (typeof getAuthHeaders === 'function')
              ? get(function(){
        var _h = AuthHeaders({ 'Content-Type': 'application/json' });
        if (window.__CODIVIUM_CSRF_TOKEN) { _h['X-Csrf-Token'] = window.__CODIVIUM_CSRF_TOKEN; }
        return _h;
      }())
              : { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action:            'recommendation_dismissed',
              recommendationType: data.type,
              dismissedAt:        record.chosenAt,
            }),
          }).catch(function() {}); // ignore network errors — not critical
        } catch(_) {}

        // Visual feedback: collapse the primary card gracefully
        const primaryCard = notTodayBtn.closest('.ap-primary-card, .ap-card, [class*="primary"]');
        if (primaryCard) {
          primaryCard.style.transition = 'opacity 200ms ease, transform 200ms ease';
          primaryCard.style.opacity    = '0.35';
          primaryCard.style.pointerEvents = 'none';
        }
        // Swap button text so user knows it registered
        notTodayBtn.textContent = 'Skipped for today';
        notTodayBtn.disabled = true;
        notTodayBtn.removeEventListener('click', dismissHandler);
      });
    }
  }

  /* ── Render alternative cards ── */
  function renderAlternatives(alternatives) {
    const grid = el('apAltGrid');
    if (!grid) return;
    grid.innerHTML = '';
    alternatives.forEach(alt => {
      const card = document.createElement('div');
      card.className = `ap-alt-card glow-follow ${alt.type}`;
      card.setAttribute('role', 'button'); card.setAttribute('tabindex', '0');
      card.innerHTML = `
        <div class="ap-alt-type">${alt.typeLabel}</div>
        <div class="ap-alt-headline">${alt.headline}</div>
        <div class="ap-alt-sub">${alt.sub}</div>
        <div class="ap-alt-sci">${alt.sci}</div>
        <button class="ap-alt-cta" type="button">${alt.cta}</button>
      `;
      const ctaBtn = card.querySelector('.ap-alt-cta');
      if (ctaBtn && alt.href) {
        ctaBtn.addEventListener('click', () => {
          recordRecommendationChoice(alt.typeLabel);
          __apSafeRedirect(alt.href);
        });
      }
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
      grid.appendChild(card);
    });
  }

  /* ── Render full guidance mode ── */
  function renderFullMode(data) {
    const wrap = el('apFullMode');
    if (!wrap || wrap.classList.contains('ap-hidden')) return;

    renderMilestone(data.milestone || null);
    renderPrimary(data.primary);
    renderAlternatives(data.alternatives);
    renderRings(data.categories);
    renderQuality(data.sessionQuality);
    renderRecent(data.recentSessions);

    // Last session label
    const lsEl = el('apLastSession');
    if (lsEl) lsEl.textContent = data.lastSessionLabel;

    // Subtitle
    const subEl = el('apSubtitle');
    if (subEl) subEl.textContent =
      `Based on ${data.sessionCount} sessions across ${data.categories.filter(c=>c.fill>0).length} categories. Updated with today\'s activity.`;
  }

  /* ── Scientific basis toggle ── */
  function initSciToggles() {
    qsa('.ap-sci-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const detail = qs('.ap-sci-detail', btn.closest('.ap-sci'));
        if (!detail) return;
        const open = detail.classList.toggle('open');
        btn.textContent = open ? 'Why this works ↑' : 'Why this works ↓';
      });
    });
  }

  /* ── Diagnostic questionnaire ── */

  /* ── Orientation diagnostic routing ─────────────────────────────────────────
   * Reads the user's three answers, applies AP_CONFIG.orientation rules,
   * and navigates to the correct first session URL.
   *
   * Track routing:
   *   interview → menu-page.html?track=interview (exercise workspace)
   *   improve   → menu-page.html?track=micro     (exercise workspace)
   *   gaps      → menu-page.html?track=micro     (exercise workspace)
   *   explore   → mcq-parent.html with multi-category config
   *
   * Difficulty mapping: AP_CONFIG.orientation.difficultyMap
   * Question count:     AP_CONFIG.orientation.questionCountByTime
   */
  function buildOrientationUrl(answers) {
    const cfg    = AP_CONFIG.orientation;
    const goal   = answers.goal   || 'explore';
    const level  = answers.level  || 'beginner';
    const time   = parseInt(answers.time || '20', 10);

    // Map comfort answer → difficulty string
    const difficulty = cfg.difficultyMap[level] || 'basic';

    // Map time answer → question count
    const count = cfg.questionCountByTime[time] || cfg.defaultQuestionCount;

    // Store answers for Phase C continuity record
    try {
      localStorage.setItem('cv_adaptive_onboarding', JSON.stringify({
        goal, level, time, difficulty, count,
        answeredAt: new Date().toISOString()
      }));
    } catch(_) {}

    if (goal === 'explore') {
      return _buildExploreUrl(difficulty, cfg.exploringSession);
    }

    // interview / improve / gaps → exercise workspace via menu page
    // In demo mode (__adaptiveBase set), go directly to mcq-parent.html since
    // menu-demo-data.js only has micro data and cannot serve interview track.
    const _base = (typeof window.__adaptiveBase === 'string') ? window.__adaptiveBase : '';
    if (_base) {
      // Demo: route to MCQ with appropriate categories for the goal
      const demoCats = goal === 'interview'
        ? 'Arrays,String+Manipulation,Tree+Traversal'
        : 'Language+Basics,Functions,Data+Types';
      return _base + 'mcq-parent.html?categories=' + demoCats + '&difficulty=' + difficulty + '&count=10&source=adaptive&orient=true';
    }
    const track = goal === 'interview' ? 'interview' : 'micro';
    const params = new URLSearchParams({
      track,
      difficulty,
      source: 'adaptive',
      orient: 'true',
    });
    return 'menu-page.html?' + params.toString();
  }

  function _buildExploreUrl(difficulty, exploringCfg) {
    // Resolve which categories to use
    const curated  = exploringCfg.curatedCategories || [];
    const useRandom = exploringCfg.categoryMode !== 'curated' || curated.length === 0;
    let cats;

    if (useRandom) {
      // Pick categoryCount random categories from the live category bank
      // _categoryObjects is populated by loadCategories() in mcq-parent.js context;
      // here we fall back to the FIXTURE categories or a generic signal
      // For the explore path from orientation, fetch categories from the API
      // or fall back to the FIXTURE list if the API hasn't been called yet
      const available = (FIXTURE.categories || []).map(c => c.name).filter(Boolean);
      const shuffled  = available.sort(() => Math.random() - 0.5);
      cats = shuffled.slice(0, exploringCfg.categoryCount);
    } else {
      // Use curated list, trim to categoryCount
      cats = curated.slice(0, exploringCfg.categoryCount);
    }

    const params = new URLSearchParams({
      categories:  cats.join(','),
      difficulty,
      count:       String(exploringCfg.totalQuestions),
      source:      'adaptive',
      orient:      'true',
    });
    const _base2 = (typeof window.__adaptiveBase === 'string') ? window.__adaptiveBase : '';
    return _base2 + 'mcq-parent.html?' + params.toString();
  }

  function readDiagnosticAnswers() {
    const answers = {};
    qsa('[data-question]').forEach(group => {
      const question = group.dataset.question;
      const selected = qs('.ap-diag-opt.is-sel', group);
      if (selected) answers[question] = selected.dataset.value || '';
    });
    return answers;
  }

  function initOrientationCta() {
    const btn = el('apOrientSubmit');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const answers = readDiagnosticAnswers();
      // Require at least goal selection before proceeding
      if (!answers.goal) {
        // Briefly highlight unanswered question
        const goalGroup = qs('[data-question="goal"]');
        if (goalGroup) {
          goalGroup.classList.add('ap-diag-required');
          setTimeout(() => goalGroup.classList.remove('ap-diag-required'), 1600);
        }
        return;
      }
      const url = buildOrientationUrl(answers);
      __apSafeRedirect(url);
    });
  }

  function initDiagnostic() {
    qsa('.ap-diag-opt').forEach(btn => {
      btn.addEventListener('click', function() {
        const opts = qsa('.ap-diag-opt', this.closest('.ap-diag-opts'));
        opts.forEach(o => o.classList.remove('is-sel'));
        this.classList.add('is-sel');
      });
    });
  }


  /* ── Record which recommendation type the user chose ──────────────────────
   * Stores in continuity record and attaches to session payload.
   * Phase C: POST this to /api/user/adaptive-state.
   */
  /* ── Record recommendation choice ──────────────────────────────────────────
   * Called when the user clicks any CTA (primary Launch or alternative buttons).
   * 1. Writes to localStorage for MCQ results payload (already done, Phase B)
   * 2. POSTs to /api/user/adaptive-state with the chosen recommendation type
   *    so the backend can update the user's continuity record and avoid
   *    surfacing the same recommendation repeatedly. (Phase C)
   */
  function recordRecommendationChoice(typeLabel) {
    const record = { type: typeLabel, chosenAt: new Date().toISOString() };

    // localStorage — read by mcq-quiz.js for selectedRecommendationType field
    try { localStorage.setItem('cv_adaptive_last_choice', JSON.stringify(record)); } catch(_) {}

    // Backend POST (fire-and-forget — don't block navigation)
    try {
      fetch('/api/user/adaptive-state', {
        method:  'POST',
        headers: get(function(){
        var _h = AuthHeaders({ 'Content-Type': 'application/json' });
        if (window.__CODIVIUM_CSRF_TOKEN) { _h['X-Csrf-Token'] = window.__CODIVIUM_CSRF_TOKEN; }
        return _h;
      }()),
        body:    JSON.stringify({
          action:                 'recommendation_chosen',
          recommendationType:     typeLabel,
          chosenAt:               record.chosenAt,
          // Include onboarding answers if this is the user's first session
          onboardingContext: (function() {
            try {
              const raw = localStorage.getItem('cv_adaptive_onboarding');
              return raw ? JSON.parse(raw) : null;
            } catch(_) { return null; }
          })(),
        }),
      });
      // No await — navigation proceeds immediately; server handles async
    } catch(_) {}
  }




  /* ── Column height equalisation ─────────────────────────────────────────────
   * Measures the gap between the alt-grid bottom and the sidebar bottom in
   * viewport coordinates, then grows the alt-grid by exactly that amount.
   * No toggling of align-items — just direct geometry comparison.
   */
  function equaliseColumns() {
    const sidebar = qs('.adaptive-sidebar-col');
    const altGrid = el('apAltGrid');
    if (!sidebar || !altGrid) return;

    // Reset so we measure the current natural bottom of the alt-grid
    altGrid.style.minHeight = '';

    const sidebarBottom  = sidebar.getBoundingClientRect().bottom;
    const altGridRect    = altGrid.getBoundingClientRect();
    const gap            = sidebarBottom - altGridRect.bottom;

    if (gap > 1) {
      altGrid.style.minHeight = (altGridRect.height + gap) + 'px';
    }
  }

  /* ── Module-level ResizeObserver ref so watchColumns() can disconnect before re-observing ── */
  let __apColumnObserver = null;

  function watchColumns() {
    if (typeof ResizeObserver === 'undefined') return;
    // Disconnect any previous observer before creating a new one
    if (__apColumnObserver) {
      __apColumnObserver.disconnect();
      __apColumnObserver = null;
    }
    let ticking = false;
    __apColumnObserver = new ResizeObserver(() => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const altGrid = el('apAltGrid');
        if (altGrid) altGrid.style.minHeight = '';
        equaliseColumns();
        ticking = false;
      });
    });
    [qs('.adaptive-sidebar-col'), qs('.ap-primary')]
      .forEach(t => { if (t) __apColumnObserver.observe(t); });
  }
  // Cleanup on page navigation
  window.addEventListener('pagehide', function() {
    if (__apColumnObserver) { __apColumnObserver.disconnect(); __apColumnObserver = null; }
  }, { once: true });

  /* ── Mode rendering ── */
  function renderMode(stateOrMode) {
    // Accept either the full state object (Phase C) or a bare mode string (legacy)
    const state = (typeof stateOrMode === 'string')
      ? { mode: stateOrMode }
      : (stateOrMode || {});
    const mode = state.mode || 'full';

    ['apOrientationMode','apBuildingMode','apFullMode'].forEach(id => {
      const el_ = el(id);
      if (el_) el_.classList.toggle('ap-hidden', true);
    });
    const target = {
      orientation: 'apOrientationMode',
      building:    'apBuildingMode',
      full:        'apFullMode',
    }[mode] || 'apFullMode';
    const t = el(target);
    if (t) t.classList.remove('ap-hidden');

    // Update sidebar active link — skip wipe if already correct (prevents flicker)
    const adaptiveLink = qs('a[href="adaptive-practice.html"]') ||
                         qs('a[data-section="home"]');
    if (adaptiveLink && !adaptiveLink.classList.contains('active')) {
      qsa('.side-link').forEach(l => l.classList.remove('active'));
      adaptiveLink.classList.add('active');
    }

    if (mode === 'full') {
      renderFullMode(state);
      requestAnimationFrame(() => { equaliseColumns(); watchColumns(); });
    }
  }

  /* ── Boot ── */
  // Wire interactive elements immediately — DOM is ready because scripts
  // are at the bottom of <body>.
  initDiagnostic();
  initOrientationCta();

  // Render the correct mode once state is known (async for API path,
  // synchronous microtask when fixture is set).
  getAdaptiveState().then(function(state) {
    document.querySelectorAll('[data-fill]').forEach(function(el_) {
      el_.style.width = el_.dataset.fill + '%';
    });
    initGlowFollow();
    initSciToggles();
    renderMode(state);
  }).catch(function(err) {
    console.error('[Adaptive] Boot failed:', err);
  });

})();
