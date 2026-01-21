/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var AttributeDesignator = require("./attr/attributeDesignator");
var EvaluationResult = require("./cond/evaluationResult");
var BagAttribute = require("./attr/bagAttribute");
var RESOURCE_ID = "urn:oasis:names:tc:xacml:1.0:resource:resource-id";
var RESOURCE_SCOPE = "urn:oasis:names:tc:xacml:1.0:resource:scope";
var SCOPE_IMMEDIATE = 0;
var SCOPE_CHILDREN = 1;
var SCOPE_DESCENDANTS = 2;

var finder,
	requestRoot,
	useCachedEnvValues,
	currentDate,
	currentTime,
	currentDateTime;
var resourceMap;
var actionMap;
var environmentMap;
var subjectMap;
var resourceId;
var scope;


function BasicEvaluationCtx() { };

BasicEvaluationCtx.prototype.basicEvaluationCtxInit3 = function (request, finder) {
	this.basicEvaluationCtxInit4(request, finder, true);
};

BasicEvaluationCtx.prototype.basicEvaluationCtxInit4 = function (request, finder, cacheEnvValues) {

	this.finder = finder;
	this.requestRoot = request.getDocumentRoot();
	this.useCachedEnvValues = cacheEnvValues;
	this.currentDate = null;
	this.currentTime = null;
	this.currentDateTime = null;

	this.subjectMap = {};
	this.setupSubjects(request.getSubjects());

	this.resourceMap = {};
	this.setupResource(request.getResource());

	this.actionMap = {};
	this.mapAttributes(request.getAction(), this.actionMap);

	this.environmentMap = {};
	this.mapAttributes(request.getEnvironmentAttributes(), this.environmentMap);

};

BasicEvaluationCtx.prototype.getResourceId = function () {

	return resourceId;

};
BasicEvaluationCtx.prototype.setupSubjects = function (subjects) {

	if (subjects.length == 0) {
		console.log("Request must a contain subject");
	}
	for (var i = 0; i < subjects.length; i++) {
		var subject = subjects[i];

		var category = subject.getCategory();

		var categoryMap = {};

		if (this.subjectMap[category] != null) {

			categoryMap = this.subjectMap[category];
		} else {

			this.subjectMap[category] = categoryMap;

		}
		var attrIterator = subject.getAttributes();

		for (var j = 0; j < attrIterator.length; j++) {
			var attr = attrIterator[j];
			var id = attr.getId();

			if (categoryMap[id] != null) {
				var existingIds = [];
				existingIds = categoryMap[id];
				existingIds.push(attr);
			} else {
				var newIds = [];
				newIds.push(attr);

				categoryMap[id] = newIds;

			}
		}
	}
};

BasicEvaluationCtx.prototype.setupResource = function (resource) {

	this.mapAttributes(resource, this.resourceMap);

	if (this.resourceMap[RESOURCE_ID] == null) {
		console.log("Resource must contain resource-id attr");
	} else {
		var set = [];
		set.push(this.resourceMap[RESOURCE_ID]);

		resourceId = set[0][0].getValue();
	}
	if (this.resourceMap[RESOURCE_SCOPE] != null) {

		var set = [];
		set.push(this.resourceMap[RESOURCE_SCOPE]);
		var attr = set[0];

		var attrValue = attr.getValue();

		var value = attrValue.getValue();
		if (value == "Immediate") {
			scope = SCOPE_IMMEDIATE;
		} else if (value == "Children") {
			scope = SCOPE_CHILDREN;
		} else if (value == "Descendants") {
			scope = SCOPE_DESCENDANTS;
		} else {
			console.log("Unknown scope type: " + value);
		}
	} else {
		scope = SCOPE_IMMEDIATE;
	}
};

BasicEvaluationCtx.prototype.mapAttributes = function (inputs, output) {
	for (var i = 0; i < inputs.length; i++) {
		var attr = inputs[i];
		var id = attr.getId();
		if (output[id] != null) {
			var set = [];
			set = output[id];
			set.push(attr);
		} else {

			var set = [];
			set.push(attr);
			output[id] = set;
			if (id.indexOf('resource') > -1) {
				this.resourceMap[id] = set;
			} else if (id.indexOf('action') > -1) {
				this.actionMap[id] = set;
			}

		}
	}
};

BasicEvaluationCtx.prototype.setResourceId = function (resourceId) {
	this.resourceId = resourceId;
	var attrSet = [];
	attrSet = this.resourceMap[RESOURCE_ID];
	var attr = attrSet[0];

	var idx = attrSet.indexOf(attr);
	if (idx != -1) {
		attrSet.splice(idx, 1);
	}
	attrSet.push(new Attribute(attr.getId(), attr.getIssuer(), attr.getIssueInstant(), this.resourceId));

};
BasicEvaluationCtx.prototype.getScope = function () {
	return scope;
};

BasicEvaluationCtx.prototype.getSubjectAttribute = function (type, id, issure, category) {

	var map = {};

	map = this.subjectMap[category];


	if (map == null) {
		return this.callHelper(type, id, issure, category, AttributeDesignator.prototype.SUBJECT_TARGET);
	}

	return this.getGenericAttributes(type, id, issure, map, category, AttributeDesignator.prototype.SUBJECT_TARGET);
};

BasicEvaluationCtx.prototype.getResourceAttribute = function (type, id, issure) {

	return this.getGenericAttributes(type, id, issure, this.resourceMap, null,
		AttributeDesignator.prototype.RESOURCE_TARGET);
};

BasicEvaluationCtx.prototype.getActionAttribute = function (type, id, issure) {

	return this.getGenericAttributes(type, id, issure, this.actionMap, null,
		AttributeDesignator.prototype.ACTION_TARGET);
};

BasicEvaluationCtx.prototype.getEnvironmentAttribute = function (type, id, issure) {

	return this.getGenericAttributes(type, id, issure, this.environmentMap, null,
		AttributeDesignator.prototype.ENVIRONMENT_TARGET);
};




BasicEvaluationCtx.prototype.callHelper = function (type, id, issuer, category, adType) {

	if (this.finder != null) {

		return this.finder.findAttribute(type, id, issuer, category, this, adType);
	} else {
		console.log("Context tried to invoke AttributeFinder but was " +
			"not configured with one");

		var evaluationResult = new EvaluationResult();
		evaluationResult.evaluationResultInit(BagAttribute.prototype.createEmptyBag(type))
		return evaluationResult;
	}

};
BasicEvaluationCtx.prototype.getGenericAttributes = function (type, id, issuer, map, category, designatorType) {
	var attrSet = map[id];

	if (attrSet == null) {

		return this.callHelper(type, id, issuer, category, designatorType);
	}
	var attributes = [];
	for (var i = 0; i < attrSet.length; i++) {
		var attr = attrSet[i];

		if ((attr.getType() == type) && ((issuer == null) || ((attr.getIssuer() != null) && (attr.getIssuer() == issuer)))) {
			attributes.push(attr.getValue());
		}
	}
	if (attributes.length == 0) {
		return this.callHelper(type, id, issuer, category, designatorType);
	}
	var evaluationResult = new EvaluationResult();
	var bagAttribute = new BagAttribute();
	bagAttribute.bagAttributeInit(type, attributes);
	evaluationResult.evaluationResultInit(bagAttribute);

	return evaluationResult;
};

module.exports = BasicEvaluationCtx;
