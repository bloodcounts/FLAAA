/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const util = require("util");
const MatchResult = require("../matchResult");
const PolicyCombiningAlgorithm = require("./policyCombiningAlgorithm");
const AbstractResult = require("../ctx/abstractResult");
const ResultFactory = require("../ctx/resultFactory");
const Result = require("../ctx/result");
const algId =
  "urn:oasis:names:tc:xacml:3.0:policy-combining-algorithm:deny-unless-permit";

function DenyUnlessPermitPolicyAlg() {}
util.inherits(DenyUnlessPermitPolicyAlg, PolicyCombiningAlgorithm);

DenyUnlessPermitPolicyAlg.prototype.denyUnlessPermitPolicyAlgInit =
  function () {
    this.policyCombiningAlgorithmInit(algId);
  };

DenyUnlessPermitPolicyAlg.prototype.denyUnlessPermitPolicyAlgInit2 = function (
  identifier
) {
  this.policyCombiningAlgorithmInit(algId);
};
DenyUnlessPermitPolicyAlg.prototype.getIdentifier = function () {
  return algId;
};

DenyUnlessPermitPolicyAlg.prototype.combine = function (
  context,
  parameters,
  policyElements
) {
  const denyObligations = [];
  const denyAdvices = [];

  for (let policy of policyElements) {
    const match = policy.match(context);
    if (match.getResult() === MatchResult.prototype.MATCH) {
      // evaluate the policy
      const result = policy.evaluate(context);
      const effect = result.getDecision();

      if (effect == AbstractResult.prototype.DECISION_PERMIT) {
        return result;
      }
   
      else if (effect == AbstractResult.prototype.DECISION_DENY) {
        denyAdvices.push(...result.getAdvices());
        denyObligations.push(...result.getObligations());
      }
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

module.exports = DenyUnlessPermitPolicyAlg;
