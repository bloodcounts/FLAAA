/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const { DOMParser } = require("@xmldom/xmldom");
const StandardFunctionFactory = require("./standardFunctionFactory");
const XACMLConstants = require("../XACMLConstants");
const PolicyMetaData = require("../PolicyMetaData");
const FunctionFactory = require("./functionFactory");

function Apply() {}

Apply.prototype.applyInit = function (_function, evals, bagFunction, isCondition) {
  var inputs = evals;
  if (bagFunction != null) {
    inputs = [];
    inputs.push(bagFunction);
    Array.prototype.push.apply(inputs, evals);
    _function.checkInputs(inputs);
  }
  this._function = _function;
  this.evals = evals;
  this.bagFunction = bagFunction;
  this.isCondition = isCondition;
};

Apply.prototype.init = function (_function, xprs) {
  _function.checkInputs(xprs);
  this._function = _function;
  this.xprs = xprs;
};

Apply.prototype.getInstance = function (root, factory, metaData, manager) {
  const ExpressionHandler = require("./expressionHandler");
  const _function = ExpressionHandler.prototype.getFunction(root, metaData, factory);
  const xprs = Array.from(root.childNodes).map(node => {
    const xpr = ExpressionHandler.prototype.parseExpression(node, metaData, manager);
    if (xpr !== null) return xpr;
  });

  const apply = new Apply;
  apply.init(_function, xprs.filter(x => !!x));
  return apply;
};

Apply.prototype.getInstance2 = function (root, xpathVersion) {
  return this.getInstance(root, StandardFunctionFactory.prototype.getGeneralFactory(), false,
    xpathVersion);
};

Apply.prototype.getFunction = function () {
  return this._function;
};

Apply.prototype.returnsBag = function () {
  return this._function.returnsBags();
}

Apply.prototype.getType = function (context) {
  return this._function.getReturnType();
}

Apply.prototype.evaluate = function (context) {
  return this._function.evaluate(this.xprs, context);
}

Apply.prototype.getConditionInstance = function (root, xpathVersion, manager) {
  const metaData = new PolicyMetaData();
  metaData.init(XACMLConstants.XACML_1_0_IDENTIFIER, xpathVersion);

  return this.getInstance(root, FunctionFactory.prototype.getConditionInstance(), metaData, manager);
};

Apply.prototype.getInstanceBasedOnDOM = function (root, metaData, manager) {
  return this.getInstance(root, FunctionFactory.prototype.getGeneralInstance(), metaData, manager);
};

Apply.prototype.getChildren = function () {
  return this.xprs;
};

module.exports = Apply;
