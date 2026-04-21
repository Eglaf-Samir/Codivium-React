import React from 'react';
import { createPortal } from 'react-dom';
import { VIDEO_CONTENT } from './tourSteps.js';

export default function TourVideoModal({ videoKey, onClose }) {
  if (!videoKey) return null;
  const text = VIDEO_CONTENT[videoKey] || 'Video content coming soon';

  return createPortal(
    <div className="cvt-video-modal open" id="cvtVideoModal">
      <div className="cvt-video-player">
        <div id="cvtVideoFrame" style={{
          width: '100%', aspectRatio: '16/9', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 32,
          boxSizing: 'border-box', background: 'var(--color-bg-surface-2,#0a0a0c)',
          fontSize: 15, lineHeight: 1.7,
          color: 'var(--color-text-secondary,rgba(245,245,252,0.8))',
          textAlign: 'center', whiteSpace: 'pre-line',
        }}>
          {text}
        </div>
      </div>
      <button className="cvt-video-close" id="cvtVideoClose"
        type="button" aria-label="Close video" onClick={onClose}>✕</button>
    </div>,
    document.body
  );
}
