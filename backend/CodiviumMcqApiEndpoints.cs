// CodiviumMcqApiEndpoints.cs
// Backend API endpoint stubs for the MCQ quiz pages.
// Implement these to wire mcq-parent.html and mcq-quiz.html to live data.
//
// See contracts/mcq-quiz-api.contract.md for the full specification.
// See backend/CodiviumMcq.cs for McqSessionResult and McqQuestionAnswer DTOs.
//
// Implementation notes:
//   BE-01: GET /api/mcq/categories  — reads from scoring config, no DB required
//   BE-02: GET /api/mcq/questions   — queries question DB, generates sessionId
//   BE-03: POST /api/mcq/results    — persists session + per-question records
//   BE-04: Auth                     — all endpoints require authenticated session

#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

public static class CodiviumMcqApiEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/mcq/categories",   GetCategories);
        app.MapGet("/api/mcq/questions",    GetQuestions);
        app.MapPost("/api/mcq/results",     PostResults);
    }

    // ── BE-01: GET /api/mcq/categories ─────────────────────────────────────
    // Returns the list of MCQ-eligible categories from the scoring config.
    // No database access needed — categories are defined in scoring-config.v1.json.
    //
    // Response: { "categories": [ { "id": "...", "displayName": "..." } ] }
    static async Task<IResult> GetCategories(
        // TODO: inject IUserSession or equivalent for auth guard
        HttpContext ctx,
        // TODO: inject IScoringConfigProvider or read config/scoring-config.v1.json
        CancellationToken ct)
    {
        // TODO BE-04: Require authenticated session
        // Uncomment when JWT middleware is registered in Program.cs:
        // if (!ctx.User.Identity?.IsAuthenticated ?? true) return Results.Unauthorized();

        // TODO BE-01: Read from CategoriesConfig.AvailableByTrack["mcq"]
        // For now: return hardcoded list matching the frontend fallback
        var categories = new[]
        {
            new { id = "data-types",          displayName = "Data Types & Data Structures" },
            new { id = "regular-expressions", displayName = "Regular Expressions" },
            new { id = "functions",           displayName = "Functions" },
            new { id = "performance",         displayName = "Performance" },
            new { id = "language-basics",     displayName = "Language Basics" },
            new { id = "object-orientation",  displayName = "Object Orientation" },
            new { id = "builtins",            displayName = "Builtins" },
        };

        return Results.Ok(new { categories });
    }

    // ── BE-02: GET /api/mcq/questions ──────────────────────────────────────
    // Returns a filtered, shuffled question set and a stable sessionId.
    //
    // Query params: categories (CSV), difficulty, count, skipCorrect (bool)
    // Response: { "sessionId": "uuid", "questions": [ { ...McqQuestion } ] }
    //
    // Question object schema (matches frontend expectation exactly):
    // {
    //   id:             string           — stable question identifier
    //   category:       string           — display name
    //   difficulty:     string           — basic | intermediate | advanced
    //   question:       string           — supports ```python fenced blocks
    //   options:        string[6]        — exactly 6 options, shuffled server-side
    //   correctIndices: int[]            — indices into shuffled options array
    //   explanation:    string           — shown in results review
    //   nanoTutorial:   string | null    — null = no Tutorial button
    // }
    static async Task<IResult> GetQuestions(
        HttpContext ctx,
        string? categories,
        string? difficulty,
        int? count,
        bool? skipCorrect,
        // TODO: inject IQuestionRepository
        // TODO: inject IUserSessionService for skipCorrect filtering
        CancellationToken ct)
    {
        // TODO BE-04: Require authenticated session
        // Uncomment when JWT middleware is registered in Program.cs:
        // if (!ctx.User.Identity?.IsAuthenticated ?? true) return Results.Unauthorized();

        // Validate parameters
        var diffVal = (difficulty ?? "basic").Trim().ToLowerInvariant();
        if (diffVal is not ("basic" or "intermediate" or "advanced"))
            return Results.BadRequest(new { error = "Invalid difficulty. Must be basic, intermediate, or advanced." });

        var countVal = Math.Clamp(count ?? 10, 1, 50);
        var catList  = (categories ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries)
                                          .Select(c => c.Trim())
                                          .Where(c => c.Length > 0)
                                          .ToList();
        var skipPrev = skipCorrect ?? false;

        // TODO BE-02: Query the question database
        // IReadOnlyList<McqQuestion> questions = await _questionRepo.GetQuestionsAsync(
        //     categories: catList,
        //     difficulty:  diffVal,
        //     count:       countVal,
        //     skipCorrect: skipPrev,
        //     userId:      GetUserId(ctx),
        //     ct:          ct);

        // TODO BE-02: Shuffle options per question and adjust correctIndices accordingly
        // (Server shuffles so that correctIndices always reflect the shuffled order)

        // Generate a stable session ID for this quiz attempt
        var sessionId = Guid.NewGuid().ToString("D");

        // TODO BE-02: Store sessionId → (userId, timestamp, filter params) in DB
        // so POST /api/mcq/results can validate the session

        // Stub: return empty for now — frontend falls back to demo bank
        return Results.Ok(new
        {
            sessionId,
            questions = Array.Empty<object>()
            // TODO: replace with: questions = questions.Select(q => q.ToApiDto()).ToArray()
        });
    }

    // ── BE-03: POST /api/mcq/results ───────────────────────────────────────
    // Records the complete quiz session result and per-question analytics.
    // Also updates UniqueCorrectMcqAllTime and the user correctIds set.
    //
    // Implementation steps:
    //   1. Validate sessionId matches a known session (from GET /api/mcq/questions)
    //   2. Validate correctIndices in payload against DB values (detect tampering)
    //   3. Persist McqSessionResult to session table
    //   4. Persist each McqQuestionAnswer to question_answers table
    //   5. Update user's distinct correct question count (UniqueCorrectMcqAllTime)
    //   6. Update user's correctIds set (for skipCorrect filtering)
    //   7. Create McqAttempt records per distinct category (for scoring engine)
    static async Task<IResult> PostResults(
        HttpContext ctx,
        // TODO: inject IQuizSessionRepository, IUserStatsRepository
        CancellationToken ct)
    {
        // TODO BE-04: Require authenticated session
        // Uncomment when JWT middleware is registered in Program.cs:
        // if (!ctx.User.Identity?.IsAuthenticated ?? true) return Results.Unauthorized();

        Codivium.Mcq.McqSessionResult? result;
        try
        {
            result = await ctx.Request.ReadFromJsonAsync<Codivium.Mcq.McqSessionResult>(ct);
        }
        catch
        {
            return Results.BadRequest(new { error = "Invalid request body." });
        }

        if (result is null) return Results.BadRequest(new { error = "Empty request body." });
        if (string.IsNullOrWhiteSpace(result.SessionId))
            return Results.BadRequest(new { error = "sessionId is required." });
        if (result.Answers is null || result.Answers.Count == 0)
            return Results.BadRequest(new { error = "answers array is required and must not be empty." });

        // TODO BE-03 step 1: Validate sessionId
        // var session = await _sessionRepo.GetAsync(result.SessionId, ct);
        // if (session is null) return Results.NotFound(new { error = "Unknown sessionId." });

        // TODO BE-03 step 2: Validate correctIndices against DB (anti-tamper)
        // foreach (var answer in result.Answers) { ... }

        // TODO BE-03 step 3: Persist session record
        // await _sessionRepo.SaveResultAsync(result, GetUserId(ctx), ct);

        // TODO BE-03 step 4: Persist per-question answers
        // await _sessionRepo.SaveAnswersAsync(result.Answers, result.SessionId, ct);

        // TODO BE-03 step 5 & 6: Update user stats
        // var newCorrectIds = result.Answers
        //     .Where(a => a.IsCorrect)
        //     .Select(a => a.QuestionId)
        //     .ToHashSet();
        // await _userStatsRepo.AddCorrectQuestionsAsync(GetUserId(ctx), newCorrectIds, ct);

        // TODO BE-03 step 7: Create McqAttempt records per distinct category
        // foreach (var category in result.DistinctCategories())
        // {
        //     var attempt = result.ToMcqAttempt(category);
        //     await _mcqAttemptRepo.SaveAsync(GetUserId(ctx), attempt, ct);
        // }

        // Stub: 202 Accepted — wiring not yet complete
        return Results.Accepted(null, new { recorded = false, stub = true });
    }

    // ── Helper ──────────────────────────────────────────────────────────────
    // TODO BE-04: Replace with real user identity resolution
    static string GetUserId(HttpContext ctx)
    {
        // JWT: identity is resolved from the Bearer token by ASP.NET Core JWT middleware.
        // Register: services.AddAuthentication().AddJwtBearer(...) in Program.cs.
        // The user ID claim is typically ClaimTypes.NameIdentifier or a custom 'sub' claim.
        return ctx.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? ctx.User.FindFirst("sub")?.Value
            ?? throw new UnauthorizedAccessException("No user identity in JWT token.");
    }
}
