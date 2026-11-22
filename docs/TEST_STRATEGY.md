# Test Strategy

**Author:** Dhanush

## Scope

Multi-tenant document management and approval workflow platform: tenant isolation, RBAC, document versioning, approvals, background jobs and session revocation.

## Risk priorities

1. **Critical:** cross-tenant IDOR, privilege escalation, approval state corruption.
2. **High:** duplicate job side effects, version mismatch, interrupted upload, revoked-session access.
3. **Medium:** search/filter correctness, notification timing, UI rendering and accessibility.

## Layers

| Layer       | Tooling                        | Purpose                                              |
| ----------- | ------------------------------ | ---------------------------------------------------- |
| UI          | Playwright, Page Object Model  | Workspace journeys                                   |
| API         | Playwright `APIRequestContext` | RBAC, negative cases, workflow transitions           |
| Python      | pytest                         | Supplementary smoke/integration checks               |
| Performance | k6                             | Virtual-user ramp with p95 and error-rate thresholds |
| Data        | SQL reference queries          | Tenant keys, versions, approvals                     |

## Test tagging

- `@smoke`: fast, high-signal checks run on every push and pull request.
- Untagged tests run in the full regression.

## Isolation

Use unique tenant, user and document IDs per test, with API-based setup and teardown. Parallel execution needs isolated tenants or database schemas. The demo serialises tests (`workers: 1`) because it uses shared in-memory state; `POST /test/reset` restores a known baseline between tests.

## Exit criteria

PR smoke passes; nightly regression has no unexplained failures; no open critical or high defects; performance thresholds pass in a controlled environment; failure traces and reports are retained.
