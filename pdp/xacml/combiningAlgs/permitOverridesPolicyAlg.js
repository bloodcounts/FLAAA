/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const util = require("util");
const Result = require('../ctx/result');
const MatchResult = require('../matchResult');
const ResultFactory = require("../ctx/resultFactory");
const PolicyCombiningAlgorithm = require('./policyCombiningAlgorithm');

const algId = "urn:oasis:names:tc:xacml:1.0:policy-combining-algorithm:permit-overrides";

function PermitOverridesPolicyAlg() { };
util.inherits(PermitOverridesPolicyAlg, PolicyCombiningAlgorithm);

PermitOverridesPolicyAlg.prototype.permitOverridesPolicyAlgInit = function () {
	this.policyCombiningAlgorithmInit(algId);
};

PermitOverridesPolicyAlg.prototype.permitOverridesPolicyAlgInit2 = function (identifier) {
	this.policyCombiningAlgorithmInit(identifier);
};

PermitOverridesPolicyAlg.prototype.getIdentifier = function () {
	return algId;
};

PermitOverridesPolicyAlg.prototype.combine = function (context, parameters, policies) {
	let atLeastOneError = false;
	let atLeastOneDeny = false;
	const denyObligations = [];
	const denyAdvices = [];

	var firstIndeterminateStatus = null;

	for (var i = 0; i < policies.length; i++) {
		var policy = policies[i];
		var match = policy.match(context);
		if (match.getResult() == MatchResult.prototype.INDETERMINATE) {
			atLeastOneError = true;
			if (firstIndeterminateStatus == null) {
				firstIndeterminateStatus = match.getStatus();
			}
		} else if (match.getResult() == MatchResult.prototype.MATCH) {
			var result = policy.evaluate(context);
			var effect = result.getDecision();
			if (effect == Result.prototype.DECISION_PERMIT) {
				return result;
			}
			if (effect == Result.prototype.DECISION_DENY) {
				atLeastOneDeny = true;
				denyAdvices.push(...result.getAdvices());
				denyObligations.push(...result.getObligations());
			} else if (effect == Result.prototype.DECISION_INDETERMINATE ||
				effect == Result.prototype.DECISION_INDETERMINATE_DENY ||
				effect == Result.prototype.DECISION_INDETERMINATE_PERMIT ||
				effect == Result.prototype.DECISION_INDETERMINATE_DENY_OR_PERMIT) {
				atLeastOneError = true;
				if (firstIndeterminateStatus == null) {
					firstIndeterminateStatus = result.getStatus();
				}
			}
		}
	}
	if (atLeastOneDeny) {
		return ResultFactory.prototype.getFactory().getResultWithObligationResults(Result.prototype.DECISION_DENY, denyObligations,
			denyAdvices, context);
	}
	if (atLeastOneError) {
		return ResultFactory.prototype.getFactory().getResultWithStatus(Result.prototype.DECISION_INDETERMINATE,
			firstIndeterminateStatus, context);
	}
	return ResultFactory.prototype.getFactory().getResultWithCtx(Result.prototype.DECISION_NOT_APPLICABLE, context);

};
module.exports = PermitOverridesPolicyAlg;
