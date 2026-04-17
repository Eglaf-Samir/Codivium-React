using System;
using System.Collections.Generic;
using Xunit;

namespace Codivium.Dashboard.Tests;

public sealed class CanonicalizationTests
{
    [Fact]
    public void CanonicalizeTrackDictionaryOrThrow_NormalizesKeys()
    {
        var input = new Dictionary<string, int>
        {
            [" Micro "] = 1,
            ["INTERVIEW"] = 2
        };

        var canon = global::CodiviumCatalog.CanonicalizeTrackDictionaryOrThrow(input, "input");

        Assert.True(canon.ContainsKey("micro"), "Expected canonical key 'micro'.");
        Assert.True(canon.ContainsKey("interview"), "Expected canonical key 'interview'.");
    }

    [Fact]
    public void CanonicalizeTrackDictionaryOrThrow_ThrowsOnCollision()
    {
        var input = new Dictionary<string, int>
        {
            [" micro"] = 1,
            ["MICRO "] = 2
        };

        Assert.Throws<InvalidOperationException>(() => global::CodiviumCatalog.CanonicalizeTrackDictionaryOrThrow(input, "input"));
    }


    [Fact]
    public void CategoryKey_CanonicalizesByLowerAndTrimOnly()
    {
        var canon = global::CodiviumCatalog.CanonicalizeCategoryKey("  Dynamic Programming  ");
        Assert.Equal("dynamic programming", canon);
    }

    [Fact]
    public void CategoryKey_DoesNotRemoveInternalWhitespace()
    {
        var canon = global::CodiviumCatalog.CanonicalizeCategoryKey("Dynamic   Programming");
        Assert.Equal("dynamic   programming", canon);
    }

    [Fact]
    public void TrackId_CanonicalizesByRemovingWhitespace()
    {
        var canon = global::CodiviumCatalog.CanonicalizeTrackId("  Mi  cro  ");
        Assert.Equal("micro", canon);
    }

    [Fact]
    public void Catalog_ResolvesAliasesAfterCanonicalization()
    {
        var cfg = new global::CodiviumScoring.ScoringConfig();
        cfg.CategoryKey.Aliases["dp"] = "dynamic programming";

        // Minimal available categories so the catalog build succeeds.
        cfg.Categories.AvailableByTrack["micro"] = new List<string> { "Dynamic Programming" };

        var catalog = global::CodiviumCatalog.Build(cfg);
        Assert.Equal("dynamic programming", catalog.ResolveCategoryKey("DP"));
    }
}
