// CodiviumPayloadDtos.cs
//
// Dashboard payload DTO classes — replaces CodiviumDashboardBackend_AllInOne_v38.cs.
//
// Contains ONLY data-transfer objects (DTOs) for the dashboard-payload-v2 contract.
// No scoring logic lives here. All scoring is in CodiviumKatexScoring.v1.cs and
// CodiviumScoringEngine.cs. The adapter that assembles these DTOs is in
// CodiviumDashboardPayloadV2Adapter.v1.cs.
//
using System;
using System.Collections.Generic;
using System.Linq;

#nullable disable

namespace Codivium.Dashboard
{
    // ------------------------------
    // Payload v2 DTOs
    // ------------------------------

    public sealed class DashboardPayloadV2
    {
        public string Version { get; set; } = "dashboard-payload-v2";
        public DashboardMeta Meta { get; set; } = new DashboardMeta();

        public OverallNamespace Overall { get; set; } = new OverallNamespace();
        public TrackNamespace Micro { get; set; } = new TrackNamespace();
        public TrackNamespace Interview { get; set; } = new TrackNamespace();
        public McqNamespace Mcq { get; set; } = new McqNamespace();

        /// <summary>
        /// Aggregated coding-only namespace (micro + interview). This drives the default
        /// Depth/Allocation/Heatmap views in the current dashboard layout.
        /// </summary>
        public TrackNamespace CombinedCoding { get; set; } = new TrackNamespace();
    }

    public sealed class DashboardMeta
    {
        /// <summary>Option B endpoint used by dashboard CTAs.</summary>
        public string SessionStartEndpoint { get; set; } = "/api/sessions/start";

        /// <summary>Optional: snapshot/anchor date. Format: YYYY-MM-DD</summary>
        public string AnchorDate { get; set; } = null;

        /// <summary>
        /// Optional UI preferences to drive dashboard rendering (panel visibility + Summary View).
        /// When serialized by ASP.NET default settings, this becomes meta.ui (camelCase).
        /// </summary>
        public DashboardUiPrefs Ui { get; set; } = null;

        /// <summary>
        /// Optional server-side mode restriction. When set, the dashboard only permits the
        /// listed modes and hides layout-preset buttons that target forbidden modes.
        /// Accepted values: "full" | "info_only" (both normalised on the frontend).
        /// Null / empty array = no restriction (default).
        ///
        /// Example: ["info_only"] → user can only see Summary View; full dashboard is blocked.
        ///          ["full", "info_only"] → both modes available (same as unrestricted).
        /// </summary>
        public List<string> AllowedModes { get; set; } = null;
    }

    public sealed class OverallNamespace
    {
        public MetricsDto Metrics { get; set; } = new MetricsDto();
        public TimeOnPlatformDto TimeOnPlatform { get; set; } = new TimeOnPlatformDto();

        /// <summary>
        /// Structured insights (existing v37 format) used by the right-side Analysis pane.
        /// </summary>
        public object Insights { get; set; } = null;

        /// <summary>
        /// Option C: backend-authored action prescriptions (one CTA per panel).
        /// </summary>
        public List<RecommendedActionDto> RecommendedActions { get; set; } = new List<RecommendedActionDto>();
    }

    public sealed class TrackNamespace
    {
        public MetricsDto Metrics { get; set; } = new MetricsDto();
        public List<AllocationRowDto> Allocation { get; set; } = new List<AllocationRowDto>();

        public List<DepthRowDto> DepthByCategory { get; set; } = new List<DepthRowDto>();
        public double? DepthAvg { get; set; } = null;

        public ConvergenceHeatmapDto ConvergenceHeatmap { get; set; } = null;
    }

    public sealed class McqNamespace
    {
        public MetricsDto Metrics { get; set; } = new MetricsDto();
        public object Mcq { get; set; } = null; // keep existing v37 MCQ payload shape
    }

    public sealed class MetricsDto
    {
        public double? CodiviumScore { get; set; }
        public double? BreadthOverall { get; set; }
        public double? BreadthMicro { get; set; }
        public double? BreadthInterview { get; set; }
        public double? BreadthMcq { get; set; }
        public double? WeightedMcqScore { get; set; }

        public double? CodiviumPointsAll { get; set; }
        public double? CodiviumPoints30 { get; set; }
        public double? EfficiencyPtsPerHr { get; set; }

        public double? DepthOverall { get; set; }
        public double? DepthMicro { get; set; }
        public double? DepthInterview { get; set; }

        public double? DepthOverallScore { get; set; } // alias for frontend
        public double? MicroDepthScore { get; set; }
        public double? InterviewDepthScore { get; set; }

        public double? FirstTryPassRate { get; set; }
        public double? AvgAttemptsToAC { get; set; }
        public double? MedianTimeToACMinutes { get; set; }
    }

    public sealed class AllocationRowDto
    {
        public string Category { get; set; }
        public int Minutes { get; set; }
        public int Solved { get; set; }
    }

    public sealed class DepthRowDto
    {
        public string Category { get; set; }
        public double Depth { get; set; }
    }

    public sealed class TimeOnPlatformDto
    {
        public List<DailyMinutesDto> Daily { get; set; } = new List<DailyMinutesDto>();
    }

    public sealed class DailyMinutesDto
    {
        public string Date { get; set; }
        public int Minutes { get; set; }
    }

    public sealed class ConvergenceHeatmapDto
    {
        public List<string> Categories { get; set; } = new List<string>();
        public List<string> Buckets { get; set; } = new List<string>();
        public List<List<double?>> Values { get; set; } = new List<List<double?>>();
        public List<List<int>> Counts { get; set; } = new List<List<int>>();

        public HeatmapFocusDto Focus { get; set; } = null;
    }

    public sealed class HeatmapFocusDto
    {
        public string DefaultModeId { get; set; } = "impact";
        public int TopNDefault { get; set; } = 12;
        public List<int> TopNOptions { get; set; } = new List<int> { 8, 10, 12, 14, 16 };
        public List<HeatmapFocusModeDto> Modes { get; set; } = new List<HeatmapFocusModeDto>();

        /// <summary>
        /// Rankings[modeId] = ordered list of category IDs/names (best first).
        /// Frontend takes Top N by slicing.
        /// </summary>
        public Dictionary<string, List<string>> Rankings { get; set; } = new Dictionary<string, List<string>>();
    }

    public sealed class HeatmapFocusModeDto
    {
        public string Id { get; set; }
        public string Label { get; set; }
        public string Description { get; set; }
        public bool IsDefault { get; set; }
    }

    public sealed class RecommendedActionDto
    {
        public string Id { get; set; }
        public string PanelId { get; set; } // heatmap | allocation | depth | time | mcq
        public string Label { get; set; }
        public string ActionType { get; set; } = "start_session"; // start_session | link
        public string Track { get; set; } = null; // micro | interview | mcq

        public Dictionary<string, object> Params { get; set; } = new Dictionary<string, object>();

        // Optional overrides
        public string Endpoint { get; set; } = null;
        public string Url { get; set; } = null;
    }

    // ------------------------------
    // NOTE: Builder classes removed (CVU-2026-03-I)
    // ------------------------------
    //
    // DashboardPayloadV2Builder — was placeholder/stub; superseded by
    //   DashboardPayloadV2Adapter.BuildFromRaw() in CodiviumDashboardPayloadV2Adapter.v1.cs.
    //
    // HeatmapFocusBuilder — was a duplicate of CodiviumHeatmapFocusBuilder.v1.cs;
    //   the adapter calls CodiviumHeatmapFocusBuilder.BuildFocus() directly.
    //
    // Both classes were dead code: no caller existed in the compiled project.

    // NOTE:
    // Live builder:    DashboardPayloadV2Adapter.BuildFromRaw() in CodiviumDashboardPayloadV2Adapter.v1.cs
    // Live heatmap:    CodiviumHeatmapFocusBuilder.BuildFocus() in CodiviumHeatmapFocusBuilder.v1.cs
    // Recommended CTAs: CodiviumRecommendedActions.BuildFromKatex() in CodiviumRecommendedActions.v1.cs
    // V2 DTOs:         Defined above (DashboardPayloadV2, MetricsDto, TrackNamespace, etc.)

}
