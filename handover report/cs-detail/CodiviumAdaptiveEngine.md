# CodiviumAdaptiveEngine.cs — Detail Reference

## What it is
Complete 14-rule adaptive recommendation engine for the Adaptive Practice page.
Stateless — takes session history in, produces recommendation state out.
All recommendation logic lives here. No client-side rule evaluation is needed.

## Entry Point
```csharp
AdaptiveEngineResult AdaptiveEngine.Compute(
    string track,
    IReadOnlyList<CodiviumScoring.CodingSession> codingSessions,
    IReadOnlyList<CodiviumScoring.McqAttempt>    mcqAttempts,
    DateTimeOffset asOfUtc
)
```

## Input
| Parameter | Type | Notes |
|---|---|---|
| track | string | "micro" or "interview" — determines which coding session set is primary |
| codingSessions | CodingSession[] | 365-day window for the specified track |
| mcqAttempts | McqAttempt[] | 365-day window, all MCQ |
| asOfUtc | DateTimeOffset | Reference timestamp (use DateTimeOffset.UtcNow) |

## Output: AdaptiveEngineResult
| Field | Type | Notes |
|---|---|---|
| IsNewUser | bool | True → caller returns 404 → orientation mode |
| Mode | string | "orientation" / "building" / "full" |
| SessionCount | int | Total sessions across all tracks |
| LastSessionDaysAgo | int | Days since most recent session |
| LastSessionLabel | string | Human-readable: "yesterday", "3 days ago" |
| Categories | AdaptiveCategoryDto[] | Ring state per category — includes track, diffFill, codingSessionCount, attempts[] |
| Primary | AdaptivePrimaryDto? | Highest-priority recommendation (never null for returning users — P14 guarantees a result) |
| Alternatives | AdaptiveAlternativeDto[] | Up to 2 secondary recommendations |
| Milestone | AdaptiveMilestoneDto? | Null if no milestone fires |
| RecentSessions | AdaptiveRecentSessionDto[] | Last 5 sessions |
| SessionQuality | AdaptiveSessionQualityDto | AP-05 quality level: Foundation / Consolidation / Proficient / Fluent |

## Processing Steps
1. New-user detection (no sessions → IsNewUser=true → caller returns 404)
2. Mode calculation (totalSessions < 10 → "building", else "full")
3. Ring fill computation (correct/30 × 100, with grace period drain, RawFill stored pre-drain)
4. Ring state classification (ready / gap / draining / locked / normal)
5. Session quality evaluation — AP-05 model using peek rate + response time + score
6. Trigger evaluation — all 14 rules in priority order (see table below)
7. Milestone detection (first session / first ring / 10 sessions / first week)

## 14 Recommendation Types — Priority Order
| Priority | Type | Trigger condition | Data needed |
|---|---|---|---|
| P1 | `recovery` | Score drop ≥30% vs rolling average within 3 days | sessions |
| P2 | `abandonment_spotlight` | Exercise abandoned within 7 days | ring.Attempts (outcome="abandoned") ★ |
| P3 | `re_entry` | Absent ≥7 days | sessions, rings |
| P4 | `spaced_review` | ≥14 days since last correct, ≥5 correct | sessions, rings |
| P5 | `weakness_spotlight` | Gap ≥50pp across ≥3 categories with ≥5 questions each | sessions, rings |
| P6 | `coding_depth_gap` | Weakest coding ring ≥40pp behind strongest, ≥3 sessions each | ring.CodingSessionCount, ring.Fill |
| P7 | `difficulty_progression` | Ring full (rawFill ≥100%), rolling ≥70%, ≥3 sessions | rings |
| P8 | `coding_fluency` | Submissions/solve trending down over last 5 exercises | ring.Attempts ★ |
| P9 | `coding_near_complete` | Coding ring rawFill ≥80% and <100%, not locked | ring.RawFill, ring.CodingSessionCount |
| P10 | `coding_next_level` | Difficulty ring rawFill ≥100%, next difficulty not started | ring.RawFill |
| P11 | `mode_switch` | MCQ:coding ratio >1.5 over last 10 sessions | sessions |
| P12 | `stretch` | Overall score ≥65%, untouched category exists | sessions, rings |
| P13 | `difficulty_calibration` | One category averaging 2× more submissions than overall avg | ring.Attempts ★ |
| P14 | `building_continue` | **Always fires** — guaranteed fallback | sessions |

★ Requires ring.Attempts data (per-exercise outcome, submissions count, completion date).
  P2 additionally requires abandoned sessions — dormant until DB layer passes incomplete sessions.
  P8 and P13 need at least 5 accepted attempts per category.

## AdaptiveCategoryDto New Fields (added in this refactor)
| Field | Type | Notes |
|---|---|---|
| diffFill | int[3] | Raw fill % per difficulty [basic, inter, adv] before drain applied |
| track | string | "micro" / "interview" / "mcq" — which practice track this category belongs to |
| codingSessionCount | int | Total coding sessions completed in this category across all difficulties |
| attempts | AdaptiveAttemptDto[] | Per-exercise attempt history, newest first — exerciseId, outcome, submissionsCount, completedDate, difficulty |

## Used by
CodiviumAdaptiveEndpoints.cs → GetAdaptiveState()

## Limitations / Known Gaps
- `abandonment_spotlight` (P2) always returns null — requires abandoned/incomplete sessions to be passed to the engine. Current model only stores accepted solves.
- All thresholds are hardcoded constants in the class — not read from a config file.
- `CodingSession.SubCategory` must be populated at session storage time for stretch recommendations to use adjacency scoring; falls back to alphabetical order if absent.
- `POST /api/user/adaptive-state` persistence is still TODO in `CodiviumAdaptiveEndpoints.cs`.
