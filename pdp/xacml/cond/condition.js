/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const { DOMParser } = require('@xmldom/xmldom');
const BooleanAttribute = require("../attr/booleanAttribute");
const Apply = require("./apply");
const ExpressionHandler = require("./expressionHandler");
const XACMLConstants = require("../XACMLConstants");

let booleanIdentifier;

function Condition() { }

(function () {
  booleanIdentifier = BooleanAttribute.prototype.identifier;
})();

Condition.prototype.initWithFunctionAndExpressions = function (_function, expressions) {
  this.isVersionOne = true;

  // check that the function is valid for a Condition
  this.checkExpression(_function);

  // turn the parameters into an Apply for simplicity
  const apply = new Apply;
  apply.init(_function, expressions);
  this.expression = apply;

  // keep track of the function and the children
  this._function = _function;
  this.children = expression.getChildren();
}

Condition.prototype.initExpressions = function (expression) {
  this.isVersionOne = false;
  // check that the function is valid for a Condition
  this.checkExpression(expression);

  // store the expression
  this.expression = expression;

  // there is no function in a 2.0 Condition
  this._function = null;
  this.children = [this.expression];
}

Condition.prototype.getInstance = function (root, metaData, manager) {
  if (metaData.getXACMLVersion() < XACMLConstants.XACML_VERSION_2_0) {
    const cond = Apply.prototype.getConditionInstance(root, metaData.getXPathIdentifier(), manager);
    const condition = new Condition;
    condition.initWithFunctionAndExpressions(cond.getFunction(), cond.getChildren())
    return condition;
  } else {
    let xpr = null;
    const nodes = root.childNodes;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.nodeType === 1) { // Node.ELEMENT_NODE
        xpr = ExpressionHandler.prototype.parseExpression(node, metaData, manager);
        break;
      }
    }

    const condition = new Condition;
    condition.initExpressions(xpr)
    return condition;
  }
}

Condition.prototype.checkExpression = function (xpr) {
  if (xpr.getType() !== booleanIdentifier) {
    throw new Error("A Condition must return a boolean...cannot create with " + xpr.getType());
  }

  // ...and that it never returns a bag
  if (xpr.returnsBag()) {
    throw new Error("A Condition must not return a Bag");
  }
}

Condition.prototype.evaluate = function (context) {
  return this.expression.evaluate(context);
}

Condition.prototype.encode = function () {
  let builder = "";
  encode(builder);
}

const encode = (builder) => {
  if (this.isVersionOne) {
    builder += ("<Condition FunctionId=\"" + this._function.getIdentifier() + "\">\n");

    for (let aChildren of this.children) {
      aChildren.encode(builder);
    }
  } else {
    builder += ("<Condition>\n");
    this.expression.encode(builder);
  }

  builder += ("</Condition>\n");
}

const checkExpression = (xpr) => {
  if (xpr.getType() !== booleanIdentifier)
    throw new Error("A Condition must return a boolean...cannot create with " + xpr.getType());

  if (xpr.returnsBag())
    throw new Error("A Condition must not return a Bag");
}

module.exports = Condition;
