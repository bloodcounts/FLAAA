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
const ResultFactory = require('../ctx/resultFactory');
var RuleCombiningAlgorithm = require('./ruleCombiningAlgorithm');

var algId = "urn:oasis:names:tc:xacml:1.0:rule-combining-algorithm:" +
	"deny-overrides";

function DenyOverridesRuleAlg() { };
util.inherits(DenyOverridesRuleAlg, RuleCombiningAlgorithm);

DenyOverridesRuleAlg.prototype.denyOverridesRuleAlgInit = function () {
	this.ruleCombiningAlgorithmInit(algId);
};

DenyOverridesRuleAlg.prototype.denyOverridesRuleAlgInit2 = function (identifier) {
	this.ruleCombiningAlgorithmInit(identifier);
};
DenyOverridesRuleAlg.prototype.getIdentifier = function () {
	return algId;
};

DenyOverridesRuleAlg.prototype.combine = function (context, parameters, ruleElements) {
	let atLeastOneError = false;
	let potentialDeny = false;
	let atLeastOnePermit = false;
	let firstIndeterminateResult = null;
	let permitObligations = [];
	let permitAdvices = [];

	for (let i = 0; i < ruleElements.length; i++) {
		const rule = ruleElements[i];
		console.log(`Evaluating rule: ${rule.idAttr}`);
		const result = rule.evaluate(context);
		console.log(`Rule ${rule.idAttr} decision: ${result.getDecision()}`);
		const value = result.getDecision();
		if (value == AbstractResult.prototype.DECISION_DENY) {
			return result;
		}
		if (value == AbstractResult.prototype.DECISION_INDETERMINATE ||
			value == AbstractResult.prototype.DECISION_INDETERMINATE_DENY ||
			value == AbstractResult.prototype.DECISION_INDETERMINATE_PERMIT ||
			value == AbstractResult.prototype.DECISION_INDETERMINATE_DENY_OR_PERMIT) {
			atLeastOneError = true;

			if (firstIndeterminateResult == null) {
				firstIndeterminateResult = result;
			}
			if (rule.effectAttr === AbstractResult.prototype.DECISION_DENY) {
				potentialDeny = true;
			}
		} else {
			if (value == AbstractResult.prototype.DECISION_PERMIT) {
				atLeastOnePermit = true;
				permitAdvices.push(...result.getAdvices());
				permitObligations.push(...result.getObligations());
			}
		}
	}

	if (potentialDeny) {
		return firstIndeterminateResult;
	}

	if (atLeastOnePermit) {
		return ResultFactory.prototype.getFactory().getResultWithObligationResults(AbstractResult.prototype.DECISION_PERMIT,
			permitObligations, permitAdvices, context);
	}
	if (atLeastOneError) {
		return firstIndeterminateResult;
	}

	return ResultFactory.prototype.getFactory().getResultWithCtx(AbstractResult.prototype.DECISION_NOT_APPLICABLE, context);
};

module.exports = DenyOverridesRuleAlg;
