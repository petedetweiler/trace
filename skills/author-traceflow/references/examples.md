# Traceflow examples

## Decision and retry flow

```yaml
version: 1
title: Email verification
direction: TB
theme: editorial

nodes:
  - id: signup
    type: start
    label: Submit signup
  - id: send-email
    type: external
    label: Send verification email
    description: Transactional email provider sends a time-limited link.
  - id: verified
    type: decision
    label: Email verified?
    emphasis: high
  - id: account
    type: end
    label: Account activated
    status: success
  - id: wait
    type: delay
    label: Wait before resend
  - id: expired
    type: end
    label: Verification expired
    status: warning

edges:
  - from: signup
    to: send-email
  - from: send-email
    to: verified
  - from: verified
    to: account
    label: "yes"
    kind: success
  - from: verified
    to: wait
    label: "not yet"
    kind: retry
    style: dashed
  - from: wait
    to: send-email
    label: resend
    kind: retry
    style: dashed
  - from: verified
    to: expired
    label: expired
    kind: warning
```

## Horizontal delivery pipeline

```yaml
version: 1
title: Release pipeline
direction: LR

nodes:
  - id: commit
    type: start
    label: Merge code
  - id: test
    type: process
    label: Run test suite
  - id: passed
    type: decision
    label: Tests pass?
  - id: deploy
    type: process
    label: Deploy release
  - id: live
    type: end
    label: Release live
    status: success
  - id: repair
    type: manual
    label: Repair failure
    status: error

edges:
  - from: commit
    to: test
  - from: test
    to: passed
  - from: passed
    to: deploy
    label: "yes"
    kind: success
  - from: deploy
    to: live
  - from: passed
    to: repair
    label: "no"
    kind: failure
    style: dashed
```
