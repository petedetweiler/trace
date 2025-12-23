export interface Example {
  id: string
  name: string
  yaml: string
}

export const EXAMPLES: Example[] = [
  {
    id: 'cicd-pipeline',
    name: 'CI/CD Pipeline',
    yaml: `title: CI/CD Pipeline
description: Automated build, test, and deploy workflow

nodes:
  - id: push
    type: start
    label: Code Push
  - id: lint
    type: process
    label: Lint & Format
  - id: test
    type: process
    label: Run Tests
    emphasis: high
  - id: tests_pass
    type: decision
    label: Tests Pass?
  - id: build
    type: process
    label: Build Image
  - id: scan
    type: process
    label: Security Scan
  - id: scan_pass
    type: decision
    label: Vulnerabilities?
  - id: staging
    type: process
    label: Deploy Staging
    emphasis: high
  - id: e2e
    type: process
    label: E2E Tests
  - id: e2e_pass
    type: decision
    label: E2E Pass?
  - id: prod
    type: end
    label: Deploy Prod
  - id: notify
    type: process
    label: Notify Team
  - id: fix
    type: process
    label: Fix Issues

edges:
  - from: push
    to: lint
  - from: lint
    to: test
  - from: test
    to: tests_pass
  - from: tests_pass
    to: build
    label: "yes"
  - from: tests_pass
    to: notify
    label: "no"
    style: dashed
  - from: build
    to: scan
  - from: scan
    to: scan_pass
  - from: scan_pass
    to: staging
    label: "clear"
  - from: scan_pass
    to: fix
    label: "issues"
    style: dashed
  - from: fix
    to: scan
  - from: staging
    to: e2e
  - from: e2e
    to: e2e_pass
  - from: e2e_pass
    to: prod
    label: "yes"
  - from: e2e_pass
    to: notify
    label: "no"
    style: dashed
`,
  },
  {
    id: 'user-auth',
    name: 'User Authentication',
    yaml: `title: User Authentication
description: Login flow with validation and retry

nodes:
  - id: start
    type: start
    label: User Visit
  - id: login_page
    type: process
    label: Show Login
  - id: submit
    type: process
    label: Submit Credentials
  - id: validate
    type: decision
    label: Valid?
  - id: check_2fa
    type: decision
    label: 2FA Enabled?
  - id: send_code
    type: process
    label: Send 2FA Code
  - id: verify_code
    type: process
    label: Verify Code
  - id: code_valid
    type: decision
    label: Code Valid?
  - id: create_session
    type: process
    label: Create Session
    emphasis: high
  - id: dashboard
    type: end
    label: Dashboard
  - id: show_error
    type: process
    label: Show Error

edges:
  - from: start
    to: login_page
  - from: login_page
    to: submit
  - from: submit
    to: validate
  - from: validate
    to: check_2fa
    label: "yes"
  - from: validate
    to: show_error
    label: "no"
    style: dashed
  - from: show_error
    to: login_page
    style: dashed
  - from: check_2fa
    to: send_code
    label: "yes"
  - from: check_2fa
    to: create_session
    label: "no"
  - from: send_code
    to: verify_code
  - from: verify_code
    to: code_valid
  - from: code_valid
    to: create_session
    label: "yes"
  - from: code_valid
    to: show_error
    label: "no"
    style: dashed
  - from: create_session
    to: dashboard
`,
  },
  {
    id: 'order-processing',
    name: 'Order Processing',
    yaml: `title: Order Processing
description: E-commerce order fulfillment workflow

nodes:
  - id: order
    type: start
    label: New Order
  - id: validate
    type: process
    label: Validate Order
  - id: payment
    type: decision
    label: Payment OK?
  - id: inventory
    type: decision
    label: In Stock?
  - id: reserve
    type: process
    label: Reserve Items
    emphasis: high
  - id: pack
    type: process
    label: Pack Order
  - id: ship
    type: process
    label: Ship
  - id: delivered
    type: end
    label: Delivered
  - id: backorder
    type: process
    label: Backorder
    status: warning
  - id: notify_customer
    type: process
    label: Notify Customer
  - id: refund
    type: process
    label: Process Refund
    status: error
  - id: cancelled
    type: end
    label: Cancelled

edges:
  - from: order
    to: validate
  - from: validate
    to: payment
  - from: payment
    to: inventory
    label: "approved"
  - from: payment
    to: refund
    label: "declined"
    style: dashed
  - from: refund
    to: cancelled
  - from: inventory
    to: reserve
    label: "yes"
  - from: inventory
    to: backorder
    label: "no"
    style: dashed
  - from: backorder
    to: notify_customer
  - from: notify_customer
    to: inventory
    style: dotted
  - from: reserve
    to: pack
  - from: pack
    to: ship
  - from: ship
    to: delivered
`,
  },
  {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    yaml: `title: Data Pipeline
description: ETL workflow with external sources

nodes:
  - id: trigger
    type: start
    label: Schedule Trigger
  - id: api
    type: external
    label: External API
  - id: extract
    type: process
    label: Extract Data
  - id: validate
    type: process
    label: Validate Schema
  - id: valid
    type: decision
    label: Valid?
  - id: transform
    type: process
    label: Transform
    emphasis: high
  - id: warehouse
    type: database
    label: Data Warehouse
  - id: cache
    type: database
    label: Redis Cache
  - id: complete
    type: end
    label: Complete
  - id: alert
    type: process
    label: Send Alert
    status: error
  - id: log_error
    type: process
    label: Log Error

edges:
  - from: trigger
    to: api
  - from: api
    to: extract
  - from: extract
    to: validate
  - from: validate
    to: valid
  - from: valid
    to: transform
    label: "yes"
  - from: valid
    to: alert
    label: "no"
    style: dashed
  - from: alert
    to: log_error
  - from: transform
    to: warehouse
  - from: transform
    to: cache
  - from: warehouse
    to: complete
  - from: cache
    to: complete
`,
  },
]
