# Operational Readiness Checklist (SaaS)

## Observability
- [ ] Client-side error capture wired to your telemetry (Sentry/Datadog/etc.)
- [ ] Key API endpoints have request IDs and structured logs
- [ ] Dashboards: error rate, latency, p95/p99, timeouts

## Security
- [ ] Strict CSP deployed for dashboard pages
- [ ] Clickjacking protection (`frame-ancestors`)
- [ ] CSRF protections for state-changing endpoints
- [ ] Rate limits for session start / payload endpoints
- [ ] Secrets stored in a secret manager; rotation plan exists

## Reliability
- [ ] Blue/green or canary releases for frontend changes
- [ ] Rollback procedure documented and tested
- [ ] Static asset caching strategy verified

## Data protection
- [ ] Backups configured and restore test performed
- [ ] Audit logs for login/subscription/admin actions
