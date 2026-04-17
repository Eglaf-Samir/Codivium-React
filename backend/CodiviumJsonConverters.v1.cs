// CodiviumJsonConverters.v1.cs
//
// Purpose:
// - Provide JSON converters used by the Raw Data Contract.
// - Support KaTeX-aligned naming/values while also accepting legacy v1 payloads.
//
// IMPORTANT:
// - The KaTeX scoring document defines Difficulty as one of: basic / intermediate / advanced.
// - Older raw payloads used numeric difficulty levels 1..3.
// - This converter accepts BOTH representations and normalizes to the KaTeX labels.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Codivium.Dashboard
{
    /// <summary>
    /// Reads Difficulty from JSON as either:
    /// - a string: "basic" | "intermediate" | "advanced" (case-insensitive), OR
    /// - a number: 1 | 2 | 3 (legacy)
    ///
    /// Writes Difficulty as a lowercase KaTeX label.
    /// </summary>
    public sealed class DifficultyValueConverter : JsonConverter<string>
    {
        public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String)
            {
                var s = reader.GetString() ?? string.Empty;
                s = s.Trim().ToLowerInvariant();

                // Accept common synonyms (defensive).
                if (s is "easy") s = "basic";
                if (s is "medium") s = "intermediate";
                if (s is "hard") s = "advanced";

                return s;
            }

            if (reader.TokenType == JsonTokenType.Number)
            {
                if (!reader.TryGetInt32(out var d))
                    throw new JsonException("Difficulty numeric value must be an integer.");

                return d switch
                {
                    1 => "basic",
                    2 => "intermediate",
                    3 => "advanced",
                    _ => throw new JsonException("Difficulty must be 1, 2, or 3 when represented as a number.")
                };
            }

            throw new JsonException("Difficulty must be a string (basic/intermediate/advanced) or an integer (1..3).");
        }

        public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        {
            var v = (value ?? string.Empty).Trim().ToLowerInvariant();
            writer.WriteStringValue(v);
        }
    }
}
