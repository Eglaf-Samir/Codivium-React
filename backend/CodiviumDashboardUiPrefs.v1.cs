// CodiviumDashboardUiPrefs.v1.cs
//
// G06: UI preferences persistence + payload inclusion (reference implementation).
// - Stores per-user UI preferences: meta.ui.mode and meta.ui.panels
// - Provides a simple store abstraction + a file-backed demo store.
// - In production, persist in your DB (and cache per user).

using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace Codivium.Dashboard
{
    /// <summary>
    /// UI preferences that can be attached to payload.meta.ui.
    /// JSON shape (camelCase in API output):
    /// meta: { ui: { mode: "full"|"info_only", panels: { scores: true, ... }, selectedTrack: "combined" } }
    /// </summary>
    public sealed class DashboardUiPrefs
    {
        public string Mode { get; set; } = "full";

        /// <summary>
        /// Panel toggles (only meaningful in mode="full").
        /// Recommended keys: scores, depth, heatmap, time, allocation, mcq, infoPane
        /// </summary>
        public Dictionary<string, bool> Panels { get; set; } = new Dictionary<string, bool>(StringComparer.Ordinal);

        /// <summary>
        /// Coding track filter shown in depth/allocation/heatmap panels.
        /// Accepted values: "combined" (default) | "micro" | "interview".
        /// Persisted alongside mode/panels and restored on next load.
        /// </summary>
        public string SelectedTrack { get; set; } = "combined";

        public static DashboardUiPrefs DefaultFull()
        {
            return new DashboardUiPrefs
            {
                Mode = "full",
                SelectedTrack = "combined",
                Panels = new Dictionary<string, bool>(StringComparer.Ordinal)
                {
                    ["scores"] = true,
                    ["depth"] = true,
                    ["heatmap"] = true,
                    ["time"] = true,
                    ["allocation"] = true,
                    ["mcq"] = true,
                    ["infoPane"] = true
                }
            };
        }
    }

    /// <summary>
    /// Abstract persistence for dashboard UI preferences. Production: store in DB by userId.
    /// </summary>
    public interface ICodiviumDashboardUiPrefsStore
    {
        DashboardUiPrefs GetOrDefault(string userId);
        void Save(string userId, DashboardUiPrefs prefs);
    }

    /// <summary>In-memory store (useful for tests/dev).</summary>
    public sealed class InMemoryDashboardUiPrefsStore : ICodiviumDashboardUiPrefsStore
    {
        private readonly Dictionary<string, DashboardUiPrefs> _byUserId =
            new Dictionary<string, DashboardUiPrefs>(StringComparer.Ordinal);

        public DashboardUiPrefs GetOrDefault(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId)) return DashboardUiPrefs.DefaultFull();
            return _byUserId.TryGetValue(userId, out var v) && v != null ? v : DashboardUiPrefs.DefaultFull();
        }

        public void Save(string userId, DashboardUiPrefs prefs)
        {
            if (string.IsNullOrWhiteSpace(userId)) return;
            _byUserId[userId] = prefs ?? DashboardUiPrefs.DefaultFull();
        }
    }

    /// <summary>
    /// File-backed store for demos. Stores each user's prefs in a single JSON file.
    /// Not safe for concurrent writers; use DB in production.
    /// </summary>
    public sealed class JsonFileDashboardUiPrefsStore : ICodiviumDashboardUiPrefsStore
    {
        private readonly string _filePath;

        public JsonFileDashboardUiPrefsStore(string filePath)
        {
            _filePath = filePath ?? throw new ArgumentNullException(nameof(filePath));
        }

        public DashboardUiPrefs GetOrDefault(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId)) return DashboardUiPrefs.DefaultFull();

            var all = ReadAll();
            if (all.TryGetValue(userId, out var v) && v != null) return v;
            return DashboardUiPrefs.DefaultFull();
        }

        public void Save(string userId, DashboardUiPrefs prefs)
        {
            if (string.IsNullOrWhiteSpace(userId)) return;

            var all = ReadAll();
            all[userId] = prefs ?? DashboardUiPrefs.DefaultFull();
            WriteAll(all);
        }

        private Dictionary<string, DashboardUiPrefs> ReadAll()
        {
            if (!File.Exists(_filePath))
                return new Dictionary<string, DashboardUiPrefs>(StringComparer.Ordinal);

            try
            {
                var json = File.ReadAllText(_filePath);
                var parsed = JsonSerializer.Deserialize<Dictionary<string, DashboardUiPrefs>>(json);
                return parsed ?? new Dictionary<string, DashboardUiPrefs>(StringComparer.Ordinal);
            }
            catch
            {
                // If the file is corrupt, fail safe by returning defaults.
                return new Dictionary<string, DashboardUiPrefs>(StringComparer.Ordinal);
            }
        }

        private void WriteAll(Dictionary<string, DashboardUiPrefs> all)
        {
            var dir = Path.GetDirectoryName(_filePath);
            if (!string.IsNullOrWhiteSpace(dir) && !Directory.Exists(dir))
                Directory.CreateDirectory(dir);

            var json = JsonSerializer.Serialize(all, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_filePath, json);
        }
    }
}
