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
    description: Developer pushes code to the main branch, triggering the CI/CD pipeline automatically.
  - id: lint
    type: process
    label: Lint & Format
    description: Code is checked for style violations and auto-formatted using ESLint and Prettier.
  - id: test
    type: process
    label: Run Tests
    emphasis: high
    description: Unit and integration tests are executed. This is a critical gate before proceeding.
  - id: tests_pass
    type: decision
    label: Tests Pass?
    description: Checks if all tests passed with 100% coverage threshold met.
  - id: build
    type: process
    label: Build Image
    description: Docker container image is built with all dependencies and application code.
  - id: scan
    type: process
    label: Security Scan
    description: Trivy scans the container image for known CVEs and security vulnerabilities.
  - id: scan_pass
    type: decision
    label: Vulnerabilities?
    description: Routes based on whether critical or high severity vulnerabilities were found.
  - id: staging
    type: process
    label: Deploy Staging
    emphasis: high
    description: Application is deployed to the staging environment for final validation.
  - id: e2e
    type: process
    label: E2E Tests
    description: Playwright runs end-to-end tests against the staging deployment.
  - id: e2e_pass
    type: decision
    label: E2E Pass?
    description: Determines if all E2E test suites passed successfully.
  - id: prod
    type: end
    label: Deploy Prod
    description: Application is promoted to production with zero-downtime deployment.
  - id: notify
    type: process
    label: Notify Team
    description: Slack notification sent to the team channel with failure details.
  - id: fix
    type: process
    label: Fix Issues
    description: Developer addresses the identified security vulnerabilities.

edges:
  - from: push
    to: lint
    description: Triggers linting automatically on push via GitHub Actions webhook.
  - from: lint
    to: test
    description: Linted code proceeds to test execution.
  - from: test
    to: tests_pass
    description: Test results are evaluated for pass/fail status.
  - from: tests_pass
    to: build
    label: "yes"
    description: All tests passed, proceed to container build.
  - from: tests_pass
    to: notify
    label: "no"
    style: dashed
    description: Test failures trigger team notification.
  - from: build
    to: scan
    description: Built image is sent for security scanning.
  - from: scan
    to: scan_pass
    description: Scan results are evaluated for vulnerabilities.
  - from: scan_pass
    to: staging
    label: "clear"
    description: No vulnerabilities found, safe to deploy.
  - from: scan_pass
    to: fix
    label: "issues"
    style: dashed
    description: Vulnerabilities detected, requires remediation.
  - from: fix
    to: scan
    description: Fixed code is rescanned to verify remediation.
  - from: staging
    to: e2e
    description: Staging deployment triggers E2E test suite.
  - from: e2e
    to: e2e_pass
    description: E2E results are evaluated.
  - from: e2e_pass
    to: prod
    label: "yes"
    description: E2E tests passed, ready for production.
  - from: e2e_pass
    to: notify
    label: "no"
    style: dashed
    description: E2E failures require investigation.
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
    description: User navigates to a protected resource or login page.
  - id: login_page
    type: process
    label: Show Login
    description: Renders the login form with email and password fields.
  - id: submit
    type: process
    label: Submit Credentials
    description: User submits their email and password for authentication.
  - id: validate
    type: decision
    label: Valid?
    description: Backend validates credentials against the user database.
  - id: check_2fa
    type: decision
    label: 2FA Enabled?
    description: Checks if user has two-factor authentication configured.
  - id: send_code
    type: process
    label: Send 2FA Code
    description: Sends a one-time code via SMS or authenticator app.
  - id: verify_code
    type: process
    label: Verify Code
    description: User enters the 2FA code for verification.
  - id: code_valid
    type: decision
    label: Code Valid?
    description: Validates the 2FA code matches and hasn't expired.
  - id: create_session
    type: process
    label: Create Session
    emphasis: high
    description: Creates a secure session token and stores it in a cookie.
  - id: dashboard
    type: end
    label: Dashboard
    description: User is redirected to their personalized dashboard.
  - id: show_error
    type: process
    label: Show Error
    description: Displays an error message with remaining retry attempts.

edges:
  - from: start
    to: login_page
    description: Unauthenticated users are redirected to login.
  - from: login_page
    to: submit
    description: Form submission triggers validation.
  - from: submit
    to: validate
    description: Credentials sent securely over HTTPS.
  - from: validate
    to: check_2fa
    label: "yes"
    description: Valid credentials, checking 2FA requirements.
  - from: validate
    to: show_error
    label: "no"
    style: dashed
    description: Invalid email or password combination.
  - from: show_error
    to: login_page
    style: dashed
    description: User can retry with correct credentials.
  - from: check_2fa
    to: send_code
    label: "yes"
    description: 2FA is enabled, initiating verification.
  - from: check_2fa
    to: create_session
    label: "no"
    description: No 2FA required, proceeding to session.
  - from: send_code
    to: verify_code
    description: Code sent, awaiting user input.
  - from: verify_code
    to: code_valid
    description: Submitted code is validated.
  - from: code_valid
    to: create_session
    label: "yes"
    description: 2FA verification successful.
  - from: code_valid
    to: show_error
    label: "no"
    style: dashed
    description: Invalid or expired 2FA code.
  - from: create_session
    to: dashboard
    description: Authenticated user gains access.
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
    description: Customer places an order through the website or mobile app.
  - id: validate
    type: process
    label: Validate Order
    description: Checks order details, shipping address, and item availability.
  - id: payment
    type: decision
    label: Payment OK?
    description: Payment processor validates the credit card or payment method.
  - id: inventory
    type: decision
    label: In Stock?
    description: Warehouse management system checks current inventory levels.
  - id: reserve
    type: process
    label: Reserve Items
    emphasis: high
    description: Items are reserved in inventory to prevent overselling.
  - id: pack
    type: process
    label: Pack Order
    description: Warehouse staff picks and packs items for shipment.
  - id: ship
    type: process
    label: Ship
    description: Package is handed off to shipping carrier with tracking number.
  - id: delivered
    type: end
    label: Delivered
    description: Customer receives their order successfully.
  - id: backorder
    type: process
    label: Backorder
    status: warning
    description: Item is out of stock, placed on backorder queue.
  - id: notify_customer
    type: process
    label: Notify Customer
    description: Email sent with expected restock date and options.
  - id: refund
    type: process
    label: Process Refund
    status: error
    description: Payment is reversed and customer is notified.
  - id: cancelled
    type: end
    label: Cancelled
    description: Order is cancelled and removed from the system.

edges:
  - from: order
    to: validate
    description: New order enters validation pipeline.
  - from: validate
    to: payment
    description: Valid order proceeds to payment processing.
  - from: payment
    to: inventory
    label: "approved"
    description: Payment successful, checking inventory.
  - from: payment
    to: refund
    label: "declined"
    style: dashed
    description: Payment failed, initiating refund process.
  - from: refund
    to: cancelled
    description: Refund completed, order cancelled.
  - from: inventory
    to: reserve
    label: "yes"
    description: Items available, reserving inventory.
  - from: inventory
    to: backorder
    label: "no"
    style: dashed
    description: Items unavailable, placing on backorder.
  - from: backorder
    to: notify_customer
    description: Customer informed of backorder status.
  - from: notify_customer
    to: inventory
    style: dotted
    description: Periodic recheck when stock is replenished.
  - from: reserve
    to: pack
    description: Reserved items sent to packing station.
  - from: pack
    to: ship
    description: Packed order ready for carrier pickup.
  - from: ship
    to: delivered
    description: Package in transit to customer.
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
    description: Cron job triggers the pipeline every hour on the hour.
  - id: api
    type: external
    label: External API
    description: Third-party REST API providing source data.
  - id: extract
    type: process
    label: Extract Data
    description: Fetches data from the API with pagination and rate limiting.
  - id: validate
    type: process
    label: Validate Schema
    description: Validates incoming data against the expected JSON schema.
  - id: valid
    type: decision
    label: Valid?
    description: Determines if the data passes all validation rules.
  - id: transform
    type: process
    label: Transform
    emphasis: high
    description: Applies business logic, aggregations, and data normalization.
  - id: warehouse
    type: database
    label: Data Warehouse
    description: Snowflake data warehouse for analytics and reporting.
  - id: cache
    type: database
    label: Redis Cache
    description: Redis cache for frequently accessed aggregated data.
  - id: complete
    type: end
    label: Complete
    description: Pipeline execution completed successfully.
  - id: alert
    type: process
    label: Send Alert
    status: error
    description: PagerDuty alert sent to on-call data engineer.
  - id: log_error
    type: process
    label: Log Error
    description: Error details logged to CloudWatch for debugging.

edges:
  - from: trigger
    to: api
    description: Scheduled trigger initiates API call.
  - from: api
    to: extract
    description: API response passed to extraction layer.
  - from: extract
    to: validate
    description: Raw data sent for schema validation.
  - from: validate
    to: valid
    description: Validation results evaluated.
  - from: valid
    to: transform
    label: "yes"
    description: Valid data proceeds to transformation.
  - from: valid
    to: alert
    label: "no"
    style: dashed
    description: Invalid data triggers alert workflow.
  - from: alert
    to: log_error
    description: Alert followed by detailed error logging.
  - from: transform
    to: warehouse
    description: Transformed data loaded into warehouse.
  - from: transform
    to: cache
    description: Hot data cached for quick access.
  - from: warehouse
    to: complete
    description: Warehouse load confirmed.
  - from: cache
    to: complete
    description: Cache update confirmed.
`,
  },
]
