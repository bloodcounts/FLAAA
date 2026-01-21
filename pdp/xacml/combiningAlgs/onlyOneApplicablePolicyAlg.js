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
const Result = require('../ctx/result');
const ResultFactory = require("../ctx/resultFactory");
const PolicyCombiningAlgorithm = require('./policyCombiningAlgorithm');
const Status = require('../ctx/status');

const algId = "urn:oasis:names:tc:xacml:1.0:policy-combining-algorithm:only-one-applicable";
function OnlyOneApplicablePolicyAlg() { };
util.inherits(OnlyOneApplicablePolicyAlg, PolicyCombiningAlgorithm);

OnlyOneApplicablePolicyAlg.prototype.onlyOneApplicablePolicyAlgInit = function () {
	this.policyCombiningAlgorithmInit(algId);
};

OnlyOneApplicablePolicyAlg.prototype.getIdentifier = function () {
	return algId;
};

OnlyOneApplicablePolicyAlg.prototype.combine = function (context, parameters, policyElements) {
	let atLeastOne = false;
	let selectedPolicy = null;

	for (let policy of policyElements) {
		const match = policy.match(context);
		const result = match.getResult();
		if (result == MatchResult.prototype.INDETERMINATE) {
			return ResultFactory.prototype.getFactory().getResultWithStatus(Result.prototype.DECISION_INDETERMINATE,
				match.getStatus(), context);
		}
		if (result === MatchResult.prototype.MATCH) {
			// if this isn't the first match, then this is an error
			if (atLeastOne) {
				const code = [];
				code.push(Status.prototype.STATUS_PROCESSING_ERROR);
				const message = "Too many applicable policies";
				const status = new Status;
				status.statusInit2(code, message);

				return ResultFactory.prototype.getFactory().
					getResultWithStatus(Result.prototype.DECISION_INDETERMINATE,
						status, context);
			}

			atLeastOne = true;
			selectedPolicy = policy;
		}
	}

	if (atLeastOne) {
		return selectedPolicy.evaluate(context);
	}
	// if we didn't find a matching policy, then we don't apply
	return ResultFactory.prototype.getFactory().getResultWithCtx(Result.prototype.DECISION_NOT_APPLICABLE, context);
};


module.exports = OnlyOneApplicablePolicyAlg;
