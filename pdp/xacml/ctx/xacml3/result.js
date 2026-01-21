/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const util = require("util");
const AbstractResult = require("../abstractResult");
const XACMLConstants = require("../../XACMLConstants");
const Attributes = require("../../xacml3/attributes");
function Result() { };
util.inherits(Result, AbstractResult);

Result.prototype.init = function (input, rootTag) {
  this.init(decision, status, XACMLConstants.XACML_VERSION_3_0)
};

Result.prototype.initWithObligationResults = function (decision, status, obligationResults,
  advices, evaluationCtx) {
  this.initWithObligation(decision, status, obligationResults, advices, XACMLConstants.XACML_VERSION_3_0);
  if (evaluationCtx != null) {
    this.policyReferences = evaluationCtx.policyReferences;
    this.processAttributes(evaluationCtx.attributesSet);
  }
};

Result.prototype.initWithPolicy = function (decision, status, obligationResults,
  advices, policyReferences, attributes) {
  this.initWithObligation(decision, status, obligationResults, advices, XACMLConstants.XACML_VERSION_3_0);
  this.policyReferences = policyReferences;
  this.processAttributes(attributes);
};

Result.prototype.processAttributes = function (attributesSet) {
  if (attributesSet == null) {
    return;
  }
  const newSet = [];
  for (let attributes of attributesSet) {
    const attributeSet = attributes.getAttributes();
    if (attributeSet == null) {
      continue;
    }
    const newAttributeSet = [];
    for (let attribute of attributeSet) {
      if (attribute.isIncludeInResult()) {
        newAttributeSet.push(attribute);
      }
    }

    if (newAttributeSet.length > 0) {
      const newAttributes = new Attributes();
      newAttributes.init(attributes.getCategory(),
        attributes.getContent(), newAttributeSet, attributes.getId())
      newSet.push(newAttributes);
    }
  }
  this.attributes = newSet;
};

Result.prototype.encode = function (builder) {
  builder.push("<Result>");
  // encode the decision
  //check whether decision is extended indeterminate values

  if (this.decision == 4 || this.decision == 5 || this.decision == 6) {
    // if this is extended indeterminate values, we just return the "Indeterminate"
    builder.push("<Decision>" + this.DECISIONS[2] + "</Decision>");
  } else {
    builder.push("<Decision>" + this.DECISIONS[this.decision] + "</Decision>");
  }
  // encode the status
  if (this.status != null) {
    this.status.encode(builder);
  }


  if (this.obligations != null && this.obligations.length != 0) {

    builder.push("<Obligations>");

    this.obligations.forEach(obligation => {
      obligation.encode(builder);
    });
    builder.push("</Obligations>");
  }

  if (this.advices != null && this.advices.length != 0) {

    builder.push("<AssociatedAdvice>");
    advices.forEach(advice => {
      advice.encode(builder);
    })

    builder.push("</AssociatedAdvice>");
  }

  if (this.attributes != null && this.attributes.length != 0) {
    for (let attribute of attributes) {
      attribute.encode(builder);
    }
  }

  if (this.policyReferences != null && this.policyReferences.length != 0) {
    builder.push("<PolicyIdentifierList>");

    for (let reference of this.policyReferences) {
      reference.encode(builder);
    }

    builder.push("</PolicyIdentifierList>");
  }

  builder.push("</Result>");
}


module.exports = Result;

