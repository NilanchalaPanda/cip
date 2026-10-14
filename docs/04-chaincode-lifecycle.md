# 04. Chaincode Lifecycle

## 1. Install Dependencies and Check Syntax

From `chaincode/cip_diligence`:

```bash
npm install
node --check index.js
```

The syntax check passed during the recorded work. npm reported four high-severity audit findings and a pending install-script approval for `protobufjs`; these warnings were left for review rather than applying automatic dependency upgrades.

## 2. Deploy Chaincode

Commands were run from `fabric-samples/test-network`. The chaincode was deployed to the existing `mychannel` channel with name `cip`, JavaScript language, version `1.0`, and sequence `1`. After the contract was updated, it was deployed again at sequence `2`.

The execution log records successful installation, organization approvals, and commit for sequence `2`.

## 3. Test Transactions

Use the CLI identity for the organization that is allowed to submit each transaction. The recorded workflow and the exact commands/results are in `05-cip-diligence-execution-log.md`.

## 4. Important Notes

- The existing `mychannel` was reused because it was already present.
- Do not run `network.sh down`, remove Docker volumes, or prune Docker resources just to repeat this assignment; the machine contains artifacts from other exercises.
- The additional status, investment-cap, and reassignment checks documented in `03-cip-contract-workflow.md` were added after the logged sequence-2 run. Redeploy and rerun tests to verify these changes on the network.
