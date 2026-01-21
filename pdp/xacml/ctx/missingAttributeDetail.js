/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const AttributeFactory = require('../attr/attributeFactory');
const XACMLConstants = require('../XACMLConstants');

function MissingAttributeDetail() { };

MissingAttributeDetail.prototype.initWithIssuerAndAttributes = function (id, type, category, issuer,
  attributeValues, xacmlVersion) {
  this.id = id;
  this.type = type;
  this.category = category;
  this.issuer = issuer;
  this.attributeValues = attributeValues;
  this.xacmlVersion = xacmlVersion;
};

MissingAttributeDetail.prototype.initWithAttributes = function (id, type, category,
  attributeValues, xacmlVersion) {
  this.initWithIssuerAndAttributes(id, type, category, null, attributeValues, xacmlVersion);
};

MissingAttributeDetail.prototype.init = function (id, type, category, xacmlVersion) {
  initWithIssuerAndAttributes(id, type, category, null, null, xacmlVersion);
};


MissingAttributeDetail.prototype.getInstance = function (root, metaData) {
  let id = null;
  let type = null;
  let category = null;
  let issuer = null;

  let values = [];
  const version = metaData.getXACMLVersion();
  const attrFactory = AttributeFactory.prototype.getInstance();
  if (root.name() !== "MissingAttributeDetail") {
    throw new Error("MissingAttributeDetailType object cannot be created "
      + "with root node of type: " + root.name());
  }
  id = node.attr("AttributeId").value();
  type = node.attr("DataType").value();


  if (version == XACMLConstants.XACML_VERSION_3_0) {
    category = node.attr("IncludeInResult").value();
  }

  let issuerNode = node.attr("Issuer");

  const nodes = node.childNodes();

  nodes.forEach(node => {
    if (node.name() === "AttributeValue") {
      if (version == XACMLConstants.XACML_VERSION_3_0) {
        type = node.attr("DataType").value();
      }
      values.push(attrFactory.createValue2(node, type));
    }
  });

  return (new MissingAttributeDetail()).initWithIssuerAndAttributes(id, type, category, issuer, values, version);
};

MissingAttributeDetail.prototype.getEncoded = function () {
  if (this.id == null) {
    throw new Error("Required AttributeId attribute is Null");
  }

  if (this.type == null) {
    throw new Error("Required DataType attribute is Null");
  }

  if (this.xacmlVersion == XACMLConstants.XACML_VERSION_3_0 && this.category == null) {
    throw new Error("Required Category attribute is Null");
  }

  let encoded = "<MissingAttributeDetail AttributeId=\"" + this.id + "\" DataType=\"" + this.type + "\"";

  if (this.xacmlVersion == XACMLConstants.XACML_VERSION_3_0) {
    encoded += " Category=\"" + this.category + "\"";
  }

  if (this.issuer != null) {
    encoded += " Issuer=\"" + this.issuer + "\"";
  }
  encoded += " >";

  if (this.attributeValues != null && this.attributeValues.length > 0) {
    this.attributeValues.forEach(value => {
      encoded += (value.encodeWithTags(true) + "\n");
    });
  }

  encoded += "</MissingAttributeDetail>";

  return encoded;
}

module.exports = MissingAttributeDetail;
