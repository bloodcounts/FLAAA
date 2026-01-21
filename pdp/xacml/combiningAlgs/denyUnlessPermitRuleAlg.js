/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var util = require("util");
const AbstractResult = require("../ctx/abstractResult");
const ResultFactory = require("../ctx/resultFactory");
var RuleCombiningAlgorithm = require("./ruleCombiningAlgorithm");

var algId =
"urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:deny-unless-permit";

function DenyUnlessPermitRuleAlg() {}
util.inherits(DenyUnlessPermitRuleAlg, RuleCombiningAlgorithm);

DenyUnlessPermitRuleAlg.prototype.denyUnlessPermitRuleAlgInit = function () {
  this.ruleCombiningAlgorithmInit(algId);
};

DenyUnlessPermitRuleAlg.prototype.denyUnlessPermitRuleAlgInit2 = function (
  identifier
) {
  this.ruleCombiningAlgorithmInit(identifier);
};
DenyUnlessPermitRuleAlg.prototype.getIdentifier = function () {
  return algId;
};

DenyUnlessPermitRuleAlg.prototype.combine = function (
  context,
  parameters,
  ruleElements
) {
  let denyObligations = [];
  let denyAdvices = [];
  let attributes = [];
  for (let i = 0; i < ruleElements.length; i++) {
    const rule = ruleElements[i];
    const result = rule.evaluate(context);
    const value = result.getDecision();
    if (value == AbstractResult.prototype.DECISION_PERMIT) {
      return result;
    } else if (value == AbstractResult.prototype.DECISION_DENY) {
      denyAdvices.push(...result.getAdvices());
      denyObligations.push(...result.getObligations());
    }
  }


  return ResultFactory.prototype
  .getFactory()
  .getResultWithObligationResults(
    AbstractResult.prototype.DECISION_DENY,
    denyObligations,
    denyAdvices,
    context
  );
};

module.exports = DenyUnlessPermitRuleAlg;
