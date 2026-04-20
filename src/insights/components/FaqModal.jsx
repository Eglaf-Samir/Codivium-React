// src/insights/components/FaqModal.jsx
import React from 'react';

export default function FaqModal({ open, onClose }) {
  if (!open) return null;
  return <div dangerouslySetInnerHTML={{__html: FAQ_HTML}} />;
}

const FAQ_HTML = `<div aria-labelledby="cvFaqTitle" aria-modal="true" class="cvHelpModal" id="cvFaqModal" role="dialog">
<div class="cvHelpWindow cvHelpDoc" tabindex="-1">
<button aria-label="Close Dashboard FAQ" class="cvHelpCloseBtn" data-close-modal="cvFaqModal" type="button">Close</button>
<div class="wrap">
<header>
<h1 id="cvFaqTitle">Dashboard FAQ</h1>
<p class="sub">How to use the Performance Insights Dashboard, what it covers, and how to interpret every metric.</p><p class="sub sub-spacer">
<a class="cvHelpLink" href="/docs/scoring_how_it_works.html" rel="noopener noreferrer" target="_blank">How your scores are calculated</a>
</p>
</header>
<section aria-label="Dashboard FAQ grouped" class="faq-groups">
<!-- Group: How exercises work -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<svg viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 14v-4m0-4h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
</div>
<div class="group-title">
<strong>How exercises work</strong>
<span>The attempt-first system, locks, and how to use hints effectively</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details>
<summary>
<div class="q">How does the attempt-first system work?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a"><p>When you open a coding exercise, <strong>hints, the mini tutorial, the suggested solution, and the unit tests</strong> are temporarily locked. This is intentional — it is the core of how Codivium builds durable skill.</p>
<p>The research behind this is well established: if you look at the answer before you have genuinely attempted the problem, you learn pattern-matching rather than problem-solving. The struggle — even if you do not succeed — is what makes the eventual explanation or solution stick.</p>
<p>Each lock has a timer and a submission count. Both count towards unlocking — whichever comes first. You can also choose to unlock early at any time; the lock is a nudge, not a barrier.</p></div></div>
</details>
<details>
<summary>
<div class="q">Why are unit tests locked until after my first submission?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a"><p>Unit tests are hidden until you make your first submission so that you encounter <strong>real test output</strong> rather than inspecting the tests in advance and writing code that targets them directly.</p>
<p>Reading unit tests before attempting the problem teaches you to reverse-engineer from expected outputs rather than reason from the problem statement. Seeing your own output fail — and then working out why — is a stronger learning signal than pre-loading what the tests expect.</p>
<p>After your first submission the tests are visible for the rest of the session.</p></div></div>
</details>
<details>
<summary>
<div class="q">Can I unlock hints early?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a"><p>Yes. Every locked resource has an <strong>"Unlock now"</strong> option in the lock notice. Clicking it unlocks that resource immediately regardless of time or submission count.</p>
<p>The locks are designed as a nudge to encourage a genuine attempt first — they are not a hard barrier. Using early unlock occasionally is fine. Using it as a default on every exercise will slow your development of independent problem-solving instinct, which is what Codivium is designed to build.</p></div></div>
</details>
<details>
<summary>
<div class="q">Why does the suggested solution take longer to unlock than hints?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a"><p>The unlock thresholds are calibrated to the value of each resource at different stages of an attempt:</p>
<ul>
<li><strong>Hints</strong> unlock after 2 minutes or 2 submissions — early enough to provide direction without replacing the initial thinking.</li>
<li><strong>Mini tutorial</strong> unlocks after 4 minutes or 3 submissions — once you have a rough idea of the approach but may need conceptual support.</li>
<li><strong>Suggested solution</strong> unlocks after 7 minutes or 5 submissions — only after you have made a serious attempt. Seeing the solution too early turns a practice session into a reading exercise.</li>
</ul>
<p>The suggested solution is the most powerful resource on the page and also the most easily misused. The longer lock creates the conditions where reading it actually produces learning.</p></div></div>
</details>
</div>
</details>

<!-- Group -1: Getting started -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<!-- Compass / guide icon -->
<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm3.8 6.2-1.9 6.7a1 1 0 0 1-.7.7l-6.7 1.9a.5.5 0 0 1-.6-.6l1.9-6.7a1 1 0 0 1 .7-.7l6.7-1.9a.5.5 0 0 1 .6.6ZM10 10l-1.1 3.9L12.8 13 14 9.1 10 10Z" fill="currentColor"></path></svg>
</div>
<div class="group-title">
<strong>Getting started</strong>
<span>What the dashboard is, how to use it, and whether you need it</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details>
<summary>
<div class="q">What is the dashboard and what is its purpose?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a"></div></div>
</details>
<details>
<summary>
<div class="q">How do I use the dashboard?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a"></div></div>
</details>
<details>
<summary>
<div class="q">Can I use Codivium without using the dashboard?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a"></div></div>
</details>
</div>
</details>
<!-- Group 0: Scoring System (KaTeX) -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm1 15h-2v-2h2v2Zm1.4-7.7-.9.9c-.7.7-1 1.2-1 2.8h-2v-.5c0-1.1.3-2.1 1.1-2.9l1.2-1.2c.3-.3.5-.8.5-1.3a2 2 0 0 0-4 0H7a4 4 0 1 1 8 0c0 1-.4 1.9-1.6 3.1Z" fill="currentColor"></path></svg>
</div>
<div class="group-title">
<strong>Scoring System</strong>
<span>Codivium Score, Points, and Efficiency — what each one measures</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details>
<summary>
<div class="q">What are the three headline scoring readouts?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a">













</div></div>
</details>
</div>
</details>
<!-- Group 3: Breadth / Coverage -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<!-- Grid -->
<svg viewBox="0 0 24 24">
<path d="M4 4h7v7H4z"></path>
<path d="M13 4h7v7h-7z"></path>
<path d="M4 13h7v7H4z"></path>
<path d="M13 13h7v7h-7z"></path>
</svg>
</div>
<div class="group-title">
<strong>Breadth (Coverage)</strong>
<span>What coverage means, what drives it, and what the bands represent</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details>
<summary>
<div class="q">What does “Breadth / Coverage” mean?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a">



</div></div>
</details>


<details>
<summary>
<div class="q">What are the breadth bands?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a">


</div></div>
</details>
</div>
</details>
<!-- Group 4: Depth by category -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<!-- Layers -->
<svg viewBox="0 0 24 24">
<path d="M12 2l9 5-9 5-9-5 9-5z"></path>
<path d="M3 12l9 5 9-5"></path>
<path d="M3 17l9 5 9-5"></path>
</svg>
</div>
<div class="group-title">
<strong>Depth by category</strong>
<span>What depth means, how the bands work, and how to interpret your depth chart</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details>
<summary>
<div class="q">What does “Depth” mean?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a">


</div></div>
</details>

<details>
<summary>
<div class="q">What are the depth bands (Emerging / Building / Focus)?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a">



</div></div>
</details>
<details>
<summary>
<div class="q">What is “concentration” in depth?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a">



</div></div>
</details>
<details>
<summary>
<div class="q">How are depth outliers detected (median + MAD)?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a">




</div></div>
</details>
</div>
</details>
<!-- Group 5: Convergence heatmap -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<!-- Trending up -->
<svg viewBox="0 0 24 24">
<path d="M3 17l6-6 4 4 7-7"></path>
<path d="M14 8h6v6"></path>
</svg>
</div>
<div class="group-title">
<strong>Convergence heatmap</strong>
<span>What A1–A5 mean and how to read convergence speed</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details>
<summary>
<div class="q">What is the convergence heatmap showing?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a">


</div></div>
</details>

</div>
</details>
<!-- Group 6: Time & ranges -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<!-- Clock -->
<svg viewBox="0 0 24 24">
<circle cx="12" cy="12" r="9"></circle>
<path d="M12 7v6l4 2"></path>
</svg>
</div>
<div class="group-title">
<strong>Time, ranges, and aggregation</strong>
<span>7D/30D/90D/YTD and Daily/Weekly</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details>
<summary>
<div class="q">What does “Time on platform” include?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a">


</div></div>
</details>
<details>
<summary>
<div class="q">What do 7D/30D/90D/YTD and Daily/Weekly mean?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a">


</div></div>
</details>
<details>
<summary>
<div class="q">What does “Exercise time by category” include?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a">



</div></div>
</details>
</div>
</details>
<!-- Group 7: MCQ interpretation -->
<details class="group">
<summary>
<div aria-hidden="true" class="group-icon">
<!-- Checklist -->
<svg viewBox="0 0 24 24">
<path d="M9 6h11"></path>
<path d="M9 12h11"></path>
<path d="M9 18h11"></path>
<path d="M4 6l1 1 2-2"></path>
<path d="M4 12l1 1 2-2"></path>
<path d="M4 18l1 1 2-2"></path>
</svg>
</div>
<div class="group-title">
<strong>MCQ diagnostics</strong>
<span>How to interpret Weighted MCQ Score and MCQ charts</span>
</div>
<div aria-hidden="true" class="group-chevron"></div>
</summary>
<div class="faq">
<details>
<summary>
<div class="q">What is “Weighted MCQ Score” and what are its bands?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a">




</div></div>
</details>
<details>
<summary>
<div class="q">What does “n” mean in the MCQ analysis?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a">



</div></div>
</details>
<details>
<summary>
<div class="q">What is a “difficulty cliff”?</div>
<div aria-hidden="true" class="chev"></div>
</summary>
<div class="answer"><div class="a">


</div></div>
</details>
</div>
</details>
</section>
<div class="footer-bar">
        If anything in the analysis feels unclear: open the Glossary, then return to the dashboard and re-read the metric explanation.
      </div>
</div>
</div>
</div>`;
