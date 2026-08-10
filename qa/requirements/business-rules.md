# D'oro Fashion System — Business Rules

## Purpose and source basis

This catalog records business rules that are implemented or explicitly exercised in the current D'oro repository. It was derived from the Sales, Inventory, Authentication, Authorization, and RBAC code; the Prisma schema; the existing test plan; `TC-SALES-INVENTORY.md`; and execution `TR-SI-001`.

The catalog does not represent a client-approved specification. It is a practical requirements-analysis artifact for this portfolio case study. A related test is listed only when a documented test already exists.

## Sales, payment, and inventory

| ID | Domain / Process | Business Rule | Main Risk | Expected System Behavior | Related Test Case(s) |
|---|---|---|---|---|---|
| BR-SALE-001 | Sales / Checkout | Creating a valid customer sale persists it as `PENDIENTE`; creation does not deduct stock or create an inventory movement. | Stock could be reserved or deducted before payment, leaving inventory inconsistent. | One `Sale` and its `SaleItem` records are created; `ProductVariant.stock` and `InventoryMovement` remain unchanged. | TC-SI-001 |
| BR-SALE-002 | Sales / Pricing and availability | The backend rebuilds requested items from active catalog data, aggregates duplicate product-size lines, and uses the persisted sale price rather than trusting a client-supplied price. | Price manipulation, duplicate-line under-validation, or sale of an inactive/unavailable item. | Invalid products, sizes, quantities, or availability are rejected; persisted catalog values are used. | Not formally covered |
| BR-PAY-001 | Payment / Ownership | Simulated payment can be confirmed only by the authenticated `CLIENT` who owns the sale. A `STAFF` account or another client must not perform it. | Unauthorized payment or cross-account access. | The request is rejected with `403`; sale, stock, and movements remain unchanged. | TC-SI-013, TC-SI-014 |
| BR-PAY-002 | Payment / State | Only a `PENDIENTE` sale using `tarjeta` or `oxxo` can enter the simulated-payment flow. | Duplicate payment, payment after cancellation, or an invalid state transition. | An already processed sale is rejected without another stock deduction or `SALIDA`. | TC-SI-006, TC-SI-016 |
| BR-INV-001 | Inventory / Paid sale | A successful payment deducts exactly the purchased quantity from the matching product-size variant and changes the sale to `PAGADO`. Stock may reach zero but must not become negative. | Overselling or deduction from the wrong size. | The selected `ProductVariant` is decremented by the sale quantity; unrelated variants remain unchanged. | TC-SI-002, TC-SI-003 |
| BR-INV-002 | Inventory / Availability | Payment requires sufficient stock for every sale item at payment time, even if stock was sufficient when the sale was created. | Overselling and API/database inconsistency after a rejected payment. | Insufficient or zero stock produces `409`; the sale stays `PENDIENTE`, stock is unchanged, and no movement is retained. | TC-SI-004, TC-SI-005 |
| BR-MOVE-001 | InventoryMovement / Paid sale | Each successfully paid item produces one `SALIDA` with the sold quantity, product, order number, and size correlation. | Missing or duplicated movements and loss of inventory traceability. | A single matching `SALIDA` is persisted for the tested item; no `ENTRADA` is produced by payment. | TC-SI-007 |

## Cancellation, state, and transaction integrity

| ID | Domain / Process | Business Rule | Main Risk | Expected System Behavior | Related Test Case(s) |
|---|---|---|---|---|---|
| BR-CANCEL-001 | Cancellation / Pending sale | A `PENDIENTE` sale may be cancelled by authorized staff without changing inventory because payment has not deducted stock. | Incorrect stock restoration for inventory that was never deducted. | The sale becomes `CANCELADO`; stock and movements remain unchanged. | TC-SI-008 |
| BR-CANCEL-002 | Cancellation / Paid sale | Cancelling a `PAGADO` sale restores each sold quantity to its matching variant and records an `ENTRADA`. | Lost stock, excessive restoration, or incomplete reversal. | Sale state, stock restoration, and movements are committed together; the cancellation reason is retained. | TC-SI-009, TC-SI-010 |
| BR-CANCEL-003 | Cancellation / Idempotency | A sale already in `CANCELADO` cannot be cancelled again. | Duplicate restocking and duplicated `ENTRADA` movements. | The repeated sequential request is rejected with `400`; state, stock, and movement count do not change. | TC-SI-011 |
| BR-STATE-001 | Sales / State transitions | Allowed Sales transitions are `PENDIENTE` → `PAGADO` or `CANCELADO`, and `PAGADO` → `CANCELADO`; `ENVIADO` and `CANCELADO` are terminal in the Sales service. | Invalid lifecycle states and inventory effects applied at the wrong stage. | Unsupported transitions are rejected before persistence or inventory side effects. | TC-SI-001, TC-SI-002, TC-SI-008, TC-SI-009, TC-SI-015, TC-SI-016 |
| BR-TXN-001 | Payment / Transaction atomicity | Payment of a multi-item sale is all-or-nothing across sale state, all variant deductions, and all `SALIDA` movements. | Partial inventory persistence when one line cannot be fulfilled. | If any item fails availability validation, Prisma rolls back every write and the sale remains `PENDIENTE`. | TC-SI-012 |

## Authentication, authorization, and RBAC

| ID | Domain / Process | Business Rule | Main Risk | Expected System Behavior | Related Test Case(s) |
|---|---|---|---|---|---|
| BR-AUTH-001 | Authentication / Account separation | Store customers authenticate as `CLIENT` records and internal personnel authenticate as `STAFF` users. Customer-only and staff-only routes must enforce the expected `accountType`. | A token or session could be used in the wrong application context. | Middleware returns `403` for the wrong account type before the protected operation runs. | TC-SI-014; related defect BUG-AUTH-001 |
| BR-AUTH-002 | Authentication / Session validation | Every authenticated request reloads the account and rejects invalid, inactive, deleted, expired, or altered credentials. | Stale or disabled accounts retaining access. | Invalid credentials return controlled `401` responses; infrastructure failures are not misreported as invalid credentials. | Not formally covered in the manual suite; automated checks exist in `backend/test/auth.middleware.integration.test.js` |
| BR-AUTH-003 | Authorization / Resource ownership | Customer order operations are scoped to `Sale.clientId`; one customer cannot pay another customer's order. | Unauthorized resource access and inventory changes on another customer's sale. | Ownership mismatch returns `403` with no state or inventory side effects. | TC-SI-013 |
| BR-RBAC-001 | Authorization / Staff operations | Internal Sales state changes require a `STAFF` account with effective `ventas:update`; Sales reads require their configured read permission. | Unauthorized staff action or privilege/account-type violation. | The backend authorization boundary rejects missing account type or permissions before invoking the controller action. | Not formally covered as a negative permission case in `TC-SALES-INVENTORY.md` |
| BR-RBAC-002 | RBAC / ADMIN | `ADMIN` has global access to registered staff permissions; primary-administrator-only invariants remain separate from functional permissions. | An administrator could lose required operational access or a secondary admin could cross a protected invariant. | Functional permission checks treat `ADMIN` as global; primary-admin middleware still applies where configured. | Not formally covered in the manual suite; automated checks exist in authorization tests |
| BR-RBAC-003 | RBAC / BODEGUERO | `BODEGUERO` access is based on role permissions plus individual grants minus revocations; administrative permissions cannot be individually granted to this role. | Excess privilege or incorrect warehouse access. | Effective permissions are resolved from current database state and administrative grants are filtered. | Not formally covered in the manual suite; automated checks exist in authorization tests |

## Traceability and data-model constraints

| ID | Domain / Process | Business Rule | Main Risk | Expected System Behavior | Related Test Case(s) |
|---|---|---|---|---|---|
| BR-TRACE-001 | InventoryMovement / Auditability | A Sales inventory movement persists `productId`, `tipo`, `cantidad`, `motivo`, and `createdAt`; order and size are correlated through `motivo`. | An inventory effect cannot be connected to the business operation that produced it. | Payment and paid-sale cancellation retain the expected `SALIDA` → `ENTRADA` trail for the order. | TC-SI-007, TC-SI-010 |

`InventoryMovement` does not currently persist size, previous stock, new stock, responsible user, or sale ID as dedicated fields. The executed suite therefore compared before/after state and used the movement reason for correlation. This is a documented model limitation, not evidence of an additional defect.
