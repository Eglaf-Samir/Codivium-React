(function(){
  'use strict';

  // Minimal telemetry shim. Safe to ship even if no provider is configured.
  // Your application can override CodiviumInsights.sendTelemetry(event).
  // If Sentry is present, it will forward events automatically.
  var CI = window.CodiviumInsights = window.CodiviumInsights || {};

  function safe(fn){ try{ fn(); }catch(_e){} }

  function send(event){
    if (typeof CI.sendTelemetry === 'function') {
      safe(function(){ CI.sendTelemetry(event); });
      return;
    }

    if (window.Sentry && typeof window.Sentry.captureMessage === 'function') {
      safe(function(){
        if (event && event.type === 'error' && event.error) {
          window.Sentry.captureException(event.error);
        } else {
          window.Sentry.captureMessage(JSON.stringify(event));
        }
      });
    }
  }

  CI.telemetry = CI.telemetry || {};
  CI.telemetry.send = send;

  if (!CI.telemetry._hooksInstalled) {
    CI.telemetry._hooksInstalled = true;

    window.addEventListener('error', function(ev){
      send({
        type: 'error',
        message: ev && ev.message ? String(ev.message) : 'window.error',
        filename: ev && ev.filename ? String(ev.filename) : '',
        lineno: ev && typeof ev.lineno === 'number' ? ev.lineno : null,
        colno: ev && typeof ev.colno === 'number' ? ev.colno : null,
        error: ev && ev.error ? ev.error : null,
        ts: Date.now()
      });
    });

    window.addEventListener('unhandledrejection', function(ev){
      send({
        type: 'unhandledrejection',
        reason: ev && ev.reason ? ev.reason : null,
        ts: Date.now()
      });
    });
  }
})();
