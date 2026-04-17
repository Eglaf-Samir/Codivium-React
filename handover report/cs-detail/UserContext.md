# UserContext.cs — Detail Reference

## What it is
Extracts the authenticated user ID from the HTTP context JWT claims.

## Interface
```csharp
interface IUserContext {
    string GetRequiredUserId(HttpContext http);
}
```

## Implementation: UserContext
Reads from ClaimTypes.NameIdentifier ("sub") claim of the JWT.
Throws UnauthorizedAccessException if no identity present.

## Used by
CodiviumAdaptiveEndpoints.cs, CodiviumMcqApiEndpoints.cs.

## Limitations
- Assumes JWT Bearer authentication configured in Program.cs
- Only reads "sub" / NameIdentifier claim — configure your JWT provider to include this
