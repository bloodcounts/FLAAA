/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const { DOMParser } = require('@xmldom/xmldom');
var MatchResult = require('./matchResult');
var AttributeFactory = require('./attr/attributeFactory');
const FunctionFactory = require("./cond/functionFactory");
const XACMLConstants = require("./XACMLConstants");
const AttributeDesignatorFactory = require("./attr/attributeDesignatorFactory");
const AttributeSelectorFactory = require("./attr/attributeSelectorFactory");

const SUBJECT = 0;
const RESOURCE = 1;
const ACTION = 2;
const ENVIRONMENT = 3;
const NAMES = ["Subject", "Resource", "Action", "Environment"];
const status = {
  match: MatchResult.prototype.MATCH,
  no_match: MatchResult.prototype.NO_MATCH
}

function TargetMatch() {}
TargetMatch.prototype.targetMatchInit = function (type, _function, evals, attrValue) {

  if ((type !== SUBJECT) &&
    (type !== RESOURCE) &&
    (type !== ACTION)) {
    throw new Error("Unknown TargetMatch type");
  }
  this.type = type;
  this._function = _function;
  this.evals = evals;
  this.attrValue = attrValue;

};

TargetMatch.prototype.init = function (_function, evals, attrValue) {
  this._function = _function;
  this.evals = evals;
  this.attrValue = attrValue;
}

TargetMatch.prototype.getInstanceWithMetaData = function (root, metaData) {
  return this.getInstance(root, 0, metaData);
}

TargetMatch.prototype.getInstance = function (root, matchType, metaData) {
  let _function;
  let evals = null;
  let attrValue = null;

  const attrFactory = AttributeFactory.prototype.getInstance();
  const funcName = root.getAttribute("MatchId");

  const factory = FunctionFactory.prototype.getTargetInstance();
  _function = factory.createFunction(funcName);

  const nodes = root.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const name = node.nodeName;

    if (XACMLConstants.XACML_VERSION_3_0 == metaData.getXACMLVersion() &&
      "AttributeDesignator" === name) {
      evals = AttributeDesignatorFactory.prototype.getFactory().getAbstractDesignator(node, metaData);
    } else if (!(XACMLConstants.XACML_VERSION_3_0 == metaData.getXACMLVersion()) &&
      (NAMES[matchType] + "AttributeDesignator") === name) {
      evals = AttributeDesignatorFactory.prototype.getFactory().getAbstractDesignator(node, metaData);
    } else if (name === "AttributeSelector") {
      evals = AttributeSelectorFactory.prototype.getFactory().getAbstractSelector(node, metaData);
    } else if (name === "AttributeValue") {
      attrValue = attrFactory.createValue1(node);
    }
  }

  const inputs = [attrValue, evals];

  _function.checkInputsNoBag(inputs);
  const targetMatch = new TargetMatch;

  if (XACMLConstants.XACML_VERSION_3_0 == metaData.getXACMLVersion()) {
    targetMatch.init(_function, evals, attrValue)
  } else {
    targetMatch.targetMatchInit(matchType, _function, evals, attrValue);
  }

  return targetMatch;
}

TargetMatch.prototype.NAMES = NAMES;
TargetMatch.prototype.ENVIRONMENT = ENVIRONMENT;
TargetMatch.prototype.match = function (context) {

  var result = this.evals.evaluate(context);

  if (result.indeterminate) {
    var matchResult = new MatchResult();
    matchResult.setResult(MatchResult.prototype.INDETERMINATE,
      result.getStatus());
    return matchResult;
  }
  var bag = result.attributeValues;

  if (bag.size() !== 0) {
    var atLeastOneError = false;
    var firstIndeterminateStatus = null;

    var match = this.evaluateMatch(this.attrValue, bag.bag, context);
    if (match.result === status.match) {
      return match;
    }
    if (match.result === MatchResult.prototype.INDETERMINATE) {
      atLeastOneError = true;

      if (firstIndeterminateStatus == null)
        firstIndeterminateStatus = match.getStatus();
    }

    if (atLeastOneError) {
      return new MatchResult.setResult(MatchResult.prototype.INDETERMINATE,
        firstIndeterminateStatus);
    } else {
      var matchResult = new MatchResult();
      matchResult.matchResultInit(MatchResult.prototype.NO_MATCH);
      return matchResult;
    }

  } else {
    var matchResult = new MatchResult();
    matchResult.matchResultInit(MatchResult.prototype.NO_MATCH);
    return matchResult;
  }

};

TargetMatch.prototype.evaluateMatch = function (value, bags, context) {
  // for (var i = 0; i < bags.length; i++) {
  var result = this._function.evaluate(value, bags, context);
  if (result.indeterminate) {
    return new MatchResult.setResult(MatchResult.INDETERMINATE,
      result.getStatus());
  }

  if (result.value) {
    return {
      result: status.match,
    }
  } else {
    return {
      result: status.no_match
    }
  }
  // }

};

module.exports = TargetMatch;
