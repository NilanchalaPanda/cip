# 01. Environment Setup

## 1. Environment

The assignment was run on Fedora Linux using the existing Hyperledger Fabric installation.

| Component       | Version or path                                              |
| --------------- | ------------------------------------------------------------ |
| Workspace       | `/home/nxl/Projects/hyperledger`                             |
| Fabric samples  | `/home/nxl/Projects/hyperledger/fabric-samples`              |
| Test network    | `/home/nxl/Projects/hyperledger/fabric-samples/test-network` |
| Fabric binaries | `/home/nxl/Projects/hyperledger/bin`                         |
| Fabric config   | `/home/nxl/Projects/hyperledger/config`                      |
| Docker          | 29.8.2                                                       |
| Docker Compose  | 5.6.0                                                        |
| Node.js         | v24.18.1                                                     |
| npm             | 11.16.0                                                      |
| Fabric peer     | v2.5.16 (`f871cf9`)                                          |

## 2. Workspace

The assignment files are kept in `cip-diligence-lab/` so they remain separate from the existing Fabric samples.

- `chaincode/cip_diligence/` contains the JavaScript contract and npm files.
- `docs/` contains the setup notes, contract explanation, workflow, lifecycle notes, and execution log.

## 3. Existing Network State

The machine already contained containers and artifacts from earlier Fabric exercises. I checked the existing setup before starting the test network. The `cartrade-sdk` container was unrelated to this assignment and was left untouched.

The test network was started from `fabric-samples/test-network`. The `mychannel` channel already existed, so the attempt to create it again could not join the existing ledger. I continued using the existing channel rather than deleting or recreating network data.

## 4. Chaincode Dependencies

From `cip-diligence-lab/chaincode/cip_diligence`, the dependencies were installed with `npm install`. The installed top-level packages included `fabric-contract-api@2.5.8`, `fabric-shim@2.5.8`, and `mocha@10.8.2`.

The JavaScript syntax check is:

```bash
node --check index.js
```

This checks syntax only. The transaction results recorded in `05-cip-diligence-execution-log.md` document the network tests.

## 5. Result

The chaincode was deployed to `mychannel` as version `1.0`, sequence `1`, and then upgraded to sequence `2`. The end-to-end workflow and two negative cases are recorded in the execution log.

The npm installation reported four high-severity audit findings and a pending install-script approval for `protobufjs`. These warnings were not resolved by automatically applying dependency upgrades.
