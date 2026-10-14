# 03. CIP Contract Workflow

## 1. Objective

This document describes the business workflow implemented by the CIP Due Diligence chaincode, including startup verification and investor queries.

## 2. Startup Verification Prerequisite

A startup is registered with an initial `verificationStatus` of `PENDING`.

The platform assigns validators. Assigned validators submit reports with a decision of `APPROVE` or `REJECT`. Once all assigned validators have submitted their reports, the contract calculates the final verification status.

The current implementation uses the following statuses:

- `PENDING` — verification is incomplete.
- `VERIFIED` — all submitted validator decisions are approvals.
- `REJECTED` — at least one submitted validator decision is a rejection, once all required reports are present.

## 3. Investor Query Workflow

### Transaction: `submitInvestorQuery`

**Arguments:** `startupId`, `question`

The transaction:

1. Checks that the submitting identity belongs to `Org2MSP`.
2. Validates that the question is non-empty.
3. Loads the startup record.
4. Requires the startup to have `verificationStatus` equal to `VERIFIED`.
5. Appends the question, an empty answer list, and the transaction timestamp to `investorQueries`.
6. Writes the updated startup record to the ledger.

### Transaction: `answerInvestorQuery`

**Arguments:** `startupId`, `queryIndex`, `answer`

The transaction:

1. Checks that the submitting identity belongs to `Org2MSP`.
2. Validates that the answer is non-empty.
3. Loads the startup record.
4. Checks that `queryIndex` is a valid integer referring to an existing question.
5. Appends the answer and transaction timestamp to the question's `answers` array.
6. Writes the updated startup record to the ledger.

## 4. Array Indexing

The `queryIndex` argument identifies a question by its position in `investorQueries`. The first question has index `0`, the second has index `1`, and so on.

Array indices are simple for a learning assignment, but they are less stable than unique query IDs if records are ever reordered or removed.

## 5. Authorization Limitation

The assignment uses `Org2MSP` for both investor and validator operations. Checking the MSP ID alone therefore cannot distinguish these two roles. The current checks demonstrate organization-level authorization, not complete role-level authorization.

## 6. Timestamp Consistency

The query and answer timestamps use the contract's `_getTxTime(ctx)` helper, which reads the Fabric transaction timestamp rather than generating a timestamp from the local system clock.

## 7. Investment Proposal Workflow

### Transaction: `proposeInvestment`

**Arguments:** `startupId`, `amount`

The transaction:

1. Checks that the submitting identity belongs to `Org2MSP`.
2. Converts the supplied amount into a number and requires a positive safe integer.
3. Loads the startup record.
4. Requires the startup to be verified.
5. Appends an investment plan with the investor MSP ID, amount, `PENDING` status, proposal timestamp, and an empty response timestamp.
6. Writes the updated startup record to the ledger.

### Transaction: `respondToInvestment`

**Arguments:** `startupId`, `planIndex`, `response`

The transaction:

1. Checks that the submitting identity belongs to `Org1MSP`.
2. Accepts only `ACCEPTED` or `REJECTED` as a response.
3. Loads the startup record and validates the plan index.
4. Requires the proposal to still have `PENDING` status.
5. Records the response and transaction timestamp.
6. Writes the updated startup record to the ledger.

### Investment Statuses

- `PENDING` — the proposal has not been answered.
- `ACCEPTED` — the proposal has been accepted.
- `REJECTED` — the proposal has been rejected.

Accepting a proposal does not itself release funds. Fund release is handled by a separate milestone-based workflow.

### Authorization Note

The current implementation treats `Org1MSP` as the platform/startup side and `Org2MSP` as the investor/validator side. These are demonstration-level organization checks, not distinct business-role identities.

## 8. Current Status

- [x] Startup registration and retrieval
- [x] Validator assignment and report submission
- [x] Verified-startup query
- [x] Investor questions and responses
- [x] Investment proposals and responses
- [ ] Milestone creation and verification
- [ ] Fund release and duplicate-payment protection
- [ ] Automated tests
- [ ] Authorization and state-transition review

## 9. Milestone and Fund Release Workflow

### Transaction: `createMilestone`

**Arguments:** `startupId`, `milestoneId`, `title`, `amount`

The transaction:

1. Checks that the caller belongs to `Org1MSP`.
2. Validates the milestone ID, title, and positive safe-integer amount.
3. Loads the startup and requires it to be verified.
4. Rejects duplicate milestone IDs within that startup.
5. Creates a milestone with `PENDING` status and transaction timestamp.
6. Writes the updated startup record to the ledger.

### Transaction: `verifyMilestone`

**Arguments:** `startupId`, `milestoneId`

The transaction:

1. Checks that the caller belongs to `Org2MSP`.
2. Loads the startup and locates the milestone.
3. Requires the milestone to exist and have `PENDING` status.
4. Changes its status to `VERIFIED` and records `verifiedAt`.
5. Writes the updated startup record to the ledger.

### Transaction: `releaseFunds`

**Arguments:** `startupId`, `milestoneId`

The transaction:

1. Checks that the caller belongs to `Org2MSP`.
2. Loads the startup and locates the milestone.
3. Rejects a milestone that has already been paid.
4. Requires the milestone to have `VERIFIED` status.
5. Adds the milestone's stored amount to `releasedFunds`, after checking the resulting total is a safe integer.
6. Changes the milestone status to `PAID`, records `paidAt`, and writes the updated startup record.

This transaction records a release in the ledger. It does not initiate a bank transfer or move real money.

### Milestone Statuses

- `PENDING` — created but not verified.
- `VERIFIED` — approved for release.
- `PAID` — the release has been recorded.

### Important Limitation

The current implementation checks organization membership, not distinct investor and validator roles. Both roles use `Org2MSP`, so additional identity-level authorization would be needed to distinguish them reliably.

## 10. Current Status

- [x] Startup registration and retrieval
- [x] Validator assignment and report submission
- [x] Verified-startup query
- [x] Investor questions and responses
- [x] Investment proposals and responses
- [x] Milestone creation and verification
- [x] Milestone-based release recording
- [ ] Automated tests
- [ ] Authorization and state-transition review
- [ ] Chaincode deployment and end-to-end verification

## 11. Next Step

Run syntax checks, review the full contract for inconsistent state transitions, and add automated tests before deploying it to the Fabric test network.
