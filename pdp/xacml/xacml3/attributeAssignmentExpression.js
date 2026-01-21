/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const { DOMParser } = require('@xmldom/xmldom');
const ExpressionHandler = require('../cond/expressionHandler');
const AttributeAssignment = require("../ctx/attributeAssignment");

function AttributeAssignmentExpression(attributeId, category, expression, issuer) {
  this.attributeId = attributeId;
  this.category = category;
  this.expression = expression;
  this.issuer = issuer;
}

AttributeAssignmentExpression.prototype.getInstance = function (node, metaData) {
  let attributeId;
  let category = null;
  let issuer = null;
  let expression = null;

  if (node.nodeName !== "AttributeAssignmentExpression") {
    throw new Error(`ObligationExpression object cannot be created
                      with root node of type: ${node.nodeName}`);
  }

  attributeId = node.getAttribute("AttributeId");

  let categoryNode = node.getAttribute("Category");
  if (categoryNode) {
    category = categoryNode;
  }

  let issuerNode = node.getAttribute("Issuer");

  if (issuerNode) {
    issuer = issuerNode;
  }

  const childNodes = node.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    const childNode = childNodes[i];
    if (childNode.nodeType === 1) { // element node
      expression = ExpressionHandler.prototype.parseExpression(childNode, metaData);
      break;
    }
  }

  if (!expression) {
    throw new Error('AttributeAssignmentExpression must contain at least one Expression Type');
  }

  return new AttributeAssignmentExpression(attributeId, category, expression, issuer);
}

AttributeAssignmentExpression.prototype.evaluate = function (ctx) {
  const values = [];
  const result = this.expression.evaluate(ctx);

  if (result == null || result.indeterminate) {
    return null;
  }

  const attributeValue = result.attributeValues;
  if (attributeValue != null) {
    if (attributeValue.isBag()) {
      if (attributeValue.length > 0) {
        attributeValue.forEach(bagValue => {
          const assignment =
            new AttributeAssignment(this.attributeId, bagValue.getType(), this.category,
              bagValue.encode(), this.issuer);
          values.push(assignment);
        });

      } else {
        return null;
      }
    } else {
      const assignment =
        new AttributeAssignment(this.attributeId, attributeValue.getType(),
          this.category, attributeValue.encode(), this.issuer);
      values.push(assignment);
    }
  }

  return values;
}

module.exports = AttributeAssignmentExpression;
