# Traceflow Implementation Plan

> AI-first diagram rendering library — YAML in, beautiful SVG out

**Status:** Authoring, Embedding & Interchange Milestone Complete
**Started:** December 23, 2024
**Last Updated:** August 11, 2026

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React + Vite | Modern, fast dev experience |
| Structure | pnpm monorepo | Separate publishable packages |
| Publishing | npm as `@traceflow/*` | Public packages, easy consumption |
| Design | Claude-inspired | Warm grays, teal accent, dot grid |

### Design Tokens

| Element | Value |
|---------|-------|
| Background | `#F8F8F8` with dot grid |
| Node cards | `#FFFFFF`, soft shadow, 12px radius |
| Accent | `#3a7d69` (teal) |
| Connectors | `#E0E0E0`, 2px stroke |
| Typography | Inter, 600 weight for labels |

---

## Progress Overview

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Project Scaffolding | ✅ Complete |
| 2 | Type Definitions | ✅ Complete |
| 3 | YAML Parser & Validator | ✅ Complete |
| 4 | Layout Engine | ✅ Complete |
| 5 | SVG Renderer | ✅ Complete |
| 6 | Default Theme | ✅ Complete |
| 7 | Security Hardening | ✅ Complete |
| 8 | Core Package API | 🟡 Partial |
| 9 | Playground Polish | ✅ Complete |
| 10 | Interactivity | ✅ Complete |
| 11 | AI Authoring Skill | ✅ Complete |
| 12 | Publishing Setup | 🟡 Partial |
| 13 | Deployment | ✅ Complete |
| 14 | Sharing & Draft Recovery | ✅ Complete |
| 15 | Authoring, Embedding & Interchange | ✅ Complete |

---

## Phase Details

### Phase 1: Project Scaffolding ✅

Set up the monorepo structure and tooling.

- [x] Initialize git repo
- [x] Create pnpm workspace config
- [x] Set up root package.json with scripts
- [x] Create base tsconfig.json
- [x] Scaffold packages (core, themes, playground)
- [x] Verify workspace linking

**Commit:** `7a83baa` Initial commit: Traceflow monorepo with working playground

---

### Phase 2: Type Definitions ✅

- [x] `TraceDocument` interface
- [x] `Node`, `Edge`, `Group` interfaces
- [x] `Theme` and token interfaces

**Files:** `packages/core/src/types.ts`, `packages/themes/src/types.ts`

---

### Phase 3: YAML Parser & Validator ✅

- [x] YAML parsing with `yaml` package
- [x] Schema validation with helpful errors
- [x] Input size limits (100KB max)
- [x] Node/edge count limits (100/200)
- [x] Prototype pollution guard
- [x] Unit tests

**Files:** `packages/core/src/parser.ts`, `packages/core/src/validator.ts`

**Commits:**
- `f72a4c9` Security hardening
- `1366600` Prototype pollution guard (PR #1)

---

### Phase 4: Layout Engine ✅

- [x] Dagre-based layout
- [x] TB/LR/BT/RL directions
- [x] Automatic node positioning
- [x] Edge path computation

**Files:** `packages/core/src/layout.ts`

---

### Phase 5: SVG Renderer ✅

- [x] Node shapes (start, end, process, decision, database)
- [x] Bezier curve edge smoothing
- [x] Labels and descriptions
- [x] Emphasis and status styling
- [x] XSS-safe output (escaped content)

**Files:** `packages/core/src/renderer.ts`, `packages/core/src/escape.ts`

---

### Phase 6: Default Theme ✅

- [x] Claude-inspired design tokens
- [x] Teal accent color palette
- [x] Typography settings
- [x] Shape configurations

**Files:** `packages/themes/src/default.ts`

---

### Phase 7: Security Hardening ✅

Addressed vulnerabilities identified in security audit.

- [x] `escapeXml()` / `escapeXmlAttr()` utilities
- [x] `sanitizeId()` for attribute safety
- [x] DOMPurify in playground Preview
- [x] Input size limits (100KB)
- [x] Node/edge count limits (100/200)
- [x] Label/description length limits
- [x] Prototype pollution guard
- [x] YAML alias expansion limit

**Commits:** `f72a4c9`, `1366600`

---

### Phase 8: Core Package API 🔲

- [ ] Clean public API exports
- [ ] CLI for `npx @traceflow/core render`
- [ ] Package README

---

### Phase 9: Playground Polish ✅

- [x] Export split button (PNG default, SVG dropdown)
- [x] Copy YAML button
- [x] Examples dropdown with 4 pre-built diagrams
- [x] Collapsible editor pane
- [x] Claude-inspired syntax highlighting for YAML
- [x] Taller decision nodes for better label readability
- [x] Theme picker
- [x] YAML-synchronized orientation controls (TB/LR/BT/RL)
- [x] Responsive fit-to-view preview with pan/zoom controls
- [x] Versioned compressed share links
- [x] Read-only presentation mode
- [x] Local draft recovery that preserves drafts when opening shared links

**Files:** `ExportButton.tsx`, `ExamplesDropdown.tsx`, `examples.ts`, `Editor.tsx`

---

### Phase 10: Interactivity ✅

- [x] Host-controlled pan/zoom with script-free SVG exports
- [x] Hover tooltips
- [x] Keyboard focus states and accessible SVG labels

---

### Phase 11: AI Authoring Skill ✅

- [x] Installable `author-traceflow` skill package
- [x] Progressive schema, pattern, and example references
- [x] Agent UI metadata
- [x] Skill package validation
- [x] Core tests that parse and validate every bundled YAML example

**Files:** `skills/author-traceflow/`

---

### Phase 12: Publishing Setup 🔲

- [ ] npm publish config
- [x] GitHub Actions CI for lint, typecheck, tests, and build
- [ ] Release workflow

---

### Phase 13: Deployment ✅

- [x] Deploy playground to Netlify
- [x] Custom domain (`trace.peterdetweiler.com`)
- [ ] Meta tags, OG image

---

### Phase 14: Sharing & Draft Recovery ✅

- [x] Versioned, compressed URL-hash format
- [x] Editable and presentation share links
- [x] Read-only presentation canvas
- [x] Local draft recovery
- [x] Preserve an existing local draft when opening an unedited shared link
- [x] Back/forward navigation between shared states
- [x] Round-trip tests including Unicode YAML

---

### Phase 15: Authoring, Embedding & Interchange ✅

- [x] Rendered groups/swimlanes with direction-aware layout
- [x] Built-in icons and safe custom glyphs
- [x] MIT-only Tabler icon registry with semantic concepts and legacy aliases
- [x] Lazy full-catalog visual picker with editor insertion
- [x] Namespaced icon packs and self-contained SVG rendering
- [x] Unknown-icon diagnostics and close-match repairs
- [x] Inline schema diagnostics, contextual autocomplete, and actionable repairs
- [x] Persistent node/edge descriptions panel
- [x] Responsive, chrome-free embed links
- [x] Mermaid flowchart import with semantic edge inference
- [x] Visual custom theme builder that writes portable YAML overrides
- [x] Unit, type, lint, build, and browser verification

---

## Out of Scope (V1)

Remaining candidates for later milestones:

- Public package and CLI distribution
- Nested groups and collapsible subflows
- Uploaded project-specific SVG packs and organization icon libraries
- Full Mermaid subgraph/style import

---

## Commits Log

| Hash | Description |
|------|-------------|
| `7a83baa` | Initial commit: Traceflow monorepo with working playground |
| `f72a4c9` | Fix XSS and DoS vulnerabilities |
| `c63f8ea` | Add .claudeignore to protect secrets |
| `1366600` | Add prototype pollution guard (PR #1) |
| `58cc24b` | Add README with documentation |
