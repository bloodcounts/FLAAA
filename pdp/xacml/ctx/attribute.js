/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const { DOMParser } = require('@xmldom/xmldom');
const AttributeFactory = require("../attr/attributeFactory");
const DateTimeAttribute = require("../attr/dateTimeAttribute");
const XACMLConstants = require("../XACMLConstants");

function Attribute() {};

Attribute.prototype.init = function (id, type, issuer, issueInstant,
  attributeValues, includeInResult, xacmlVersion) {
  this.id = id;
  this.type = type;
  this.issuer = issuer;
  this.issueInstant = issueInstant;
  this.attributeValues = attributeValues;
  this.includeInResult = includeInResult;
  this.xacmlVersion = xacmlVersion;
};

Attribute.prototype.initWithResult = function (id, issuer, issueInstant, value,
  includeInResult, version) {

  this.init(id, value.getType(), issuer, issueInstant, value, includeInResult, version);
};

Attribute.prototype.initWithoutResult = function (id, issuer, issueInstant, value,
  version) {
  this(id, value.getType(), issuer, issueInstant, value, false, version);
};

Attribute.prototype.getInstance = function (root, version) {
  let type = null;
  let issuer = null;
  let issueInstant = null;
  let values = [];
  let includeInResult = false;

  const attributeFactory = AttributeFactory.prototype.getInstance();

  if (root.nodeName != "Attribute") {
    throw new Error("Attribute object cannot be created " + "with root node of type: " + root.nodeName);
  }

  const id = root.getAttribute("AttributeId");

  if (version !== XACMLConstants.XACML_VERSION_3_0) {
    type = root.getAttribute("DataType");
  }

  if (version === XACMLConstants.XACML_VERSION_3_0) {
    const includeInResultString = root.getAttribute("IncludeInResult");
    if ("true" === includeInResultString) {
      includeInResult = true;
    }
  }

  const issuerNode = root.getAttribute("Issuer");
  if (issuerNode != null)
    issuer = issuerNode;
  if (version !== XACMLConstants.XACML_VERSION_3_0) {
    const instantNode = root.getAttribute("IssueInstant");
    if (instantNode != null) {
      issueInstant = DateTimeAttribute.prototype.getInstance(instantNode);
    }
  }
  const nodes = root.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.nodeName === "AttributeValue") {
      if (version == XACMLConstants.XACML_VERSION_3_0) {
        type = node.getAttribute("DataType");
      }
      values.push(attributeFactory.createValue2(node, type));
    }
  }

  if (values.length < 1) {
    throw new Error("Attribute must contain a value");
  }

  const attribute = new Attribute();
  attribute.init(id, type, issuer, issueInstant, values, includeInResult, version);
  return attribute;
};

Attribute.prototype.getId = function () {
  return this.id;
};

Attribute.prototype.getValue = function () {
  if (this.attributeValues != null) {
    return this.attributeValues[0];
  }
  return null;
};

Attribute.prototype.getType = function () {
  return this.type;
};

Attribute.prototype.getIssuer = function () {
  return this.issuer;
};

Attribute.prototype.getIssueInstant = function () {
  return this.issueInstant;
};

Attribute.prototype.isIncludeInResult = function () {
  return this.includeInResult;
};

Attribute.prototype.getValues = function () {
  return this.attributeValues;
};

Attribute.prototype.encode = function (builder) {
  builder += ("<Attribute AttributeId=\"" + this.id.toString() + "\"");

  if ((this.xacmlVersion == XACMLConstants.XACML_VERSION_3_0)) {
    builder += (" IncludeInResult=\"" + this.includeInResult + "\"");
  } else {
    builder += (" DataType=\"" + this.type.toString() + "\"");
    if (this.issueInstant != null) {
      builder += ((" IssueInstant=\"") + (this.issueInstant.encode()) + ("\""));
    }
  }

  if (this.issuer != null) {
    builder += ((" Issuer=\"") + (this.issuer) + ("\""));
  }

  builder += (">\n");

  if (this.attributeValues != null && this.attributeValues.length > 0) {
    for (let value of this.attributeValues) {
      value.encode(builder);
    }
  }

  builder += ("</Attribute>\n");

};

module.exports = Attribute;
