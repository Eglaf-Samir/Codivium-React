# Program.cs — Detail Reference

## What it is
ASP.NET Core minimal API application entry point.
Registers services, middleware, and maps all HTTP endpoints.

## What it registers
- Response compression (Brotli + GZip)
- Memory cache
- JWT Bearer authentication (configure issuer/audience for your auth provider)
- CORS policy
- IRawDataProvider → DemoRawDataProvider (replace for production)
- IUserContext → UserContext
- ICodiviumClock → SystemCodiviumClock
- ICodiviumDashboardUiPrefsStore → InMemoryDashboardUiPrefsStore (replace for production)

## Endpoints registered
- CodiviumAdaptiveEndpoints.Map(app) — GET/POST /api/user/adaptive-state
- CodiviumMcqApiEndpoints.Map(app) — GET /api/mcq/categories, GET /api/mcq/questions, POST /api/mcq/results
- GET /api/dashboard/payload — TO BE ADDED (see integration reports)
- POST /api/sessions/start — TO BE ADDED

## Startup validation
Calls CodiviumConfigValidation.ValidateOrThrow(config) before serving requests.

## Limitations
- DemoRawDataProvider and InMemoryDashboardUiPrefsStore are stubs — replace for production
- JWT issuer/audience must be configured via appsettings.json
- /api/dashboard/payload endpoint not yet wired
