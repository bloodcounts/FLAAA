#!/usr/bin/env python3
"""
XACML Test Case Generator for Federated Learning Governance Policy

Extended coverage (security-bypass oriented) additions:
- Missing required attributes (fail-closed expectations)
- Invalid datatype / malformed lexical forms (often Indeterminate in PDPs)
- Duplicate attributes (multi-valued bags / ambiguity probes)
- Category mismatch attempts (subject attrs placed under resource, etc.)
- Action normalization probes (case/whitespace variations)
- Boundary +/- 1 second tests for time comparisons

Notes:
- This generator keeps your original "baseline" cases intact.
- Added tests use new optional fields in TestCase to control XML generation.
- Expected decisions now allow: "Permit", "Deny", "NotApplicable", "Indeterminate"
  (If your PDP does not return Indeterminate explicitly, you can set those to "Deny".)
"""

import os
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any
import json

# =============================================================================
# Configuration
# =============================================================================

CURRENT_TIME = "2025-06-15T12:00:00Z"
FUTURE_TIME = "2026-12-31T23:59:59Z"
PAST_TIME = "2024-01-01T00:00:00Z"

# Boundary helpers (string form is enough for tests)
JUST_BEFORE_CURRENT = "2025-06-15T11:59:59Z"
JUST_AFTER_CURRENT  = "2025-06-15T12:00:01Z"

VALID_TASK_ID = "medical"
INVALID_TASK_ID = "unauthorized_task"

# XACML categories used
CAT_ACTION = "urn:oasis:names:tc:xacml:3.0:attribute-category:action"
CAT_RESOURCE = "urn:oasis:names:tc:xacml:1.0:attribute-category:resource"
CAT_SUBJECT = "urn:oasis:names:tc:xacml:1.0:subject-category:access-subject"
CAT_ENV = "urn:oasis:names:tc:xacml:3.0:attribute-category:environment"

DT_STRING = "http://www.w3.org/2001/XMLSchema#string"
DT_BOOL = "http://www.w3.org/2001/XMLSchema#boolean"
DT_DATETIME = "http://www.w3.org/2001/XMLSchema#dateTime"


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class TestCase:
    """Represents a single XACML test case"""
    test_id: str
    description: str
    action: str
    expected_decision: str  # "Permit" | "Deny" | "NotApplicable" | "Indeterminate"
    policy_rule: str
    threat_category: str

    # Baseline attributes (used unless overridden by advanced fields)
    task_id: str = VALID_TASK_ID
    task_expires: str = FUTURE_TIME

    is_member_of_task: Optional[bool] = None
    task_membership_expires: Optional[str] = None
    task_role: Optional[str] = None

    current_datetime: str = CURRENT_TIME

    # ---------------------------
    # Extended / adversarial knobs
    # ---------------------------

    # Omit these attribute IDs entirely from the request (e.g., ["task_expires", "current-dateTime"])
    omit_attributes: List[str] = field(default_factory=list)

    # Override attribute values and datatypes; keys are attribute IDs.
    # Example: {"task_expires": {"value": "not-a-datetime", "datatype": DT_DATETIME}}
    override_attributes: Dict[str, Dict[str, str]] = field(default_factory=dict)

    # Duplicate attributes: attribute ID -> list of extra values (same datatype unless overridden)
    # Example: {"task_role": ["participant", "observer"]}
    duplicate_attributes: Dict[str, List[str]] = field(default_factory=dict)

    # Place selected attributes into the wrong category on purpose:
    # attribute ID -> category URI
    # Example: {"task_role": CAT_RESOURCE}
    category_override: Dict[str, str] = field(default_factory=dict)

    # Add arbitrary extra attributes (useful for fuzz / unknown attrs)
    # Each item: {"category": CAT_..., "id": "x", "datatype": DT_..., "value": "y"}
    extra_attributes: List[Dict[str, str]] = field(default_factory=list)


# =============================================================================
# Test Case Definitions
# =============================================================================

def _baseline_cases() -> List[TestCase]:
    """Your original baseline cases (kept intact, with minimal edits only)."""
    test_cases: List[TestCase] = []

    # -------------------------
    # POLICY 1: task-authorization
    # -------------------------
    test_cases.append(TestCase(
        test_id="P1-TC01",
        description="Valid task authorization: correct task_id, future expiry",
        action="task-authorization",
        expected_decision="Permit",
        policy_rule="permit-task-valid",
        threat_category="N/A (happy path)",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
    ))
    test_cases.append(TestCase(
        test_id="P1-TC02",
        description="Invalid task_id: unauthorized task identifier",
        action="task-authorization",
        expected_decision="Deny",
        policy_rule="deny-wrong-task-or-expired",
        threat_category="Unauthorised task participation",
        task_id=INVALID_TASK_ID,
        task_expires=FUTURE_TIME,
    ))
    test_cases.append(TestCase(
        test_id="P1-TC03",
        description="Expired task: task_expires in the past",
        action="task-authorization",
        expected_decision="Deny",
        policy_rule="deny-wrong-task-or-expired",
        threat_category="Temporal policy violation",
        task_id=VALID_TASK_ID,
        task_expires=PAST_TIME,
    ))
    test_cases.append(TestCase(
        test_id="P1-TC04",
        description="Both invalid: wrong task_id AND expired",
        action="task-authorization",
        expected_decision="Deny",
        policy_rule="deny-wrong-task-or-expired",
        threat_category="Unauthorised task participation",
        task_id=INVALID_TASK_ID,
        task_expires=PAST_TIME,
    ))
    test_cases.append(TestCase(
        test_id="P1-TC05",
        description="Boundary: task_expires equals current-dateTime (not greater)",
        action="task-authorization",
        expected_decision="Deny",
        policy_rule="deny-wrong-task-or-expired",
        threat_category="Temporal policy violation",
        task_id=VALID_TASK_ID,
        task_expires=CURRENT_TIME,
    ))

    # -------------------------
    # POLICY 2: node-activation
    # -------------------------
    test_cases.append(TestCase(
        test_id="P2-TC01",
        description="Valid node activation: member with valid task and membership",
        action="node-activation",
        expected_decision="Permit",
        policy_rule="permit-activation-valid",
        threat_category="N/A (happy path)",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
    ))
    test_cases.append(TestCase(
        test_id="P2-TC02",
        description="Not a task member: is_member_of_task=false",
        action="node-activation",
        expected_decision="Deny",
        policy_rule="deny-activation-invalid",
        threat_category="Unauthorised task participation",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=False,
        task_membership_expires=FUTURE_TIME,
    ))
    test_cases.append(TestCase(
        test_id="P2-TC03",
        description="Expired membership: task_membership_expires in past",
        action="node-activation",
        expected_decision="Deny",
        policy_rule="deny-activation-invalid",
        threat_category="Temporal policy violation",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=PAST_TIME,
    ))
    test_cases.append(TestCase(
        test_id="P2-TC04",
        description="Task expired: valid member but task_expires in past",
        action="node-activation",
        expected_decision="Deny",
        policy_rule="deny-activation-invalid",
        threat_category="Temporal policy violation",
        task_id=VALID_TASK_ID,
        task_expires=PAST_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
    ))
    test_cases.append(TestCase(
        test_id="P2-TC05",
        description="Wrong task: invalid task_id with valid membership",
        action="node-activation",
        expected_decision="Deny",
        policy_rule="deny-activation-invalid",
        threat_category="Unauthorised task participation",
        task_id=INVALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
    ))
    test_cases.append(TestCase(
        test_id="P2-TC06",
        description="Boundary: membership_expires equals current-dateTime",
        action="node-activation",
        expected_decision="Deny",
        policy_rule="deny-activation-invalid",
        threat_category="Temporal policy violation",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=CURRENT_TIME,
    ))

    # -------------------------
    # POLICY 3: train/aggregate
    # -------------------------
    test_cases.append(TestCase(
        test_id="P3-TC01",
        description="Valid training: participant with valid task and membership",
        action="train",
        expected_decision="Permit",
        policy_rule="permit-train-aggregate-valid-participant",
        threat_category="N/A (happy path)",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="participant",
    ))
    test_cases.append(TestCase(
        test_id="P3-TC02",
        description="Privilege escalation: observer attempting train action",
        action="train",
        expected_decision="Deny",
        policy_rule="deny-train-aggregate-nonparticipant-or-invalid",
        threat_category="Privilege escalation",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="observer",
    ))
    test_cases.append(TestCase(
        test_id="P3-TC03",
        description="Unknown role: unrecognised task_role attempting train",
        action="train",
        expected_decision="Deny",
        policy_rule="deny-train-aggregate-nonparticipant-or-invalid",
        threat_category="Privilege escalation",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="admin",
    ))
    test_cases.append(TestCase(
        test_id="P3-TC04",
        description="Expired membership: participant with past membership_expires",
        action="train",
        expected_decision="Deny",
        policy_rule="deny-train-aggregate-nonparticipant-or-invalid",
        threat_category="Temporal policy violation",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=PAST_TIME,
        task_role="participant",
    ))
    test_cases.append(TestCase(
        test_id="P3-TC05",
        description="Expired task: participant with past task_expires",
        action="train",
        expected_decision="Deny",
        policy_rule="deny-train-aggregate-nonparticipant-or-invalid",
        threat_category="Temporal policy violation",
        task_id=VALID_TASK_ID,
        task_expires=PAST_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="participant",
    ))
    test_cases.append(TestCase(
        test_id="P3-TC06",
        description="Wrong task: participant in unauthorized task",
        action="train",
        expected_decision="Deny",
        policy_rule="deny-train-aggregate-nonparticipant-or-invalid",
        threat_category="Unauthorised task participation",
        task_id=INVALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="participant",
    ))
    test_cases.append(TestCase(
        test_id="P3-TC07",
        description="Valid aggregation: participant with valid credentials",
        action="aggregate",
        expected_decision="Permit",
        policy_rule="permit-train-aggregate-valid-participant",
        threat_category="N/A (happy path)",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="participant",
    ))
    test_cases.append(TestCase(
        test_id="P3-TC08",
        description="Privilege escalation: observer attempting aggregate action",
        action="aggregate",
        expected_decision="Deny",
        policy_rule="deny-train-aggregate-nonparticipant-or-invalid",
        threat_category="Privilege escalation",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="observer",
    ))
    test_cases.append(TestCase(
        test_id="P3-TC09",
        description="Expired membership: participant aggregate with past expiry",
        action="aggregate",
        expected_decision="Deny",
        policy_rule="deny-train-aggregate-nonparticipant-or-invalid",
        threat_category="Temporal policy violation",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=PAST_TIME,
        task_role="participant",
    ))

    # -------------------------
    # POLICY 4: evaluate
    # -------------------------
    test_cases.append(TestCase(
        test_id="P4-TC01",
        description="Valid evaluation: participant can evaluate",
        action="evaluate",
        expected_decision="Permit",
        policy_rule="permit-evaluate-valid",
        threat_category="N/A (happy path)",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="participant",
    ))
    test_cases.append(TestCase(
        test_id="P4-TC02",
        description="Valid evaluation: observer can evaluate (read-only access)",
        action="evaluate",
        expected_decision="Permit",
        policy_rule="permit-evaluate-valid",
        threat_category="N/A (happy path)",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="observer",
    ))
    test_cases.append(TestCase(
        test_id="P4-TC03",
        description="Unknown role: unrecognised role attempting evaluate",
        action="evaluate",
        expected_decision="Deny",
        policy_rule="deny-evaluate-invalid",
        threat_category="Privilege escalation",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="guest",
    ))
    test_cases.append(TestCase(
        test_id="P4-TC04",
        description="Not a member: is_member_of_task=false",
        action="evaluate",
        expected_decision="Deny",
        policy_rule="deny-evaluate-invalid",
        threat_category="Unauthorised task participation",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=False,
        task_membership_expires=FUTURE_TIME,
        task_role="participant",
    ))
    test_cases.append(TestCase(
        test_id="P4-TC05",
        description="Expired membership: valid role but membership expired",
        action="evaluate",
        expected_decision="Deny",
        policy_rule="deny-evaluate-invalid",
        threat_category="Temporal policy violation",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=PAST_TIME,
        task_role="observer",
    ))
    test_cases.append(TestCase(
        test_id="P4-TC06",
        description="Expired task: valid member/role but task expired",
        action="evaluate",
        expected_decision="Deny",
        policy_rule="deny-evaluate-invalid",
        threat_category="Temporal policy violation",
        task_id=VALID_TASK_ID,
        task_expires=PAST_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="participant",
    ))
    test_cases.append(TestCase(
        test_id="P4-TC07",
        description="Wrong task: valid credentials but unauthorized task",
        action="evaluate",
        expected_decision="Deny",
        policy_rule="deny-evaluate-invalid",
        threat_category="Unauthorised task participation",
        task_id=INVALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="participant",
    ))

    # -------------------------
    # EDGE
    # -------------------------
    test_cases.append(TestCase(
        test_id="E-TC01",
        description="Unknown action: action not in policy set",
        action="delete",
        expected_decision="NotApplicable",
        policy_rule="N/A (no matching policy)",
        threat_category="Unauthorised action",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="participant",
    ))

    return test_cases


def _extended_security_cases(start_index: int = 1) -> List[TestCase]:
    """
    Additional cases aimed at bypass/robustness.
    IDs: S1-XXX (Security), S2-XXX, etc.
    """
    cases: List[TestCase] = []
    n = start_index

    def sid():
        nonlocal n
        s = f"S-TC{n:03d}"
        n += 1
        return s

    # ---------------------------------------------------------------------
    # Missing attributes (fail-closed)
    # ---------------------------------------------------------------------
    cases.append(TestCase(
        test_id=sid(),
        description="Missing task_expires attribute (task-authorization) should not permit",
        action="task-authorization",
        expected_decision="Deny",
        policy_rule="deny-missing-attribute",
        threat_category="Attribute omission / fail-closed",
        omit_attributes=["task_expires"],
        task_id=VALID_TASK_ID,
    ))
    cases.append(TestCase(
        test_id=sid(),
        description="Missing task_id attribute (task-authorization) should not permit",
        action="task-authorization",
        expected_decision="Deny",
        policy_rule="deny-missing-attribute",
        threat_category="Attribute omission / fail-closed",
        omit_attributes=["task_id"],
        task_expires=FUTURE_TIME,
    ))
    cases.append(TestCase(
        test_id=sid(),
        description="Missing current-dateTime (environment) should not permit",
        action="task-authorization",
        expected_decision="Deny",
        policy_rule="deny-missing-attribute",
        threat_category="Attribute omission / fail-closed",
        omit_attributes=["current-dateTime"],
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
    ))

    cases.append(TestCase(
        test_id=sid(),
        description="node-activation missing is_member_of_task should not permit",
        action="node-activation",
        expected_decision="Deny",
        policy_rule="deny-missing-attribute",
        threat_category="Attribute omission / fail-closed",
        omit_attributes=["is_member_of_task"],
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        task_membership_expires=FUTURE_TIME,
    ))
    cases.append(TestCase(
        test_id=sid(),
        description="node-activation missing task_membership_expires should not permit",
        action="node-activation",
        expected_decision="Deny",
        policy_rule="deny-missing-attribute",
        threat_category="Attribute omission / fail-closed",
        omit_attributes=["task_membership_expires"],
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
    ))
    cases.append(TestCase(
        test_id=sid(),
        description="train missing task_role should not permit",
        action="train",
        expected_decision="Deny",
        policy_rule="deny-missing-attribute",
        threat_category="Attribute omission / fail-closed",
        omit_attributes=["task_role"],
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
    ))

    # ---------------------------------------------------------------------
    # Malformed datatypes / lexical forms (often Indeterminate)
    # If your Luas PDP returns "Indeterminate", keep as expected.
    # If it returns "Deny" instead, change these expected_decision to "Deny".
    # ---------------------------------------------------------------------
    cases.append(TestCase(
        test_id=sid(),
        description="Malformed dateTime for task_expires should not permit (expect Indeterminate or Deny)",
        action="task-authorization",
        expected_decision="Indeterminate",
        policy_rule="indeterminate-malformed-datetime",
        threat_category="Parser robustness / datatype abuse",
        override_attributes={
            "task_expires": {"value": "not-a-datetime", "datatype": DT_DATETIME}
        },
        task_id=VALID_TASK_ID,
    ))
    cases.append(TestCase(
        test_id=sid(),
        description="Malformed boolean for is_member_of_task should not permit (expect Indeterminate or Deny)",
        action="node-activation",
        expected_decision="Indeterminate",
        policy_rule="indeterminate-malformed-boolean",
        threat_category="Parser robustness / datatype abuse",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        task_membership_expires=FUTURE_TIME,
        override_attributes={
            "is_member_of_task": {"value": "truee", "datatype": DT_BOOL}
        },
    ))
    cases.append(TestCase(
        test_id=sid(),
        description="Malformed current-dateTime should not permit (expect Indeterminate or Deny)",
        action="evaluate",
        expected_decision="Indeterminate",
        policy_rule="indeterminate-malformed-datetime",
        threat_category="Parser robustness / datatype abuse",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="participant",
        override_attributes={
            "current-dateTime": {"value": "2025-06-15T12:00:00", "datatype": DT_DATETIME}  # missing Z/offset
        },
    ))

    # ---------------------------------------------------------------------
    # Duplicate attributes (ambiguity probes)
    # ---------------------------------------------------------------------
    cases.append(TestCase(
        test_id=sid(),
        description="Duplicate task_role values (participant + observer) on train should not permit",
        action="train",
        expected_decision="Deny",
        policy_rule="deny-ambiguous-attributes",
        threat_category="Attribute ambiguity / multi-value abuse",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="participant",
        duplicate_attributes={"task_role": ["observer"]},
    ))
    cases.append(TestCase(
        test_id=sid(),
        description="Duplicate task_id values (medical + unauthorized_task) should not permit",
        action="task-authorization",
        expected_decision="Deny",
        policy_rule="deny-ambiguous-attributes",
        threat_category="Attribute ambiguity / multi-value abuse",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        duplicate_attributes={"task_id": [INVALID_TASK_ID]},
    ))
    cases.append(TestCase(
        test_id=sid(),
        description="Duplicate current-dateTime values should not permit",
        action="node-activation",
        expected_decision="Deny",
        policy_rule="deny-ambiguous-attributes",
        threat_category="Attribute ambiguity / multi-value abuse",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        duplicate_attributes={"current-dateTime": [JUST_AFTER_CURRENT]},
    ))

    # ---------------------------------------------------------------------
    # Category mismatch (bypass attempt by placing attrs in wrong category)
    # ---------------------------------------------------------------------
    cases.append(TestCase(
        test_id=sid(),
        description="Place task_role under Resource instead of Subject (train) should not permit",
        action="train",
        expected_decision="Deny",
        policy_rule="deny-category-mismatch",
        threat_category="Category confusion / bypass attempt",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="participant",
        category_override={"task_role": CAT_RESOURCE},
    ))
    cases.append(TestCase(
        test_id=sid(),
        description="Place is_member_of_task under Resource instead of Subject (node-activation) should not permit",
        action="node-activation",
        expected_decision="Deny",
        policy_rule="deny-category-mismatch",
        threat_category="Category confusion / bypass attempt",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        category_override={"is_member_of_task": CAT_RESOURCE},
    ))

    # ---------------------------------------------------------------------
    # Action normalization probes
    # ---------------------------------------------------------------------
    cases.append(TestCase(
        test_id=sid(),
        description="Action case-variant 'Train' should be NotApplicable (closed-world)",
        action="Train",
        expected_decision="NotApplicable",
        policy_rule="N/A (no matching policy)",
        threat_category="Unauthorised action (normalization)",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="participant",
    ))
    cases.append(TestCase(
        test_id=sid(),
        description="Action whitespace variant 'train ' should be NotApplicable (closed-world)",
        action="train ",
        expected_decision="NotApplicable",
        policy_rule="N/A (no matching policy)",
        threat_category="Unauthorised action (normalization)",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="participant",
    ))

    # ---------------------------------------------------------------------
    # Tight temporal +/- 1 second tests
    # ---------------------------------------------------------------------
    cases.append(TestCase(
        test_id=sid(),
        description="task_expires 1 second after current-dateTime should permit (task-authorization)",
        action="task-authorization",
        expected_decision="Permit",
        policy_rule="permit-task-valid",
        threat_category="N/A (happy path)",
        task_id=VALID_TASK_ID,
        task_expires=JUST_AFTER_CURRENT,
        current_datetime=CURRENT_TIME,
    ))
    cases.append(TestCase(
        test_id=sid(),
        description="task_expires 1 second before current-dateTime should deny (task-authorization)",
        action="task-authorization",
        expected_decision="Deny",
        policy_rule="deny-wrong-task-or-expired",
        threat_category="Temporal policy violation",
        task_id=VALID_TASK_ID,
        task_expires=JUST_BEFORE_CURRENT,
        current_datetime=CURRENT_TIME,
    ))

    # ---------------------------------------------------------------------
    # Unknown extra attributes (should not change decision)
    # ---------------------------------------------------------------------
    cases.append(TestCase(
        test_id=sid(),
        description="Extra unknown attributes should not grant access (train observer remains deny)",
        action="train",
        expected_decision="Deny",
        policy_rule="deny-train-aggregate-nonparticipant-or-invalid",
        threat_category="Attribute injection",
        task_id=VALID_TASK_ID,
        task_expires=FUTURE_TIME,
        is_member_of_task=True,
        task_membership_expires=FUTURE_TIME,
        task_role="observer",
        extra_attributes=[
            {"category": CAT_SUBJECT, "id": "reputation_score_scaled", "datatype": "http://www.w3.org/2001/XMLSchema#integer", "value": "9999"},
            {"category": CAT_ENV, "id": "request_nonce", "datatype": DT_STRING, "value": "abc123"},
        ],
    ))

    return cases


def generate_test_cases() -> List[TestCase]:
    """Generate all test cases (baseline + extended)."""
    test_cases = _baseline_cases()
    test_cases.extend(_extended_security_cases(start_index=1))
    return test_cases


# =============================================================================
# XACML Request XML Generator (extended)
# =============================================================================

def _attr_xml(attr_id: str, datatype: str, value: str, include_in_result: bool = True) -> str:
    inc = ' IncludeInResult="true"' if include_in_result else ""
    return f'''    <Attribute AttributeId="{attr_id}"{inc}>
      <AttributeValue DataType="{datatype}">{value}</AttributeValue>
    </Attribute>'''


def generate_xacml_request(tc: TestCase) -> str:
    """Generate XACML 3.0 Request XML for a test case, including adversarial variants."""

    # Canonical baseline values + types
    base: Dict[str, Dict[str, Any]] = {
        # Action
        "action": {"category": CAT_ACTION, "datatype": DT_STRING, "value": tc.action},

        # Resource
        "task_id": {"category": CAT_RESOURCE, "datatype": DT_STRING, "value": tc.task_id},
        "task_expires": {"category": CAT_RESOURCE, "datatype": DT_DATETIME, "value": tc.task_expires},

        # Subject
        "is_member_of_task": {"category": CAT_SUBJECT, "datatype": DT_BOOL, "value": None if tc.is_member_of_task is None else str(tc.is_member_of_task).lower()},
        "task_membership_expires": {"category": CAT_SUBJECT, "datatype": DT_DATETIME, "value": tc.task_membership_expires},
        "task_role": {"category": CAT_SUBJECT, "datatype": DT_STRING, "value": tc.task_role},

        # Environment
        "current-dateTime": {"category": CAT_ENV, "datatype": DT_DATETIME, "value": tc.current_datetime},
    }

    # Apply category overrides
    for aid, cat in tc.category_override.items():
        if aid in base:
            base[aid]["category"] = cat

    # Apply overrides (value/datatype)
    for aid, ov in tc.override_attributes.items():
        if aid not in base:
            # allow overriding unknown ids too (put under env by default)
            base[aid] = {"category": CAT_ENV, "datatype": ov.get("datatype", DT_STRING), "value": ov.get("value", "")}
        else:
            if "value" in ov:
                base[aid]["value"] = ov["value"]
            if "datatype" in ov:
                base[aid]["datatype"] = ov["datatype"]

    # Build per-category attribute lists
    by_cat: Dict[str, List[str]] = {CAT_ACTION: [], CAT_RESOURCE: [], CAT_SUBJECT: [], CAT_ENV: []}

    # Add baseline attrs except omitted and except those with None values (optional subject attrs)
    for aid, meta in base.items():
        if aid in tc.omit_attributes:
            continue
        # optional subject attrs: if no value, skip
        if meta["value"] is None:
            continue
        by_cat.setdefault(meta["category"], [])
        by_cat[meta["category"]].append(_attr_xml(aid, meta["datatype"], meta["value"]))

    # Add duplicates (same category/typ unless overridden in base)
    for aid, vals in tc.duplicate_attributes.items():
        if aid in tc.omit_attributes:
            continue
        if aid not in base:
            # default unknown dup under env
            cat, dt = CAT_ENV, DT_STRING
        else:
            cat, dt = base[aid]["category"], base[aid]["datatype"]
        for v in vals:
            by_cat.setdefault(cat, [])
            by_cat[cat].append(_attr_xml(aid, dt, v))

    # Add extra attributes
    for e in tc.extra_attributes:
        cat = e["category"]
        by_cat.setdefault(cat, [])
        by_cat[cat].append(_attr_xml(e["id"], e["datatype"], e["value"]))

    # Assemble sections; omit empty categories (except Action/Resource/Env are typically present)
    def section(cat_uri: str, title: str) -> str:
        attrs = "\n".join(by_cat.get(cat_uri, []))
        if not attrs:
            return ""
        return f'''
  <!-- {title} -->
  <Attributes Category="{cat_uri}">
{attrs}
  </Attributes>
'''

    xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Test Case: {tc.test_id}
  Description: {tc.description}
  Expected Decision: {tc.expected_decision}
  Policy Rule: {tc.policy_rule}
  Threat Category: {tc.threat_category}
-->
<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17">
{section(CAT_ACTION, "Action")}
{section(CAT_RESOURCE, "Resource")}
{section(CAT_SUBJECT, "Subject")}
{section(CAT_ENV, "Environment")}
</Request>
'''
    return xml


# =============================================================================
# Test Summary Generator
# =============================================================================

def generate_test_summary(test_cases: List[TestCase]) -> str:
    """Generate a summary table of all test cases."""
    summary = """# XACML Test Case Summary for FL Governance Policy
# ================================================

## Overview
| Metric | Count |
|--------|-------|
| Total Test Cases | {total} |
| Expected PERMIT | {permit} |
| Expected DENY | {deny} |
| Expected NotApplicable | {na} |
| Expected Indeterminate | {ind} |

## Test Cases by Group

### Baseline (P1/P2/P3/P4/E)
| Test ID | Description | Expected | Threat Category |
|---------|-------------|----------|-----------------|
{baseline_rows}

### Security / Robustness (S-TCxxx)
| Test ID | Description | Expected | Threat Category |
|---------|-------------|----------|-----------------|
{sec_rows}

## Summary by Threat Category
| Threat Category | Test Cases |
|-----------------|------------|
{threat_summary}
"""

    permit = sum(1 for tc in test_cases if tc.expected_decision == "Permit")
    deny = sum(1 for tc in test_cases if tc.expected_decision == "Deny")
    na = sum(1 for tc in test_cases if tc.expected_decision == "NotApplicable")
    ind = sum(1 for tc in test_cases if tc.expected_decision == "Indeterminate")

    baseline = [tc for tc in test_cases if tc.test_id.startswith(("P1", "P2", "P3", "P4", "E-"))]
    sec = [tc for tc in test_cases if tc.test_id.startswith("S-TC")]

    def make_rows(cases: List[TestCase]) -> str:
        rows = []
        for tc in cases:
            desc = tc.description
            if len(desc) > 70:
                desc = desc[:70] + "..."
            rows.append(f"| {tc.test_id} | {desc} | {tc.expected_decision} | {tc.threat_category} |")
        return "\n".join(rows)

    threat_counts: Dict[str, int] = {}
    for tc in test_cases:
        threat_counts[tc.threat_category] = threat_counts.get(tc.threat_category, 0) + 1
    threat_rows = "\n".join(f"| {k} | {v} |" for k, v in sorted(threat_counts.items(), key=lambda x: (-x[1], x[0])))

    return summary.format(
        total=len(test_cases),
        permit=permit,
        deny=deny,
        na=na,
        ind=ind,
        baseline_rows=make_rows(baseline),
        sec_rows=make_rows(sec),
        threat_summary=threat_rows,
    )


# =============================================================================
# JSON Export for Programmatic Testing
# =============================================================================

def export_test_cases_json(test_cases: List[TestCase]) -> str:
    """Export test cases as JSON for integration with test frameworks."""
    data = []
    for tc in test_cases:
        data.append({
            "test_id": tc.test_id,
            "description": tc.description,
            "action": tc.action,
            "expected_decision": tc.expected_decision,
            "policy_rule": tc.policy_rule,
            "threat_category": tc.threat_category,
            "request": {
                "action": tc.action,
                "resource": {
                    "task_id": tc.task_id,
                    "task_expires": tc.task_expires,
                },
                "subject": {
                    "is_member_of_task": tc.is_member_of_task,
                    "task_membership_expires": tc.task_membership_expires,
                    "task_role": tc.task_role,
                },
                "environment": {
                    "current_datetime": tc.current_datetime,
                },
                "adversarial": {
                    "omit_attributes": tc.omit_attributes,
                    "override_attributes": tc.override_attributes,
                    "duplicate_attributes": tc.duplicate_attributes,
                    "category_override": tc.category_override,
                    "extra_attributes": tc.extra_attributes,
                }
            }
        })
    return json.dumps(data, indent=2)


# =============================================================================
# Main Execution
# =============================================================================

def main():
    """Generate all test cases and save to files."""
    output_dir = "xacml_test_cases"
    os.makedirs(output_dir, exist_ok=True)

    test_cases = generate_test_cases()

    print(f"Generated {len(test_cases)} test cases")
    print(f"  - PERMIT: {sum(1 for tc in test_cases if tc.expected_decision == 'Permit')}")
    print(f"  - DENY: {sum(1 for tc in test_cases if tc.expected_decision == 'Deny')}")
    print(f"  - NotApplicable: {sum(1 for tc in test_cases if tc.expected_decision == 'NotApplicable')}")
    print(f"  - Indeterminate: {sum(1 for tc in test_cases if tc.expected_decision == 'Indeterminate')}")
    print()

    print("Generating XML request files...")
    for tc in test_cases:
        xml = generate_xacml_request(tc)
        filename = f"{output_dir}/{tc.test_id}.xml"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(xml)
        print(f"  Created: {filename}")

    print("\nGenerating test summary...")
    summary = generate_test_summary(test_cases)
    with open(f"{output_dir}/TEST_SUMMARY.md", "w", encoding="utf-8") as f:
        f.write(summary)
    print(f"  Created: {output_dir}/TEST_SUMMARY.md")

    print("\nGenerating JSON export...")
    json_data = export_test_cases_json(test_cases)
    with open(f"{output_dir}/test_cases.json", "w", encoding="utf-8") as f:
        f.write(json_data)
    print(f"  Created: {output_dir}/test_cases.json")

    print("\n" + "=" * 70)
    print("TEST CASE SUMMARY")
    print("=" * 70)

    threat_counts: Dict[str, int] = {}
    for tc in test_cases:
        threat_counts[tc.threat_category] = threat_counts.get(tc.threat_category, 0) + 1

    print("\nBy Threat Category:")
    for cat, count in sorted(threat_counts.items(), key=lambda x: (-x[1], x[0])):
        print(f"  {cat}: {count}")

    print("\nBy Group:")
    print(f"  Baseline (P*/E*): {sum(1 for tc in test_cases if tc.test_id.startswith(('P1','P2','P3','P4','E-')))}")
    print(f"  Security (S-*):   {sum(1 for tc in test_cases if tc.test_id.startswith('S-TC'))}")

    print("\n" + "=" * 70)
    print(f"All files saved to: {output_dir}/")
    print("=" * 70)


if __name__ == "__main__":
    main()
