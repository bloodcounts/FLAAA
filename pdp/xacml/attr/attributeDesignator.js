/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var Status = require('../ctx/status');
var SUBJECT_TARGET = 0;
var RESOURCE_TARGET = 1;
var ACTION_TARGET = 2;
var ENVIRONMENT_TARGET = 3;
var SUBJECT_CATEGORY_DEFAULT = "urn:oasis:names:tc:xacml:1.0:subject-category:access-subject";
var targetTypes = ["Subject", "Resource", "Action", "Environment"];

function AttributeDesignator() {};
AttributeDesignator.prototype.attributeDesignatorInit = function (target, type, id, mustBePresent) {
  this.attributeDesignatorInit2(target, type, id, mustBePresent, null);
};


AttributeDesignator.prototype.attributeDesignatorInit2 = function (target, type, id, mustBePresent, issuer) {
  if ((target != SUBJECT_TARGET) &&
    (target != RESOURCE_TARGET) &&
    (target != ACTION_TARGET) &&
    (target != ENVIRONMENT_TARGET)) {
    console.log("Input target is not a valid" + "value");
  }
  this.target = target;
  this.type = type;
  this.id = id;
  this.mustBePresent = mustBePresent;
  this.issuer = issuer;

  this.subjectCategory = null;

};

AttributeDesignator.prototype.getInstance = function (root, target) {
  let mustBePresent = false;
  let subjectCategory;

  const id = root.attr("AttributeId").value();
  const type = root.attr("DataType").value();
  let node = root.attr("Issuer");
  if (node !== null) {
    const issuer = node.value();
  }
  if (target == SUBJECT_TARGET) {

    var scnode = root.attr("SubjectCategory");
    if (scnode != null) {
      subjectCategory = scnode.value();
    } else {
      subjectCategory = SUBJECT_CATEGORY_DEFAULT;
    }
  }
  node = root.attr("MustBePresent");
  if (node != null) {
    if (node.value() == "true") {
      mustBePresent = true;
    }
  }
  var attributeDesignator = new AttributeDesignator();
  attributeDesignator.attributeDesignatorInit2(target, type, id, mustBePresent, issuer);
  attributeDesignator.setSubjectCategory(subjectCategory);
  return attributeDesignator;
};

AttributeDesignator.prototype.SUBJECT_CATEGORY_DEFAULT = SUBJECT_CATEGORY_DEFAULT;
AttributeDesignator.prototype.SUBJECT_TARGET = SUBJECT_TARGET;
AttributeDesignator.prototype.RESOURCE_TARGET = RESOURCE_TARGET;
AttributeDesignator.prototype.ACTION_TARGET = ACTION_TARGET;
AttributeDesignator.prototype.ENVIRONMENT_TARGET = ENVIRONMENT_TARGET;

AttributeDesignator.prototype.evaluate = function (context) {
  var result;
  switch (this.target) {
    case SUBJECT_TARGET:
      result = context.getSubjectAttribute(this.type, this.id, this.issuer, this.subjectCategory);
      break;
    case RESOURCE_TARGET:
      result = context.getResourceAttribute(this.type, this.id, this.issuer);
      break;
    case ACTION_TARGET:
      result = context.getActionAttribute(this.type, this.id, this.issuer);
      break;
    case ENVIRONMENT_TARGET:
      result = context.getEnvironmentAttribute(this.type, this.id, this.issuer);
      break;

  }
  if (result.indeterminate()) {
    return result;
  }

  var bag = result.attributeValues;

  if (bag == null) {
    if (this.mustBePresent) {
      var code = [];
      code.push(Status.prototype.STATUS_MISSING_ATTRIBUTE);
      var message = "Couldn't find " + targetTypes[this.target] +
        "AttributeDesignator attribute";
      var evaluationResult = new EvaluationResult();
      var status = new Status();
      status.statusInit2(code, message);
      evaluationResult.evaluationResultInit_status(status)
      return evaluationResult;
    }
  }
  return result;
};
AttributeDesignator.prototype.setSubjectCategory = function (category) {
  if (this.target == SUBJECT_TARGET) {
    this.subjectCategory = category;
  }
};


module.exports = AttributeDesignator;
