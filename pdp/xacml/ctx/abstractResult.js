/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const Status = require("./status");
const DECISION_PERMIT = 0;

/**
 * The decision to deny the request
 */
const DECISION_DENY = 1;

/**
 * The decision that a decision about the request cannot be made
 */
const DECISION_INDETERMINATE = 2;

/**
 * The decision that nothing applied to us
 */
const DECISION_NOT_APPLICABLE = 3;

/**
 * The decision that a decision about the request cannot be made
 */
const DECISION_INDETERMINATE_DENY = 4;

/**
 * The decision that a decision about the request cannot be made
 */
const DECISION_INDETERMINATE_PERMIT = 5;

/**
 * The decision that a decision about the request cannot be made
 */
const DECISION_INDETERMINATE_DENY_OR_PERMIT = 6;

/**
 * string versions of the 4 Decision types used for encoding
 */
const DECISIONS = ["Permit", "Deny", "Indeterminate", "NotApplicable"];

function AbstractResult() { };

AbstractResult.prototype.init = function (decision, status, version) {
  this.version = version;
  // check that decision is valid
  if ((decision != DECISION_PERMIT) && (decision != DECISION_DENY)
    && (decision != DECISION_INDETERMINATE) && (decision != DECISION_NOT_APPLICABLE)
    && (decision != DECISION_INDETERMINATE_DENY) && (decision != DECISION_INDETERMINATE_PERMIT)
    && (decision != DECISION_INDETERMINATE_DENY_OR_PERMIT)) {
    throw new Error("invalid decision value");
  }
  this.decision = decision;
  if (status == null) {
    this.status = Status.prototype.getOkInstance();
  } else {
    this.status = status;
  }
};


AbstractResult.prototype.initWithObligation = function (decision, status, obligationResults,
  advices, version) {
  this.version = version;
  // check that decision is valid
  if ((decision != DECISION_PERMIT) && (decision != DECISION_DENY)
    && (decision != DECISION_INDETERMINATE) && (decision != DECISION_NOT_APPLICABLE)
    && (decision != DECISION_INDETERMINATE_DENY) && (decision != DECISION_INDETERMINATE_PERMIT)
    && (decision != DECISION_INDETERMINATE_DENY_OR_PERMIT)) {
    throw new Error("invalid decision value");
  }

  this.decision = decision;

  if (obligationResults != null) {
    this.obligations = obligationResults;
  }

  if (advices != null) {
    this.advices = advices;
  }

  if (status == null) {
    this.status = Status.prototype.getOkInstance();
  } else {
    this.status = status;
  }
}

AbstractResult.prototype.getObligations = function () {
  if (this.obligations == null) {
    this.obligations = [];
  }
  return this.obligations;
}

AbstractResult.prototype.getAdvices = function () {
  if (this.advices == null) {
    this.advices = [];
  }
  return this.advices;
}

AbstractResult.prototype.getDecision = function () {
  return this.decision;
}

AbstractResult.prototype.getStatus = function () {
  return this.status;
}

AbstractResult.prototype.getVersion = function () {
  return this.version;
}

AbstractResult.prototype.DECISIONS = DECISIONS;
AbstractResult.prototype.DECISION_PERMIT = DECISION_PERMIT;
AbstractResult.prototype.DECISION_DENY = DECISION_DENY;
AbstractResult.prototype.DECISION_INDETERMINATE = DECISION_INDETERMINATE;
AbstractResult.prototype.DECISION_NOT_APPLICABLE = DECISION_NOT_APPLICABLE;
AbstractResult.prototype.DECISION_INDETERMINATE = DECISION_INDETERMINATE;
AbstractResult.prototype.DECISION_INDETERMINATE_DENY = DECISION_INDETERMINATE_DENY;
AbstractResult.prototype.DECISION_INDETERMINATE_PERMIT = DECISION_INDETERMINATE_PERMIT;
AbstractResult.prototype.DECISION_INDETERMINATE_DENY_OR_PERMIT = DECISION_INDETERMINATE_DENY_OR_PERMIT;

module.exports = AbstractResult;

