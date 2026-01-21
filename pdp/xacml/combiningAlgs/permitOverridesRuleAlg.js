/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const util = require("util");
const AbstractResult = require("../ctx/abstractResult");
const ResultFactory = require('../ctx/resultFactory');
const RuleCombiningAlgorithm = require('./ruleCombiningAlgorithm');
const Result = require('../ctx/result');
const algId = "urn:oasis:names:tc:xacml:1.0:rule-combining-algorithm:permit-overrides";

function PermitOverridesRuleAlg() { };

util.inherits(PermitOverridesRuleAlg, RuleCombiningAlgorithm);

PermitOverridesRuleAlg.prototype.permitOverridesRuleAlgInit = function () {
  this.ruleCombiningAlgorithmInit(algId);
};

PermitOverridesRuleAlg.prototype.permitOverridesRuleAlgInit2 = function (algId) {
  this.ruleCombiningAlgorithmInit(algId);
};

PermitOverridesRuleAlg.prototype.combine = function (context, parameters, rules) {

  let atLeastOneError = false;
  let potentialPermit = false;
  let atLeastOneDeny = false;
  const denyObligations = [];
  const denyAdvices = [];

  let firstIndeterminateResult = null;
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    const result = rule.evaluate(context);
    const value = result.getDecision();
    if (value == Result.prototype.DECISION_PERMIT) {
      return result;
    }
    if (value == Result.prototype.DECISION_INDETERMINATE ||
      value == Result.prototype.DECISION_INDETERMINATE_DENY ||
      value == Result.prototype.DECISION_INDETERMINATE_PERMIT ||
      value == Result.prototype.DECISION_INDETERMINATE_DENY_OR_PERMIT) {
      atLeastOneError = true;
      if (firstIndeterminateResult == null) {
        firstIndeterminateResult = result;
      }
      if (rule.effectAttr === Result.prototype.DECISION_PERMIT) {
        potentialPermit = true;
      }

    } else {
      if (value == Result.prototype.DECISION_DENY)
        atLeastOneDeny = true;
      denyAdvices.push(...result.getAdvices());
      denyObligations.push(...result.getObligations());
    }

  }
  if (potentialPermit) {
    return firstIndeterminateResult;
  }
  if (atLeastOneDeny) {
    return ResultFactory.prototype.getFactory().getResultWithObligationResults(AbstractResult.prototype.DECISION_DENY, denyObligations,
      denyAdvices, context);
  }

  if (atLeastOneError) {
    return firstIndeterminateResult;
  }
  return ResultFactory.prototype.getFactory().getResultWithCtx(AbstractResult.prototype.DECISION_NOT_APPLICABLE, context);
};

PermitOverridesRuleAlg.prototype.getIdentifier = function () {
  return algId;
};
module.exports = PermitOverridesRuleAlg;
