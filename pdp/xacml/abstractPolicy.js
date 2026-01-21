/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const { DOMParser } = require('@xmldom/xmldom');
const CombiningAlgFactory = require("./combiningAlgs/combiningAlgFactory");
const RuleCombiningAlgorithm = require("./combiningAlgs/ruleCombiningAlgorithm");
const PolicyCombiningAlgorithm = require("./combiningAlgs/policyCombiningAlgorithm");
const Target = require("./target");
const PolicyMetaData = require("./PolicyMetaData");
const ObligationFactory = require('./obligationFactory');
const Result = require("./ctx/result");
const TargetFactory = require("./targetFactory");

const XPATH_1_0_VERSION = "http://www.w3.org/TR/1999/Rec-xpath-19991116";

function AbstractPolicy() {}

AbstractPolicy.prototype.abstractPolicyInitWithRoot = function (root, policyPrefix, combiningName) {
  this.parameters = [];
  this.idAttr = root.getAttribute(`${policyPrefix}Id`);
  let algId = root.getAttribute(combiningName);
  let factory = CombiningAlgFactory.prototype.getInstance();

  this.combiningAlg = factory.createAlgorithm(algId);
  if (policyPrefix == "Policy") {
    if (!this.combiningAlg instanceof RuleCombiningAlgorithm) {
      throw new Error('Policy must use a Rule Combining Algorithm');
    }
  } else {
    if (!(this.combiningAlg instanceof PolicyCombiningAlgorithm)) {
      throw new Error('PolicySet must use a Policy Combining Algorithm');
    }
  }

  const namespaceURI = root.namespaceURI;
  this.metaData = new PolicyMetaData();
  this.metaData.init(namespaceURI);

  this.obligationExpressions = [];
  this.adviceExpressions = [];

  var children = root.childNodes;
  for (var i = 0, l = children.length; i < l; i++) {
    var cname = children[i].nodeName;
    var child = children[i];

    switch (cname) {
      case 'Description':
        this.description = child.textContent;
        break;
      case 'Target':
        this.target = TargetFactory.prototype.getTarget(child, this.metaData);
        break;
      case 'Obligations':
      case 'ObligationExpressions':
        this.parseObligationExpressions(child);
        break;
      case 'AdviceExpressions':
      case 'CombinerParameters':
        throw new Error(`cname === ${cname}`);
      case `${policyPrefix}Defaults`:
        this.handleDefaults(child);
        break;
    }
  }
};

AbstractPolicy.prototype.parseObligationExpressions = function (root) {
  const nodes = root.childNodes;

  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if (node.nodeName === "Obligation" || node.nodeName === "ObligationExpression") {
      this.obligationExpressions.push(ObligationFactory.prototype.getObligation(node, this.metaData));
    }
  }
};

AbstractPolicy.prototype.handleDefaults = function (root) {
  defaultVersion = null;
  var nodes = root.childNodes;
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node.nodeName == "XPathVersion") {
      defaultVersion = node.textContent;
      if (defaultVersion != XPATH_1_0_VERSION) {
        console.log("Unknown XPath version");
      }
    }
  }
};

AbstractPolicy.prototype.setChildren = function (children) {
  if (children == null) {
    this.children = [];
  } else {
    const list = [];
    for (let aChildren of children) {
      list.push(aChildren.getElement());
    }

    this.children = list;
    this.childElements = children;
  }
};

AbstractPolicy.prototype.getChildren = function (children) {
  return this.children;
};

AbstractPolicy.prototype.getDefaultVersion = function () {
  return defaultVersion;
};

AbstractPolicy.prototype.match = function (context) {
  return this.target.match(context);
};

AbstractPolicy.prototype.getCombiningAlg = function () {
  return this.combiningAlg;
};

AbstractPolicy.prototype.getMetaData = function () {
  return this.metaData;
};

AbstractPolicy.prototype.evaluate = function (context) {
  const result = this.combiningAlg.combine(context, this.parameters, this.children);

  if (this.obligationExpressions.length < 1 && this.adviceExpressions.length < 1) {
    return result;
  }

  const effect = result.getDecision();

  if ((effect == Result.prototype.DECISION_INDETERMINATE) || (effect == Result.prototype.DECISION_NOT_APPLICABLE)) {
    return result;
  }
  this.processObligationAndAdvices(context, effect, result);

  return result;
};

AbstractPolicy.prototype.processObligationAndAdvices = function (evaluationCtx, effect, result) {
  if (this.obligationExpressions != null && this.obligationExpressions.length > 0) {
    const results = [];
    for (let obligationExpression of this.obligationExpressions) {
      if (obligationExpression.getFulfillOn() == effect) {
        results.push(obligationExpression.evaluate(evaluationCtx));
      }
    }

    result.getObligations().push(...results);
  }
  if (this.adviceExpressions != null && this.adviceExpressions.length > 0) {
    const advices = [];
    for (let adviceExpression of this.adviceExpressions) {
      if (adviceExpression.getAppliesTo() == effect) {
        advices.push(adviceExpression.evaluate(evaluationCtx));
      }
    }
    result.getAdvices().push(...advices);
  }

}
module.exports = AbstractPolicy;
