# D'oro Fashion System — QA Case Study

## 1. QA Case Study

D'oro is a full-stack retail system used here as a practical Quality Assurance case study. The portfolio focuses on understanding an operational process, identifying its risks and business rules, designing tests from those risks, validating API and database behavior, and preserving traceable evidence.

The current featured execution is the manual Sales & Inventory suite, [TR-SI-001](test-runs/TR-SALES-INVENTORY-001.md). It contains 16 executed cases covering sale creation, simulated payment, stock effects, cancellation, state transitions, authorization, and transaction atomicity.

## 2. System Under Test

D'oro connects two application contexts over the same Express/Prisma/PostgreSQL backend:

- A customer store with catalog, customer authentication, checkout, simulated payment, addresses, and customer-owned orders.
- An internal workspace for Sales, size-level Inventory, Fulfillment, Replenishment, Receiving, staff administration, permissions, and audit records.

The current Sales flow starts in the online store. The internal Sales module monitors and manages customer orders; D'oro does not implement a physical point-of-sale or cashier workflow.

## 3. QA Objective

The objective is to demonstrate a disciplined testing process around business-critical behavior:

- translate code and workflows into explicit, testable business rules;
- prioritize failures that could corrupt stock, order state, or authorization;
- validate accepted and rejected operations at the API and database levels;
- document results without claiming coverage that has not been measured;
- maintain a clear chain from rule and risk to case, run, evidence, and result.

## 4. Scope

The case study includes functional, negative, boundary, integration, API, database, authorization, and regression-oriented testing. The featured manual suite covers Sales and Inventory. Repository automation additionally covers selected services, middleware, authorization, authentication, receiving, notifications, presentation rules, and related regressions.

Performance, load, penetration testing, real payment processing, real shipping integrations, disaster recovery, complete accessibility conformance, full browser end-to-end automation, and production certification are outside the demonstrated scope.

## 5. Operational Process Under Test

```text
Customer creates order
        ↓
Sale = PENDIENTE; inventory unchanged
        ↓
Owner confirms simulated payment
        ↓
Every item has stock?
  ├─ No → 409; full rollback; sale stays PENDIENTE
  └─ Yes → Sale = PAGADO; variant stock decreases;
            one SALIDA per item
        ↓
Authorized staff may cancel before shipment
  ├─ PENDIENTE → CANCELADO; no inventory effect
  └─ PAGADO → CANCELADO; stock restored; ENTRADA recorded
        ↓
Authorized fulfillment can dispatch a PAGADO order → ENVIADO
```

The flow joins customer identity, order ownership, state rules, size-level availability, movement traceability, staff authorization, and database transactions.

## 6. Risk-Based Approach

Testing prioritized high-impact failures such as overselling, duplicated payment or restoration, partial inventory persistence, invalid state transitions, unauthorized resource access, CLIENT/STAFF confusion, and loss of inventory traceability.

The [risk analysis](test-plan/risk-analysis.md) explains likelihood, impact, existing coverage, and residual risk. This is a portfolio exercise in risk-based testing, not a certified production-risk assessment.

## 7. Business Rules

The [Business Rules Catalog](requirements/business-rules.md) records rules verified in the current implementation, including:

- creation in `PENDIENTE` without inventory effects;
- payment restricted to the owning customer;
- stock validation at payment time and deduction by exact size;
- one `SALIDA` per successfully paid item;
- correct cancellation behavior for `PENDIENTE` and `PAGADO` sales;
- terminal-state and duplicate-operation protection;
- all-or-nothing multi-item payment;
- backend enforcement of account type, resource ownership, and staff permissions.

Rules without a documented test are marked **Not formally covered** rather than being assigned invented coverage.

## 8. Test Design

The 16-case [Sales & Inventory suite](test-cases/TC-SALES-INVENTORY.md) was designed from the risks already identified in the test plan. It includes positive paths, negative paths, exact and zero-stock boundaries, sequential duplicate operations, valid and invalid transitions, ownership, account-type separation, movement checks, and a multi-item rollback scenario.

Each case defines preconditions, data needs, steps, expected API and persistence results, priority, potential severity, and minimum evidence. Controlled synthetic data was used; some availability preconditions were prepared through Prisma Studio.

## 9. Execution Results

| Validation | Recorded result |
|---|---:|
| Total automated tests | **79/79 PASS** |
| Backend automated tests | **60/60 PASS** |
| Frontend automated tests | **19/19 PASS** |
| Manual Sales & Inventory suite | **16/16 PASS** |
| Manual failures | **0** |
| Manual blocked cases | **0** |
| ESLint | **0 errors / 0 warnings** |
| Production frontend build | **PASS** |

The manual suite pass rate is 100% for its 16 executed cases. These numbers do **not** mean 100% code coverage, 100% requirements coverage, or 100% end-to-end coverage. No code-coverage percentage is claimed because no coverage report is documented.

See the concise [Test Execution Summary](test-summary/TR-SI-001-summary.md) and the detailed [test run](test-runs/TR-SALES-INVENTORY-001.md).

## 10. API Validation

The execution checked success and error contracts for the implemented REST endpoints, including `201`, `200`, `400`, `403`, and `409` outcomes. Rejected requests were followed by state checks to confirm that errors did not leave hidden inventory effects.

Examples include insufficient stock (`409`), a processed sale (`400`), cross-customer ownership denial (`403`), STAFF use of a customer-only route (`403`), and invalid terminal-state transitions (`400`). Postman is documented as the manual REST client used for the suite.

## 11. Database Validation

PostgreSQL persistence was inspected through Prisma Studio. Validation covered:

- `Sale.estado`, ownership, order number, and totals;
- `SaleItem` product, size, quantity, and price snapshot;
- `ProductVariant.stock` before and after critical operations;
- `InventoryMovement` count, type, quantity, reason, and timestamp;
- absence of partial writes after rejected operations.

`InventoryMovement` does not store size, previous stock, new stock, responsible user, or sale ID as dedicated fields. The suite therefore correlated size and order through `motivo` and compared before/after records. This limitation is preserved in the business rules and risk analysis.

## 12. Authorization & RBAC Validation

The backend is the authoritative access-control boundary. Authentication reloads the active account and distinguishes `CLIENT` from `STAFF`. Customer-only and staff-only middleware enforce account type; staff operations also use effective permissions.

- TC-SI-013 verified that another customer could not pay an order they did not own.
- TC-SI-014 verified that a STAFF session could not call the client-only payment operation.
- Automated checks cover ADMIN global functional access, primary-admin invariants, BODEGUERO grants/revocations, rejection of administrative grants to BODEGUERO, and permission middleware behavior.

The manual suite does not yet provide a complete endpoint-by-role denial matrix. That gap is marked honestly in the traceability matrix.

## 13. Featured Scenario: Transaction Atomicity

TC-SI-012 tested a `PENDIENTE` sale with two variants. One variant still had enough stock; the other had become insufficient before payment. The expected result was all-or-nothing behavior.

The API returned `409`, the sale remained `PENDIENTE`, neither variant changed, and no new inventory movement remained. This validates the observed rollback behavior of the Prisma transaction for the tested scenario.

- [Test case TC-SI-012](test-cases/TC-SALES-INVENTORY.md#tc-si-012)
- [Detailed execution](test-runs/TR-SALES-INVENTORY-001.md#registro-de-ejecución--tc-si-012)
- [Concise evidence](evidence/TR-SI-001/TC-SI-012-atomicity-result.txt)

## 14. Defect Management

[BUG-AUTH-001](defects/BUG-AUTH-001.md) documents customer profile navigation resolving to an existing privileged STAFF session when valid CLIENT and ADMIN authentication states coexist in the same browser profile. The confirmed result enters the administrative panel under the existing ADMIN identity with functional administrative privileges. 
The defect was discovered independently during exploratory review of the application, outside the formal TR-SI-001 execution. It was later reproduced in local development and the public deployment.

The defect remains **OPEN** and has [documented reproduction evidence](evidence/BUG-AUTH-001/). Root cause is not confirmed, and no fix or post-fix retest supports a `Fixed` or `Closed` status.

## 15. Automated Regression Testing

The repository uses Node.js's native test runner:

- **60 backend tests** cover selected authentication, middleware, authorization, Sales payment service behavior, receiving, notifications, roles, password actions, audit dates, navigation contracts, and related services.
- **19 frontend tests** cover scoped auth tokens, replenishment access presentation, password-audit presentation, and supplier-order UI behavior.

Run commands:

```powershell
cd backend
npm test

cd ../frontend
npm test
```

Static analysis and the production build are separate quality checks:

```powershell
cd frontend
npm run lint
npm run build
```

The current `lint` script includes `--fix` and may modify source files. Automated suites complement, but do not replace, manual API/database testing, concurrency testing, or real-browser end-to-end coverage.

## 16. Traceability

The [Requirements Traceability Matrix](requirements/traceability-matrix.md) links:

```text
Business Rule → Risk → Test Case → Test Run → Evidence → Result
```

It uses existing identifiers such as `R-03`, `TC-SI-012`, `TR-SI-001`, and `BUG-AUTH-001`. Missing coverage is labeled **Not formally covered**.

## 17. Test Artifacts

| Artifact | Purpose |
|---|---|
| [Test plan](test-plan/doro-test-plan.md) | Overall scope, strategy, risks, entry/exit criteria, and confirmed rules |
| [Risk analysis](test-plan/risk-analysis.md) | Prioritized operational and technical risk assessment |
| [Business rules](requirements/business-rules.md) | Testable rules extracted from the current system |
| [Traceability matrix](requirements/traceability-matrix.md) | Coverage and evidence chain by rule |
| [Manual test cases](test-cases/TC-SALES-INVENTORY.md) | 16 designed Sales & Inventory scenarios |
| [Detailed test run](test-runs/TR-SALES-INVENTORY-001.md) | Recorded execution of TC-SI-001 through TC-SI-016 |
| [Execution summary](test-summary/TR-SI-001-summary.md) | Concise result and risk summary |
| [Evidence](evidence/TR-SI-001/) | API, state, movement, and persistence artifacts |
| [BUG-AUTH-001](defects/BUG-AUTH-001.md) | Open session/profile defect report |
| [BUG-AUTH-001 evidence](evidence/BUG-AUTH-001/) | Screenshots and video from the confirmed reproduction |

## 18. Known Limitations

- Concurrent payment is tracked separately as `R-14` and was not formally executed; sequential duplicate protection is not proof of concurrent safety.
- No full browser end-to-end suite or end-to-end coverage percentage is documented.
- No code-coverage report or percentage is available.
- The manual execution focuses on Sales & Inventory rather than every D'oro workflow.
- The RBAC evidence is stronger at automated unit/middleware level than in a formal manual role-endpoint matrix.
- BUG-AUTH-001 has documented reproduction evidence, but no confirmed root cause, fix, or post-fix retest.
- The local execution does not certify production behavior, performance, security, accessibility, or cross-browser compatibility.

## 19. Transferable QA Skills for Operational Software

D'oro belongs to the retail domain, but the QA work demonstrates skills that transfer to other operational software:

- operational process analysis and decomposition;
- business-rule validation;
- state-transition and negative testing;
- authorization, ownership, and RBAC analysis;
- API/database consistency checks;
- data-integrity and transaction-atomicity validation;
- requirements-to-evidence traceability;
- auditability assessment;
- risk-based regression testing.

The value of the case study is not the retail label itself. It is the ability to understand a connected operational process, identify where it can fail, and produce reproducible evidence about the system's behavior.
