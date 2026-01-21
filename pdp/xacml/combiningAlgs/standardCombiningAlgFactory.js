/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var util = require("util");
var BaseCombiningAlgFactory = require('./baseCombiningAlgFactory');
var DenyOverridesRuleAlg = require('./denyOverridesRuleAlg');
var DenyOverridesPolicyAlg = require('./denyOverridesPolicyAlg');
var OrderedDenyOverridesRuleAlg = require('./orderedDenyOverridesRuleAlg');
var OrderedDenyOverridesPolicyAlg = require('./orderedDenyOverridesPolicyAlg');
var PermitOverridesRuleAlg = require('./permitOverridesRuleAlg');
var PermitOverridesPolicyAlg = require('./permitOverridesPolicyAlg');
var OrderedPermitOverridesRuleAlg = require('./orderedPermitOverridesRuleAlg');
var OrderedPermitOverridesPolicyAlg = require('./orderedPermitOverridesPolicyAlg');
var FirstApplicableRuleAlg = require('./firstApplicableRuleAlg');
var FirstApplicablePolicyAlg = require('./firstApplicablePolicyAlg');
var OnlyOneApplicablePolicyAlg = require('./onlyOneApplicablePolicyAlg');
var DenyUnlessPermitPolicyAlg = require('./denyUnlessPermitPolicyAlg');
var DenyUnlessPermitRuleAlg = require('./denyUnlessPermitRuleAlg');

var factoryInstance = null;
var supportedAlgorithms = [];

function StandardCombiningAlgFactory() { };
util.inherits(StandardCombiningAlgFactory, BaseCombiningAlgFactory);

StandardCombiningAlgFactory.prototype.standardCombiningAlgFactoryInit = function () {
	this.baseCombiningAlgFactoryInit(supportedAlgorithms);
};

StandardCombiningAlgFactory.prototype.getFactory = function () {
	if (factoryInstance === null) {
		initAlgorithms();
		var standardCombiningAlgFactory = new StandardCombiningAlgFactory();
		standardCombiningAlgFactory.standardCombiningAlgFactoryInit();
		factoryInstance = standardCombiningAlgFactory;
	}
	return factoryInstance;

};

StandardCombiningAlgFactory.prototype.getStandardAlgorithms = function () {
	return supportedAlgorithms;
};

function initAlgorithms() {
	var denyOverridesRuleAlg = new DenyOverridesRuleAlg();
	denyOverridesRuleAlg.denyOverridesRuleAlgInit();

	var denyOverridesPolicyAlg = new DenyOverridesPolicyAlg();
	denyOverridesPolicyAlg.denyOverridesPolicyAlgInit();

	var denyUnlessPermitRuleAlg = new DenyUnlessPermitRuleAlg();
	denyUnlessPermitRuleAlg.denyUnlessPermitRuleAlgInit();

	var denyUnlessPermitPolicyAlg = new DenyUnlessPermitPolicyAlg();
	denyUnlessPermitPolicyAlg.denyUnlessPermitPolicyAlgInit();

	var orderedDenyOverridesRuleAlg = new OrderedDenyOverridesRuleAlg();
	orderedDenyOverridesRuleAlg.orderedDenyOverridesRuleAlgInit();

	var orderedDenyOverridesPolicyAlg = new OrderedDenyOverridesPolicyAlg()
	orderedDenyOverridesPolicyAlg.orderedDenyOverridesPolicyAlgInit();

	var permitOverridesRuleAlg = new PermitOverridesRuleAlg();
	permitOverridesRuleAlg.permitOverridesRuleAlgInit();

	var permitOverridesPolicyAlg = new PermitOverridesPolicyAlg();
	permitOverridesPolicyAlg.permitOverridesPolicyAlgInit();

	var orderedPermitOverridesRuleAlg = new OrderedPermitOverridesRuleAlg();
	orderedPermitOverridesRuleAlg.permitOverridesRuleAlgInit();

	var orderedPermitOverridesPolicyAlg = new OrderedPermitOverridesPolicyAlg();
	orderedPermitOverridesPolicyAlg.orderedPermitOverridesPolicyAlgInit();

	var firstApplicableRuleAlg = new FirstApplicableRuleAlg();
	firstApplicableRuleAlg.firstApplicableRuleAlgInit();

	var firstApplicablePolicyAlg = new FirstApplicablePolicyAlg();
	firstApplicablePolicyAlg.firstApplicablePolicyAlgInit();

	var onlyOneApplicablePolicyAlg = new OnlyOneApplicablePolicyAlg();
	onlyOneApplicablePolicyAlg.onlyOneApplicablePolicyAlgInit();

	supportedAlgorithms.push(denyOverridesRuleAlg);
	supportedAlgorithms.push(denyUnlessPermitPolicyAlg);

	supportedAlgorithms.push(denyUnlessPermitRuleAlg);
	supportedAlgorithms.push(denyOverridesPolicyAlg);

	supportedAlgorithms.push(orderedDenyOverridesRuleAlg);
	supportedAlgorithms.push(orderedDenyOverridesPolicyAlg);

	supportedAlgorithms.push(permitOverridesRuleAlg);
	supportedAlgorithms.push(permitOverridesPolicyAlg);

	supportedAlgorithms.push(orderedPermitOverridesRuleAlg);
	supportedAlgorithms.push(orderedPermitOverridesPolicyAlg);

	supportedAlgorithms.push(firstApplicableRuleAlg);
	supportedAlgorithms.push(firstApplicablePolicyAlg);

	supportedAlgorithms.push(onlyOneApplicablePolicyAlg);
}




module.exports = StandardCombiningAlgFactory;
