import React, { useEffect, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  List,
  BlockQuote,
  Heading,
  CodeBlock,
  Table,
  TableToolbar,
  Undo,
  Autoformat,
  HorizontalLine,
  RemoveFormat,
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';

/**
 * Codivium-themed wrapper around CKEditor 5 ClassicEditor, used for admin
 * rich text fields (instructions, hints, MCQ question, etc.). Source uses
 * CKEditor; we keep the same editor with our dark-theme styling layered on.
 */
const PLUGINS = [
  Essentials,
  Paragraph,
  Heading,
  Autoformat,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  List,
  BlockQuote,
  CodeBlock,
  HorizontalLine,
  RemoveFormat,
  Table,
  TableToolbar,
  Undo,
];

const TOOLBAR = [
  'undo', 'redo', '|',
  'heading', '|',
  'bold', 'italic', 'underline', 'strikethrough', 'code', 'removeFormat', '|',
  'link', 'bulletedList', 'numberedList', 'blockQuote', 'codeBlock', '|',
  'insertTable', 'horizontalLine',
];

export default function AdminRichEditor({ value, onChange, placeholder = '' }) {
  // CKEditor must run client-side; the React wrapper already handles SSR,
  // but we also defer the first render so any global theme-flash logic has
  // settled before the editor mounts.
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  if (!ready) {
    return (
      <div className="cv-admin-rich-editor cv-admin-rich-editor--loading">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="cv-admin-rich-editor">
      <CKEditor
        editor={ClassicEditor}
        data={value || ''}
        config={{
          licenseKey: 'GPL',
          plugins: PLUGINS,
          toolbar: TOOLBAR,
          placeholder,
          heading: {
            options: [
              { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
              { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
              { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
            ],
          },
          table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
          },
        }}
        onChange={(_event, editor) => {
          onChange?.(editor.getData());
        }}
      />
    </div>
  );
}
