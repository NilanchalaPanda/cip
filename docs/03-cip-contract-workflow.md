# 03. CIP Contract Workflow

## 1. Startup Verification

`applyStartup` creates a record with `status: NOT_VALIDATED` and `verificationStatus: PENDING`. Org1 assigns validators with `assignValidators`. Each assigned validator submits one `APPROVE` or `REJECT` report through `submitValidatorReport`.

After all assigned validators have submitted reports, the contract sets both `status` and `verificationStatus` to `VERIFIED` if all reports approve, or `REJECTED` if at least one report rejects. Validator reassignment is blocked after a report has been submitted so earlier reports cannot be left attached to a changed validator list.

`getVerifiedStartups` returns records whose `verificationStatus` is `VERIFIED`.

## 2. Investor Queries

### `submitInvestorQuery(startupId, question)`

The caller must belong to `Org2MSP`, the question must be non-empty, and the startup must be verified. The contract appends the question, an empty answer list, and a transaction timestamp to the startup record.

### `answerInvestorQuery(startupId, queryIndex, answer)`

The caller must belong to `Org2MSP`; the answer and query index are validated before the answer is appended. The first query has index `0`.

The current implementation records the answerer's MSP ID as `Org2MSP`, not a specific individual validator. This is consistent with the organization-level identity checks used in this lab, but it does not provide individual role verification.

## 3. Investment Proposals

### `proposeInvestment(startupId, amount)`

An Org2 caller can propose a positive safe-integer amount for a verified startup. The proposal is stored with status `PENDING` and a transaction timestamp.

### `respondToInvestment(startupId, planIndex, response)`

An Org1 caller can respond to a pending proposal with `ACCEPTED` or `REJECTED`. A proposal that has already been answered cannot be answered again.

## 4. Milestones and Fund Release

### `createMilestone(startupId, milestoneId, title, amount)`

An Org1 caller can create a milestone for a verified startup only after an investment proposal has been accepted. The milestone ID must be unique, and the sum of milestone amounts cannot exceed the accepted investment total.

### `verifyMilestone(startupId, milestoneId)`

An Org2 caller can verify a milestone only while its status is `PENDING`. The contract records `verifiedAt` and changes the status to `VERIFIED`.

### `releaseFunds(startupId, milestoneId)`

An Org2 caller can record release only for a `VERIFIED` milestone. The contract marks it `PAID`, records `paidAt`, increments `releasedFunds`, prevents duplicate release, and rejects a release that would exceed the accepted investment total.

This function records the release in the ledger. It does not transfer money through a bank or payment service.

## 5. Status Values

| Record          | Status values                           |
| --------------- | --------------------------------------- |
| Startup         | `NOT_VALIDATED`, `VERIFIED`, `REJECTED` |
| Verification    | `PENDING`, `VERIFIED`, `REJECTED`       |
| Investment plan | `PENDING`, `ACCEPTED`, `REJECTED`       |
| Milestone       | `PENDING`, `VERIFIED`, `PAID`           |

## 6. Authorization Notes

The lab uses `Org1MSP` for platform/startup operations and `Org2MSP` for validator/investor operations. Because validator and investor operations share `Org2MSP`, these checks cannot distinguish the two business roles. The validator name supplied to a report is also not independently verified against the caller's certificate.

## 7. Test Status

The execution log records successful execution of the full workflow on `mychannel`: startup registration, validator reports, verified-startup lookup, investor query and answer, investment proposal and acceptance, milestone creation and verification, and fund release. It also records rejection of an unauthorized validator assignment and a duplicate fund release.

The added investment cap and validator reassignment guard are code changes made after that recorded run. Redeploy the updated contract and rerun the workflow before treating those new rules as network-tested.
