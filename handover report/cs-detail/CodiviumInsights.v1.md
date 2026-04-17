# CodiviumInsights.v1.cs — Detail Reference

## What it is
Generates all structured insight text for the Performance Insights info pane.
The largest single backend file (85KB). Entirely self-contained — no external calls.

## Entry Point
```csharp
Dictionary<string,Insight> CodiviumInsights.Build(
    KatexAllResults            scores,
    CodiviumScoring.ScoringConfig config
)
```

## Input
| Parameter | Type | Notes |
|---|---|---|
| scores | KatexAllResults | Output of CodiviumKatexScoring.ComputeAll() |
| config | ScoringConfig | Band thresholds and evidence thresholds from scoring-config.v1.json |

## Output: Dictionary<string, Insight>
One entry per insight key. Each Insight has:
- title: string
- summary: string (one-line summary shown in collapsed state)
- sections: Section[] (heading + blocks of bullets/paragraphs)
- meta: object (empty by default)

### Insight keys produced
| Key | Panel |
|---|---|
| breadthScore | Overall breadth |
| microBreadthScore | Micro track breadth |
| interviewBreadthScore | Interview track breadth |
| mcqBreadthScore | MCQ breadth |
| panel_scores | Scores panel overview |
| codiviumScore | Master score explanation |
| medianTimeToAC | Efficiency: median time |
| avgAttemptsToAC | Efficiency: average attempts |
| firstTryPassRate | Efficiency: first-try rate |

## Content logic
Each insight evaluates the relevant metric against band thresholds from ScoringConfig,
selects the appropriate band label and explanation, lists coverage gaps for breadth metrics,
and generates recommended action bullets tailored to the user's current position.

## Used by
CodiviumDashboardPayloadV2Adapter.v1.cs (step 6 of Build pipeline)

## Limitations
- All insight text is English only
- Coverage gap lists reference the category catalog from ScoringConfig — must be current
- Deterministic given same inputs — no randomisation or A/B variation
