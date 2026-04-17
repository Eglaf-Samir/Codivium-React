using System.Diagnostics;
using System.Text.Json;
using Codivium.Dashboard;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.Caching.Memory;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<GzipCompressionProvider>();
    options.Providers.Add<BrotliCompressionProvider>();
});

builder.Services.AddMemoryCache();

// Minimal auth/user context for reference. Production: integrate JWT / your IdP.
builder.Services.AddScoped<IUserContext, UserContext>();

// Reference UI prefs store (file-backed for demo).
builder.Services.AddSingleton<ICodiviumDashboardUiPrefsStore>(_ =>
{
    var dataDir = Path.Combine(AppContext.BaseDirectory, "App_Data");
    Directory.CreateDirectory(dataDir);
    return new JsonFileDashboardUiPrefsStore(Path.Combine(dataDir, "dashboard_ui_prefs.json"));
});

// Reference raw data provider (replace with DB repositories).
builder.Services.AddSingleton<IRawDataProvider, DemoRawDataProvider>();

var app = builder.Build();

app.UseResponseCompression();

// ── CSRF token validation ──────────────────────────────────────────────────
// Validates X-CSRF-Token header on all state-mutating requests.
// Production: replace token source with a session-stored per-user token.
app.Use(async (ctx, next) =>
{
    if (ctx.Request.Method is "POST" or "PUT" or "DELETE" or "PATCH")
    {
        var csrfHeader  = ctx.Request.Headers["X-CSRF-Token"].FirstOrDefault() ?? string.Empty;
        var csrfEnv     = Environment.GetEnvironmentVariable("CODIVIUM_CSRF_SECRET") ?? string.Empty;
        // In demo mode (no secret set) we skip enforcement but log a warning.
        if (!string.IsNullOrEmpty(csrfEnv) && csrfHeader != csrfEnv)
        {
            ctx.Response.StatusCode = 403;
            await ctx.Response.WriteAsync("{\"error\":\"CSRF token mismatch\"}");
            return;
        }
    }
    await next();
});


    HttpContext http,
    IUserContext user,
    IRawDataProvider rawProvider,
    ICodiviumDashboardUiPrefsStore uiStore,
    IMemoryCache cache,
    ILoggerFactory loggerFactory,
    string? from,
    string? to,
    string? granularity) =>
{
    var logger = loggerFactory.CreateLogger("Codivium.Dashboard.Payload");

    string userId = user.GetRequiredUserId(http);

    // Parse range (UTC). Default: last 120 days.
    var now = DateTimeOffset.UtcNow;
    DateTimeOffset toUtc = ParseDateOrDefault(to, now);
    DateTimeOffset fromUtc = ParseDateOrDefault(from, toUtc.AddDays(-120));
    string g = string.IsNullOrWhiteSpace(granularity) ? "day" : granularity!;

    var cacheKey = $"dash:v2:{userId}:{fromUtc:yyyyMMdd}:{toUtc:yyyyMMdd}:{g}";
    if (cache.TryGetValue(cacheKey, out byte[] cachedBytes))
    {
        return Results.Bytes(cachedBytes, "application/json");
    }

    var sw = Stopwatch.StartNew();

    var raw = await rawProvider.GetRawDataAsync(userId, fromUtc, toUtc);
    var uiPrefs = uiStore.GetOrDefault(userId);

    var payload = DashboardPayloadV2Adapter.BuildFromRaw(
        raw,
        fromUtc,
        toUtc,
        granularity: g,
        sessionStartEndpoint: "/api/sessions/start",
        uiPrefs: uiPrefs,
        clock: null);

    var json = JsonSerializer.SerializeToUtf8Bytes(payload, new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    });

    sw.Stop();

    logger.LogInformation(
        "Built dashboard payload v2 for {UserId}. Range={From}->{To} bytes={Bytes} ms={Ms}",
        userId,
        fromUtc.ToString("yyyy-MM-dd"),
        toUtc.ToString("yyyy-MM-dd"),
        json.Length,
        sw.ElapsedMilliseconds);

    cache.Set(cacheKey, json, new MemoryCacheEntryOptions
    {
        SlidingExpiration = TimeSpan.FromSeconds(60)
    });

    http.Response.Headers["Cache-Control"] = "private, max-age=60, stale-while-revalidate=120";
    http.Response.Headers["Vary"] = "Accept-Encoding";
    return Results.Bytes(json, "application/json");
});

app.MapPost("/api/sessions/start", async (
    HttpContext http,
    IUserContext user,
    StartSessionRequest req,
    ILoggerFactory loggerFactory) =>
{
    var logger = loggerFactory.CreateLogger("Codivium.Sessions.Start");
    string userId = user.GetRequiredUserId(http);

    // In production, create a session record and choose next exercise.
    var sessionId = Guid.NewGuid().ToString("N");

    logger.LogInformation("Start session user={UserId} actionId={ActionId} track={Track} category={Category} panel={PanelId} source={Source}",
        userId,
        req.ActionId ?? "",
        req.Track ?? "",
        req.Category ?? "",
        req.PanelId ?? "",
        req.Source ?? "");

    var redirectUrl = $"/practice/start?sessionId={sessionId}";

    return Results.Json(new StartSessionResponse
    {
        SessionId = sessionId,
        RedirectUrl = redirectUrl
    });
});

app.MapPost("/api/dashboard/ui-prefs", (
    HttpContext http,
    IUserContext user,
    ICodiviumDashboardUiPrefsStore store,
    DashboardUiPrefs prefs) =>
{
    string userId = user.GetRequiredUserId(http);
    store.Save(userId, prefs);
    return Results.Ok(new { ok = true });
});

app.Run();

static DateTimeOffset ParseDateOrDefault(string? iso, DateTimeOffset dflt)
{
    if (string.IsNullOrWhiteSpace(iso)) return dflt;
    if (DateTimeOffset.TryParse(iso, out var dto))
    {
        // Treat date-only as UTC midnight.
        if (dto.Offset != TimeSpan.Zero) dto = dto.ToUniversalTime();
        return dto;
    }
    return dflt;
}

public sealed class StartSessionRequest
{
    /// <summary>Stable identifier for the CTA (from recommendedActions[].id). Used for analytics.</summary>
    public string? ActionId { get; set; }
    public string? PanelId { get; set; }
    public string? Track { get; set; }
    /// <summary>Primary category hint (top-level convenience field; also present in Params).</summary>
    public string? Category { get; set; }
    /// <summary>Difficulty hint (top-level convenience field; also present in Params).</summary>
    public string? Difficulty { get; set; }
    /// <summary>Full params dict from the CTA: category, intent, timeboxMinutes, count, difficultyMix, etc.</summary>
    public Dictionary<string, object>? Params { get; set; }
    /// <summary>Caller identifier, e.g. "dashboard".</summary>
    public string? Source { get; set; }
}

public sealed class StartSessionResponse
{
    public string SessionId { get; set; } = "";
    public string RedirectUrl { get; set; } = "";
}
