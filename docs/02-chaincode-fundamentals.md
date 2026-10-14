# 02. Chaincode Fundamentals

## 1. Objective

This document explains the structure of the CIP Due Diligence smart contract, its interaction with the Fabric ledger, and the initial business functions implemented in JavaScript.

## 2. What Is Chaincode?

Chaincode is the application logic executed by Hyperledger Fabric peers. It defines the transactions that applications can submit to read or modify ledger state.

In this assignment, the chaincode implements startup registration, validator assessment, and subsequent investment-related operations.

The contract is implemented in JavaScript using the Hyperledger Fabric Contract API.

## 3. Project Structure

- `index.js` contains the contract class and transaction functions.
- `package.json` declares the chaincode entry point, runtime requirement, and dependencies.
- `package-lock.json` records the resolved npm dependency tree after installation.

The contract currently exports the `CIPDiligence` class through `module.exports.contracts`.

## 4. Contract Class

The contract imports the Fabric Contract API:

    const { Contract } = require('fabric-contract-api');

The `CIPDiligence` class extends `Contract`. Its methods define the transactions that the chaincode exposes.

The `ctx` argument is the transaction context. It provides access to the ledger stub, client identity, and other transaction-related information.

## 5. Client Organization Identity

The `_getMSP(ctx)` helper calls:

    ctx.clientIdentity.getMSPID()

An MSP ID identifies the Membership Service Provider associated with the submitting identity. The current implementation uses `Org1MSP` for platform operations and `Org2MSP` for validator operations.

An MSP ID identifies an organization, not a specific individual or business role. Additional identity-level authorization is needed if several roles share an organization.

## 6. Transaction Timestamps

The `_getTxTime(ctx)` helper reads the timestamp supplied by Fabric using `ctx.stub.getTxTimestamp()`.

Using the proposal timestamp avoids generating a different wall-clock timestamp independently on each endorsing peer. This supports deterministic execution.

The timestamp helper must still be tested against the installed Fabric dependencies.

## 7. Reading and Writing Ledger State

### Reading state

    const bytes = await ctx.stub.getState(startupId);

The result is a byte buffer. An empty result indicates that no value exists for that key.

### Writing state

    await ctx.stub.putState(
        startupId,
        Buffer.from(JSON.stringify(startup))
    );

The JavaScript object is serialized to JSON and encoded as bytes before being written to the transaction's proposed state.

A successful `putState()` call does not, by itself, mean that the update has been committed. The transaction must pass Fabric's endorsement, ordering, and validation process.

## 8. Implemented Business Functions

### `applyStartup`

Validates required fields, rejects duplicate startup IDs, initializes the startup record, and writes it to the ledger.

### `getStartup`

Reads a startup record and converts its stored JSON back into a JavaScript object.

### `assignValidators`

Checks the submitting organization's MSP ID, parses the validator list, validates the entries, and updates the startup record.

### `submitValidatorReport`

Checks the submitting MSP, confirms that the supplied validator name is assigned to the startup, records the report, and calculates the verification status once all assigned validators have reported.

The current implementation uses validator names supplied as transaction arguments. These names are not independently bound to the caller's certificate.

### `getVerifiedStartups`

Iterates over the chaincode's ledger key range and returns records whose `verificationStatus` is `VERIFIED`.

## 9. Syntax Validation

The command:

    node --check index.js

checks JavaScript syntax without executing the contract or connecting to Fabric.

Passing this check does not establish business-rule correctness, dependency compatibility, successful endorsement, or successful ledger commitment.

## 10. Current Implementation Status

Implemented:

- [x] Contract class and export
- [x] MSP identity helper
- [x] Transaction timestamp helper
- [x] Startup registration
- [x] Startup retrieval
- [x] Validator assignment
- [x] Validator report submission
- [x] Verified-startup query

Pending:

- [ ] Investor questions and responses
- [ ] Investment proposals and responses
- [ ] Milestone creation and verification
- [ ] Fund release and duplicate-payment protection
- [ ] Automated tests
- [ ] Full authorization and state-transition review
- [ ] Chaincode deployment and transaction-flow verification

## 11. Next Steps

Continue implementing the remaining CIP workflow, then test the contract before deploying it to the Fabric test network.
