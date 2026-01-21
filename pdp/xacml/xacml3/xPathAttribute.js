/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const AttributeValue = require('../attr/attributeValue');
const util = require("util");
const identifier = "urn:oasis:names:tc:xacml:3.0:data-type:xpathExpression";

let value;
let xPathCategory;

function XPathAttribute() { };
util.inherits(XPathAttribute, AttributeValue);

XPathAttribute.prototype.init = function (value, xPathCategory) {
  this.attributeValueInit(identifier);
  if (value == null) {
    this.value = "";
  } else {
    this.value = value;
  }

  if (xPathCategory == null) {
    this.xPathCategory = "";
  } else {
    this.xPathCategory = xPathCategory;
  }
};


XPathAttribute.prototype.getInstanceWithValue = function (value, xPathCategory) {
  const xPathAttribute = new XPathAttribute();
  xPathAttribute.init(value, xPathCategory)
  return xPathAttribute;
};

XPathAttribute.prototype.getInstanceWithRoot = function (root) {
  let xPathCategory = null;

  const nodeMap = root.attrs();
  if (nodeMap != null) {
    const categoryNode = nodeMap.attr("XPathCategory");
    xPathCategory = categoryNode.value();
  }

  return this.getInstanceWithValue(root.childNodes[0].value(), xPathCategory);
};


XPathAttribute.prototype.getValue = function () {
  return this.value;
}

XPathAttribute.prototype.getXPathCategory = function () {
  return this.xPathCategory;
}

XPathAttribute.prototype.identifier = identifier;

XPathAttribute.prototype.encode = function () {
  return this.value;
}

XPathAttribute.prototype.encodeWithTags = function (includeType) {
  let tag = "<AttributeValue";
  if (includeType && this.getType() != null) {
      tag + " DataType=\"" + this.getType()
          + "\" XPathCategory=\"" + this.getXPathCategory()
          + "\"";
  }
  `${tag} > ${this.encode()}</AttributeValue>`;
  return tag;
}

module.exports = XPathAttribute;
