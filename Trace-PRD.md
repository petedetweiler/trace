# Trace

**Product Requirements Document**

Version: 0.1 (Draft)  
Date: December 2024  
Status: Early Concept

---

## 1. Vision & Positioning

### The Problem

Existing flowchart tools like Mermaid and D2 were designed for a different era — one where developers manually authored diagram syntax. They optimize for terseness and typing speed, but the outputs are visually uninspiring: rigid orthogonal routing, Excel-default colors, typography as an afterthought, and zero visual hierarchy. They look like they were designed by committee in 2012.

In 2025, this model is backwards. AI can generate structured data far more reliably than humans can type cryptic syntax from memory. The bottleneck has shifted from authoring to aesthetics.

### The Opportunity

Trace is a diagram rendering library and ecosystem designed for AI-first authoring. Humans describe what they want in natural language. AI generates the structure. Trace makes it beautiful.

### Core Principles

1. **AI-authored, human-reviewed.** The syntax (YAML) is optimized for AI reliability, not human typing speed. Humans describe intent; AI structures it; humans tweak if needed.

2. **Achingly beautiful by default.** No diagram should look like a Visio reject. Soft curves, considered typography, generous whitespace, and a cohesive visual language out of the box.

3. **Themeable to the bone.** One YAML structure, infinite visual expressions. Themes control everything: colors, fonts, corner radii, line styles, animations.

4. **Responsive and interactive.** Pan, zoom, hover states, click-to-expand descriptions. Diagrams are experiences, not static images.

### Tagline Options

- Trace — Diagrams that follow your thinking.
- Trace — Describe it. See it.
- Trace — Flow, visualized.

---

## 2. User Journey

### Primary Flow (Claude Skill)

1. **Describe.** User describes their flow in natural language: "Create a flowchart showing how our API handles a request, including auth, rate limiting, and the database lookup. Show error paths."

2. **Generate.** Claude reads the Trace skill, understands the YAML schema, and generates a valid Trace document.

3. **Render.** Claude invokes the Trace renderer (via artifact or code execution) to produce an interactive SVG.

4. **Iterate.** User requests changes: "Make the auth step more prominent" or "Add an error path from rate limiting." Claude modifies the YAML and re-renders.

5. **Export.** User exports as SVG, PNG, or copies the YAML for use elsewhere.

### Secondary Flow (Playground Website)

Users can visit a standalone web app, paste Trace YAML directly (perhaps generated elsewhere), and see the rendered output. They can also select themes, adjust layout parameters, and export.

---

## 3. YAML Schema Specification

The schema prioritizes explicitness and parseability over terseness. AI models have extensive training data on YAML and produce it reliably. The schema is designed to be self-documenting and extensible.

### Top-Level Structure

```yaml
title: string                    # optional
description: string              # optional
theme: string                    # optional, default: "default"
direction: TB | LR | BT | RL     # default: "TB" (top-to-bottom)
nodes: Node[]
edges: Edge[]
groups: Group[]                  # optional
```

### Node Schema

```yaml
id: string           # required, unique identifier
label: string        # required, display text
type: string         # start | end | process | decision | database | external | manual | delay
description: string  # optional, shown on hover/click
icon: string         # optional, icon identifier
emphasis: string     # low | normal | high (default: normal)
status: string       # default | success | warning | error
```

### Edge Schema

```yaml
from: string         # required, source node id
to: string           # required, target node id
label: string        # optional, displayed on connector
description: string  # optional, shown on hover
style: string        # solid | dashed | dotted (default: solid)
animate: boolean     # default: false
```

### Group Schema (Swimlanes)

```yaml
id: string           # required
label: string        # required
nodes: string[]      # list of node ids contained in this group
color: string        # optional, override theme color
```

### Example Document

```yaml
title: User Authentication Flow
description: JWT-based auth with error handling
theme: firecrawl
direction: TB

nodes:
  - id: start
    type: start
    label: User visits site
    description: Entry point from marketing or direct

  - id: auth
    type: process
    label: Authenticate
    description: Validate JWT against auth service
    emphasis: high

  - id: valid
    type: decision
    label: Valid session?

  - id: dashboard
    type: process
    label: Dashboard
    status: success

  - id: login
    type: process
    label: Login page

edges:
  - from: start
    to: auth

  - from: auth
    to: valid

  - from: valid
    to: dashboard
    label: "yes"
    description: JWT validated successfully

  - from: valid
    to: login
    label: "no"
    style: dashed

  - from: login
    to: auth
```

---

## 4. Theme System

Themes are JSON configuration files that control all visual aspects of rendering. The default theme is inspired by Firecrawl's aesthetic: warm grays, soft shadows, generous whitespace, and a single punchy accent color.

### Theme Token Categories

| Category | Tokens |
|----------|--------|
| Colors | background, nodeBackground, nodeBorder, accent, accentMuted, text, textMuted, connectorStroke |
| Typography | fontFamily, fontSizeLabel, fontSizeDescription, fontWeightLabel, fontWeightDescription |
| Shapes | nodeCornerRadius, nodePadding, nodeShadow, nodeMinWidth, nodeMaxWidth |
| Connectors | connectorStrokeWidth, connectorCurveStyle (bezier/orthogonal/organic), arrowSize, arrowStyle |
| Layout | nodeSpacingX, nodeSpacingY, groupPadding, canvasPadding |
| Background | showGrid, gridStyle (dots/lines/blueprint), gridColor, gridSpacing |

### Bundled Themes

- **default** — Warm grays, orange accent, blueprint grid, soft shadows (Firecrawl-inspired)
- **dark** — Dark background, cyan accent, subtle glow effects
- **minimal** — Pure white, black text, hairline borders, no shadows
- **blueprint** — Dark blue background, white lines, technical drawing aesthetic
- **hand-drawn** — Slightly wobbly lines, sketch-like appearance, warm paper background

---

## 5. Rendering Engine

### Technology Stack

- **Output format:** SVG (scalable, styleable, accessible)
- **Layout engine:** Dagre (hierarchical) with custom post-processing
- **Interaction layer:** d3-zoom for pan/zoom, native SVG events for hover/click
- **Curve smoothing:** Custom bezier interpolation on Dagre edge paths

### Rendering Pipeline

1. **Parse.** Validate YAML against schema, resolve theme tokens.
2. **Layout.** Run Dagre to compute node positions and edge paths.
3. **Smooth.** Post-process edge paths with bezier curves based on theme settings.
4. **Render.** Generate SVG elements with theme-driven styles.
5. **Hydrate.** Attach event listeners for interactivity (hover tooltips, click handlers, pan/zoom).

### Visual Differentiation by Node Type

| Type | Shape | Visual Treatment |
|------|-------|------------------|
| start | Rounded pill / circle | Accent border, subtle glow |
| end | Rounded pill / circle | Filled accent, bold |
| process | Rounded rectangle | Standard card with shadow |
| decision | Diamond | Rotated square, accent border |
| database | Cylinder | 3D-ish top ellipse |
| external | Rounded rect, dashed border | Indicates external system |
| manual | Trapezoid | Human intervention step |
| delay | Half-rounded rectangle | Wait/queue indicator |

---

## 6. Claude Skill Specification

The Claude Skill is a markdown file that teaches Claude how to generate valid Trace YAML. It includes the full schema, examples, and guidance on translating natural language descriptions into structured diagrams.

### Skill Contents

- Overview of Trace and its purpose
- Complete YAML schema reference
- Multiple annotated examples (simple → complex)
- Guidance on node type selection
- Common patterns (error paths, parallel flows, swimlanes)
- Theme selection hints

### Example Prompt/Response

**User prompt:**
```
"Create a flowchart for a user signup process. Include email verification, and show what happens if verification fails."
```

**Claude generates:**
```yaml
title: User Signup Flow

nodes:
  - id: start
    type: start
    label: User clicks signup

  - id: form
    type: process
    label: Fill signup form

  - id: send-email
    type: process
    label: Send verification email

  - id: verify
    type: decision
    label: Email verified?

  - id: success
    type: end
    label: Account created
    status: success

  - id: resend
    type: process
    label: Resend email

edges:
  - from: start
    to: form

  - from: form
    to: send-email

  - from: send-email
    to: verify

  - from: verify
    to: success
    label: "yes"

  - from: verify
    to: resend
    label: "no"
    style: dashed

  - from: resend
    to: verify
```

---

## 7. Playground Website

A standalone web application where users can paste Trace YAML, see rendered output, adjust settings, and export their diagrams.

### Core Features

- **Split-pane editor.** YAML on left, live preview on right.
- **Theme picker.** Dropdown to switch between bundled themes.
- **Export options.** SVG, PNG, and copy-to-clipboard.
- **Shareable URLs.** Encode YAML in URL for sharing (like Mermaid Live).
- **Example gallery.** Pre-built examples users can load and modify.
- **Schema validation.** Inline error highlighting for invalid YAML.

### Tech Stack

- React or vanilla JS
- Monaco or CodeMirror for YAML editing
- Trace renderer as npm package
- Static hosting (Vercel, Netlify)

---

## 8. MVP Scope

### V1 (MVP)

- Core YAML schema (nodes, edges, basic metadata)
- Dagre-based layout
- SVG rendering with bezier edge smoothing
- One polished default theme (Firecrawl-inspired)
- Basic interactivity (pan, zoom, hover tooltips)
- Claude skill for generation
- Minimal playground (paste YAML → see output)

### V2

- Additional themes (dark, minimal, blueprint, hand-drawn)
- Groups / swimlanes
- Custom icons
- Animated edges
- Click-to-expand descriptions
- Shareable URLs in playground

### V3 (Future)

- Custom theme builder
- Embed mode for docs/blogs
- Alternative layout engines (ELK, force-directed)
- Accessibility improvements (ARIA, keyboard nav)
- Import from Mermaid syntax

---

*— End of Document —*
