// components/InfoRail.jsx
import React from 'react';

const INFO = {
  purpose: {
    title: 'What this is for',
    body: `<p>The Multiple-Choice Quizzes help you identify strengths and weaknesses in Python coding and programming.</p>
<p>The suggested approach: select a single difficulty level and go one topic at a time to identify your knowledge level.</p>
<p><b>When you're ready:</b> set your filters, then press <b>Start Quiz</b>.</p>`,
  },
  mode: {
    title: 'Simple vs Power Filter',
    body: `<p><b>Simple Filter</b> is a visual, low-noise way to choose categories using pills.</p>
<p><b>Power Filter</b> is fastest when you know what you want:</p>
<ul><li>Type to search.</li><li>Matching categories are highlighted.</li><li>Press <b>Enter</b> to select all matches.</li></ul>`,
  },
  category: {
    title: 'What is a category?',
    body: `<p><b>Categories</b> are the topics you'll be tested on (e.g. Data Types, Regular Expressions, Functions).</p>
<ul><li>Select <b>one</b> category to focus, or <b>multiple</b> to mix topics.</li><li><b>Select all</b> chooses every category.</li></ul>`,
  },
  selectedview: {
    title: 'All vs Selected (view) + Clear',
    body: `<p>The <b>All / Selected</b> switch is a <b>view filter</b> — it changes what you see, not what you've chosen.</p>
<ul><li><b>All</b> shows the full list.</li><li><b>Selected</b> shows only your choices — great for reviewing.</li></ul>
<p><b>Clear</b> removes all selected categories in one step.</p>`,
  },
  difficulty: {
    title: 'Difficulty levels',
    body: `<p>Choose the level that matches how challenging you want the quiz:</p>
<ul><li><b>Basic</b>: fundamentals and core concepts.</li><li><b>Intermediate</b>: multi-step reasoning and common patterns.</li><li><b>Advanced</b>: edge-cases and deeper understanding.</li></ul>`,
  },
  qcount: {
    title: 'Number of questions',
    body: `<p>Sets <b>how many questions</b> will be included in your quiz session.</p>
<ul><li>Use the slider to choose any value between <b>10</b> and <b>50</b>.</li><li>Use <b>Min</b> / <b>Max</b> for one-tap presets.</li></ul>`,
  },
  exclude: {
    title: 'Exclude previously-correct questions',
    body: `<p>If enabled, the quiz will <b>avoid questions you've previously answered correctly</b>.</p>
<p>This helps you spend more time on areas you still need to improve.</p>`,
  },
};

export default function InfoRail({ activeKey, onClear }) {
  const content = activeKey ? INFO[activeKey] : null;
  return (
    <div className="window-pad rail-pad">
      <div className="rail-head">
        <div className="rail-title" id="infoRailTitle">
          {content ? content.title : 'Info'}
        </div>
        <button className="rail-clear" id="infoRailClear" type="button"
          aria-label="Clear info" onClick={onClear}>×</button>
      </div>
      <div
        className="rail-body"
        id="infoRailBody"
        dangerouslySetInnerHTML={
          content
            ? { __html: content.body }
            : { __html: '<div class="rail-muted">Click an "i" to view a clear explanation.</div>' }
        }
      />
    </div>
  );
}
