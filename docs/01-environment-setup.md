# 01. Local Environment Setup

## 1. Objective

The objective of this phase is to inspect and prepare the local development environment for executing the CIP Due Diligence project using Hyperledger Fabric. Before deploying the chaincode, the existing Fabric installation, dependencies, Docker containers, and network configuration are checked to avoid unnecessary reinstallation or disruption of previous work.

## 2. Development Environment

| Component | Current Details |
|---|---|
| Operating system | Fedora Linux |
| Project workspace | `/home/nxl/Projects/hyperledger` |
| Fabric samples directory | `/home/nxl/Projects/hyperledger/fabric-samples` |
| Fabric test network | `/home/nxl/Projects/hyperledger/fabric-samples/test-network` |
| Fabric binaries | `/home/nxl/Projects/hyperledger/bin` |
| Fabric configuration | `/home/nxl/Projects/hyperledger/config` |
| Docker | 29.8.2 |
| Docker Compose | 5.6.0 |
| Node.js | v24.18.1 |
| npm | 11.16.0 |
| Hyperledger Fabric peer binary | v2.5.16 |
| Go CLI | Not currently available through the shell's PATH |
| Network status | Not running at the time of inspection; existing containers were found stopped |
| CIP chaincode deployment | Pending verification |

## 3. Workspace Organization

A dedicated workspace was created for the CIP Due Diligence assignment.

**Workspace:** `/home/nxl/Projects/hyperledger/cip-diligence-lab`

The following directories were created:

- `docs/` — Technical documentation organized by topic.
- `logs/` — Command output, execution logs, and error records.
- `evidence/` — Screenshots and other verification evidence.
- `notes/` — Learning notes, observations, and troubleshooting details.

The existing Fabric samples directory is being preserved so that the new assignment does not unnecessarily modify previous work.

## 4. Existing Fabric Installation

The local Fabric installation contains the following binaries:

- `peer` — Interacts with peers and executes Fabric CLI operations.
- `orderer` — Runs the ordering service.
- `configtxgen` — Generates channel and ordering-service configuration artifacts.
- `cryptogen` — Generates cryptographic identities and certificates.
- `fabric-ca-client` and `fabric-ca-server` — Support certificate authority operations.

The installed peer binary reports Hyperledger Fabric version 2.5.16, with commit SHA `f871cf9`.

The Fabric configuration directory contains `core.yaml`, `orderer.yaml`, and `configtx.yaml`.

## 5. Initial Docker Inspection

The `docker ps` command showed one running container named `cartrade-sdk`. No Fabric peer, orderer, or certificate authority container was running at the time of inspection.

The `docker ps -a` command showed previously created Fabric containers, including:

- `peer0.org1.example.com`
- `peer0.org2.example.com`
- `peer0.org3.example.com`
- `orderer.example.com`
- Certificate authority containers for the organizations and orderer

Previously created chaincode containers associated with `vehicle` and `erc20` were also present.

These results indicate that the machine contains artifacts from earlier Fabric exercises. The state of the previous network and the presence of a channel or committed chaincode must be verified before starting or recreating the network.

## 6. Prerequisites Requiring Verification

The following checks remain pending:

1. Verify the installed Fabric binary versions.
2. Verify the network script and its supported commands.
3. Confirm the compatibility of the installed Node.js version with the chaincode runtime.
4. Check whether the Go toolchain is required for the remaining tasks.
5. Determine whether the existing network can be reused or whether a separate clean test network is preferable.

## 7. Initial Conclusion

The local environment already contains Hyperledger Fabric binaries, configuration files, sample projects, and previous Docker artifacts. Therefore, the next step is to verify the existing installation and network configuration rather than reinstalling Fabric immediately.

No network startup, teardown, or chaincode redeployment has been performed as part of this initial inspection.

## 8. Evidence and Verification

Evidence to add as the environment checks are completed:

- [x] Fabric binary version output
- [x] Fabric network script help output
- [x] Docker container status
- [x] Network configuration inspection
- [ ] Final confirmation that the environment is ready for the CIP assignment
