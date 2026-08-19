# Traceflow authoring patterns

## Main path and alternatives

Build the primary successful path first. Add failures, warnings, and retries afterward so the hierarchy remains obvious. Mark alternatives with semantic edge kinds instead of relying only on dashed lines.

## Decisions

Use a `decision` node for a real question or gate. Label each outgoing edge with the outcome and give it an appropriate kind.

```yaml
- from: authorized
  to: fetch-data
  label: "yes"
  kind: success
- from: authorized
  to: reject
  label: "no"
  kind: failure
  style: dashed
```

Avoid decision nodes with one outgoing edge or unlabeled branches.

## Retries and loops

Make the retry target explicit and mark the edge as `retry`. A dashed style is usually appropriate. Ensure the flow still has an exit path so the diagram does not imply an endless loop.

```yaml
- from: wait
  to: attempt
  label: retry
  kind: retry
  style: dashed
```

## Orientation

- Use `TB` for approvals, forms, branching workflows, and most compact diagrams.
- Use `LR` for delivery pipelines, lifecycle stages, and time-oriented sequences.
- Use `BT` or `RL` only when the user requests a reverse reading direction or the surrounding composition requires it.

Do not use horizontal direction merely because the main path is long; branches can make a horizontal diagram extremely wide.

## Hierarchy and state

- Use `emphasis: high` for one or two genuinely critical gates.
- Use `emphasis: low` for supporting or optional steps.
- Use `status` for the state of a node, especially terminal outcomes.
- Avoid coloring every node; visual hierarchy disappears when everything is emphasized.

## Descriptions

Keep labels scannable and move explanatory detail into `description`. Descriptions become accessible labels and hover or keyboard-focus tooltips in the playground.

## External and manual boundaries

Use `external` for third-party systems and `manual` for human work. This makes responsibility changes legible without adding unsupported swimlanes.
