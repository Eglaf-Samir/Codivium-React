using System.Security.Claims;

namespace Codivium.Dashboard;

public interface IUserContext
{
    string GetRequiredUserId(HttpContext http);
}

/// <summary>
/// Reference user context.
/// Production: wire your auth middleware and read user id from JWT claims.
/// Dev fallback: accept X-Codivium-UserId header.
/// </summary>
public sealed class UserContext : IUserContext
{
    public string GetRequiredUserId(HttpContext http)
    {
        // Claim-based
        var sub = http.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? http.User?.FindFirstValue("sub");

        if (!string.IsNullOrWhiteSpace(sub)) return sub!;

        // ── DEV-ONLY FALLBACK — remove in production ────────────────────
        // Accepts X-Codivium-UserId header when no JWT middleware is configured.
        // Lets the API work for local development without a full auth stack.
        // In production this header MUST NOT be trusted — wire real JWT middleware
        // via builder.Services.AddAuthentication().AddJwtBearer(...) in Program.cs
        // and remove or guard this fallback.
        if (http.Request.Headers.TryGetValue("X-Codivium-UserId", out var v))
        {
            var s = v.ToString();
            if (!string.IsNullOrWhiteSpace(s)) return s;
        }

        throw new InvalidOperationException("Missing user id. Provide JWT claim 'sub' or header X-Codivium-UserId.");
    }
}
