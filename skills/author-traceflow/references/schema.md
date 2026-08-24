# Traceflow version 1 schema

## Document

| Property | Type | Requirement |
|---|---|---|
| `version` | `1` | Recommended for every new document |
| `title` | string | Optional, maximum 200 characters |
| `description` | string | Optional, maximum 1,000 characters |
| `theme` | theme name or configuration | Optional |
| `direction` | `TB`, `BT`, `LR`, `RL` | Optional; defaults to `TB` |
| `nodes` | node array | Required; 1–100 nodes |
| `edges` | edge array | Required; 0–200 edges |
| `groups` | group array | Optional rendered swimlanes; each node may belong to at most one group |

Unknown properties are rejected.

## Nodes

Required properties: `id`, `label`.

| Property | Allowed values or type |
|---|---|
| `id` | Unique non-empty string |
| `label` | Non-empty string, maximum 200 characters |
| `type` | `start`, `end`, `process`, `decision`, `database`, `external`, `manual`, `delay` |
| `description` | String, maximum 1,000 characters |
| `emphasis` | `low`, `normal`, `high` |
| `status` | `default`, `success`, `warning`, `error` |
| `icon` | MIT Tabler name (`shield-check`), namespaced name (`tabler:shield-check`), semantic shortcut (`concept:approval`), or explicit glyph (`text:API`, `emoji:🚚`) |

Traceflow bundles a curated set of workflow icons and supports the complete non-brand Tabler catalog when the full icon pack is available. Prefer `concept:*` for AI-authored process intent and exact Tabler names when a particular pictogram is required. Unknown names should be repaired rather than treated as implicit text.

Use node types semantically:

- `start` and `end`: entry and terminal states
- `process`: ordinary automated step
- `decision`: a branch with explicit outcomes
- `database`: stored data or persistence boundary
- `external`: third-party or out-of-system dependency
- `manual`: human action or approval
- `delay`: wait, timeout, schedule, or queue delay

## Edges

Required properties: `from`, `to`.

| Property | Allowed values or type |
|---|---|
| `id` | Optional unique string, useful for parallel edges |
| `from`, `to` | Existing node IDs |
| `label` | String, maximum 200 characters |
| `description` | String, maximum 1,000 characters |
| `kind` | `primary`, `success`, `failure`, `warning`, `retry`, `alternate` |
| `style` | `solid`, `dashed`, `dotted` |
| `animate` | Boolean |

`kind` carries meaning and influences color and routing. `style` only changes the line pattern.

## Groups

Groups render as labeled swimlanes in document order. Each group requires a unique `id`, a `label`, and a non-empty `nodes` array of existing node IDs. A node may belong to only one group. Optional `description` and `icon` fields enrich the lane rail; optional `color` accepts a hex tint.

## Themes

Current bundled theme names are `editorial`, `werkstatt`, `blueprint`, `terminal`, and `nocturne`. Prefer `editorial` unless the user requests a visual direction. Editorial and Werkstatt are curated light themes; Blueprint, Terminal Signal, and Nocturne are curated dark themes. A theme configuration may contain `name`, an optional appearance override via `mode` (`light`, `dark`, or `system`), and an `overrides` object.
