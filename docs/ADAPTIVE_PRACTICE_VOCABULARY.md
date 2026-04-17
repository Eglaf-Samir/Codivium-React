# Adaptive Practice — Vocabulary Document
# Phase A Complete Reference

**Status:** Approved — ready for Phase B frontend design  
**Version:** 1.0  
**Last updated:** 2026-03-19

---

## 1. Page identity

| Item | Decision |
|---|---|
| URL | `adaptive-practice.html` |
| Sidebar label | Adaptive Practice |
| Post-login landing | Yes — for all users |
| Priority selection | Confidence-based (highest evidence signal wins primary CTA) |
| CTAs per experienced user | 2–3, each labelled by learning purpose |
| Scientific basis display | One sentence per recommendation, expandable to 2–3 sentences |

---

## 2. Three user modes

| Mode | Trigger | Page behaviour |
|---|---|---|
| **Orientation** | Zero completed sessions | Runs 3-question diagnostic; emits single first recommendation; no alternatives |
| **Building** | 1–9 sessions OR insufficient data for confident recommendation | Partial recommendation with explicit note that data is still building |
| **Full guidance** | 10+ sessions with sufficient category spread | Full recommendation engine; confidence-based primary + 2 alternatives |

---

## 3. Recommendation types

### 3.1 Confirmed types for initial build

| # | Type | Trigger condition | Scientific principle |
|---|---|---|---|
| 1 | Orientation | Zero completed sessions | Self-determination theory — guided choice reduces paralysis |
| 2 | Re-entry | ≥ 7 days since last session | Habit re-formation; reducing re-entry friction |
| 3 | Weakness spotlight | ≥ 50% depth score gap between best and worst category; minimum 3 categories attempted with ≥ 5 questions each | Deliberate practice targets weakness not strength |
| 4 | Spaced review | ≥ 14 days since last correct answer in a category with ≥ 5 correct answers on record | Spaced repetition; Ebbinghaus forgetting curve |
| 5 | Difficulty progression | Rolling average ≥ 70% over last 3 sessions in category at current difficulty | Zone of proximal development |
| 6 | Mode switch | MCQ:coding ratio ≥ 1.5 or ≤ 0.67 AND total sessions ≥ 10 | Interleaving and the testing effect |
| 7 | Stretch | ≥ 70% in current category; subcategory-based new category when taxonomy populated; blunt fallback: overall difficulty ≥ 65% in track | ZPD; transfer of learning |
| 8 | Milestone celebration | First session; first category to Intermediate; first 10 sessions; first consistent week | Goal-gradient effect |
| 9 | Recovery | Session score ≥ 30% below user's category average | Errors are most information-rich events in deliberate practice |

### 3.2 Deferred types

| Type | Deferred to | Dependency |
|---|---|---|
| Goal-anchored | Phase 3 | Requires onboarding goal storage (P-INF-05) |
| Pre-activity warm-up | Future enhancement | Requires per-question session-position accuracy data |

### 3.3 Priority when multiple types apply

Confidence-based: highest evidence score wins primary. Evidence scores:

- Re-entry: absence in days × 3 (absence is unambiguous signal)
- Weakness spotlight: gap percentage × 2
- Spaced review: days overdue × 2.5
- Difficulty progression: sessions above threshold × 1.5
- Mode switch: ratio deviation × 1
- Stretch: readiness score × 1
- Milestone celebration: fires as secondary annotation only, never displaces data-driven primary
- Recovery: fires as primary only if score drop exceeds threshold AND absence < 3 days (user is still active)

---

## 4. Thresholds (tunable constants)

```js
const ADAPTIVE_THRESHOLDS = {
  reEntry:                  { absenceDays: 7 },
  weaknessSpotlight:        { minGapPercent: 50, minCategories: 3, minQuestionsPerCat: 5 },
  spacedReview:             { daysSinceCorrect: 14, minCorrectAnswers: 5 },
  difficultyProgression:    { minScorePercent: 70, minSessions: 3 },
  modeSwitch:               { maxRatio: 1.5, minTotalSessions: 10 },
  stretch:                  { minScorePercent: 70, fallbackOverallScore: 65 },
  recovery:                 { dropBelowAveragePercent: 30, maxAbsenceDays: 3 },
  ringDrain: {
    gracePeriodDays:        { basic: 14, intermediate: 21, advanced: 28 },
    slowDrainPerDay:        0.10,   // % of ring per day, days 14–20
    fastDrainPerDay:        0.20,   // % of ring per day, days 21+
  },
  ring: {
    targetCorrectAnswers:   30,     // correct answers to fill ring
    advancementScoreMin:    70,     // % rolling average to unlock advancement
    advancementSessionsMin: 5,      // last N sessions for rolling average
  }
};
```

---

## 5. Session quality indicator

### 5.1 Level names (confirmed)

| Level | Description |
|---|---|
| **Foundation** | Starting point — active recall building |
| **Consolidation** | Knowledge stabilising — memory traces strengthening |
| **Proficient** | Reliable retrieval — consistent and accurate |
| **Fluent** | Automatic retrieval — fast, accurate, no scaffolding needed |

### 5.2 Inputs

- Accuracy: percentage of questions answered correctly (not peeked)
- Peek rate: number of peeks as a proportion of total questions
- Response confidence: median `responseTimeSeconds` across non-peeked answers

### 5.3 Thresholds (tunable)

| Level | Accuracy | Peek rate | Median response time |
|---|---|---|---|
| Foundation | ≥ 60% | Any | Any |
| Consolidation | ≥ 70% | ≤ 20% | Any |
| Proficient | ≥ 80% | ≤ 10% | ≤ 45 seconds |
| Fluent | ≥ 90% | 0% | ≤ 20 seconds |

Levels are evaluated top-down; the highest level where all conditions are met is awarded.

### 5.4 FE-08 pending item

Record `questionRenderedAt` in `renderQuestion()`. Compute `responseTimeSeconds = submittedAt - questionRenderedAt` at submit time. Include `responseTimeSeconds` per answer in `POST /api/mcq/results` payload.

---

## 6. Progression rings

### 6.1 Measurement

Ring fill % = (correct answers at current difficulty in category / 30) × 100

Capped at 100%. Does not count peeked answers.

### 6.2 Ready-to-advance condition

Both must be true:
- Ring is at 100% (30+ correct answers)
- Rolling average score ≥ 70% over last 5 sessions in category at current difficulty

### 6.3 Drain schedule

No drain for grace period (varies by difficulty). After grace period:

- Days 1–7 past grace: drain 10% of current ring value per day
- Day 8+ past grace: drain 20% of current ring value per day

Drain pauses when the user completes a session in that category.

### 6.4 Visual states

| State | Visual |
|---|---|
| Empty (0%) | Ring outline only, dim |
| Building (1–49%) | Ring partially filled, gold fill |
| Strong (50–99%) | Ring more than half filled, brighter gold |
| Full — advancement locked | 100% filled, pulsing gently, "Ready to advance?" prompt |
| Draining | Fill visibly receding, amber-to-red colour shift |
| Advanced (step earned) | Step marker changes from locked to earned treatment |

---

## 7. Difficulty markers

Three steps per category per track: Basic → Intermediate → Advanced.

### 7.1 Step states

| State | Condition | Visual |
|---|---|---|
| Locked | Not yet attempted at this difficulty | Dimmed, no progress indicator |
| In progress | Attempted but ring not full / score not at threshold | Step highlighted, ring shown |
| Earned | Ring filled AND score threshold met | Distinct earned treatment, subtle glow |

### 7.2 Subcategory stretch

The `SubCategory` field already exists on individual exercises — each exercise has both a
`Category` and a `SubCategory`. The backend derives stretch suggestions by analysing the
user's exercise history grouped by subcategory, identifying subcategories within a strong
category where coverage is thin or absent.

The stretch recommendation arrives pre-computed from `GET /api/user/adaptive-state` with
the specific subcategory already identified as `newCategory`. No `subCategoryOf` relationship
field is needed on the category list — the relationship is implicit in the exercise data.

**Blunt fallback** (used until `GET /api/user/adaptive-state` is live): overall score
≥ 65% in track triggers the stretch recommendation with a broad category as the target
rather than a specific subcategory.

---

## 8. Copy templates

*4–5 variants per type. Selected randomly, excluding the variant used on the previous visit (store last-used index in continuity record).*

---

### TYPE 1 — Orientation (new user, zero data)

**Template A**
> **Headline:** Let's find out exactly where to start.
> **Context:** You haven't completed any sessions yet — so we're going to ask you three quick questions.
> **Scientific basis:** Research shows that starting with a targeted first activity, rather than browsing a menu, dramatically increases the chance of returning for a second session.
> **Expandable:** Self-determination theory — one of the most robust frameworks in motivation psychology — shows that people are more likely to engage when they feel their choices are guided rather than arbitrary. Three questions is enough for us to make a confident first recommendation.
> **CTA:** Start the quick diagnostic →

**Template B**
> **Headline:** Three questions. One clear starting point.
> **Context:** Before we can guide you, we need to know a little about where you are and what you're aiming for.
> **Scientific basis:** Deliberate practice always begins with an accurate baseline — without one, practice time is wasted on the wrong things.
> **Expandable:** The research of Anders Ericsson, who coined deliberate practice, is clear: improvement is fastest when effort is precisely targeted. The three questions below take less than a minute and give us enough to make that first targeting decision.
> **CTA:** Begin →

**Template C**
> **Headline:** Welcome. Let's make your first session count.
> **Context:** Your first activity matters more than you might think — it sets the pattern for everything that follows.
> **Scientific basis:** The habit-formation literature consistently shows that the first experience with a new platform determines long-term return rate more than any subsequent feature.
> **Expandable:** Getting the first recommendation right is not just about today's session — it is about whether you come back tomorrow. Three short questions let us calibrate to your actual level and goal, not a generic starting point.
> **CTA:** Let's go →

**Template D**
> **Headline:** Before your first session — a 60-second orientation.
> **Context:** Tell us your goal, your current level, and how much time you have. We'll take it from there.
> **Scientific basis:** Guided onboarding increases early engagement by reducing the decision overhead that causes new learners to disengage before starting.
> **Expandable:** Studies on self-regulated learning consistently find that learners with a clear immediate goal outperform those left to choose freely — particularly in the first few sessions before personal momentum is established.
> **CTA:** Start orientation →

---

### TYPE 2 — Re-entry (absent ≥ 7 days)

**Template A**
> **Headline:** Good to have you back — your knowledge needs a refresh.
> **Context:** It's been {N} days since your last session. Research suggests some of what you built is starting to fade.
> **Scientific basis:** The forgetting curve shows measurable memory decay begins within days of last retrieval. A short session now recovers that knowledge more efficiently than waiting longer.
> **Expandable:** Hermann Ebbinghaus demonstrated in 1885 — and hundreds of subsequent studies have confirmed — that memories weaken exponentially without retrieval practice. The good news: relearning is always faster than first learning, even after significant gaps. A 10-minute session now is worth more than an hour after another week away.
> **CTA:** Recover {category} now →

**Template B**
> **Headline:** {N} days away. Your best next move is a short retrieval session.
> **Context:** The categories you were working on have started to decay. The fastest way back is direct retrieval practice — not re-reading, not video, not notes.
> **Scientific basis:** Retrieval practice is consistently more effective than re-study for restoring decayed knowledge, even when retrieval feels harder than re-reading.
> **Expandable:** This counterintuitive finding — called the testing effect — has been replicated hundreds of times. The cognitive effort of retrieval, even when you get answers wrong, produces stronger memory consolidation than passive re-exposure to the same material. Struggling to recall something is the mechanism, not a sign that the approach is wrong.
> **CTA:** Jump back in →

**Template C**
> **Headline:** Welcome back. Let's pick up where the data says matters most.
> **Context:** After {N} days, your {category} knowledge is the most at risk. Here's a focused session to stabilise it.
> **Scientific basis:** Spaced retrieval at this interval produces significantly stronger long-term retention than studying at shorter intervals — your absence has actually set up an optimal review moment.
> **Expandable:** This is not a coincidence. Spaced repetition systems like Anki deliberately schedule reviews at the point of maximum forgetting, because the memory restoration at that point is more durable than reviewing earlier. Your {N}-day gap puts {category} in that optimal window right now.
> **CTA:** Review {category} →

**Template D**
> **Headline:** It's been a while. One session will get you back on track.
> **Context:** Your last activity was {N} days ago. We've identified the area most worth reinforcing right now.
> **Scientific basis:** Consistent, distributed practice is dramatically more effective than massed practice — returning now, even briefly, maintains the spacing pattern that produces lasting retention.
> **Expandable:** Research on distributed versus massed practice (sometimes called the spacing effect) shows that spreading practice over time produces 10–30% better long-term retention than the same amount of practice in a single block. Every session you complete, however short, contributes to that distribution.
> **CTA:** Start a recovery session →

**Template E**
> **Headline:** Your knowledge is drifting — a short session fixes that.
> **Context:** {N} days without practice means {category} is now below your retention threshold.
> **Scientific basis:** Memory is not static — it requires periodic retrieval to remain accessible. This is not a flaw; it is how human memory is designed to prioritise relevant knowledge.
> **Expandable:** The neuroscience of memory consolidation shows that the hippocampus actively prunes memories that are not retrieved. This is adaptive — the brain is conserving resources for knowledge that is actually being used. Retrieval practice signals to the brain that this knowledge is worth keeping. A single session is enough to reset the decay clock.
> **CTA:** Reset your {category} score →

---

### TYPE 3 — Weakness spotlight

**Template A**
> **Headline:** Your {category} score has the most room to grow.
> **Context:** There's a {gap}% gap between your strongest and weakest categories. {category} is where focused effort pays off most right now.
> **Scientific basis:** Deliberate practice produces the fastest improvement when effort targets the specific area of greatest weakness — not the areas already performing well.
> **Expandable:** Anders Ericsson's research on expert performance across domains — music, chess, medicine, sport — consistently found that experts spend disproportionate time on their weakest areas, while non-experts gravitate toward what they already do well. The {gap}% gap in your profile is the clearest signal your data can give.
> **CTA:** Work on {category} →

**Template B**
> **Headline:** The data is clear — {category} is your highest-leverage practice area.
> **Context:** You're scoring {score}% on {category} — {gap} points below your average. That gap is where your practice time returns the most.
> **Scientific basis:** Spending practice time on strengths feels productive but produces little measurable improvement. The same time spent on weaknesses moves the needle significantly.
> **Expandable:** This is one of the most counterintuitive findings in learning science — and one of the most robust. Practising what you're already good at is comfortable and feels effective, but the performance gains are marginal. The uncomfortable sessions on weaker material are the ones that produce growth.
> **CTA:** Close the {category} gap →

**Template C**
> **Headline:** {category} is pulling your overall score down.
> **Context:** A {gap}% gap between your best and weakest categories is significant. Narrowing it is the most direct path to measurable overall improvement.
> **Scientific basis:** The weakest link principle in skill development: overall performance is often limited more by the lowest area than by the average.
> **Expandable:** In complex skill domains, performance under pressure often collapses to the weakest element. A job interview that covers {category} will expose the gap regardless of how strong your other categories are. Addressing it now is both the most effective and the most strategically important move.
> **CTA:** Strengthen {category} now →

**Template D**
> **Headline:** You have a {gap}% gap. Here's how to close it efficiently.
> **Context:** Your strongest category is {topCategory} at {topScore}%. Your weakest is {category} at {weakScore}%. One targeted session starts closing that.
> **Scientific basis:** Targeted weakness practice is more efficient than general practice — the same session length produces larger measurable gains when focused on the identified gap.
> **Expandable:** Efficiency matters in self-directed learning because motivation is finite. A session that produces visible progress reinforces the habit of practice. Targeting the largest gap maximises the probability of seeing a score shift in this session, which is the most reliable source of continued engagement.
> **CTA:** Target {category} →

**Template E**
> **Headline:** One category is holding your profile back. Let's address it.
> **Context:** {category} at {weakScore}% is your clearest opportunity. Your data says this is where to put your energy today.
> **Scientific basis:** Deliberate practice is defined by its targeting — unfocused practice, however frequent, produces expertise more slowly than focused effort on identified gaps.
> **Expandable:** The difference between deliberate practice and mere experience is specificity. A programmer who has coded for ten years without targeting weaknesses improves slowly. One who identifies and addresses specific gaps improves rapidly. Your Codivium data gives you exactly the specificity that deliberate practice requires.
> **CTA:** Practice {category} →

---

### TYPE 4 — Spaced review

**Template A**
> **Headline:** {category} is due for review — before it fades.
> **Context:** You haven't practised {category} in {N} days. Your correct answers from that session are starting to decay.
> **Scientific basis:** The forgetting curve is predictable — retrieval at this point produces significantly stronger long-term retention than waiting longer or reviewing earlier.
> **Expandable:** Spaced repetition systems — from Ebbinghaus's original research to modern implementations like Anki — deliberately time reviews at the point of near-forgetting. The cognitive effort of retrieval at that moment is the mechanism that strengthens the memory trace. This is the optimal review window for your {category} knowledge.
> **CTA:** Review {category} now →

**Template B**
> **Headline:** You built solid {category} knowledge {N} days ago. Lock it in.
> **Context:** Without a review session now, that knowledge will continue to decay. A short retrieval session at this point is the most efficient thing you can do for long-term retention.
> **Scientific basis:** Memories reviewed at spaced intervals are retained significantly longer than those reviewed immediately or never reviewed at all.
> **Expandable:** The spacing effect is one of the most replicated findings in cognitive psychology. A review session today does not just refresh your {category} knowledge — it extends the next decay interval, meaning you will need to review it less frequently in the future. Each spaced review makes the knowledge progressively more durable.
> **CTA:** Reinforce {category} →

**Template C**
> **Headline:** Your {category} knowledge needs a retrieval signal.
> **Context:** {N} days since your last correct answer in {category}. The forgetting curve is working against you — a retrieval session now reverses it.
> **Scientific basis:** Human memory is maintained by use — retrieval practice signals to the brain that this knowledge is worth retaining and extends its accessibility.
> **Expandable:** The neuroscience here is specific: retrieval activates the same neural pathways used to encode the original knowledge, strengthening the connections through a process called memory reconsolidation. This is why testing yourself is more effective than re-reading even when you get answers wrong — the retrieval attempt itself is the intervention.
> **CTA:** Retrieve {category} →

**Template D**
> **Headline:** This is the right moment to review {category}.
> **Context:** Not too early, not too late — {N} days is the optimal review interval for knowledge at your level. This session will extend your retention by weeks.
> **Scientific basis:** Reviewing at the optimal spacing interval — just before significant forgetting occurs — produces more durable memory than reviewing more frequently or waiting too long.
> **Expandable:** Spaced repetition research shows that the same total study time produces dramatically different retention depending on how it is distributed. Reviews at the right intervals are worth three to four times as many reviews at arbitrary intervals. Codivium tracks these windows so you do not have to.
> **CTA:** Review {category} at the right time →

**Template E**
> **Headline:** Don't let {category} slip — a 10-minute review protects weeks of work.
> **Context:** You invested time building your {category} knowledge. A short retrieval session now prevents that investment from decaying.
> **Scientific basis:** Each successful retrieval at the right interval extends the next forgetting boundary — consistent spaced review produces near-permanent retention of material.
> **Expandable:** Studies on long-term retention show that knowledge reviewed on a spaced schedule becomes progressively easier to recall and increasingly resistant to forgetting. The end state — fluent, automatic retrieval — is only achievable through this process. Skipping a review window does not just cost you today's retention; it pushes the fluency endpoint further away.
> **CTA:** Protect your {category} knowledge →

---

### TYPE 5 — Difficulty progression

**Template A**
> **Headline:** You're ready for the next level in {category}.
> **Context:** You've averaged {score}% on {difficulty} {category} across your last {N} sessions. The data says you're ready for {nextDifficulty}.
> **Scientific basis:** The zone of proximal development — the space just beyond current capability — is where learning is fastest and engagement is highest.
> **Expandable:** Psychologist Lev Vygotsky identified that optimal learning happens at the boundary of current competence — challenging enough to require effort, achievable enough to prevent frustration. Your {score}% average at {difficulty} places you squarely at that boundary for {nextDifficulty}. Staying at the current level now would produce diminishing returns.
> **CTA:** Try {nextDifficulty} {category} →

**Template B**
> **Headline:** {difficulty} {category} is no longer your challenge. {nextDifficulty} is.
> **Context:** Consistent performance above {score}% means you've consolidated this level. The most productive next step is moving up.
> **Scientific basis:** Once a skill is consolidated at a given difficulty, further practice at that level produces comfort but not growth — the challenge must increase to maintain the learning effect.
> **Expandable:** Flow state research by Mihaly Csikszentmihalyi shows that engagement peaks when challenge slightly exceeds skill. Below that threshold is boredom; above it is anxiety. Your current {difficulty} {category} score places you in the boredom zone — {nextDifficulty} is where the optimal engagement window is.
> **CTA:** Level up in {category} →

**Template C**
> **Headline:** Your {category} score says you're ready to be challenged more.
> **Context:** {score}% over {N} sessions at {difficulty} is a strong signal. Staying here longer would slow your progress rather than accelerate it.
> **Scientific basis:** Deliberate practice requires that difficulty is continuously calibrated to the learner's current level — practice that is too easy produces no improvement.
> **Expandable:** This is one of the most important and least intuitive principles of deliberate practice. Most learners stay in the comfortable zone — repeating what they already know. Expert performers consistently seek out the uncomfortable edge. Your data says the edge has moved — your {difficulty} questions are no longer at that edge.
> **CTA:** Advance to {nextDifficulty} →

**Template D**
> **Headline:** {N} sessions at {difficulty}. Time to move forward.
> **Context:** You've proven your {category} competency at this level. Your progression ring is full. The next step is yours.
> **Scientific basis:** Sustained competency at one level is the clearest possible signal that the learning challenge needs to increase.
> **Expandable:** Expertise research consistently shows that stagnation in skill development occurs not from lack of effort but from lack of appropriate challenge. The performers who improve continuously are those who deliberately seek out the level that feels slightly too hard. Your {category} data says that level is now {nextDifficulty}.
> **CTA:** Take on {nextDifficulty} {category} →

**Template E**
> **Headline:** Well done on {difficulty} {category}. Here's what comes next.
> **Context:** Your average score of {score}% over the last {N} sessions confirms you've genuinely consolidated this level — not just got lucky.
> **Scientific basis:** Genuine consolidation — consistent high performance rather than a single good session — is the right threshold for advancement, and that is exactly what your data shows.
> **Expandable:** The distinction between a good session and genuine consolidation matters enormously for the decision to advance. A single 90% score could be luck; an average of {score}% across {N} sessions is evidence of real competency. Codivium requires both the score and the session count before recommending advancement — because advancing too early is as counterproductive as advancing too late.
> **CTA:** Move to {nextDifficulty} →

---

### TYPE 6 — Mode switch

**Template A**
> **Headline:** Your practice has been {dominantMode}-heavy. Time to balance it.
> **Context:** {ratio}x more {dominantMode} than {otherMode} over your last {N} sessions. Adding {otherMode} now will consolidate what your {dominantMode} sessions built.
> **Scientific basis:** Interleaving different practice types produces better transfer and longer retention than blocked practice in one mode — even when blocked practice feels more productive.
> **Expandable:** The interleaving effect is counterintuitive and well-evidenced. Mixing MCQ (conceptual retrieval) with coding (procedural application) produces better performance on both than doing them in separate blocks. The additional cognitive demand of switching modes forces deeper processing of each. Pure MCQ practice without coding application builds knowledge that may not transfer to real problems.
> **CTA:** Try {otherMode} in {category} →

**Template B**
> **Headline:** You know the theory. Now apply it.
> **Context:** Strong MCQ scores in {category} — but no coding practice there yet. The next step is applying that knowledge in code.
> **Scientific basis:** The testing effect shows that retrieval practice (MCQ) builds strong conceptual knowledge — but procedural skill requires application practice in a different format.
> **Expandable:** Learning science distinguishes between declarative knowledge (knowing that something is true) and procedural knowledge (knowing how to do it). MCQ practice builds declarative knowledge efficiently. Coding exercises are required to develop procedural fluency. The two reinforce each other — conceptual understanding improves problem decomposition; coding practice deepens conceptual understanding. Your profile currently has the first without the second.
> **CTA:** Apply {category} in code →

**Template C**
> **Headline:** You've been coding — your conceptual foundation needs the same attention.
> **Context:** More coding sessions than MCQ recently. A conceptual retrieval session on {category} would reinforce and deepen what your coding practice built.
> **Scientific basis:** Application without conceptual grounding can produce brittle skills — effective in familiar contexts but fragile under novel problems or interview pressure.
> **Expandable:** Research on transfer of learning shows that skills developed purely through procedural practice do not transfer well to new contexts. Conceptual knowledge — the why behind the how — is what enables flexible application. MCQ practice tests and strengthens exactly that conceptual layer, making your coding skills more adaptable and more robust.
> **CTA:** Reinforce {category} with MCQ →

**Template D**
> **Headline:** Variety in practice is not optional — it's how retention works.
> **Context:** Your recent sessions have all been {dominantMode}. The research is clear: mixing practice types is more effective than repeating the same format.
> **Scientific basis:** Interleaved practice produces better long-term retention and transfer than blocked practice, even though blocked practice feels more productive in the moment.
> **Expandable:** This is one of the most striking findings in cognitive psychology because it is so counterintuitive. Students who interleave practice types consistently outperform those who block by format on delayed tests, despite the fact that blocked practice feels more fluent during the practice itself. The difficulty of switching modes is the mechanism — not a problem to avoid.
> **CTA:** Switch mode →

**Template E**
> **Headline:** {ratio}x {dominantMode} — your practice needs a counterpart.
> **Context:** A strong {dominantMode} record. Now the data says adding {otherMode} will compound those gains rather than duplicate them.
> **Scientific basis:** Deliberate practice in complementary formats is more than twice as effective as the same time in a single format, due to the interleaving and transfer effects.
> **Expandable:** Think of MCQ and coding as two sides of the same skill — conceptual retrieval and procedural application. Strong MCQ performance tells you what you know. Coding performance tells you what you can do with it. The gap between those two measures is one of the most useful diagnostics for identifying where knowledge is theoretical versus genuinely usable. Switching modes now closes that gap.
> **CTA:** Balance your practice →

---

### TYPE 7 — Stretch

**Template A**
> **Headline:** You're ready for something new — {newCategory} is your next step.
> **Context:** Your {currentCategory} work has built a strong foundation. {newCategory} shares the same core mental models and is the logical next challenge.
> **Scientific basis:** Transfer of learning — the application of knowledge from one domain to a related one — is accelerated when the transition is timed to coincide with consolidation of the prior domain.
> **Expandable:** Learning science research on skill transfer shows that the optimal moment to introduce a related skill is when the foundational skill is consolidated but not over-practiced. Your {currentCategory} progression ring is full — this is exactly that moment. Starting {newCategory} now means your {currentCategory} knowledge actively supports it rather than competing with it.
> **CTA:** Start {newCategory} →

**Template B**
> **Headline:** {currentCategory} is mastered. Here's the natural next challenge.
> **Context:** Your scores say you've genuinely consolidated {currentCategory}. {newCategory} is the closest step forward — familiar enough to start, challenging enough to grow.
> **Scientific basis:** The zone of proximal development for stretch goals: the most productive next challenge is adjacent to current competency, not distant from it.
> **Expandable:** Choosing a stretch goal that is too distant from current knowledge produces frustration and slow progress. Choosing one that shares conceptual foundations with what you already know produces rapid early progress, which sustains motivation through the harder later stages. {newCategory} is exactly the right distance from {currentCategory}.
> **CTA:** Stretch to {newCategory} →

**Template C**
> **Headline:** Your data suggests you're ready to broaden your range.
> **Context:** Strong performance in {currentCategory}. The next growth opportunity is trying {newCategory} — a logical extension of what you already know.
> **Scientific basis:** Expertise research shows that breadth of knowledge across related domains accelerates depth of understanding in each — categories are not isolated but mutually reinforcing.
> **Expandable:** Cognitive load theory explains why adjacent categories are easier to learn once a foundational category is consolidated: the mental schemas built for {currentCategory} provide scaffolding for {newCategory}. You are not starting from zero — your existing knowledge actively supports the new learning.
> **CTA:** Expand into {newCategory} →

**Template D**
> **Headline:** Ready for a new challenge? {newCategory} is waiting.
> **Context:** You've done the work on {currentCategory}. Your profile says this is the right moment to add a new dimension.
> **Scientific basis:** Varied practice across related domains produces more robust overall competency than deep single-domain practice alone.
> **Expandable:** The analogy from sport is useful: a tennis player who only ever practices their serve develops a one-dimensional game that opponents learn to counter. Breadth of competency across related skills produces more adaptable, more resilient overall performance. The same principle applies in programming — broad category coverage produces transferable problem-solving ability.
> **CTA:** Try {newCategory} →

---

### TYPE 8 — Milestone celebration

**Template A (first session ever)**
> **Headline:** First session complete. That's the hardest one.
> **Context:** Research consistently shows that starting is the biggest barrier to any new learning habit. You've cleared it.
> **Scientific basis:** Habit formation research shows that the first instance of a new behaviour is disproportionately predictive of long-term continuation.
> **Expandable:** BJ Fogg's behaviour model and James Clear's habit research both converge on the same finding: the first action is the barrier, not the motivation. Motivation follows action — not the other way around. Your first session has created a small neural pattern that the next session will reinforce. The third session is measurably easier than the first.
> **CTA:** Build on it →

**Template B (first category to Intermediate)**
> **Headline:** {category} — Basic level earned. You've reached Intermediate.
> **Context:** Consistent performance above the threshold has moved you to the next level. Your progression ring confirmed it.
> **Scientific basis:** Advancement to a higher difficulty level is the clearest signal of genuine skill consolidation — not just repeated exposure.
> **CTA:** Continue at Intermediate →

**Template C (10 sessions)**
> **Headline:** 10 sessions. The habit is forming.
> **Context:** Habit research suggests 10 consistent repetitions begins to establish an automatic behaviour pattern. You're at that threshold.
> **Scientific basis:** Repeated behaviour at consistent intervals creates neural pathway reinforcement — at 10 sessions, the return becomes meaningfully easier than it was at session one.
> **CTA:** Keep the momentum →

**Template D (first consistent week)**
> **Headline:** A full week of practice. Exactly what the spacing research prescribes.
> **Context:** Distributed practice across a week produces measurably better retention than the same number of sessions in one or two days.
> **Scientific basis:** The spacing effect is one of the most replicated findings in cognitive science — distributed practice produces 10–30% better long-term retention than massed practice.
> **CTA:** Start week two →

---

### TYPE 9 — Recovery

**Template A**
> **Headline:** That session was a tough one — and that's useful information.
> **Context:** Your {category} score was {gap}% below your average. A poor session is the most diagnostic thing that can happen in deliberate practice.
> **Scientific basis:** Errors in deliberate practice are not failures — they are the highest-information events in the learning process, pinpointing exactly where effort needs to go.
> **Expandable:** Anders Ericsson's research on deliberate practice emphasises that errors are the mechanism of improvement, not evidence of its absence. A session where you scored well on things you already knew produced less learning than this one. The question now is how to act on the information — and that is exactly what the next recommended session is designed to do.
> **CTA:** Act on what this session revealed →

**Template B**
> **Headline:** Below your average in {category}. Here's the right response.
> **Context:** {score}% vs your usual {average}% in {category}. This gap tells us something specific — let's address it directly.
> **Scientific basis:** Immediate error correction is more effective than deferred correction — acting on a poor session within the next 24–48 hours produces the strongest recovery.
> **Expandable:** Memory reconsolidation research shows that the period immediately after a retrieval failure is a particularly effective window for correction. The memory trace that produced the error is temporarily unstable — new information provided during this window integrates more strongly than it would at other times. This is the biological basis for why immediate recovery sessions are more effective than waiting.
> **CTA:** Recovery session — {category} →

**Template C**
> **Headline:** Your {category} score dropped. Let's find out why.
> **Context:** A {gap}% drop below your average is a signal worth acting on — not a reason to worry, but a reason to look more carefully at what this session revealed.
> **Scientific basis:** Targeted error analysis followed by focused retrieval practice is the most efficient correction mechanism available in deliberate practice.
> **Expandable:** The specific questions you struggled with in that session are now the highest-priority items for your next session. Codivium has identified the categories within {category} where the errors clustered. Addressing those specifically — rather than repeating the full category — is the most efficient path to recovery.
> **CTA:** Targeted recovery →

---

## 9. Continuity record schema

Stored per user as a lightweight JSON object. Updated on each adaptive page visit.

```json
{
  "lastVisit":              "ISO 8601 timestamp",
  "lastRecommendationType": "weakness_spotlight",
  "lastTemplatIndices": {
    "weakness_spotlight":  2,
    "spaced_review":       0,
    "re_entry":            4
  },
  "selectedRecommendationType": "primary | reinforcement | stretch",
  "onboardingAnswers": {
    "goal":         "interview | improvement | explore",
    "level":        "beginner | comfortable | advanced",
    "timeAvailable":"short | medium | long"
  }
}
```

---

## 10. Pending items added by Phase A

| ID | Item | File | Priority |
|---|---|---|---|
| P-INF-01 | ~~MCQ URL parameter pre-seeding~~ | ✓ Done — `readUrlParams()` + `applyUrlParams()` in `mcq-parent.js` | — |
| FE-08 | ~~Record `questionRenderedAt`; compute `responseTimeSeconds`~~ | ✓ Done — in `renderQuestion()` and `state.answers.push()` | — |
| AD-01 | ~~Session quality thresholds~~ | ✓ Done — `AP_CONFIG.sessionQuality` in `adaptive-practice.js` | — |
| AD-02 | ~~Progression ring drain rate calibration~~ | ✓ Done — `AP_CONFIG.ring` in `adaptive-practice.js` | — |
| AD-03 | ~~`subCategoryOf` field~~ | ✓ Resolved — `SubCategory` already exists on exercises; backend derives relationships from exercise history; no separate taxonomy field needed | — |
| AD-04 | ~~Immediate right/wrong MCQ feedback~~ | ✓ Done — 2400ms reveal with reduced-motion fallback | — |
| AD-05 | ~~`responseTimeSeconds` in MCQ session result payload~~ | ✓ Done — computed per answer in `mcq-quiz.js` | — |
| AD-06 | Milestone celebration content and trigger logic | `adaptive-practice.html` | Phase B |
| AD-07 | Recovery recommendation trigger and copy | `adaptive-practice.html` | Phase B |
| AD-08 | Continuity record API (`GET`/`POST /api/user/adaptive-state`) | Backend | Phase C |
