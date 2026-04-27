// components/ReplEditor.jsx
// Dedicated Ace editor for the REPL input.
//
// Why a separate component: the REPL needs to follow ONLY the REPL settings
// (cv_repl_syntax_theme, cv_repl_font_size, cv_repl_font_family). By tagging
// this slot with `variant="repl"`, the wrapper gets the `repl-shell` class
// instead of `editor-shell`, and the Ace token CSS overrides read from
// `--repl-syn-*` variables instead of `--syn-*`. This guarantees Code Editor
// settings can never paint into the REPL editor.
import { forwardRef } from 'react';
import EditorSlot from './EditorSlot.jsx';

const ReplEditor = forwardRef(function ReplEditor(props, ref) {
  return <EditorSlot {...props} ref={ref} variant="repl" />;
});

export default ReplEditor;
