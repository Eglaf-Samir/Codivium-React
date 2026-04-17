# CodiviumAdaptiveEndpoints.cs — Detail Reference

## What it is
HTTP endpoint wrappers for the Adaptive Practice page. Two routes.
Delegates computation entirely to CodiviumAdaptiveEngine.Compute().

## Registration
```csharp
CodiviumAdaptiveEndpoints.Map(IEndpointRouteBuilder app)
```
Call once from Program.cs to register both routes.

## GET /api/user/adaptive-state

### Input
- JWT Bearer token (user identity via sub or NameIdentifier claim)
- Optional query param: ?track=micro (default) or ?track=interview

### What it does
1. Resolves userId from JWT
2. Calls IRawDataProvider.GetRawDataAsync(userId, now-365d, now)
3. Calls AdaptiveEngine.Compute(track, codingSessions, mcqAttempts, now)
4. Returns AdaptiveStateResponse (200), NotFound (404 for new user), or Problem (500)

### Output: AdaptiveStateResponse (200 OK)
Serialises AdaptiveEngineResult fields to camelCase JSON.
See contracts/adaptive-state-api.contract.md for the full field reference.

The response includes all 14 recommendation types evaluated in priority order.
The `primary` field is guaranteed non-null for returning users (P14 building_continue is the fallback).
The `categories[]` items now include: `track`, `diffFill`, `codingSessionCount`, `attempts[]`.

### Error responses
| Code | When | Frontend behaviour |
|---|---|---|
| 401 | No valid JWT | Redirect to login |
| 404 | IsNewUser=true | Show orientation mode |
| 500 | DB error | Fall back to orientation mode |

## POST /api/user/adaptive-state

### Input body
```json
{ "action": "recommendation_chosen", "recommendationType": "weakness_spotlight",
  "chosenAt": "ISO8601", "onboardingContext": null }
```

### What it does (TODO stubs)
- AD-POST-01: Persist recommendation type + timestamp to user continuity record
- AD-POST-02: Store onboardingContext if present (first session only)

### Output
204 No Content — always. Frontend ignores response.

## Dependencies (DI)
- IRawDataProvider — inject real DB implementation replacing DemoRawDataProvider
- JWT authentication middleware must be registered in Program.cs

## Limitations
- POST persistence stubs not yet implemented (TODOs in file)
- IRawDataProvider must be wired to real database
