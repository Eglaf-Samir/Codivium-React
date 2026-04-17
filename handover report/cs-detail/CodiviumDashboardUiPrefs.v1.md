# CodiviumDashboardUiPrefs.v1.cs — Detail Reference

## What it is
Manages per-user dashboard UI preferences (mode + panel visibility).
Provides a store abstraction with an in-memory demo implementation.

## Key Types

### DashboardUiPrefs
| Field | Type | Default |
|---|---|---|
| Mode | string | "full" |
| Panels | Dict<string,bool> | All true |

### ICodiviumDashboardUiPrefsStore
```csharp
DashboardUiPrefs GetOrDefault(string userId)
void Save(string userId, DashboardUiPrefs prefs)
```

## Implementations
- InMemoryDashboardUiPrefsStore — for demo/testing
- JsonFileDashboardUiPrefsStore — file-backed, for dev
- Production: implement ICodiviumDashboardUiPrefsStore backed by your database

## Used by
CodiviumDashboardPayloadV2Adapter.v1.cs (meta.ui section of payload)

## Limitations
- InMemoryDashboardUiPrefsStore is not persistent across process restarts
- Production must implement ICodiviumDashboardUiPrefsStore with real DB backing
