# BUG-AUTH-001 — Customer profile navigation resolves to an existing privileged STAFF session

## Summary

Customer profile navigation can resolve to an existing privileged STAFF session when valid CLIENT and ADMIN authentication states coexist in the same browser profile.

From the store in CLIENT context, selecting **Mi Perfil** navigates to `/perfil`, resolves the existing ADMIN session, and opens the administrative panel under the ADMIN identity. Administrative functionality remains accessible in the resulting context.

This does not demonstrate that a CLIENT without a valid pre-existing ADMIN session can obtain ADMIN privileges.

## Defect record

| Field | Value |
|---|---|
| ID | BUG-AUTH-001 |
| Module | Authentication / Navigation / Profiles |
| Reported date | August 6, 2026 |
| Reported by | Elvia Gutiérrez García |
| Severity | High |
| Priority | High |
| Status | **OPEN** |
| Discovery context | Independent exploratory review of the application |

## Environment

| Field | Recorded value |
|---|---|
| Original environment | Local development |
| Additional reproduction | Public deployment: `https://doro-fashion-system.vercel.app` |
| Browser / version | Not recorded |
| Browser condition | Valid CLIENT and ADMIN sessions coexist in the same browser profile |
| Original branch | `feature/erp-refactor` |
| Original reference commit | `10c0dc9` |
| Accounts | One valid ADMIN account and one valid CLIENT account |
| Latest reproduction date | August 9, 2026 |

## Preconditions

- A valid ADMIN session already exists in the browser profile.
- A valid CLIENT session also exists in the same browser profile.
- The user is operating from the customer store in the CLIENT context.

## Steps to reproduce

1. Sign in as ADMIN within the browser profile.
2. Keep the ADMIN session valid.
3. Sign in as CLIENT within the same browser profile.
4. From the customer store, select **Mi Perfil**.
5. Observe navigation to `/perfil`.
6. Confirm that the displayed identity belongs to the existing ADMIN session.
7. Navigate to a non-destructive administrative section and confirm that administrative functionality remains accessible.

## Expected result

The customer remains in the store context and sees only the authenticated customer profile. A CLIENT interaction must not resolve to a STAFF profile merely because a STAFF session also exists in the browser.

## Actual result

- The CLIENT-initiated flow resolves the existing ADMIN session.
- The application opens the administrative panel at `/perfil`.
- The active and visible identity is ADMIN.
- Administrative sections and functionality remain accessible from the resulting context.

## Impact and severity rationale

- The account context that initiated the action is lost.
- CLIENT/STAFF separation is compromised.
- The administrative panel is entered under an existing ADMIN session.
- Administrative functionality remains available from the resulting context.

Severity remains **High** because a CLIENT-initiated flow resolves to a privileged existing STAFF identity and its administrative access. This does not prove that a CLIENT without a valid pre-existing ADMIN session can escalate privileges.

## Evidence

The repository contains reproduction evidence:

- [01-client-context.png](../evidence/BUG-AUTH-001/01-client-context.png) — authenticated CLIENT context in the public store before navigation.
- [02-profile-resolves-admin.png](../evidence/BUG-AUTH-001/02-profile-resolves-admin.png) — `/perfil` resolved inside the administrative panel under the existing ADMIN identity.
- [03-admin-panel-access.png](../evidence/BUG-AUTH-001/03-admin-panel-access.png) — non-destructive access to the administrative dashboard from the resulting context.
- [BUG-AUTH-001-reproduction.mp4](../evidence/BUG-AUTH-001/BUG-AUTH-001-reproduction.mp4) — video reproduction of the reported flow.

The evidence confirms reproduction of the open defect. It is not a post-fix retest and does not support closure.

## Root cause

**Root cause: Not confirmed.** Investigation should compare route selection, profile rendering, authentication-context selection, and the separate CLIENT/STAFF session keys when both sessions exist. These are investigation targets, not a root-cause conclusion.

## Workaround

Use a private/incognito window or a different browser profile when CLIENT and STAFF sessions must remain active at the same time.

## Retest

| Field | Value |
|---|---|
| Retest status | **NOT RUN / NOT DOCUMENTED** |
| Fix version or commit | Not available |
| Retest evidence | Not available |
| Closure decision | Not eligible for closure |

## Regression considerations

After a verified fix, regression should cover:

- CLIENT only: **Mi Perfil** opens the customer profile.
- STAFF only: `/perfil` opens the internal profile intentionally.
- Valid CLIENT and STAFF sessions in the same browser profile: navigation preserves its initiating account context.
- Direct access to `/perfil` with each account type and with no session.
- CLIENT token against STAFF-only API routes and STAFF token against CLIENT-only routes returns the expected controlled denial.
- Logging out or expiring one account type does not remove or silently replace the other valid session.

## Relationship to formal test execution

BUG-AUTH-001 was discovered independently during exploratory review of the application, outside the formal execution of TR-SI-001. It was not triggered by or associated with a failed TC-SI case. TR-SI-001 remains 16/16 PASS.


