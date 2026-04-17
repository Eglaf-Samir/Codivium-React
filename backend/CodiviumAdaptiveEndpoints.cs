// CodiviumAdaptiveEndpoints.cs
// Backend API endpoint stubs for the adaptive practice page.
// Implement these to wire adaptive-practice.html to live user data.
//
// See contracts/adaptive-state-api.contract.md for the full specification.
//
// Implementation notes:
//   AD-GET:  GET /api/user/adaptive-state
//            — Load user session history, compute ring fills, run the
//              14-rule recommendation engine, return full adaptive state.
//            — On new user (no sessions): return 404 (frontend shows orientation mode).
//            — All 14 recommendation types are evaluated in CodiviumAdaptiveEngine.cs.
//              No client-side rule evaluation is needed.
//
//   AD-POST: POST /api/user/adaptive-state
//            — Record recommendation choice in user's continuity record.
//            — Store onboardingContext (goal/level/time) if present (first session only).
//            — Fire-and-forget from frontend: always return 204.

#nullable enable
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

public static class CodiviumAdaptiveEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/user/adaptive-state",  (HttpContext ctx, IRawDataProvider rp, CancellationToken ct) => GetAdaptiveState(ctx, rp, ct));
        app.MapPost("/api/user/adaptive-state", PostAdaptiveState);
    }

    // ── GET /api/user/adaptive-state ────────────────────────────────────────
    static async Task<IResult> GetAdaptiveState(
        HttpContext ctx,
        IRawDataProvider rawProvider,
        CancellationToken ct)
    {
        var userId = GetUserId(ctx);

        // Load 365-day rolling window
        var toUtc   = DateTimeOffset.UtcNow;
        var fromUtc = toUtc.AddDays(-365);
        CodiviumScoring.CodiviumRawData raw;
        try   { raw = await rawProvider.GetRawDataAsync(userId, fromUtc, toUtc); }
        catch { return Results.Problem("Failed to load session data.", statusCode: 500); }

        // Determine track from query string (default: micro)
        string track = ctx.Request.Query.TryGetValue("track", out var t) ? t.ToString() : "micro";

        var codingSessions = raw.CodingSessionsByTrack.TryGetValue(track, out var cs)
            ? cs : Array.Empty<CodiviumScoring.CodingSession>();
        var mcqAttempts = raw.McqAttemptsByTrack.TryGetValue("mcq", out var ma)
            ? ma : Array.Empty<CodiviumScoring.McqAttempt>();

        // Seven-step recommendation engine
        var result = Codivium.Adaptive.AdaptiveEngine.Compute(
            track, codingSessions, mcqAttempts, toUtc);

        // 404 → frontend shows orientation mode (new user)
        if (result.IsNewUser) return Results.NotFound();

        return Results.Ok(new AdaptiveStateResponse
        {
            Mode               = result.Mode,
            SessionCount       = result.SessionCount,
            LastSessionDaysAgo = result.LastSessionDaysAgo,
            LastSessionLabel   = result.LastSessionLabel,
            Categories         = result.Categories.ToList(),
            Primary            = result.Primary,
            Alternatives       = result.Alternatives.ToList(),
            Milestone          = result.Milestone,
            RecentSessions     = result.RecentSessions.ToList(),
            SessionQuality     = result.SessionQuality,
        });
    });
    }

    // ── POST /api/user/adaptive-state ───────────────────────────────────────
    static async Task<IResult> PostAdaptiveState(HttpContext ctx, CancellationToken ct)
    {
        var userId = GetUserId(ctx);
        AdaptiveChoiceRecord? body;
        try
        {
            body = await ctx.Request.ReadFromJsonAsync<AdaptiveChoiceRecord>(ct);
        }
        catch { return Results.BadRequest(); }
        if (body is null) return Results.BadRequest();

        // TODO AD-POST-01: Persist recommendation choice to user continuity record
        //   await _adaptiveRepo.RecordChoiceAsync(userId, body.RecommendationType,
        //       body.ChosenAt, ct);
        //
        // TODO AD-POST-02: If onboardingContext is present, store user preferences
        //   These feed into the goal-anchored recommendation type (Phase 4)
        //   if (body.OnboardingContext is not null)
        //     await _adaptiveRepo.SaveOnboardingAsync(userId, body.OnboardingContext, ct);

        return Results.NoContent();   // 204 — frontend ignores response
    }

    // ── Auth helper ─────────────────────────────────────────────────────────
    static string GetUserId(HttpContext ctx)
        => ctx.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
           ?? ctx.User.FindFirst("sub")?.Value
           ?? throw new UnauthorizedAccessException("No user identity in JWT token.");
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

public sealed class AdaptiveStateResponse
{
    [JsonPropertyName("mode")]                public required string Mode { get; init; }
    [JsonPropertyName("sessionCount")]        public required int SessionCount { get; init; }
    [JsonPropertyName("lastSessionDaysAgo")] public required int LastSessionDaysAgo { get; init; }
    [JsonPropertyName("lastSessionLabel")]   public required string LastSessionLabel { get; init; }
    [JsonPropertyName("categories")]         public required IReadOnlyList<AdaptiveCategoryDto> Categories { get; init; }
    [JsonPropertyName("primary")]            public AdaptivePrimaryDto? Primary { get; init; }
    [JsonPropertyName("alternatives")]       public required IReadOnlyList<AdaptiveAlternativeDto> Alternatives { get; init; }
    [JsonPropertyName("milestone")]          public AdaptiveMilestoneDto? Milestone { get; init; }
    [JsonPropertyName("recentSessions")]     public required IReadOnlyList<AdaptiveRecentSessionDto> RecentSessions { get; init; }
    [JsonPropertyName("sessionQuality")]     public AdaptiveSessionQualityDto? SessionQuality { get; init; }
}

public sealed class AdaptiveCategoryDto
{
    [JsonPropertyName("name")]              public required string Name { get; init; }
    [JsonPropertyName("fill")]              public required int Fill { get; init; }
    [JsonPropertyName("diff")]              public required IReadOnlyList<int> Diff { get; init; }
    /// <summary>Raw fill % per difficulty [basic, intermediate, advanced] before drain.</summary>
    [JsonPropertyName("diffFill")]          public required IReadOnlyList<int> DiffFill { get; init; }
    [JsonPropertyName("state")]             public required string State { get; init; }
    [JsonPropertyName("status")]            public required string Status { get; init; }
    /// <summary>Which practice track this category belongs to (micro | interview | mcq).</summary>
    [JsonPropertyName("track")]             public required string Track { get; init; }
    /// <summary>Total coding sessions completed in this category across all difficulties.</summary>
    [JsonPropertyName("codingSessionCount")] public required int CodingSessionCount { get; init; }
    /// <summary>
    /// Per-exercise attempt history for this category (newest first).
    /// Populated for coding categories. Used by client-side UI for progress detail.
    /// </summary>
    [JsonPropertyName("attempts")]          public required IReadOnlyList<AdaptiveAttemptDto> Attempts { get; init; }
}

/// <summary>
/// A single exercise attempt record within a category ring.
/// Carries the data needed for fluency, calibration, and abandonment detection.
/// </summary>
public sealed class AdaptiveAttemptDto
{
    [JsonPropertyName("exerciseId")]       public string? ExerciseId { get; init; }
    /// <summary>"accepted" | "abandoned"</summary>
    [JsonPropertyName("outcome")]          public required string Outcome { get; init; }
    [JsonPropertyName("submissionsCount")] public required int SubmissionsCount { get; init; }
    [JsonPropertyName("completedDate")]    public required string CompletedDate { get; init; }
    [JsonPropertyName("difficulty")]       public required string Difficulty { get; init; }
}

public sealed class AdaptivePrimaryDto
{
    [JsonPropertyName("type")]          public required string Type { get; init; }
    [JsonPropertyName("typeLabel")]     public required string TypeLabel { get; init; }
    [JsonPropertyName("headline")]      public required string Headline { get; init; }
    [JsonPropertyName("context")]       public required string Context { get; init; }
    [JsonPropertyName("evidence")]      public required string Evidence { get; init; }
    [JsonPropertyName("evidencePct")]   public required int EvidencePct { get; init; }
    [JsonPropertyName("sciShort")]      public required string SciShort { get; init; }
    [JsonPropertyName("sciLong")]       public required string SciLong { get; init; }
    [JsonPropertyName("ctaLabel")]      public required string CtaLabel { get; init; }
    [JsonPropertyName("ctaHref")]       public required string CtaHref { get; init; }
    [JsonPropertyName("templateVars")]  public Dictionary<string, string>? TemplateVars { get; init; }
}

public sealed class AdaptiveAlternativeDto
{
    [JsonPropertyName("type")]      public required string Type { get; init; }
    [JsonPropertyName("typeLabel")] public required string TypeLabel { get; init; }
    [JsonPropertyName("headline")]  public required string Headline { get; init; }
    [JsonPropertyName("sub")]       public required string Sub { get; init; }
    [JsonPropertyName("sci")]       public required string Sci { get; init; }
    [JsonPropertyName("cta")]       public required string Cta { get; init; }
    [JsonPropertyName("href")]      public required string Href { get; init; }
}

public sealed class AdaptiveMilestoneDto
{
    [JsonPropertyName("type")]           public required string Type { get; init; }
    [JsonPropertyName("label")]          public required string Label { get; init; }
    [JsonPropertyName("context")]        public required string Context { get; init; }
    [JsonPropertyName("category")]       public string? Category { get; init; }
    [JsonPropertyName("difficulty")]     public string? Difficulty { get; init; }
    [JsonPropertyName("nextDifficulty")] public string? NextDifficulty { get; init; }
}

public sealed class AdaptiveRecentSessionDto
{
    [JsonPropertyName("cat")]   public required string Cat { get; init; }
    [JsonPropertyName("score")] public required string Score { get; init; }
    [JsonPropertyName("state")] public required string State { get; init; }
}

public sealed class AdaptiveSessionQualityDto
{
    [JsonPropertyName("level")]  public required string Level { get; init; }
    [JsonPropertyName("levels")] public required IReadOnlyList<AdaptiveQualityLevelDto> Levels { get; init; }
}

public sealed class AdaptiveQualityLevelDto
{
    [JsonPropertyName("name")]      public required string Name { get; init; }
    [JsonPropertyName("pct")]       public required int Pct { get; init; }
    [JsonPropertyName("isCurrent")] public required bool IsCurrent { get; init; }
}

public sealed class AdaptiveChoiceRecord
{
    [JsonPropertyName("action")]                public required string Action { get; init; }
    [JsonPropertyName("recommendationType")]    public required string RecommendationType { get; init; }
    [JsonPropertyName("chosenAt")]              public required string ChosenAt { get; init; }
    [JsonPropertyName("onboardingContext")]     public AdaptiveOnboardingContextDto? OnboardingContext { get; init; }
}

public sealed class AdaptiveOnboardingContextDto
{
    [JsonPropertyName("goal")]        public required string Goal { get; init; }
    [JsonPropertyName("level")]       public required string Level { get; init; }
    [JsonPropertyName("time")]        public required int Time { get; init; }
    [JsonPropertyName("difficulty")]  public required string Difficulty { get; init; }
    [JsonPropertyName("count")]       public required int Count { get; init; }
    [JsonPropertyName("answeredAt")]  public required string AnsweredAt { get; init; }
}
