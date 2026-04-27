// components/HtmlPreview.jsx
// Renders HTML content inside an isolated iframe so author-supplied styles
// and scripts run without leaking into the host page. The iframe self-reports
// its scrollHeight via postMessage so we can grow it to fit content.
import React, { useEffect, useRef } from 'react';

export const HtmlPreview = ({ html }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    function onMessage(e) {
      if (typeof e.data === 'number' && iframeRef.current) {
        iframeRef.current.style.height = e.data + 'px';
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title="html-preview"
      style={{ width: '100%', border: 'none' }}
      scrolling="no"
      srcDoc={`
<!DOCTYPE html>
<html>
<head>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div id="root">
    ${html}
  </div>

  <script>
    function sendHeight(){
      parent.postMessage(
        document.body.scrollHeight,
        "*"
      );
    }

    window.addEventListener("load", sendHeight);
    window.addEventListener("resize", sendHeight);

    let last = 0;
    const obs = new MutationObserver(() => {
      const h = document.body.scrollHeight;
      if (h !== last) {
        last = h;
        parent.postMessage(h, "*");
      }
    });

    obs.observe(document.body, { childList: true, subtree: true });
  </script>
</body>
</html>
`}
    />
  );
};

export default HtmlPreview;
