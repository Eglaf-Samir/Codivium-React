// utils/templates.js
// Copy template engine — identical to adaptive-practice.js TEMPLATES section.
// Any change here must be mirrored in adaptive-practice.js (or that file removed
// once the React conversion is complete).

// Track last-used variant per type to avoid repeating the same copy.
const _lastUsed = {};

export function pickTemplate(type) {
  const variants = TEMPLATES[type];
  if (!variants || !variants.length) return { headline: '', context: '', sci: '', sciLong: '', cta: '' };

  const last = _lastUsed[type] ?? -1;
  let idx;
  if (variants.length === 1) {
    idx = 0;
  } else {
    do {
      idx = Math.floor(Math.random() * variants.length);
    } while (idx === last);
  }
  _lastUsed[type] = idx;
  return { ...variants[idx] };
}

export function fillTemplate(tpl, vars) {
  if (!vars || !tpl) return tpl;
  const t = { ...tpl };
  Object.entries(vars).forEach(([k, v]) => {
    ['headline', 'context', 'cta'].forEach(field => {
      if (t[field]) t[field] = t[field].replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
  });
  return t;
}

// ── Templates ─────────────────────────────────────────────────────────────────
// Copied verbatim from adaptive-practice.js TEMPLATES constant.

export const TEMPLATES = {

  weakness_spotlight: [
    {
      headline: 'Your {category} knowledge has the most room to grow.',
      context:  "You're scoring {score}% on {category} — {gap} points below your average across all categories. That gap is where focused effort returns the most, right now.",
      sci:      'Deliberate practice produces the fastest improvement when effort targets the specific area of greatest weakness — not the areas already performing well.',
      sciLong:  "Ericsson's research on expert performance across domains consistently found that experts spend disproportionate time on their weakest areas, while non-experts gravitate toward what they already do well. Spending practice time on strengths feels productive but produces little measurable improvement.",
      cta:      'Work on {category} now',
    },
    {
      headline: 'The data is clear — {category} is your highest-leverage practice area.',
      context:  "You're scoring {score}% on {category} — {gap} points below your average. That gap is where your practice time returns the most.",
      sci:      "Spending practice time on strengths feels productive but produces little measurable improvement. The same time spent on weaknesses moves the needle significantly.",
      sciLong:  "This is one of the most counterintuitive findings in learning science — and one of the most robust. Practising what you're already good at is comfortable and feels effective, but the performance gains are marginal. The uncomfortable sessions on weaker material are the ones that produce growth.",
      cta:      'Close the {category} gap',
    },
    {
      headline: '{category} is pulling your overall score down.',
      context:  'A {gap}-point gap between your best and weakest categories is significant. Narrowing it is the most direct path to measurable overall improvement.',
      sci:      'The weakest link principle in skill development: overall performance is often limited more by the lowest area than by the average.',
      sciLong:  'In complex skill domains, performance under pressure often collapses to the weakest element. Addressing it now is both the most effective and the most strategically important move.',
      cta:      'Strengthen {category} now',
    },
    {
      headline: "One category is holding your profile back. Let's address it.",
      context:  "{category} at {score}% is your clearest opportunity. Your data says this is where to put your energy today.",
      sci:      'Deliberate practice is defined by its targeting — unfocused practice, however frequent, produces expertise more slowly than focused effort on identified gaps.',
      sciLong:  'The difference between deliberate practice and mere experience is specificity. Your Codivium data gives you exactly the specificity that deliberate practice requires.',
      cta:      'Practice {category}',
    },
  ],

  re_entry: [
    {
      headline: 'Welcome back — {n} days away. A short session now recovers what matters most.',
      context:  'The forgetting curve has been working since your last session. A targeted retrieval session on {category} now is the most efficient way to restore that knowledge.',
      sci:      'Retrieval practice at the point of near-forgetting produces significantly more durable memory than re-studying — even when retrieval feels harder.',
      sciLong:  'Ebbinghaus demonstrated in 1885, and hundreds of subsequent studies have confirmed, that memories weaken exponentially without retrieval practice. The good news: relearning after a gap is always faster than first learning. A short retrieval session now resets the decay clock.',
      cta:      'Start recovery session',
    },
    {
      headline: '{n} days away. Your best next move is a short retrieval session.',
      context:  'The categories you were working on have started to decay. The fastest way back is direct retrieval practice — not re-reading, not video, not notes.',
      sci:      'The testing effect: retrieval practice is consistently more effective than re-study for restoring decayed knowledge, even when retrieval feels harder.',
      sciLong:  "The cognitive effort of retrieval, even when you get answers wrong, produces stronger memory consolidation than passive re-exposure to the same material. Struggling to recall something is the mechanism, not a sign that the approach is wrong.",
      cta:      'Jump back in',
    },
    {
      headline: "Welcome back. Let's pick up where the data says matters most.",
      context:  'After {n} days, your {category} knowledge is most at risk. A focused session now stabilises it before the decay accelerates further.',
      sci:      'Spaced retrieval at this interval produces significantly stronger long-term retention — your absence has set up an optimal review moment.',
      sciLong:  'Spaced repetition systems deliberately schedule reviews at the point of maximum forgetting, because memory restoration at that point is more durable than reviewing earlier. Your absence has created exactly that window.',
      cta:      'Review {category}',
    },
    {
      headline: "It's been a while. One session will get you back on track.",
      context:  'Your last activity was {n} days ago. We\'ve identified the area most worth reinforcing right now.',
      sci:      'Consistent, distributed practice is dramatically more effective than massed practice — returning now maintains the spacing pattern that produces lasting retention.',
      sciLong:  "Research on distributed versus massed practice shows that spreading practice over time produces 10-30% better long-term retention than the same amount of practice in a single block. Every session you complete, however short, contributes to that distribution.",
      cta:      'Start a recovery session',
    },
    {
      headline: "Your knowledge is drifting — a short session fixes that.",
      context:  '{n} days without practice means {category} is now below your retention threshold.',
      sci:      'Memory is not static — it requires periodic retrieval to remain accessible. This is not a flaw; it is how human memory prioritises relevant knowledge.',
      sciLong:  'The neuroscience of memory consolidation shows that the hippocampus actively prunes memories that are not retrieved. Retrieval practice signals to the brain that this knowledge is worth keeping. A single session resets the decay clock.',
      cta:      'Reset your {category} score',
    },
  ],

  spaced_review: [
    {
      headline: '{category} is due for review — before it fades.',
      context:  "You haven't practised {category} in {n} days. Your correct answers from that session are starting to decay.",
      sci:      'The forgetting curve is predictable — retrieval at this point produces significantly stronger long-term retention than waiting longer or reviewing earlier.',
      sciLong:  'Spaced repetition systems deliberately time reviews at the point of near-forgetting. The cognitive effort of retrieval at that moment is the mechanism that strengthens the memory trace. This is the optimal review window for your {category} knowledge.',
      cta:      'Review {category} now',
    },
    {
      headline: 'You built solid {category} knowledge {n} days ago. Lock it in.',
      context:  'Without a review session now, that knowledge will continue to decay. A short retrieval session at this point is the most efficient thing you can do.',
      sci:      'Memories reviewed at spaced intervals are retained significantly longer than those reviewed immediately or never reviewed at all.',
      sciLong:  'The spacing effect: a review session today extends the next decay interval, meaning you will need to review less frequently in future. Each spaced review makes the knowledge progressively more durable.',
      cta:      'Reinforce {category}',
    },
    {
      headline: 'This is the right moment to review {category}.',
      context:  'Not too early, not too late — {n} days is the optimal review interval for knowledge at your level. This session will extend your retention by weeks.',
      sci:      'Reviewing at the optimal spacing interval — just before significant forgetting occurs — produces more durable memory than reviewing more or less frequently.',
      sciLong:  "Research shows the same total study time produces dramatically different retention depending on how it is distributed. Reviews at the right intervals are worth three to four times as many reviews at arbitrary intervals.",
      cta:      'Review {category} at the right time',
    },
    {
      headline: "Don't let {category} slip — a 10-minute review protects weeks of work.",
      context:  'You invested time building your {category} knowledge. A short retrieval session now prevents that investment from decaying.',
      sci:      'Each successful retrieval at the right interval extends the next forgetting boundary — consistent spaced review produces near-permanent retention.',
      sciLong:  "Knowledge reviewed on a spaced schedule becomes progressively easier to recall and increasingly resistant to forgetting. Skipping a review window does not just cost today's retention; it pushes the fluency endpoint further away.",
      cta:      'Protect your {category} knowledge',
    },
  ],

  difficulty_progression: [
    {
      headline: "You're ready for the next level in {category}.",
      context:  "You've averaged {score}% on {difficulty} {category} across your last {n} sessions. The data says you're ready for {nextDifficulty}.",
      sci:      "The zone of proximal development: the optimal learning zone is just beyond current capability — challenging enough to require effort, achievable enough to prevent frustration.",
      sciLong:  "Vygotsky's ZPD and Csikszentmihalyi's flow state research both converge on this: optimal engagement and learning happen at the boundary of current competence. Staying at the current level now would produce comfort but not growth.",
      cta:      'Try {nextDifficulty} {category}',
    },
    {
      headline: '{difficulty} {category} is no longer your challenge. {nextDifficulty} is.',
      context:  "Consistent performance above {score}% means you've consolidated this level. The most productive next step is moving up.",
      sci:      'Once a skill is consolidated at a given difficulty, further practice at that level produces comfort but not growth — the challenge must increase to maintain the learning effect.',
      sciLong:  'Flow state research shows that engagement peaks when challenge slightly exceeds skill. Below that threshold is boredom; above it is anxiety. Your current {difficulty} {category} score places you in the boredom zone — {nextDifficulty} is where the optimal engagement window is.',
      cta:      'Level up in {category}',
    },
    {
      headline: 'Your {category} score says you\'re ready to be challenged more.',
      context:  '{score}% over {n} sessions at {difficulty} is a strong signal. Staying here longer would slow your progress rather than accelerate it.',
      sci:      "Deliberate practice requires that difficulty is continuously calibrated to the learner's current level — practice that is too easy produces no improvement.",
      sciLong:  "This is one of the most important and least intuitive principles of deliberate practice. Most learners stay in the comfortable zone — repeating what they already know. Expert performers consistently seek out the uncomfortable edge. Your data says the edge has moved.",
      cta:      'Advance to {nextDifficulty}',
    },
    {
      headline: 'Well done on {difficulty} {category}. Here\'s what comes next.',
      context:  "Your average score of {score}% over the last {n} sessions confirms you've genuinely consolidated this level — not just got lucky.",
      sci:      'Genuine consolidation — consistent high performance rather than a single good session — is the right threshold for advancement, and that is exactly what your data shows.',
      sciLong:  'The distinction between a good session and genuine consolidation matters enormously. A single 90% score could be luck; an average above {score}% across {n} sessions is evidence of real competency. Advancing too early is as counterproductive as advancing too late.',
      cta:      'Move to {nextDifficulty}',
    },
  ],

  mode_switch: [
    {
      headline: 'Your practice has been {dominantMode}-heavy. Time to balance it.',
      context:  '{ratio}x more {dominantMode} than {otherMode} over your last {n} sessions. Adding {otherMode} now will consolidate what your {dominantMode} sessions built.',
      sci:      'Interleaving different practice types produces better transfer and longer retention than blocked practice in one mode — even when blocked practice feels more productive.',
      sciLong:  'The interleaving effect is counterintuitive and well-evidenced. Mixing MCQ (conceptual retrieval) with coding (procedural application) produces better performance on both than doing them in separate blocks.',
      cta:      'Try {otherMode} in {category}',
    },
    {
      headline: 'You know the theory. Now apply it.',
      context:  'Strong MCQ scores in {category} — but no coding practice there yet. The next step is applying that knowledge in code.',
      sci:      'The testing effect shows that retrieval practice (MCQ) builds strong conceptual knowledge — but procedural skill requires application practice in a different format.',
      sciLong:  'Learning science distinguishes declarative knowledge (knowing that something is true) from procedural knowledge (knowing how to do it). MCQ practice builds declarative knowledge efficiently. Coding exercises are required to develop procedural fluency.',
      cta:      'Apply {category} in code',
    },
    {
      headline: "You've been coding — your conceptual foundation needs the same attention.",
      context:  'More coding sessions than MCQ recently. A conceptual retrieval session on {category} would reinforce and deepen what your coding practice built.',
      sci:      'Application without conceptual grounding can produce brittle skills — effective in familiar contexts but fragile under novel problems or interview pressure.',
      sciLong:  'Research on transfer of learning shows that skills developed purely through procedural practice do not transfer well to new contexts. Conceptual knowledge — the why behind the how — is what enables flexible application.',
      cta:      'Reinforce {category} with MCQ',
    },
    {
      headline: 'Variety in practice is not optional — it\'s how retention works.',
      context:  'Your recent sessions have all been {dominantMode}. The research is clear: mixing practice types is more effective than repeating the same format.',
      sci:      'Interleaved practice produces better long-term retention and transfer than blocked practice, even though blocked practice feels more productive in the moment.',
      sciLong:  'Students who interleave practice types consistently outperform those who block by format on delayed tests. The difficulty of switching modes is the mechanism — not a problem to avoid.',
      cta:      'Switch mode',
    },
  ],

  stretch: [
    {
      headline: "You're ready for something new — {newCategory} is your next step.",
      context:  'Your {currentCategory} work has built a strong foundation. {newCategory} shares the same core mental models and is the logical next challenge.',
      sci:      'Transfer of learning is accelerated when the transition is timed to coincide with consolidation of the prior domain.',
      sciLong:  'The optimal moment to introduce a related skill is when the foundational skill is consolidated but not over-practiced. Your {currentCategory} progression ring is full — this is exactly that moment. Starting {newCategory} now means your existing knowledge actively supports it.',
      cta:      'Start {newCategory}',
    },
    {
      headline: '{currentCategory} is mastered. Here\'s the natural next challenge.',
      context:  "Your scores say you've genuinely consolidated {currentCategory}. {newCategory} is the closest step forward — familiar enough to start, challenging enough to grow.",
      sci:      'The zone of proximal development for stretch goals: the most productive next challenge is adjacent to current competency, not distant from it.',
      sciLong:  'Choosing a stretch goal that shares conceptual foundations with what you already know produces rapid early progress, which sustains motivation through the harder later stages.',
      cta:      'Stretch to {newCategory}',
    },
    {
      headline: "Your data suggests you're ready to broaden your range.",
      context:  'Strong performance in {currentCategory}. The next growth opportunity is trying {newCategory} — a logical extension of what you already know.',
      sci:      'Expertise research shows that breadth of knowledge across related domains accelerates depth of understanding in each.',
      sciLong:  'Cognitive load theory explains why adjacent categories are easier to learn once a foundational category is consolidated: the mental schemas built for {currentCategory} provide scaffolding for {newCategory}. You are not starting from zero.',
      cta:      'Expand into {newCategory}',
    },
    {
      headline: 'Ready for a new challenge? {newCategory} is waiting.',
      context:  "You've done the work on {currentCategory}. Your profile says this is the right moment to add a new dimension.",
      sci:      'Varied practice across related domains produces more robust overall competency than deep single-domain practice alone.',
      sciLong:  'The analogy from sport: a tennis player who only practises their serve develops a one-dimensional game. Breadth of competency across related skills produces more adaptable, more resilient overall performance.',
      cta:      'Try {newCategory}',
    },
  ],

  milestone: [
    {
      headline: "First session complete. That's the hardest one.",
      context:  "Research consistently shows that starting is the biggest barrier to any new learning habit. You've cleared it.",
      sci:      'Habit formation research shows that the first instance of a new behaviour is disproportionately predictive of long-term continuation.',
      sciLong:  "Fogg's behaviour model and Clear's habit research both converge: the first action is the barrier, not the motivation. Motivation follows action — not the other way around.",
      cta:      'Build on it',
    },
    {
      headline: '{category} — {difficulty} level earned. Well done.',
      context:  'Consistent performance above the threshold has moved you to the next level. Your progression ring confirmed it.',
      sci:      'Advancement to a higher difficulty level is the clearest signal of genuine skill consolidation — not just repeated exposure.',
      sciLong:  "The distinction between genuine consolidation and repeated exposure matters: a user who answers the same easy questions 30 times has not consolidated the skill. Your rolling score confirmed genuine improvement across varied question sets.",
      cta:      'Continue at {nextDifficulty}',
    },
    {
      headline: '10 sessions. The habit is forming.',
      context:  'Habit research suggests 10 consistent repetitions begins to establish an automatic behaviour pattern. You\'re at that threshold.',
      sci:      'Repeated behaviour at consistent intervals creates neural pathway reinforcement — at 10 sessions, the return becomes meaningfully easier than it was at session one.',
      sciLong:  'The neuroscience of habit formation shows that repeated behaviour creates progressively stronger automatic associations. The activation energy required to start a session decreases measurably with each repetition.',
      cta:      'Keep the momentum',
    },
    {
      headline: 'A full week of practice. Exactly what the spacing research prescribes.',
      context:  'Distributed practice across a week produces measurably better retention than the same number of sessions in one or two days.',
      sci:      'The spacing effect is one of the most replicated findings in cognitive science — distributed practice produces 10-30% better long-term retention than massed practice.',
      sciLong:  'Seven days of distributed practice is not just better than one day of massed practice — it is dramatically better. The same total effort, applied with spacing, produces retention that persists for months rather than days.',
      cta:      'Start week two',
    },
  ],

  recovery: [
    {
      headline: "That session was a tough one — and that's useful information.",
      context:  'Your {category} score was {gap}% below your average. A poor session is the most diagnostic event in deliberate practice.',
      sci:      "Errors in deliberate practice are not failures — they are the highest-information events in the learning process, pinpointing exactly where effort needs to go.",
      sciLong:  "Ericsson's research on deliberate practice emphasises that errors are the mechanism of improvement, not evidence of its absence. A session where you struggled on weaknesses produced more learning signal than one where you scored well on things you already knew.",
      cta:      'Act on what this session revealed',
    },
    {
      headline: 'Below your average in {category}. Here\'s the right response.',
      context:  '{score}% vs your usual {average}% in {category}. This gap tells us something specific — let\'s address it directly.',
      sci:      "Immediate error correction is more effective than deferred correction — acting on a poor session within 24-48 hours produces the strongest recovery.",
      sciLong:  "Memory reconsolidation research shows that the period immediately after a retrieval failure is a particularly effective window for correction. The memory trace that produced the error is temporarily unstable — new information provided during this window integrates more strongly.",
      cta:      'Recovery session — {category}',
    },
    {
      headline: 'Your {category} score dropped. Let\'s find out why.',
      context:  "A {gap}% drop below your average is a signal worth acting on — not a reason to worry, but a reason to look more carefully.",
      sci:      'Targeted error analysis followed by focused retrieval practice is the most efficient correction mechanism in deliberate practice.',
      sciLong:  "The specific questions you struggled with in that session are now the highest-priority items for your next session. Addressing those specifically — rather than repeating the full category — is the most efficient path to recovery.",
      cta:      'Targeted recovery',
    },
  ],

  orientation: [
    {
      headline: "Let's find out exactly where to start.",
      context:  "You haven't completed any sessions yet — so we'll ask you three quick questions.",
      sci:      'Research shows that starting with a targeted first activity dramatically increases the chance of returning for a second session compared to browsing a menu.',
      sciLong:  '',
      cta:      'Start the quick diagnostic',
    },
  ],
};
