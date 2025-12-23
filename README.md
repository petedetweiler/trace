# Traceflow

**AI-first diagram rendering — YAML in, beautiful SVG out.**

Traceflow is a diagram library designed for the AI era. Describe your flowchart in simple YAML, get a polished SVG. No dragging boxes, no fiddling with arrows.

![Traceflow Example](https://github.com/petedetweiler/trace/raw/main/firecrawl-screenshot.png)

## Features

- **YAML-native** — Human-readable, AI-writable format
- **Beautiful defaults** — Firecrawl-inspired aesthetic out of the box
- **Smart layout** — Dagre-powered automatic positioning
- **Multiple node types** — Start, end, process, decision, database, and more
- **Edge styling** — Solid, dashed, dotted lines with labels
- **Security hardened** — XSS protection, DoS limits, prototype pollution guards

## Quick Start

```yaml
title: User Authentication

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

## Installation

```bash
npm install @traceflow/core @traceflow/themes
```

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
| `title` | string | Diagram title (optional) |
| `description` | string | Diagram description (optional) |
| `direction` | `TB` \| `LR` \| `BT` \| `RL` | Flow direction (default: `TB`) |
| `nodes` | array | List of nodes (required) |
| `edges` | array | List of edges (required) |

### Nodes

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (required) |
| `label` | string | Display text (required) |
| `type` | string | Shape: `start`, `end`, `process`, `decision`, `database`, `external`, `manual`, `delay` |
| `description` | string | Tooltip text |
| `emphasis` | `low` \| `normal` \| `high` | Visual prominence |
| `status` | `default` \| `success` \| `warning` \| `error` | Color treatment |

### Edges

| Field | Type | Description |
|-------|------|-------------|
| `from` | string | Source node ID (required) |
| `to` | string | Target node ID (required) |
| `label` | string | Edge label |
| `description` | string | Tooltip text |
| `style` | `solid` \| `dashed` \| `dotted` | Line style |

## Packages

| Package | Description |
|---------|-------------|
| `@traceflow/core` | Parser, layout engine, SVG renderer |
| `@traceflow/themes` | Theme definitions |
| `@traceflow/playground` | Interactive web editor (not published) |

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
```

## Security

Traceflow includes multiple security measures:

- **XSS Protection** — All user content is escaped before SVG rendering
- **Input Limits** — Max 100KB input, 100 nodes, 200 edges
- **Prototype Pollution Guard** — Rejects `__proto__`, `constructor`, `prototype` keys
- **DOMPurify** — SVG sanitization in the playground

## License

MIT
