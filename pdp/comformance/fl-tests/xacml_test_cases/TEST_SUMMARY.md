# XACML Test Case Summary for FL Governance Policy
# ================================================

## Overview
| Metric | Count |
|--------|-------|
| Total Test Cases | 47 |
| Expected PERMIT | 7 |
| Expected DENY | 34 |
| Expected NotApplicable | 3 |
| Expected Indeterminate | 3 |

## Test Cases by Group

### Baseline (P1/P2/P3/P4/E)
| Test ID | Description | Expected | Threat Category |
|---------|-------------|----------|-----------------|
| P1-TC01 | Valid task authorization: correct task_id, future expiry | Permit | N/A (happy path) |
| P1-TC02 | Invalid task_id: unauthorized task identifier | Deny | Unauthorised task participation |
| P1-TC03 | Expired task: task_expires in the past | Deny | Temporal policy violation |
| P1-TC04 | Both invalid: wrong task_id AND expired | Deny | Unauthorised task participation |
| P1-TC05 | Boundary: task_expires equals current-dateTime (not greater) | Deny | Temporal policy violation |
| P2-TC01 | Valid node activation: member with valid task and membership | Permit | N/A (happy path) |
| P2-TC02 | Not a task member: is_member_of_task=false | Deny | Unauthorised task participation |
| P2-TC03 | Expired membership: task_membership_expires in past | Deny | Temporal policy violation |
| P2-TC04 | Task expired: valid member but task_expires in past | Deny | Temporal policy violation |
| P2-TC05 | Wrong task: invalid task_id with valid membership | Deny | Unauthorised task participation |
| P2-TC06 | Boundary: membership_expires equals current-dateTime | Deny | Temporal policy violation |
| P3-TC01 | Valid training: participant with valid task and membership | Permit | N/A (happy path) |
| P3-TC02 | Privilege escalation: observer attempting train action | Deny | Privilege escalation |
| P3-TC03 | Unknown role: unrecognised task_role attempting train | Deny | Privilege escalation |
| P3-TC04 | Expired membership: participant with past membership_expires | Deny | Temporal policy violation |
| P3-TC05 | Expired task: participant with past task_expires | Deny | Temporal policy violation |
| P3-TC06 | Wrong task: participant in unauthorized task | Deny | Unauthorised task participation |
| P3-TC07 | Valid aggregation: participant with valid credentials | Permit | N/A (happy path) |
| P3-TC08 | Privilege escalation: observer attempting aggregate action | Deny | Privilege escalation |
| P3-TC09 | Expired membership: participant aggregate with past expiry | Deny | Temporal policy violation |
| P4-TC01 | Valid evaluation: participant can evaluate | Permit | N/A (happy path) |
| P4-TC02 | Valid evaluation: observer can evaluate (read-only access) | Permit | N/A (happy path) |
| P4-TC03 | Unknown role: unrecognised role attempting evaluate | Deny | Privilege escalation |
| P4-TC04 | Not a member: is_member_of_task=false | Deny | Unauthorised task participation |
| P4-TC05 | Expired membership: valid role but membership expired | Deny | Temporal policy violation |
| P4-TC06 | Expired task: valid member/role but task expired | Deny | Temporal policy violation |
| P4-TC07 | Wrong task: valid credentials but unauthorized task | Deny | Unauthorised task participation |
| E-TC01 | Unknown action: action not in policy set | NotApplicable | Unauthorised action |

### Security / Robustness (S-TCxxx)
| Test ID | Description | Expected | Threat Category |
|---------|-------------|----------|-----------------|
| S-TC001 | Missing task_expires attribute (task-authorization) should not permit | Deny | Attribute omission / fail-closed |
| S-TC002 | Missing task_id attribute (task-authorization) should not permit | Deny | Attribute omission / fail-closed |
| S-TC003 | Missing current-dateTime (environment) should not permit | Deny | Attribute omission / fail-closed |
| S-TC004 | node-activation missing is_member_of_task should not permit | Deny | Attribute omission / fail-closed |
| S-TC005 | node-activation missing task_membership_expires should not permit | Deny | Attribute omission / fail-closed |
| S-TC006 | train missing task_role should not permit | Deny | Attribute omission / fail-closed |
| S-TC007 | Malformed dateTime for task_expires should not permit (expect Indeterm... | Indeterminate | Parser robustness / datatype abuse |
| S-TC008 | Malformed boolean for is_member_of_task should not permit (expect Inde... | Indeterminate | Parser robustness / datatype abuse |
| S-TC009 | Malformed current-dateTime should not permit (expect Indeterminate or ... | Indeterminate | Parser robustness / datatype abuse |
| S-TC010 | Duplicate task_role values (participant + observer) on train should no... | Deny | Attribute ambiguity / multi-value abuse |
| S-TC011 | Duplicate task_id values (medical + unauthorized_task) should not perm... | Deny | Attribute ambiguity / multi-value abuse |
| S-TC012 | Duplicate current-dateTime values should not permit | Deny | Attribute ambiguity / multi-value abuse |
| S-TC013 | Place task_role under Resource instead of Subject (train) should not p... | Deny | Category confusion / bypass attempt |
| S-TC014 | Place is_member_of_task under Resource instead of Subject (node-activa... | Deny | Category confusion / bypass attempt |
| S-TC015 | Action case-variant 'Train' should be NotApplicable (closed-world) | NotApplicable | Unauthorised action (normalization) |
| S-TC016 | Action whitespace variant 'train ' should be NotApplicable (closed-wor... | NotApplicable | Unauthorised action (normalization) |
| S-TC017 | task_expires 1 second after current-dateTime should permit (task-autho... | Permit | N/A (happy path) |
| S-TC018 | task_expires 1 second before current-dateTime should deny (task-author... | Deny | Temporal policy violation |
| S-TC019 | Extra unknown attributes should not grant access (train observer remai... | Deny | Attribute injection |

## Summary by Threat Category
| Threat Category | Test Cases |
|-----------------|------------|
| Temporal policy violation | 11 |
| N/A (happy path) | 7 |
| Unauthorised task participation | 7 |
| Attribute omission / fail-closed | 6 |
| Privilege escalation | 4 |
| Attribute ambiguity / multi-value abuse | 3 |
| Parser robustness / datatype abuse | 3 |
| Category confusion / bypass attempt | 2 |
| Unauthorised action (normalization) | 2 |
| Attribute injection | 1 |
| Unauthorised action | 1 |
