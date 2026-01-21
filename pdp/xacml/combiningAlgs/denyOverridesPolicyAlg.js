/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const util = require("util");
const MatchResult = require('../matchResult');
const PolicyCombiningAlgorithm = require('./policyCombiningAlgorithm');
const AbstractResult = require("../ctx/abstractResult");
const ResultFactory = require("../ctx/resultFactory");
const Result = require('../ctx/result');
const algId = "urn:oasis:names:tc:xacml:1.0:policy-combining-algorithm:deny-overrides";

function DenyOverridesPolicyAlg() { };
util.inherits(DenyOverridesPolicyAlg, PolicyCombiningAlgorithm);

DenyOverridesPolicyAlg.prototype.denyOverridesPolicyAlgInit = function () {
	this.policyCombiningAlgorithmInit(algId);
};

DenyOverridesPolicyAlg.prototype.denyOverridesPolicyAlgInit2 = function (identifier) {
	this.policyCombiningAlgorithmInit(algId);
};
DenyOverridesPolicyAlg.prototype.getIdentifier = function () {
	return algId;
};

DenyOverridesPolicyAlg.prototype.combine = function (context, parameters, policyElements) {
	let atLeastOnePermit = false;
	const permitObligations = [];
	const permitAdvices = [];

	for (let policy of policyElements) {
		const match = policy.match(context);
		console.log(`Child policy ${policy.idAttr} match: ${match.getResult()}`);
		if (match.getResult() == MatchResult.prototype.INDETERMINATE) {
			return ResultFactory.prototype.getFactory().getResultWithCtx(AbstractResult.prototype.DECISION_DENY, context);
		}
		if (match.getResult() == MatchResult.prototype.MATCH) {
			// evaluate the policy
			const result = policy.evaluate(context);
			console.log(`Policy ${policy.idAttr} evaluated decision: ${result.getDecision()}`);
			const effect = result.getDecision();

			// unlike in the RuleCombining version of this alg, we always
			// return DENY if any Policy returns DENY or INDETERMINATE
			if (effect == AbstractResult.prototype.DECISION_DENY) {
				return result;
			}

			if (effect == AbstractResult.prototype.DECISION_INDETERMINATE ||
				effect == AbstractResult.prototype.DECISION_INDETERMINATE_DENY ||
				effect == AbstractResult.prototype.DECISION_INDETERMINATE_PERMIT ||
				effect == AbstractResult.prototype.DECISION_INDETERMINATE_DENY_OR_PERMIT) {

				return ResultFactory.prototype.getFactory().getResultWithCtx(Result.prototype.DECISION_DENY, context);
			}
			// remember if at least one Policy said PERMIT
			if (effect == Result.prototype.DECISION_PERMIT) {
				atLeastOnePermit = true;
				permitAdvices.push(...result.getAdvices());
				permitObligations.push(...result.getObligations());
			}
		}
	}

	if (atLeastOnePermit) {
		return ResultFactory.prototype.getFactory().getResultWithObligationResults(AbstractResult.prototype.DECISION_PERMIT,
			permitObligations, permitAdvices, context);
	} else {
		return ResultFactory.prototype.getFactory().getResultWithCtx(AbstractResult.prototype.DECISION_NOT_APPLICABLE, context);
	}
};


module.exports = DenyOverridesPolicyAlg;
