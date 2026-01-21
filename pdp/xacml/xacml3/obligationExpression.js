/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const { DOMParser } = require('@xmldom/xmldom');
const AttributeAssignmentExpression = require('./attributeAssignmentExpression');
const Obligation = require("./obligation");

function ObligationExpression(fulfillOn, expressions, obligationId) {
  this.fulfillOn = fulfillOn;
  this.expressions = expressions;
  this.obligationId = obligationId;
}

ObligationExpression.prototype.getInstance = function (node, metaData) {
  let expressions = [];
  let obligationId;
  let fulfillOn;
  let effect;

  if (node.nodeName !== "ObligationExpression") {
    throw new Error(`ObligationExpression object cannot be created with root node of type: ${node.nodeName}`);
  }

  obligationId = node.getAttribute("ObligationId");
  effect = node.getAttribute("FulfillOn");

  if ("Permit" === effect) {
    fulfillOn = 0;
  } else if ("Deny" === effect) {
    fulfillOn = 1;
  } else {
    throw new Error(`Invalid FulfillOn: ${effect}`);
  }

  const children = node.childNodes;
  for (let i = 0; i < children.length; i++) {
    const childNode = children[i];
    if (childNode.nodeName === "AttributeAssignmentExpression") {
      expressions.push(AttributeAssignmentExpression.prototype.getInstance(childNode, metaData));
    }
  }

  return new ObligationExpression(fulfillOn, expressions, obligationId);
}

ObligationExpression.prototype.getFulfillOn = function () {
  return this.fulfillOn;
}

ObligationExpression.prototype.evaluate = function (ctx) {
  const assignments = [];
  for (let expression of this.expressions) {
    const assignmentSet = expression.evaluate(ctx);
    if (assignmentSet != null && assignmentSet.length > 0) {
      assignments.push(...assignmentSet);
    }
  }

  return new Obligation(assignments, this.obligationId);
}

module.exports = ObligationExpression;