# Traceflow

**AI-first diagram rendering — YAML in, beautiful SVG out.**

Traceflow is a diagram library designed for the AI era. Describe your flowchart in simple YAML, get a polished SVG. No dragging boxes, no fiddling with arrows.

![Traceflow Example](https://github.com/petedetweiler/trace/raw/main/firecrawl-screenshot.png)

## Features

- **YAML-native** — Human-readable, AI-writable format
- **Beautiful defaults** — Clean, polished aesthetic out of the box
- **Theming** — Five curated light and dark visual systems
- **Smart layout** — Dagre-powered automatic positioning with dynamic sizing
- **Four flow directions** — Top-down, horizontal, and reversed layouts
- **Multiple node types** — Start, end, process, decision, database, and more
- **Semantic edges** — Success, failure, warning, retry, and alternate paths
- **Responsive viewport** — Fit-to-view, pan, zoom, and keyboard-accessible diagrams
- **AI authoring skill** — Generate reliable Traceflow YAML from plain-language processes
- **Shareable diagrams** — Compressed editable and presentation links with no backend
- **MIT icon system** — 148 workflow essentials, 4,754 searchable Tabler icons, and semantic concepts
- **Schema-aware editor** — Inline diagnostics, autocomplete, and one-click repairs
- **Visual node inspector** — Edit labels, descriptions, types, statuses, emphasis, and icons from the rendered canvas
- **Import and customize** — Mermaid flowchart import and a visual theme builder
- **Responsive embeds** — Lightweight read-only links for docs and blogs
- **Security hardened** — XSS protection, DoS limits, prototype pollution guards

## Quick Start

```yaml
version: 1
title: User Authentication
direction: TB

nodes:
  - id: start
    type: start
    label: User visits site

  - id: auth
    type: process
    label: Authenticate
    emphasis: high

  - id: valid
    type: decision
    label: Valid session?

  - id: dashboard
    type: end
    label: Dashboard

edges:
  - from: start
    to: auth

  - from: auth
    to: valid

  - from: valid
    to: dashboard
    label: "yes"

  - from: valid
    to: start
    label: "no"
    style: dashed
```

## AI Authoring

The official [`author-traceflow` skill](skills/author-traceflow/SKILL.md) teaches skill-capable AI agents how to translate plain-language processes into valid Traceflow YAML. It includes the current schema, decision and retry patterns, orientation guidance, and examples that are validated by the core test suite.

Example request:

```text
Use $author-traceflow to diagram our release process, including the approval gate,
rollback path, and the external monitoring service.
```

The skill folder is self-contained and can be installed or referenced by agents that support `SKILL.md` packages.

## Sharing

The playground Share menu provides:

- **Editable links** that open the complete diagram in the editor
- **Presentation links** that open a clean, read-only canvas
- **Embed links** that remove all app chrome for responsive iframes
- **Presentation mode** for reviewing a diagram before copying its link

The YAML is compressed into a versioned URL hash. Diagram contents are not uploaded to a Traceflow server, and opening somebody else's link does not replace the previous local draft until the shared diagram is edited.

Embed a copied embed link with a responsive iframe:

```html
<iframe
  src="https://trace.peterdetweiler.com/#v=1&flow=…&sig=…&embed=1"
  title="Release workflow"
  style="width:100%;aspect-ratio:16/9;border:0"
  loading="lazy">
</iframe>
```

## Installation

The packages are still pre-release and are not published to npm yet. For local development:

```bash
pnpm install
pnpm build
```

The intended public installation command remains `npm install @traceflow/core @traceflow/themes` once the first release is published.

## Usage

```typescript
import { parse, validate, computeLayout, render } from '@traceflow/core'

const yaml = `
nodes:
  - id: a
    label: Hello
  - id: b
    label: World
edges:
  - from: a
    to: b
`

const doc = parse(yaml)
const { valid, errors } = validate(doc)

if (valid) {
  const layout = computeLayout(doc)
  const svg = render(layout)
  // svg is a string you can inject into the DOM
}
```

## YAML Schema

### Document

| Field | Type | Description |
|-------|------|-------------|
| `version` | `1` | Schema version (recommended) |
| `title` | string | Diagram title (optional) |
| `description` | string | Diagram description (optional) |
| `direction` | `TB` \| `LR` \| `BT` \| `RL` | Flow direction (default: `TB`) |
| `nodes` | array | List of nodes (required) |
| `edges` | array | List of edges (required) |
| `groups` | array | Optional swimlanes; a node may belong to at most one group |

### Nodes

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (required) |
| `label` | string | Display text (required) |
| `type` | string | Shape: `start`, `end`, `process`, `decision`, `database`, `external`, `manual`, `delay` |
| `description` | string | Tooltip text |
| `icon` | string | MIT Tabler name, semantic concept, or explicit text/emoji glyph |
| `emphasis` | `low` \| `normal` \| `high` | Visual prominence |
| `status` | `default` \| `success` \| `warning` \| `error` | Color treatment |

### Icons

Traceflow ships 148 commonly useful Tabler icons in its default, self-contained renderer. The playground's **Icons** browser lazy-loads the complete 4,754-icon non-brand catalog and inserts the selected reference at the current node or group. Click a rendered node icon to open the picker directly for that node; selecting any node also exposes a keyboard-accessible **Choose icon** or **Change icon** action in its details panel. Tabler Icons and Traceflow's icon packages are MIT licensed; brand icons are intentionally excluded.

```yaml
nodes:
  - id: exact
    label: Validate supplier
    icon: shield-check

  - id: semantic
    label: Request approval
    icon: concept:approval

  - id: namespaced
    label: Travel
    icon: tabler:zeppelin

  - id: abbreviation
    label: Call API
    icon: text:API

  - id: glyph
    label: Ship order
    icon: emoji:🚚
```

Direct names use Tabler by default. `concept:*` references provide a smaller AI-friendly vocabulary for ideas such as approval, review, security, payment, shipment, and deployment. Explicit `tabler:*` references are useful when a document should name its pack. Unknown names produce a close-match repair in the playground.

The full catalog is optional for library consumers:

```ts
import { render } from '@traceflow/core'
import { tablerIconPack } from '@traceflow/icons/tabler'

const svg = render(layout, { theme, iconPacks: [tablerIconPack] })
```

All resolved icon geometry is embedded into the exported SVG. No font, CDN, API, or network request is required at viewing time. See [`packages/icons/THIRD_PARTY_NOTICES.md`](packages/icons/THIRD_PARTY_NOTICES.md) for attribution.

### Edges

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Stable edge identifier (recommended for parallel edges) |
| `from` | string | Source node ID (required) |
| `to` | string | Target node ID (required) |
| `label` | string | Edge label |
| `description` | string | Tooltip text |
| `kind` | `primary` \| `success` \| `failure` \| `warning` \| `retry` \| `alternate` | Semantic meaning used for routing and color |
| `style` | `solid` \| `dashed` \| `dotted` | Line style |

Use `kind` for meaning and `style` for appearance. This keeps routing and theme behavior independent from whether a line happens to be dashed.

### Groups / Swimlanes

Groups render behind their member nodes in document order. In top-to-bottom flows they form vertical lanes; in left-to-right flows they form horizontal bands.

```yaml
groups:
  - id: engineering
    label: Engineering
    description: Build and validate changes
    icon: code
    nodes: [plan, build, test]
    color: "#3a7d69"
  - id: operations
    label: Operations
    nodes: [deploy, monitor]
```

Descriptions remain out of the SVG’s visible labels and open in a persistent details panel when a user selects a node or edge.

### Editor Schema

The versioned JSON Schema is available at [`schema/traceflow.schema.json`](schema/traceflow.schema.json). YAML editors can opt into completion and inline diagnostics with:

```yaml
# yaml-language-server: $schema=./schema/traceflow.schema.json
version: 1
nodes:
  - id: example
    label: Example
edges: []
```

The playground applies the schema live: errors appear inline, common problems include one-click repairs, and property/value suggestions are available while typing.

## Mermaid Import

Use **Import** in the playground to convert common `flowchart`/`graph` Mermaid syntax. Directions, node shapes, edge labels, dashed paths, and common yes/no/success/failure semantics are translated. Mermaid-only directives such as styling and subgraphs are ignored; unsupported diagram types produce an actionable error.

## Theming

Traceflow includes five curated themes. Each has an intentional native appearance; explicit light, dark, and system overrides remain available for custom documents.

### Built-in Themes

| Theme | Description |
|-------|-------------|
| `editorial` | Editorial Swiss — rigorous white space, black structure, decisive red |
| `werkstatt` | Rams-inspired warm technical paper with functional olive and red |
| `blueprint` | Deep-blue engineering grid with cyan drafting lines |
| `terminal` | Near-black phosphor console with green signal and amber warnings |
| `nocturne` | Near-black cinematic field with cyan flow and gold eclipse light |

### Applying Themes

**In YAML:**

```yaml
title: My Diagram
theme: nocturne

nodes:
  - id: a
    label: Start
```

**In code:**

```typescript
import { parse, computeLayout, render, resolveTheme } from '@traceflow/core'

const doc = parse(yaml)
const theme = resolveTheme('blueprint') // resolves to its curated dark appearance
const layout = computeLayout(doc, { theme })
const svg = render(layout, { theme })
```

### Appearance Overrides

Themes use their curated appearance by default. Override it only when a document or host needs a specific mode:

```typescript
import { resolveTheme, getSystemColorScheme, onColorSchemeChange } from '@traceflow/core'

// Get theme for current system preference
const theme = resolveTheme('editorial', getSystemColorScheme())

// Listen for system changes
onColorSchemeChange((mode) => {
  const newTheme = resolveTheme('editorial', mode)
  // Re-render with new theme...
})
```

### Custom Theme Overrides

Override specific tokens without creating a full theme:

```yaml
title: Custom Colors
theme:
  name: editorial
  overrides:
    accent:
      primary: "#FF6B6B"
    shapes:
      nodeCornerRadius: 0
```

The playground’s **Customize** action provides a visual builder for base theme, colors, node radius, connectors, and grid. Applying it writes ordinary `theme.overrides` YAML, so the result remains portable and hand-editable.

### Theme Tokens

Themes can customize these token groups:

| Group | Tokens |
|-------|--------|
| `accent` | `primary`, `muted`, `success`, `warning`, `error` |
| `typography` | `fontFamily`, `fontSizeLabel`, `fontSizeDescription`, `fontWeightLabel`, `fontWeightDescription` |
| `shapes` | `nodeCornerRadius`, `nodePadding`, `nodeShadow`, `nodeMinWidth`, `nodeMaxWidth`, `nodeMinHeight`, `nodeBorderWidth`, `nodeColors`, `nodeChamfer`, `nodeIconSize`, `nodeIconPosition`, `nodeIconColor`, `decisionColor`, `terminalNodeStyle`, `fillTerminalNodes` |
| `connectors` | `strokeWidth`, `curveStyle`, `arrowSize` |
| `layout` | `nodeSpacingX`, `nodeSpacingY`, `groupPadding`, `groupHeaderSize`, `groupGap`, `canvasPadding` |
| `background` | `showGrid`, `gridStyle` (`dots`, `lines`, `blueprint`), `gridSpacing`, `decoration` (`none`, `scanlines`, `eclipse`) |

## Packages

| Package | Description |
|---------|-------------|
| `@traceflow/core` | Parser, layout engine, SVG renderer |
| `@traceflow/themes` | Theme definitions and resolver |
| `@traceflow/playground` | Interactive web editor (not published) |
| `skills/author-traceflow` | AI-authoring instructions, schema guidance, and validated examples |

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run playground locally
pnpm dev

# Run tests
pnpm test

# Run lint and type checks
pnpm lint
pnpm typecheck
```

## Security

Traceflow includes multiple security measures:

- **XSS Protection** — All user content is escaped before SVG rendering
- **Input Limits** — Max 100KB input, 100 nodes, 200 edges
- **Prototype Pollution Guard** — Rejects `__proto__`, `constructor`, `prototype` keys
- **DOMPurify** — SVG sanitization in the playground
- **Client-side sharing** — Shared YAML stays in the URL fragment rather than server logs

## License

MIT
