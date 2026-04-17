using System.Text.Json;

namespace Codivium.Dashboard;

public interface IRawDataProvider
{
    Task<global::CodiviumScoring.CodiviumRawData> GetRawDataAsync(string userId, DateTimeOffset fromUtc, DateTimeOffset toUtc);
}

/// <summary>
/// Demo provider that returns an empty RawData with the packaged scoring config.
/// Replace with DB-backed provider.
/// </summary>
public sealed class DemoRawDataProvider : IRawDataProvider
{
    public Task<global::CodiviumScoring.CodiviumRawData> GetRawDataAsync(string userId, DateTimeOffset fromUtc, DateTimeOffset toUtc)
    {
        // Load scoring-config.v1.json from the packaged config directory.
        var baseDir = AppContext.BaseDirectory;
        var cfgPath = Path.Combine(baseDir, "config", "scoring-config.v1.json");
        if (!File.Exists(cfgPath))
        {
            // When running from the api project, copy config to output.
            cfgPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "config", "scoring-config.v1.json");
        }

        var json = File.ReadAllText(cfgPath);
        var cfg = JsonSerializer.Deserialize<global::CodiviumScoring.ScoringConfig>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? throw new InvalidOperationException("Failed to parse scoring-config.v1.json");

        var raw = new global::CodiviumScoring.CodiviumRawData
        {
            Config = cfg,
            UniqueCorrectMcqAllTime = 0,
            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.CodingSession>>(StringComparer.OrdinalIgnoreCase)
            {
                ["micro"] = new List<global::CodiviumScoring.CodingSession>(),
                ["interview"] = new List<global::CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<global::CodiviumScoring.McqAttempt>>(StringComparer.OrdinalIgnoreCase)
            {
                ["mcq"] = new List<global::CodiviumScoring.McqAttempt>()
            }
        };

        return Task.FromResult(raw);
    }
}
