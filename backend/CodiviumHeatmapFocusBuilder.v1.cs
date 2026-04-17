// CodiviumHeatmapFocusBuilder.v1.cs
//
// G12: Backend-driven heatmap focus modes + rankings.
// Reads config.heatmap.focus_modes (if present) and computes rankings from:
// - heatmap early convergence (A1-A3)
// - time allocation by category
// - depth by category
//
// Output is attached to convergenceHeatmap.focus for combinedCoding and per-track blocks.

using System;
using System.Collections.Generic;
using System.Linq;

namespace Codivium.Dashboard
{
    public static class CodiviumHeatmapFocusBuilder
    {
        public static HeatmapFocusDto BuildFocus(global::CodiviumScoring.ScoringConfig cfg, TrackNamespace ns)
        {
            if (cfg is null) throw new ArgumentNullException(nameof(cfg));
            if (ns is null) throw new ArgumentNullException(nameof(ns));

            var fm = cfg.Heatmap?.FocusModes;
            var focus = new HeatmapFocusDto
            {
                DefaultModeId = fm?.DefaultMode ?? "impact",
                TopNDefault = fm?.TopNDefault ?? 12,
                TopNOptions = (fm?.TopNOptions != null && fm.TopNOptions.Count > 0)
                    ? fm.TopNOptions
                    : new List<int> { 8, 10, 12, 14, 16 },
                Modes = new List<HeatmapFocusModeDto>(),
                Rankings = new Dictionary<string, List<string>>(StringComparer.Ordinal)
            };

            // Mode list from config (fallback to a sensible default set)
            var modeList = (fm?.Modes != null && fm.Modes.Count > 0)
                ? fm.Modes.Select(m => new HeatmapFocusModeDto
                    {
                        Id = m.Id,
                        Label = m.Label,
                        Description = m.Description,
                        IsDefault = m.IsDefault || (m.Id == focus.DefaultModeId)
                    })
                    .Where(m => !string.IsNullOrWhiteSpace(m.Id))
                    .ToList()
                : DefaultModes(focus.DefaultModeId);

            // Ensure at least the default exists.
            if (modeList.All(m => m.Id != focus.DefaultModeId))
            {
                modeList.Insert(0, new HeatmapFocusModeDto
                {
                    Id = focus.DefaultModeId,
                    Label = "Impact",
                    Description = "Backend ranking",
                    IsDefault = true
                });
            }

            // Deduplicate mode ids
            focus.Modes = modeList
                .GroupBy(m => m.Id, StringComparer.Ordinal)
                .Select(g => g.First())
                .ToList();

            var cats = ns.ConvergenceHeatmap?.Categories ?? new List<string>();
            var alloc = (ns.Allocation ?? new List<AllocationRowDto>())
                .Where(r => r != null && !string.IsNullOrWhiteSpace(r.Category))
                .GroupBy(r => r.Category, StringComparer.Ordinal)
                .ToDictionary(g => g.Key, g => g.Sum(x => (double)x.Minutes), StringComparer.Ordinal);

            var depth = (ns.DepthByCategory ?? new List<DepthRowDto>())
                .Where(r => r != null && !string.IsNullOrWhiteSpace(r.Category))
                .ToDictionary(r => r.Category, r => r.Depth, StringComparer.Ordinal);

            var earlyConv = ComputeEarlyConvergence(ns.ConvergenceHeatmap!);

            // Precompute derived metrics
            var rows = cats.Select(c =>
            {
                alloc.TryGetValue(c, out var mins);
                depth.TryGetValue(c, out var d);
                earlyConv.TryGetValue(c, out var ec);

                var depthNorm = Clamp01(d / 100.0);
                var weakness = Clamp01(1.0 - ec);
                var timeWeight = Math.Log(1.0 + Math.Max(0.0, mins));

                // Heuristics (stable, deterministic)
                // Read blend weights from config (KaTeX spec: heatmap.focus_modes.impact_weights)
                var alphaImp = cfg?.Katex?.Heatmap?.FocusModes?.ImpactWeights?.AlphaImp ?? 0.55;
                var betaImp  = cfg?.Katex?.Heatmap?.FocusModes?.ImpactWeights?.BetaImp  ?? 0.45;
                var impact   = (alphaImp * weakness + betaImp * (1.0 - depthNorm)) * timeWeight;
                var worstConv = weakness; // higher = worse
                var mostTime = mins;
                var lowestDepth = 1.0 - depthNorm;
                var friction = weakness * timeWeight;

                return new
                {
                    Category = c,
                    Impact = impact,
                    WorstConvergence = worstConv,
                    MostTime = mostTime,
                    LowestDepth = lowestDepth,
                    HighestFriction = friction
                };
            }).ToList();

            foreach (var m in focus.Modes)
            {
                var id = m.Id;
                if (string.IsNullOrWhiteSpace(id)) continue;

                List<string> ranking = id switch
                {
                    "impact" => rows.OrderByDescending(x => x.Impact).ThenBy(x => x.Category, StringComparer.Ordinal).Select(x => x.Category).ToList(),
                    "worst_convergence" => rows.OrderByDescending(x => x.WorstConvergence).ThenBy(x => x.Category, StringComparer.Ordinal).Select(x => x.Category).ToList(),
                    "most_time" => rows.OrderByDescending(x => x.MostTime).ThenBy(x => x.Category, StringComparer.Ordinal).Select(x => x.Category).ToList(),
                    "lowest_depth" => rows.OrderByDescending(x => x.LowestDepth).ThenBy(x => x.Category, StringComparer.Ordinal).Select(x => x.Category).ToList(),
                    "highest_friction" => rows.OrderByDescending(x => x.HighestFriction).ThenBy(x => x.Category, StringComparer.Ordinal).Select(x => x.Category).ToList(),
                    _ => rows.OrderByDescending(x => x.Impact).ThenBy(x => x.Category, StringComparer.Ordinal).Select(x => x.Category).ToList()
                };

                focus.Rankings[id] = ranking;
            }

            return focus;
        }

        private static Dictionary<string, double> ComputeEarlyConvergence(ConvergenceHeatmapDto heat)
        {
            var outMap = new Dictionary<string, double>(StringComparer.Ordinal);
            if (heat == null || heat.Categories == null || heat.Values == null) return outMap;

            int n = Math.Min(heat.Categories.Count, heat.Values.Count);
            for (int i = 0; i < n; i++)
            {
                var cat = heat.Categories[i];
                if (string.IsNullOrWhiteSpace(cat)) continue;
                var row = heat.Values[i];
                if (row == null || row.Count == 0)
                {
                    outMap[cat] = 0.0;
                    continue;
                }

                // A1-A3 (indices 0..2)
                double sum = 0.0;
                int k = 0;
                for (int j = 0; j < Math.Min(3, row.Count); j++)
                {
                    if (row[j].HasValue)
                    {
                        sum += row[j]!.Value;
                        k++;
                    }
                }

                outMap[cat] = k == 0 ? 0.0 : (sum / k);
            }

            return outMap;
        }

        private static List<HeatmapFocusModeDto> DefaultModes(string defaultModeId)
        {
            return new List<HeatmapFocusModeDto>
            {
                new HeatmapFocusModeDto { Id = "impact", Label = "Impact (time × weakness)", Description = "Prioritises categories where time spent is high and early convergence is low.", IsDefault = (defaultModeId=="impact") },
                new HeatmapFocusModeDto { Id = "worst_convergence", Label = "Worst convergence", Description = "Lowest early attempt pass% (A1–A3).", IsDefault = (defaultModeId=="worst_convergence") },
                new HeatmapFocusModeDto { Id = "most_time", Label = "Most time spent", Description = "Highest time allocation.", IsDefault = (defaultModeId=="most_time") },
                new HeatmapFocusModeDto { Id = "lowest_depth", Label = "Lowest depth", Description = "Lowest depth score by category.", IsDefault = (defaultModeId=="lowest_depth") },
                new HeatmapFocusModeDto { Id = "highest_friction", Label = "Highest friction", Description = "Low early convergence scaled by time.", IsDefault = (defaultModeId=="highest_friction") }
            };
        }

        private static double Clamp01(double x)
        {
            if (x < 0.0) return 0.0;
            if (x > 1.0) return 1.0;
            return x;
        }
    }
}
