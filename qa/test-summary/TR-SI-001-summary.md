# Test Execution Summary — TR-SI-001

## Objective

Evaluate the implemented Sales and Inventory rules that carry the greatest integrity risk: sale creation, simulated payment, stock deduction, cancellation, inventory movements, state transitions, ownership, account-type separation, and transaction atomicity.

## Scope

The execution covered the 16 manual cases in the Sales & Inventory suite, `TC-SI-001` through `TC-SI-016`. It did not repeat automated suites or claim coverage of the full D'oro application.

## Environment

| Attribute | Recorded value |
|---|---|
| Environment | Local development backend and local development database |
| Branch | `feature/erp-refactor` |
| Reference commit | `10c0dc9` |
| Execution dates | August 5–7, 2026 |
| Executor | Elvia Gutiérrez García |
| Interfaces used | REST API requests, application views where relevant, and PostgreSQL persistence inspection through Prisma Studio |

No production environment, real payment gateway, or real shipping provider was part of this execution.

## Test approach

The suite combined functional, negative, boundary, integration, API, database, authorization, and regression-oriented scenarios. For operations that could affect inventory, state and movement records were captured before and after the request. Rejected operations were also checked for absence of side effects.

## Results

| Metric | Result |
|---|---:|
| Total cases | 16 |
| Passed | 16 |
| Failed | 0 |
| Blocked | 0 |
| Pass rate | **100% (16/16)** |

This pass rate describes only this executed 16-case suite. It does not mean 100% code coverage or 100% end-to-end coverage.

## Main risks covered

- Overselling and negative stock at the exact, insufficient, and zero-stock boundaries.
- Sequential duplicate payment and duplicate cancellation effects.
- Missing, duplicated, or incorrect `SALIDA` and `ENTRADA` movements.
- Incorrect restoration after cancelling a paid sale.
- Invalid transitions involving `PENDIENTE`, `PAGADO`, `ENVIADO`, and `CANCELADO`.
- Cross-customer resource access and use of a STAFF session on a customer-only operation.
- Partial persistence during a multi-item payment failure.

## Important validations

- A newly created sale remained `PENDIENTE` and did not change inventory.
- Successful payment changed the sale to `PAGADO`, deducted only the purchased size, and allowed the last unit to reach zero without becoming negative.
- Insufficient and zero stock returned `409` and left the sale, stock, and movement count unchanged.
- A second sequential payment returned `400` without another deduction.
- Cancelling a pending sale did not restore stock; cancelling a paid sale restored the exact quantity and created one `ENTRADA`.
- Repeated cancellation and invalid terminal-state transitions returned `400` without inventory side effects.

## Database validation

Persistence checks covered `Sale`, `SaleItem`, `ProductVariant`, and `InventoryMovement`. The execution compared stored state and movement counts before and after operations and used the movement reason to correlate order number and size. This was necessary because the current `InventoryMovement` model does not store size, previous stock, new stock, responsible user, or sale ID as dedicated fields.

## Authorization validation

TC-SI-013 confirmed that `CLIENTE_B` could not pay a sale owned by `CLIENTE_A`; the API returned `403` and no state or inventory change followed. TC-SI-014 confirmed that a valid `STAFF` session could not call the client-only payment endpoint; middleware returned `403` before the payment service executed.

These results validate the tested API boundaries only. They do not close the separate browser-session defect BUG-AUTH-001.

## Atomicity validation

TC-SI-012 used a `PENDIENTE` sale with two variants: one still available and one insufficient at payment time. The API returned `409`; the available item was not partially deducted, the unavailable item did not become negative, the sale remained `PENDIENTE`, and no new movement was retained. The observed API and database state matched all-or-nothing transaction behavior.

## Findings

- All 16 planned cases passed with no blocked execution.
- No defect was raised from a failed case in this suite.
- BUG-AUTH-001 was discovered independently during exploratory review of the application, outside the formal execution of TR-SI-001. It was not caused by a failed test case and does not change the recorded 16/16 PASS result.

## Known limitations

- Concurrent payment is tracked as R-14 and was not formally executed. Concurrent cancellations, last-unit competition, dispatches, and reception confirmations were also not executed.
- The suite is not browser-based end-to-end automation and does not cover the complete customer-to-fulfillment journey.
- The scope is Sales & Inventory; receiving, replenishment, broader RBAC, authentication lifecycle, usability, accessibility, performance, and security assessment require separate coverage.
- Some controlled preconditions were prepared through Prisma Studio, including zero or insufficient stock before payment.
- The evidence set supports the recorded scenarios but is not a coverage report.
- `TC-SI-002-stock-before-after.txt` is present but empty. TR-SI-001 records stock `3 → 2`, the payment JSON records the successful `PAGADO` result, and the image records the `SALIDA`; however, a separate usable before/after stock artifact was not found and should be recaptured in a future controlled run.

## Conclusion

TR-SI-001 provides evidence that the selected high-risk Sales & Inventory rules behaved as expected in the recorded local environment and version. The strongest result is consistent API/database behavior across accepted and rejected operations, including the multi-item rollback scenario. The outcome supports regression confidence for the tested paths while leaving concurrency, complete RBAC, and end-to-end coverage as explicit residual work.

## Related artifacts

- [Manual test cases](../test-cases/TC-SALES-INVENTORY.md)
- [Detailed test run](../test-runs/TR-SALES-INVENTORY-001.md)
- [Execution evidence](../evidence/TR-SI-001/)
- [Business rules](../requirements/business-rules.md)
- [Traceability matrix](../requirements/traceability-matrix.md)
- [Risk analysis](../test-plan/risk-analysis.md)
- [Related open defect](../defects/BUG-AUTH-001.md)
