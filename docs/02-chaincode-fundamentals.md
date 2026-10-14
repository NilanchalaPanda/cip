# 02. Chaincode Fundamentals

## 1. Overview

The CIP Due Diligence contract is written in JavaScript using the Hyperledger Fabric Contract API. It stores startup information and the due-diligence and investment workflow in the Fabric ledger.

## 2. Project Files

- `index.js` contains the `CIPDiligence` contract and its transaction functions.
- `package.json` lists the runtime dependencies and scripts.
- `package-lock.json` records the resolved npm dependency versions.

## 3. Contract Context and Identity

Each transaction receives a context (`ctx`). The contract uses `ctx.stub` to read and write ledger state and `ctx.clientIdentity.getMSPID()` to identify the caller's organization.

The current demonstration assigns platform operations to `Org1MSP` and validator/investor operations to `Org2MSP`. An MSP ID identifies an organization, not an individual business role. This setup therefore demonstrates organization-level access checks, not full role separation.

## 4. Transaction Timestamps

`_getTxTime(ctx)` reads the timestamp from `ctx.stub.getTxTimestamp()`. Using the proposal timestamp avoids each endorsing peer independently generating a wall-clock timestamp during execution.

## 5. Ledger State

`_readStartup()` reads a startup record and throws an error if the key does not exist. Records are stored as JSON encoded in a buffer:

```js
await ctx.stub.putState(startupId, Buffer.from(JSON.stringify(startup)));
```

A transaction's state changes become committed only after Fabric's endorsement, ordering, and validation process succeeds.

## 6. Transaction Functions

| Function                | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| `applyStartup`          | Creates a startup record and rejects duplicate IDs.                      |
| `getStartup`            | Reads one startup record.                                                |
| `assignValidators`      | Lets Org1 assign validators before reports are submitted.                |
| `submitValidatorReport` | Records an assigned validator's approval or rejection.                   |
| `getVerifiedStartups`   | Returns startup records whose verification status is `VERIFIED`.         |
| `submitInvestorQuery`   | Adds a query for a verified startup.                                     |
| `answerInvestorQuery`   | Adds an answer to an existing query.                                     |
| `proposeInvestment`     | Adds a positive-amount investment proposal.                              |
| `respondToInvestment`   | Lets Org1 accept or reject a pending proposal.                           |
| `createMilestone`       | Creates a milestone after an investment is accepted.                     |
| `verifyMilestone`       | Marks a pending milestone as verified.                                   |
| `releaseFunds`          | Records payment for a verified milestone and prevents duplicate release. |

## 7. Validation and State Rules

The contract checks required fields, duplicate startup and milestone IDs, validator assignment, duplicate validator reports, valid status transitions, positive safe-integer amounts, and duplicate milestone payments. Milestone allocation and recorded releases are also limited to the total accepted investment amount.

The contract records a fund release in the ledger; it does not transfer real currency. Amounts are stored as integer units, and no currency conversion is performed.

## 8. Syntax Check

Run this from `chaincode/cip_diligence`:

```bash
node --check index.js
```

This verifies JavaScript syntax. The actual transaction results are recorded in `05-cip-diligence-execution-log.md`.
