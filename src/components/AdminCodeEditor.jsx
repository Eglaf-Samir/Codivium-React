import React from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import 'ace-builds/src-noconflict/ext-language_tools';

/**
 * Codivium-themed wrapper around react-ace, used for admin code fields
 * (suggested solution, manual suggested solution, code template, etc.).
 * Source uses Ace; we keep the same editor with a Codivium-styled border.
 */
export default function AdminCodeEditor({
  value,
  onChange,
  height = '260px',
  mode = 'python',
  theme = 'tomorrow_night',
  name,
  placeholder = '',
  readOnly = false,
}) {
  return (
    <div
      style={{
        border: '1px solid var(--color-border-default)',
        borderRadius: 10,
        overflow: 'hidden',
        background: '#1d1f21',
      }}
    >
      <AceEditor
        mode={mode}
        theme={theme}
        value={value || ''}
        placeholder={placeholder}
        onChange={onChange}
        name={name || `ace_${Math.random().toString(36).slice(2, 8)}`}
        editorProps={{ $blockScrolling: false }}
        width="100%"
        height={height}
        fontSize={13}
        readOnly={readOnly}
        showPrintMargin={false}
        setOptions={{
          useWorker: false,
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          tabSize: 4,
        }}
      />
    </div>
  );
}
