#nullable enable
using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

public static class McqPayloadCallExample
{
    public static void Run()
    {
        var cfgJson = File.ReadAllText(Path.Combine("config", "scoring-config.v1.json"));
        var cfg = JsonSerializer.Deserialize<CodiviumScoring.ScoringConfig>(
                      cfgJson,
                      new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                  ?? throw new InvalidOperationException("Failed to parse scoring config.");

        // Same raw input type used across Codivium calculators.
        // This example is KaTeX-aligned (QuizId, ScorePercent, CompletedAtUtc, difficulty labels).
        var raw = new CodiviumScoring.CodiviumRawData
        {
            Config = cfg,

            // KaTeX U_all (lifetime distinct MCQ questions answered correctly).
            UniqueCorrectMcqAllTime = 0,

            CodingSessionsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.CodingSession>>(StringComparer.OrdinalIgnoreCase)
            {
                ["micro"] = Array.Empty<CodiviumScoring.CodingSession>(),
                ["interview"] = Array.Empty<CodiviumScoring.CodingSession>()
            },
            McqAttemptsByTrack = new Dictionary<string, IReadOnlyList<CodiviumScoring.McqAttempt>>(StringComparer.OrdinalIgnoreCase)
            {
                ["mcq"] = new[]
                {
                    new CodiviumScoring.McqAttempt { QuizId="quiz_arrays_0001", CategoryId = "Arrays", Difficulty = "basic", ScorePercent = 80, TotalQuestions = 20, Correct = 16, CompletedAtUtc = DateTime.UtcNow.AddDays(-3) },
                    new CodiviumScoring.McqAttempt { QuizId="quiz_arrays_0002", CategoryId = "Arrays", Difficulty = "intermediate", ScorePercent = 65, TotalQuestions = 20, Correct = 13, CompletedAtUtc = DateTime.UtcNow.AddDays(-2) },
                    new CodiviumScoring.McqAttempt { QuizId="quiz_arrays_0003", CategoryId = "Arrays", Difficulty = "advanced", ScorePercent = 50, TotalQuestions = 20, Correct = 10, CompletedAtUtc = DateTime.UtcNow.AddDays(-1) },

                    new CodiviumScoring.McqAttempt { QuizId="quiz_graphs_0001", CategoryId = "Graphs", Difficulty = "basic", ScorePercent = 55, TotalQuestions = 20, Correct = 11, CompletedAtUtc = DateTime.UtcNow.AddDays(-3) },
                    new CodiviumScoring.McqAttempt { QuizId="quiz_graphs_0002", CategoryId = "Graphs", Difficulty = "intermediate", ScorePercent = 48, TotalQuestions = 20, Correct = 10, CompletedAtUtc = DateTime.UtcNow.AddDays(-2) },
                    new CodiviumScoring.McqAttempt { QuizId="quiz_graphs_0003", CategoryId = "Graphs", Difficulty = "advanced", ScorePercent = 41, TotalQuestions = 20, Correct = 8, CompletedAtUtc = DateTime.UtcNow.AddDays(-1) },
                }
            }
        };

        var mcq = CodiviumMcqPayload.BuildMcqPayload(raw);

        // Wrap into the dashboard payload shape
        var payload = new { mcq };

        var json = JsonSerializer.Serialize(payload,
            new JsonSerializerOptions { WriteIndented = true });

        Console.WriteLine(json);
    }
}
