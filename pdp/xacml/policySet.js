/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const util = require("util");
const { DOMParser } = require("@xmldom/xmldom");
const AbstractPolicy = require('./abstractPolicy');
const Policy = require('./policy');
const PolicyCombinerElement = require("./combiningAlgs/policyCombinerElement");
const PolicyFilter = require('./policyFilter')

function PolicySet() { };
util.inherits(PolicySet, AbstractPolicy);
PolicySet.prototype.policySetInit = function (root, finder) {

	this.abstractPolicyInitWithRoot(root, "PolicySet", "PolicyCombiningAlgId");
	var policies = [];
	const policyParameters = [];
	const policySetParameters = [];

	var children = root.childNodes;

	for (var i = 0, l = children.length; i < l; i++) {
		var child = children[i];
		var name = child.nodeName;
		if (name ==="PolicySet") {
			policies.push(this.getInstance(child, finder));
		} else if (name === "Policy") {
			policies.push(Policy.prototype.getInstance(child));
		} else if (name === "PolicySetIdReference") {
			policies.push(PolicyReference.prototype.getInstance(child, finder));
		} else if (name === "PolicyIdReference") {
			policies.push(PolicyReference.prototype.getInstance(child, finder));
		} else if (name === "PolicyCombinerParameters") {
			parameterHelper(policyParameters, child, "Policy");
		} else if (name === "PolicySetCombinerParameters") {
			parameterHelper(policySetParameters, child, "PolicySet");
		}
	}

	const elements = [];
	for (let policy of policies) {
		let list = null;

		if (policy instanceof Policy) {
			list = remove_array_element(policyParameters, policy.idAttr);
		} else if (policy instanceof PolicySet) {
			list = remove_array_element(policySetParameters, policy.idAttr);
		} else {
			const id = policy.getReference().toString();
			if (policy.getReferenceType() == PolicyReference.prototype.POLICY_REFERENCE) {
				list = policyParameters.remove(id);
			} else {
				list = policySetParameters.remove(id);
			}
		}

		elements.push(new PolicyCombinerElement(policy, list));
	}

	if (policyParameters.length !== 0) {
		throw new Error("Unmatched parameters in Policy");
	}

	if (policySetParameters.length !== 0) {
		throw new Error("Unmatched parameters in PolicySet");
	}

	this.setChildren(elements);

};

PolicySet.prototype.getInstance = function (root, finder) {
	if (root.nodeName != "PolicySet") {
		console.log("Cannot create PolicySet from root of" + " type " + root.nodeName);
	}

	var policySet = new PolicySet();
	policySet.policySetInit(root, finder);
	const policyFilter = PolicyFilter.getInstance();
	policyFilter.addPolicySetAttrs(policySet)
	return policySet;
}

const parameterHelper = function (parameters,
	root, prefix) {
	throw new Error()
}

const remove_array_element = (array, n) => {
	const index = array.indexOf(n);
	if (index > -1) {
		array.splice(index, 1);
	}
	return array;
}

module.exports = PolicySet;
