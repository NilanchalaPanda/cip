# Hyperledger Fabric CIP Due Diligence Lab

## Execution Log, Commands, and Observed Outputs

**Workspace:** `/home/nxl/Projects/hyperledger/cip-diligence-lab`\
**Fabric samples:** `/home/nxl/Projects/hyperledger/fabric-samples`\
**Network directory:**
`/home/nxl/Projects/hyperledger/fabric-samples/test-network`\
**Channel:** `mychannel`\
**Chaincode name:** `cip`\
**Chaincode version / sequence:** `1.0` / `2` (sequence 1 was deployed first; sequence 2 contains the complete workflow used in the tests below)\
**Execution date:** 15 October 2026 (local terminal timestamps shown in
IST)

> This document records the commands and terminal results shared during
> the lab session. Exact outputs are quoted where they were supplied.
> For longer setup/deployment operations, the output section records the
> key result that was observed, not a fabricated full terminal
> transcript. Commands that are future steps are intentionally not
> included as completed work.

---

## 1. Environment and project preparation

### 1.1 Environment versions observed

The following versions were reported during setup:

---

Component Observed version / detail

---

Hyperledger Fabric peer binary `v2.5.16`

Docker Engine `29.8.2`

Docker Compose `5.6.0`

Node.js `v24.18.1`

npm `11.16.0`

JavaScript chaincode dependencies `fabric-contract-api@2.5.8`,
`fabric-shim@2.5.8`

Local Fabric images Fabric `v2.5.16`; CA `v1.5.17`
-----------------------------------------------------------------------

The Fabric sample network and the CIP lab were kept separate. The
chaincode path used by `network.sh` was:

```text
../../cip-diligence-lab/chaincode/cip_diligence
```

### 1.2 Install chaincode dependencies

**Run from:**

```bash
cd /home/nxl/Projects/hyperledger/cip-diligence-lab/chaincode/cip_diligence
```

**Command:**

```bash
npm install
```

**Purpose:** Installs the dependencies declared by the chaincode
package, including the Fabric contract/shim libraries and the Mocha
development dependency.

**Observed result:** Installation succeeded. Installed versions
included:

```text
fabric-contract-api@2.5.8
fabric-shim@2.5.8
mocha@10.8.2
```

npm reported four high-severity audit findings and noted that approval
was pending for a `protobufjs@7.6.6` install script. These warnings were
not automatically fixed. Avoid running `npm audit fix --force` or
approving scripts without reviewing the consequences.

### 1.3 Check JavaScript syntax

**Run from the chaincode directory.**

**Command:**

```bash
node --check index.js
```

**Purpose:** Parses `index.js` to catch JavaScript syntax errors without
invoking the contract.

**Observed result:** Passed with no syntax-error output.

---

## 2. Start the Fabric test network

### 2.1 Start peers and orderer

**Run from:**

```bash
cd /home/nxl/Projects/hyperledger/fabric-samples/test-network
```

**Command:**

```bash
./network.sh up
```

**Purpose:** Starts the Fabric test network using the locally available
Fabric images.

**Observed result:** The network started successfully with these main
containers:

- `orderer.example.com`
- `peer0.org1.example.com`
- `peer0.org2.example.com`

The network used Fabric `v2.5.16`. The command displayed a warning about
orphan containers from earlier runs. That warning was noted; unrelated
containers and old artifacts were not cleaned up.

### 2.2 Attempt to create `mychannel`

**Command:**

```bash
./network.sh createChannel -c mychannel
```

**Observed result:** The command failed while joining the channel
because the local peer ledger already had `mychannel` in the `ACTIVE`
state. The network's channel-artifact generation had regenerated
`channel-artifacts/mychannel.block`, but the channel itself already
existed on the peer.

A peer channel listing showed both:

```text
cartrade-channel
mychannel
```

**Decision:** Do not recreate or reset the existing channel. Continue
using the already active `mychannel`.

---

## 3. Configure the CLI for Org1

The following exports were used from the `test-network` directory. They
configure the `peer` CLI to submit transactions as the Org1
administrator.

```bash
export PATH="/home/nxl/Projects/hyperledger/bin:$PATH"
export FABRIC_CFG_PATH="/home/nxl/Projects/hyperledger/config"

export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH="$PWD/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE="$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
```

**Purpose of the important variables:**

- `PATH`: Makes the Fabric CLI binaries available.
- `FABRIC_CFG_PATH`: Points to the Fabric configuration directory.
- `CORE_PEER_LOCALMSPID`: Sets the client's organization identity to
  `Org1MSP`.
- `CORE_PEER_MSPCONFIGPATH`: Points to the Org1 administrator's MSP
  identity.
- `CORE_PEER_ADDRESS`: Selects Org1's peer at `localhost:7051`.
- `CORE_PEER_TLS_ENABLED` and `CORE_PEER_TLS_ROOTCERT_FILE`: Enable
  TLS and identify the peer's TLS root certificate.

The shell's working directory matters because the certificate paths use
`$PWD`.

---

## 4. Deploy the JavaScript chaincode

**Run from:** `fabric-samples/test-network`

**Command:**

```bash
./network.sh deployCC \
  -c mychannel \
  -ccn cip \
  -ccp ../../cip-diligence-lab/chaincode/cip_diligence \
  -ccl javascript \
  -ccv 1.0 \
  -ccs 1
```

**What the options mean:**

Option Meaning

---

`-c mychannel` Deploy on the existing channel `mychannel`.
`-ccn cip` Name the chaincode `cip`.
`-ccp ...` Path to the CIP JavaScript chaincode package.
`-ccl javascript` Use JavaScript as the chaincode language.
`-ccv 1.0` Set the chaincode definition version to `1.0`.
`-ccs 1` Set the chaincode definition sequence to `1`.

**Observed result:** Deployment succeeded. The package `cip_1.0` was
installed on Org1 and Org2; both organizations' approvals were true; and
the `cip` chaincode definition was committed to `mychannel` at version
`1.0`, sequence `1`. Org3's approval was false, which was expected for
the configured deployment and was not required by this flow.

---

## 5. Register a startup

### 5.1 Invoke `applyStartup`

**Run from:** `fabric-samples/test-network`, with the network running.

**Command:**

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n cip \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem" \
  -c '{"function":"applyStartup","Args":["startup001","Acme Innovations","India","Rahul Sharma","rahul@example.com"]}'
```

**Purpose:** Submits a transaction to register startup `startup001`,
named `Acme Innovations`, in India, with founder `Rahul Sharma` and
email `rahul@example.com`.

**Observed output:**

```text
2026-10-15 00:16:14.030 IST 0001 INFO [chaincodeCmd] chaincodeInvokeOrQuery -> Chaincode invoke successful. result: status:200 payload:"Startup startup001 registered successfully"
```

**Result:** Startup registration succeeded.

### 5.2 Query the registered startup with `getStartup`

**Command:**

```bash
peer chaincode query \
  -C mychannel \
  -n cip \
  -c '{"function":"getStartup","Args":["startup001"]}'
```

**Purpose:** Reads the startup record from the ledger without submitting
a write transaction.

**Observed output:**

```json
{
  "id": "startup001",
  "name": "Acme Innovations",
  "country": "India",
  "founder": "Rahul Sharma",
  "email": "rahul@example.com",
  "status": "NOT_VALIDATED",
  "verificationStatus": "PENDING",
  "validators": [],
  "validatorReports": [],
  "investorQueries": [],
  "investmentPlans": [],
  "milestones": [],
  "releasedFunds": 0,
  "createdAt": "2026-10-14T18:46:13.000Z"
}
```

**Interpretation:** The record exists. Initially, it has no assigned
validators or reports, and its `verificationStatus` is `PENDING`.

---

## 6. Assign validators

### 6.1 Invoke `assignValidators`

**Command:**

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n cip \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"assignValidators","Args":["startup001","[\\"Validator A\\",\\"Validator B\\"]"]}'
```

**Purpose:** Assigns `Validator A` and `Validator B` to `startup001`.
This operation is restricted by the current chaincode to `Org1MSP`, the
platform organization. At this point, the terminal was configured for
Org1.

**Observed output:**

```text
2026-10-15 00:17:52.328 IST 0001 INFO [chaincodeCmd] chaincodeInvokeOrQuery -> Chaincode invoke successful. result: status:200 payload:"Validators assigned to startup startup001"
```

### 6.2 Confirm validator assignment

**Command:**

```bash
peer chaincode query \
  -C mychannel \
  -n cip \
  -c '{"function":"getStartup","Args":["startup001"]}'
```

**Observed output:**

```json
{
  "id": "startup001",
  "name": "Acme Innovations",
  "country": "India",
  "founder": "Rahul Sharma",
  "email": "rahul@example.com",
  "status": "NOT_VALIDATED",
  "verificationStatus": "PENDING",
  "validators": ["Validator A", "Validator B"],
  "validatorReports": [],
  "investorQueries": [],
  "investmentPlans": [],
  "milestones": [],
  "releasedFunds": 0,
  "createdAt": "2026-10-14T18:46:13.000Z"
}
```

**Result:** Both validators are recorded. Verification remains `PENDING`
because no reports have yet been submitted.

---

## 7. Switch the CLI identity to Org2

The validator-report transactions were submitted using the Org2
administrator identity. Run these exports from the same `test-network`
directory:

```bash
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_MSPCONFIGPATH="$PWD/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
export CORE_PEER_ADDRESS=localhost:9051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE="$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
```

Verify the active CLI settings:

```bash
echo "$CORE_PEER_LOCALMSPID"
echo "$CORE_PEER_ADDRESS"
```

**Observed output:**

```text
Org2MSP
localhost:9051
```

At one point, the expected output was accidentally entered as commands:

```text
Org2MSP
localhost:9051
zsh: Org2MSP: command not found...
zsh: localhost:9051: command not found...
```

This was a harmless shell usage mistake. The exports had already
succeeded; no repair was required.

---

## 8. Submit validator reports

### 8.1 Submit Validator A's approval

**Command:**

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n cip \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"submitValidatorReport","Args":["startup001","Validator A","Due diligence report: documents checked.","APPROVE"]}'
```

**Purpose:** Submits Validator A's due-diligence report with the
decision `APPROVE`. The chaincode checks that the caller belongs to Org2
and that the validator name is assigned to the startup.

**Observed output:**

```text
2026-10-15 00:18:41.873 IST 0001 INFO [chaincodeCmd] chaincodeInvokeOrQuery -> Chaincode invoke successful. result: status:200 payload:"Validator report recorded for startup startup001"
```

### 8.2 Submit Validator B's approval

**Command:**

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n cip \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"submitValidatorReport","Args":["startup001","Validator B","Due diligence report: financial and registration documents verified.","APPROVE"]}'
```

**Purpose:** Submits Validator B's approval. Once every assigned
validator has submitted a report, the current chaincode calculates the
startup's verification result.

**Observed output:**

```text
2026-10-15 00:19:19.780 IST 0001 INFO [chaincodeCmd] chaincodeInvokeOrQuery -> Chaincode invoke successful. result: status:200 payload:"Validator report recorded for startup startup001"
```

### 8.3 Confirm final verification state

**Command:**

```bash
peer chaincode query \
  -C mychannel \
  -n cip \
  -c '{"function":"getStartup","Args":["startup001"]}'
```

**Observed output:**

```json
{
  "id": "startup001",
  "name": "Acme Innovations",
  "country": "India",
  "founder": "Rahul Sharma",
  "email": "rahul@example.com",
  "status": "NOT_VALIDATED",
  "verificationStatus": "VERIFIED",
  "validators": ["Validator A", "Validator B"],
  "validatorReports": [
    {
      "validatorName": "Validator A",
      "report": "Due diligence report: documents checked.",
      "decision": "APPROVE",
      "submittedAt": "2026-10-14T18:48:41.000Z"
    },
    {
      "validatorName": "Validator B",
      "report": "Due diligence report: financial and registration documents verified.",
      "decision": "APPROVE",
      "submittedAt": "2026-10-14T18:49:19.000Z"
    }
  ],
  "investorQueries": [],
  "investmentPlans": [],
  "milestones": [],
  "releasedFunds": 0,
  "createdAt": "2026-10-14T18:46:13.000Z"
}
```

**Result:** Both reports were recorded, and `verificationStatus` changed
to `VERIFIED`.

**Implementation note:** The record's separate `status` field remains
`NOT_VALIDATED` even though `verificationStatus` is `VERIFIED`. This is
the observed behavior of the current chaincode and should be reviewed to
determine whether the fields represent distinct concepts or whether
`status` should also change.

---

## 9. Retrieve all verified startups

**Command:**

```bash
peer chaincode query \
  -C mychannel \
  -n cip \
  -c '{"function":"getVerifiedStartups","Args":[]}'
```

**Purpose:** Queries the chaincode function that scans ledger startup
records and returns only records whose `verificationStatus` is
`VERIFIED`.

**Observed output:**

```json
[
  {
    "id": "startup001",
    "name": "Acme Innovations",
    "country": "India",
    "founder": "Rahul Sharma",
    "email": "rahul@example.com",
    "status": "NOT_VALIDATED",
    "verificationStatus": "VERIFIED",
    "validators": ["Validator A", "Validator B"],
    "validatorReports": [
      {
        "validatorName": "Validator A",
        "report": "Due diligence report: documents checked.",
        "decision": "APPROVE",
        "submittedAt": "2026-10-14T18:48:41.000Z"
      },
      {
        "validatorName": "Validator B",
        "report": "Due diligence report: financial and registration documents verified.",
        "decision": "APPROVE",
        "submittedAt": "2026-10-14T18:49:19.000Z"
      }
    ],
    "investorQueries": [],
    "investmentPlans": [],
    "milestones": [],
    "releasedFunds": 0,
    "createdAt": "2026-10-14T18:46:13.000Z"
  }
]
```

**Result:** `startup001` appeared in the returned array with both
approval reports. This confirms that the verified-startup query works
against the current ledger state.

---

## 10. Negative test: Org2 must not assign validators

The terminal was still configured for `Org2MSP`. The following
invocation attempted to assign an unauthorized validator to
`startup001`.

**Command:**

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n cip \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"assignValidators","Args":["startup001","[\\"Unauthorized Validator\\"]"]}'
```

**Purpose:** Verifies that the Org1-only access-control rule is enforced
even when an Org2 caller submits the transaction to both peers.

**Observed output:**

```text
Error: endorsement failure during invoke. response: status:500 message:"Only the platform can assign validators"
```

**Result:** The chaincode rejected the operation, as expected. The
rejection demonstrates that the current `assignValidators` function
checks the caller's MSP identity.

---

## 11. Test summary

The following table summarizes the setup, deployment, business workflow, and negative tests completed during the lab.

| No. | Test / Action | Function / Command | Result | Notes |
| --: | --- | --- | --- | --- |
| 1 | JavaScript syntax check | `node --check index.js` | **Passed** | No syntax errors detected. |
| 2 | Start Fabric network | `./network.sh up` | **Passed** | Orderer and Org1/Org2 peers started. |
| 3 | Create channel | `./network.sh createChannel -c mychannel` | **Existing channel** | `mychannel` already existed and was reused. |
| 4 | Initial chaincode deployment | `./network.sh deployCC ... -ccs 1` | **Passed** | Version 1.0, sequence 1. |
| 5 | Register startup | `applyStartup` | **Passed** | Registered `startup001` — Acme Innovations. |
| 6 | Read startup | `getStartup` | **Passed** | Retrieved the startup record. |
| 7 | Assign validators | `assignValidators` — Org1 | **Passed** | Assigned Validator A and Validator B. |
| 8 | Submit Validator A report | `submitValidatorReport` — Org2 | **Passed** | Approval report recorded. |
| 9 | Submit Validator B report | `submitValidatorReport` — Org2 | **Passed** | Approval report recorded. |
| 10 | Verify startup | `getStartup` | **Passed** | `verificationStatus` became `VERIFIED`. |
| 11 | List verified startups | `getVerifiedStartups` | **Passed** | Returned `startup001`. |
| 12 | Unauthorized validator assignment | `assignValidators` — Org2 | **Rejected as expected** | `Only the platform can assign validators`. |
| 13 | Redeploy updated chaincode | `./network.sh deployCC ... -ccs 2` | **Passed** | Sequence 2 committed; ledger data persisted. |
| 14 | Submit investor query | `submitInvestorQuery` — Org2 | **Passed** | Submitted Year 1 projected-revenue question. |
| 15 | Answer investor query | `answerInvestorQuery` — Org2 | **Passed** | Answer recorded for query index 0. |
| 16 | Propose investment | `proposeInvestment` — Org2 | **Passed** | Proposed 50,000,000 units; initially pending. |
| 17 | Accept investment proposal | `respondToInvestment` — Org1 | **Passed** | Proposal index 0 accepted. |
| 18 | Create milestone | `createMilestone` — Org1 | **Passed** | Created `M1`, Prototype Completion, amount 10,000,000. |
| 19 | Verify milestone | `verifyMilestone` — Org2 | **Passed** | `M1` verified. |
| 20 | Release milestone funds | `releaseFunds` — Org2 | **Passed** | `M1` marked `PAID`; `releasedFunds` became 10,000,000. |
| 21 | Query final startup record | `getStartup` | **Passed** | Query, answer, accepted investment, paid milestone, and released total were present. |
| 22 | Attempt duplicate fund release | `releaseFunds` — Org2 | **Rejected as expected** | `Funds have already been released for this milestone`. |

### Test Outcome

The end-to-end business workflow was executed successfully: startup registration, validator assignment and approvals, verified-startup lookup, investor query and answer, investment proposal and acceptance, milestone creation and verification, and fund release. The authorization and duplicate-release negative tests were also rejected as expected.

The chaincode definition was upgraded from sequence 1 to sequence 2. The existing startup record and its ledger state remained available after the upgrade.

### Final consistency note

The final `getStartup` output showed `status: "NOT_VALIDATED"` while `verificationStatus: "VERIFIED"`. This is observed behavior in the current contract and should be reviewed against the assignment's expected meaning for the two fields before making a code change.

---

## 12. Upgrade chaincode definition to sequence 2

After the initial tests, the local chaincode contained the complete workflow functions. The chaincode definition was upgraded to sequence 2 on `mychannel`.

**Run from:** `fabric-samples/test-network`

**Command:**

```bash
./network.sh deployCC \
  -c mychannel \
  -ccn cip \
  -ccp ../../cip-diligence-lab/chaincode/cip_diligence \
  -ccl javascript \
  -ccv 1.0 \
  -ccs 2
```

**Observed result:** The package was installed on Org1 and Org2, both organizations approved the definition, and sequence 2 was committed successfully. The command printed `scripts/envVar.sh: line 86: [: too many arguments` during installation checks, but the installation, approvals, and commit all completed successfully.

The final lifecycle query reported:

```text
Committed chaincode definition for chaincode 'cip' on channel 'mychannel':
Version: 1.0, Sequence: 2, Endorsement Plugin: escc, Validation Plugin: vscc, Approvals: [Org1MSP: true, Org2MSP: true, Org3MSP: false]
```

Org3's approval remained false; Org1 and Org2 were the organizations used for this workflow.

### 12.1 Verify existing ledger data after the upgrade

**Command:**

```bash
peer chaincode query \
  -C mychannel \
  -n cip \
  -c '{"function":"getStartup","Args":["startup001"]}'
```

**Observed result:** `startup001` remained in the ledger. Its validator list and both approval reports were preserved, and `verificationStatus` remained `VERIFIED`. The upgrade did not erase the existing startup state.

---

## 13. Submit and answer an investor query

### 13.1 Submit the query

**CLI identity:** Org2MSP

**Command:**

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n cip \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"submitInvestorQuery","Args":["startup001","What is your projected revenue for Year 1?"]}'
```

**Observed output:**

```text
2026-10-15 00:29:49.387 IST 0001 INFO [chaincodeCmd] chaincodeInvokeOrQuery -> Chaincode invoke successful. result: status:200 payload:"Investor query submitted for startup startup001"
```

### 13.2 Answer the first query

The first query has index `0`.

**Command:**

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n cip \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"answerInvestorQuery","Args":["startup001","0","Projected revenue is 5 crore INR in Year 1."]}'
```

**Observed output:**

```text
2026-10-15 00:30:09.162 IST 0001 INFO [chaincodeCmd] chaincodeInvokeOrQuery -> Chaincode invoke successful. result: status:200 payload:"Investor query 0 answered for startup startup001"
```

**Result:** The investor query and its answer were recorded successfully.

---

## 14. Propose and accept an investment

### 14.1 Propose an investment (Org2MSP)

**Command:**

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n cip \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"proposeInvestment","Args":["startup001","50000000"]}'
```

**Observed output:**

```text
2026-10-15 00:30:45.156 IST 0001 INFO [chaincodeCmd] chaincodeInvokeOrQuery -> Chaincode invoke successful. result: status:200 payload:"Investment proposal submitted for startup startup001"
```

The proposal amount was `50000000` integer units. The contract stores an integer amount; the currency unit is not enforced by the contract.

### 14.2 Switch the CLI identity to Org1MSP

```bash
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH="$PWD/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE="$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
```

### 14.3 Accept proposal index 0

**Command:**

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n cip \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"respondToInvestment","Args":["startup001","0","ACCEPTED"]}'
```

**Observed output:**

```text
2026-10-15 00:31:09.773 IST 0001 INFO [chaincodeCmd] chaincodeInvokeOrQuery -> Chaincode invoke successful. result: status:200 payload:"Investment proposal accepted for startup startup001"
```

**Result:** The first investment proposal was accepted by Org1MSP.

---

## 15. Create and verify a milestone

### 15.1 Create milestone `M1` (Org1MSP)

**Command:**

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n cip \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"createMilestone","Args":["startup001","M1","Prototype Completion","10000000"]}'
```

**Observed output:**

```text
2026-10-15 00:31:47.708 IST 0001 INFO [chaincodeCmd] chaincodeInvokeOrQuery -> Chaincode invoke successful. result: status:200 payload:"Milestone M1 created for startup startup001"
```

### 15.2 Switch the CLI identity to Org2MSP

```bash
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_MSPCONFIGPATH="$PWD/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
export CORE_PEER_ADDRESS=localhost:9051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE="$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
```

### 15.3 Verify milestone `M1` (Org2MSP)

**Command:**

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n cip \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"verifyMilestone","Args":["startup001","M1"]}'
```

**Observed output:**

```text
2026-10-15 00:32:08.591 IST 0001 INFO [chaincodeCmd] chaincodeInvokeOrQuery -> Chaincode invoke successful. result: status:200 payload:"Milestone M1 verified"
```

**Result:** Milestone `M1` was verified successfully.

---

## 16. Release funds and test duplicate-payment protection

### 16.1 Release funds for milestone `M1` (Org2MSP)

**Command:**

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n cip \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"releaseFunds","Args":["startup001","M1"]}'
```

**Observed output:**

```text
2026-10-15 00:32:24.460 IST 0001 INFO [chaincodeCmd] chaincodeInvokeOrQuery -> Chaincode invoke successful. result: status:200 payload:"Funds recorded as released for milestone M1"
```

### 16.2 Query the final startup state

**Command:**

```bash
peer chaincode query \
  -C mychannel \
  -n cip \
  -c '{"function":"getStartup","Args":["startup001"]}'
```

**Observed final state (selected fields):**

```json
{
  "id": "startup001",
  "status": "NOT_VALIDATED",
  "verificationStatus": "VERIFIED",
  "investorQueries": [
    {
      "question": "What is your projected revenue for Year 1?",
      "answers": [
        {
          "validator": "Org2MSP",
          "answer": "Projected revenue is 5 crore INR in Year 1.",
          "time": "2026-10-14T19:00:09.000Z"
        }
      ],
      "askedAt": "2026-10-14T18:59:49.000Z"
    }
  ],
  "investmentPlans": [
    {
      "investor": "Org2MSP",
      "amount": 50000000,
      "status": "ACCEPTED",
      "proposedAt": "2026-10-14T19:00:45.000Z",
      "respondedAt": "2026-10-14T19:01:09.000Z"
    }
  ],
  "milestones": [
    {
      "id": "M1",
      "title": "Prototype Completion",
      "amount": 10000000,
      "status": "PAID",
      "createdAt": "2026-10-14T19:01:47.000Z",
      "verifiedAt": "2026-10-14T19:02:08.000Z",
      "paidAt": "2026-10-14T19:02:24.000Z"
    }
  ],
  "releasedFunds": 10000000
}
```

**Result:** The final ledger query confirmed the investor answer, accepted investment, paid milestone, and released amount of `10000000`.

### 16.3 Attempt a second release for `M1`

The following invocation was repeated after the milestone had already been paid.

**Command:**

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n cip \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"releaseFunds","Args":["startup001","M1"]}'
```

**Observed output:**

```text
Error: endorsement failure during invoke. response: status:500 message:"Funds have already been released for this milestone"
```

**Result:** The chaincode rejected the second release as expected. The duplicate-payment guard is working for the tested milestone.

---

## 17. Current verified state and follow-up notes

The following workflow functions were executed successfully on `mychannel` using chaincode version `1.0`, sequence `2`:

- `applyStartup`
- `getStartup`
- `assignValidators`
- `submitValidatorReport`
- `getVerifiedStartups`
- `submitInvestorQuery`
- `answerInvestorQuery`
- `proposeInvestment`
- `respondToInvestment`
- `createMilestone`
- `verifyMilestone`
- `releaseFunds`

The tested negative cases were:
- Org2 attempting `assignValidators`, rejected with `Only the platform can assign validators`.
- Releasing funds for already-paid milestone `M1` a second time, rejected with `Funds have already been released for this milestone`.

Before final submission, review the following contract-level points against the assignment specification:

1. The `status` field remains `NOT_VALIDATED` while `verificationStatus` is `VERIFIED`. Confirm whether these are intended to be independent fields or should be synchronized.
2. The investment amount and milestone amount are stored as integer units. The contract does not enforce a currency.
3. The current tested path successfully released `10000000` units for `M1`; the current implementation's workflow should be checked against the assignment for any requirement that milestone totals be capped by the accepted investment amount.

These are review notes, not failures observed during the commands above.
