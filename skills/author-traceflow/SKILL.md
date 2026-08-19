---
name: author-traceflow
description: Create, revise, repair, or review Traceflow diagrams and version 1 Traceflow YAML from plain-language process descriptions. Use when a user asks for a flowchart, workflow, decision tree, system process, or operational diagram specifically for Traceflow, or provides Traceflow YAML that needs structural or visual improvement.
---

# Author Traceflow

Turn process intent into valid, visually deliberate Traceflow YAML. Optimize for a reliable diagram, not terse syntax.

## Authoring workflow

1. Read [references/schema.md](references/schema.md) before creating or changing YAML.
2. Identify the main path, decisions, failure paths, retries, and terminal outcomes.
3. Choose the direction from the content: use `TB` by default and `LR` for timelines, pipelines, or wide sequential flows.
4. Assign stable kebab-case node IDs. Select node types for meaning, not decoration.
5. Connect every non-terminal node intentionally. Use edge `kind` for meaning and `style` only for appearance.
6. Use groups as swimlanes when ownership, system boundary, or phase materially clarifies the flow. A node can belong to at most one group.
7. Add concise descriptions for details-panel context and icons when they improve scanning. Keep visible labels short.
8. Check every reference, enum, required property, and duplicate ID before returning the YAML.
9. Render and inspect the result when a Traceflow renderer is available. Correct crossings, awkward hierarchy, or misleading emphasis rather than accepting the first layout.

Read [references/patterns.md](references/patterns.md) for decisions, retries, orientation, and visual-hierarchy guidance. Read [references/examples.md](references/examples.md) when a concrete template would help.

## Output rules

- Start new documents with `version: 1`.
- Return one complete YAML document in a fenced `yaml` block unless the user requests a file or a rendered artifact.
- Preserve valid user IDs when revising an existing document unless changing them solves a real structural problem.
- Quote short branch labels such as `"yes"`, `"no"`, `"on"`, and `"off"`.
- Prefer a meaningful end state over a generic node named `Done`.
- Use `status` for node state, `emphasis` for hierarchy, and `kind` for edge semantics.
- Do not invent node types, edge kinds, theme names, or theme-token keys.
- Use built-in icons (`check`, `clock`, `cloud`, `code`, `globe`, `lock`, `mail`, `user`, `warning`) or a short custom glyph such as one emoji.
- Keep groups mutually exclusive: every referenced node must exist, and one node cannot belong to multiple groups.
- Do not manually construct Traceflow share URLs. Use the playground Share action so compression and versioning remain correct.

## Validation checklist

Before finishing, confirm:

- `nodes` contains at least one node and `edges` is present, even when empty.
- Every node has a unique non-empty `id` and `label`.
- Every edge `from` and `to` matches an existing node ID.
- Every decision has clearly labeled outcomes.
- Success, failure, warning, and retry paths use the corresponding semantic `kind`.
- No unsupported properties or enum values are present.
- The main path reads naturally in the selected direction.
- Labels remain understandable when the diagram is zoomed out.
- Groups represent meaningful lanes rather than decorative boxes.
