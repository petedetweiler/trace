# Traceflow Implementation Plan

> AI-first diagram rendering library — YAML in, beautiful SVG out

**Status:** MVP In Progress
**Started:** December 23, 2024
**Last Updated:** December 23, 2024

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React + Vite | Modern, fast dev experience |
| Structure | pnpm monorepo | Separate publishable packages |
| Publishing | npm as `@traceflow/*` | Public packages, easy consumption |
| Design | Firecrawl-inspired | Warm grays, orange accent, dot grid |

### Design Tokens

| Element | Value |
|---------|-------|
| Background | `#F8F8F8` with dot grid |
| Node cards | `#FFFFFF`, soft shadow, 12px radius |
| Accent | `#FF6B35` (coral/orange) |
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
| 8 | Core Package API | 🔲 Not Started |
| 9 | Playground Polish | 🔲 Not Started |
| 10 | Interactivity | 🔲 Not Started |
| 11 | Claude Skill | 🔲 Not Started |
| 12 | Publishing Setup | 🔲 Not Started |
| 13 | Deployment | 🔲 Not Started |

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

- [x] Firecrawl-inspired design tokens
- [x] Color palette
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

### Phase 9: Playground Polish 🔲

- [ ] Export buttons (SVG, PNG, copy YAML)
- [ ] Example gallery
- [ ] Theme picker
- [ ] Better error display

---

### Phase 10: Interactivity 🔲

- [ ] Pan/zoom with d3-zoom
- [ ] Hover tooltips
- [ ] Focus states

---

### Phase 11: Claude Skill 🔲

- [ ] SKILL.md with schema reference
- [ ] EXAMPLES.md with patterns
- [ ] Test with Claude

---

### Phase 12: Publishing Setup 🔲

- [ ] npm publish config
- [ ] GitHub Actions CI/CD
- [ ] Release workflow

---

### Phase 13: Deployment 🔲

- [ ] Deploy playground to Vercel
- [ ] Custom domain (optional)
- [ ] Meta tags, OG image

---

## Out of Scope (V1)

Per PRD, deferred to V2/V3:

- Additional themes (dark, minimal, blueprint, hand-drawn)
- Groups / swimlanes
- Custom icons
- Animated edges
- Click-to-expand descriptions
- Shareable URLs
- Mermaid import

---

## Commits Log

| Hash | Description |
|------|-------------|
| `7a83baa` | Initial commit: Traceflow monorepo with working playground |
| `f72a4c9` | Fix XSS and DoS vulnerabilities |
| `c63f8ea` | Add .claudeignore to protect secrets |
| `1366600` | Add prototype pollution guard (PR #1) |
| `58cc24b` | Add README with documentation |
