# Enterprise SaaS Workflow & Document Management: QA Portfolio

**Author:** Dhanush  
**Target role:** Mid-level / Senior QA Automation Engineer (3+ years)  

A QA automation portfolio project built around a multi-tenant document management and approval workflow platform (think a mix of Jira, DocuSign and an internal document system). It is designed to exercise the hard parts of enterprise testing: tenant isolation, role-based access control, approval state transitions, file handling, background jobs and session revocation.

The repo contains two things:

1. **A small system under test (SUT):** an Express + TypeScript demo API with a minimal web page.
2. **The automation framework around it:** Playwright + TypeScript, with Postman, pytest, k6, SQL references and GitHub Actions added over the following weeks.

## Platform features (system under test)

| Area               | What the demo API does                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Multi-tenancy      | Two organisations (`org-a`, `org-b`). Every document is scoped to an org; cross-tenant lookups return a non-disclosing `404`.                                  |
| Authentication     | Bearer-token identity (`/api/me`). Unknown or revoked tokens get `401`.                                                                                        |
| RBAC               | Four roles: `admin`, `manager`, `reviewer`, `employee`. Approval needs reviewer/manager/admin; revoking users is admin-only.                                   |
| Documents          | Create, fetch, list, update (version bump) and upload a file (8 MB limit, in memory).                                                                          |
| Approval workflow  | `draft → in_review → approved`. Submitting enqueues a background job; edits are blocked (`409`) while in review; double approval by the same user is rejected. |
| Background jobs    | Queue listing and a process endpoint that is idempotent once a job is `done`.                                                                                  |
| Search             | Tenant-scoped, case-insensitive name search, also used by the web page.                                                                                        |
| Session revocation | An admin can deactivate a user; their token stops working immediately.                                                                                         |
| Test support       | `POST /test/reset` restores seed data between tests.                                                                                                           |

### API reference

| Method | Path                         | Roles                    | Notes                           |
| ------ | ---------------------------- | ------------------------ | ------------------------------- |
| GET    | `/health`                    | public                   | Liveness check                  |
| POST   | `/test/reset`                | public                   | Demo only: resets seed data     |
| GET    | `/api/me`                    | any                      | Caller identity                 |
| GET    | `/api/documents`             | any                      | Own tenant only                 |
| GET    | `/api/documents/:id`         | any                      | `404` for other tenants         |
| POST   | `/api/documents`             | any                      | Creates a draft                 |
| POST   | `/api/documents/:id/upload`  | any                      | multipart `file` field          |
| PUT    | `/api/documents/:id`         | any                      | `409` while in review           |
| POST   | `/api/documents/:id/submit`  | employee, manager, admin | draft → in_review, queues a job |
| POST   | `/api/documents/:id/approve` | reviewer, manager, admin | in_review → approved            |
| POST   | `/api/users/:id/revoke`      | admin                    | Same tenant only                |
| GET    | `/api/jobs`                  | any                      | Own tenant's jobs               |
| POST   | `/api/jobs/:id/process`      | any                      | Idempotent once done            |
| GET    | `/api/search?q=`             | any                      | Tenant-scoped name search       |

### Demo accounts

| Token              | Org   | Role     |
| ------------------ | ----- | -------- |
| `token-admin-a`    | org-a | admin    |
| `token-manager-a`  | org-a | manager  |
| `token-reviewer-a` | org-a | reviewer |
| `token-employee-a` | org-a | employee |
| `token-admin-b`    | org-b | admin    |

Seed documents: `doc-a-001` (org-a, "Vendor Agreement.pdf") and `doc-b-001` (org-b, "Confidential Plan.pdf").


## Getting started

Requires Node.js 20 or newer.

```bash
npm install
npx playwright install chromium
npm test            # starts the API automatically, then runs the tests
npm run report      # open the HTML report
```

Run only the smoke suite with `npm run test:smoke`. To run the API on its own: `npm run dev` (default port `3000`, override with the `PORT` environment variable). To test against an already-running instance, set `BASE_URL`. See `.env.example` for the variables used; they are read from the environment, so export them or prefix the command.

## Roadmap

| Week | Focus                       | Adds                                                                          |
| ---- | --------------------------- | ----------------------------------------------------------------------------- |
| 1    | Foundation                  | SUT, Playwright config, smoke tests, CI skeleton, strategy                    |
| 2    | Tenant isolation, RBAC, API | Role fixtures, IDOR and workflow API tests, Postman collection, SQL schema    |
| 3    | UI, documents, workflows    | Page Object Model, UI search test, job and revocation tests, scenario backlog |
| 4    | Python, performance, CI     | pytest contract checks, k6 load script, full CI, seeded-bug exercises         |

## Known limitations

This is a portfolio project, not a production SaaS. State is in memory, uploads are not persisted, and there is no real notification service or durable queue. Do not deploy it or put real documents or secrets in it. The tests in this repository have not been executed in the environment where it was prepared, so run `npm test` yourself before quoting results.

## License

MIT, see [LICENSE](LICENSE). Copyright (c) 2026 Dhanush.
