// utils/renderContent.jsx
// Converts question text (markdown-ish with code fences and inline code) to React elements.
// Direct port of renderContent() + appendInlineText() + appendTextLines() from mcq-quiz.js

import React from 'react';

function parseInline(text) {
  // Split on `inline code` spans
  const parts = [];
  const re    = /`([^`]+)`/g;
  let last    = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      text.slice(last, m.index).split('\n').forEach((line, i, arr) => {
        parts.push(line);
        if (i < arr.length - 1) parts.push(<br key={`br-${last}-${i}`} />);
      });
    }
    parts.push(<code key={`ic-${m.index}`} className="quiz-inline-code">{m[1]}</code>);
    last = re.lastIndex;
  }
  if (last < text.length) {
    text.slice(last).split('\n').forEach((line, i, arr) => {
      parts.push(line);
      if (i < arr.length - 1) parts.push(<br key={`br-end-${i}`} />);
    });
  }
  return parts;
}

export default function renderContent(text) {
  if (!text) return null;

  const nodes  = [];
  const fenceRe = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0, m;
  let keyIdx = 0;

  while ((m = fenceRe.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(
        <span key={`t-${keyIdx++}`}>{parseInline(text.slice(last, m.index))}</span>
      );
    }
    nodes.push(
      <pre key={`pre-${keyIdx++}`} className="quiz-code-block">
        <code className={m[1] ? `language-${m[1]}` : undefined}>
          {m[2].trimEnd()}
        </code>
      </pre>
    );
    last = fenceRe.lastIndex;
  }

  if (last < text.length) {
    nodes.push(
      <span key={`t-${keyIdx++}`}>{parseInline(text.slice(last))}</span>
    );
  }

  return nodes.length === 1 ? nodes[0] : <>{nodes}</>;
}
