# Backend Test Plans

This document summarizes the automated test coverage currently available in the backend project and explains the intent behind every suite. It also captures how to execute them locally and what each plan verifies so you can quickly understand the safety net before making changes.

## How to Run the Suites

- `pnpm test` &mdash; runs the full unit test suite (all `*.spec.ts` files under `src/`).
- `pnpm test:e2e` &mdash; runs the black-box end-to-end journeys located under `test/e2e/`.
- `pnpm test -- --watch` or `pnpm test:e2e -- --watch` &mdash; watch mode while iterating on specific specs.

> Tip: keep Prisma and external integrations mocked when adding new tests so the suites stay deterministic and fast.

## Unit-Level Plans

| Suite                                        | Location                                                                                     | Purpose                                                                                                                                           | Core Scenarios                                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| AuthService                                  | `src/features/auth/auth.service.spec.ts`                                                     | Validates authentication helpers that wrap `UsersService`, password hashing, JWT payload composition, refresh token hashing, and role utilities.  | Login validation, refresh token hashing, password operations, role/area helpers.                                          |
| UsersService                                 | `src/features/users/users.service.spec.ts`                                                   | Exercises user CRUD logic against mocked Prisma, including role assignment persistence, cache invalidation, notifications, and password policies. | Registration with generated temp password, updates with role rewiring, pagination, soft validations, deletion safeguards. |
| NotificationService                          | `src/features/notification/notification.service.spec.ts`                                     | Ensures notifications fan out correctly to areas/roles/users and that read receipts and gateway broadcasts fire.                                  | Custom notification creation, ticket/work-order events, mark-as-read path.                                                |
| TicketService                                | `src/features/ticket/ticket.service.spec.ts`                                                 | Guards ticket lifecycle orchestration independent of HTTP.                                                                                        | Creation, assignment, approval workflow, filters, and deletion rules.                                                     |
| RoutesService                                | `src/features/routes/routes.service.spec.ts`                                                 | Checks route CRUD and truck assignments with Prisma stubs.                                                                                        | Create/update/delete routes, pagination, assignment create/remove flows.                                                  |
| VehicleService                               | `src/features/vehicle/vehicle.service.spec.ts`                                               | Validates vehicle persistence helpers, filtering, maintenance timestamps.                                                                         | Creation, update, document linking, pagination.                                                                           |
| WorkOrderService                             | `src/features/work-order/work-order.service.spec.ts`                                         | Exercises work order creation, status transitions, QA closure, and domain events.                                                                 | Transactional create, update status, close with QA record, delete with safety checks.                                     |
| WorkshopService                              | `src/features/workshop/workshop.service.spec.ts`                                             | Ensures aggregate workshop overview logic composes vehicle/work-order/users data.                                                                 | Delegation to underlying services, overview pagination, mechanics filtering.                                              |
| CivilWork, Cleaning, Incident, Fuel Services | `src/features/*/*.service.spec.ts`                                                           | Confirm domain-specific aggregations, filtering, and event triggers for each vertical module.                                                     | CRUD operations, summary metrics, event listeners per module.                                                             |
| Guard & Strategy Specs                       | `src/features/auth/guards/**/*.spec.ts`, `src/features/auth/strategies/jwt.strategy.spec.ts` | Validate route protection, permission resolution, and JWT payload requirements in isolation.                                                      | Optional-auth paths, permission guard fallbacks, JWT claim validation.                                                    |

These suites mock Prisma and upstream services, so they run quickly while guaranteeing business rules at the service/guard level remain stable.

## End-to-End Journeys

| Suite               | Location                            | Scope                                                                                                                                                      | Key Assertions                                                                                                                                                   |
| ------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth E2E            | `test/e2e/auth.e2e-spec.ts`         | Focuses on the authentication controller contract. Uses mock services to simulate login, refresh, and logout flows with real JWT generation.               | Login returns tokens and user payload, refresh validates HMAC-stored token, logout clears refresh token.                                                         |
| Notification E2E    | `test/e2e/notification.e2e-spec.ts` | Exercises the notification endpoints against mocked Prisma and websockets gateway with role-aware guards overridden.                                       | Admin-created notifications, supervisor listing with read receipts, mark-as-read behavior, gateway emission hook.                                                |
| Ticket E2E          | `test/e2e/ticket.e2e-spec.ts`       | Validates ticket lifecycle over HTTP: create, update, approval, closure.                                                                                   | CRUD flow, approval endpoint collects user context, lifecycle progression through statuses.                                                                      |
| Integrated Journeys | `test/e2e/journeys.e2e-spec.ts`     | Simulates real user journeys across modules with shared in-memory stores. Covers user onboarding, transport planning, and workshop loop in a single suite. | Registration with temp password, login and dashboard access via bearer token, route creation/assignment, work-order status->closure, workshop overview accuracy. |

The e2e tests boot lightweight Nest applications with guards overridden, combining actual controllers with mocked dependencies to validate routing, validation pipes, and guard integration.

## Extending the Plans

1. **Decide the level** &mdash; prefer unit specs for pure business logic; reserve e2e for cross-module sequences.
2. **Reuse mocks** &mdash; extend the existing in-memory stores in `test/e2e` rather than reintroducing Prisma.
3. **Follow FIRST principles** &mdash; make tests Fast, Independent, Repeatable, Self-validating, and Timely.
4. **Document additions** &mdash; update this file when new plans are added so teammates can locate coverage quickly.

With this overview you can determine where new assertions should live and understand the guardrails protecting each backend feature.
