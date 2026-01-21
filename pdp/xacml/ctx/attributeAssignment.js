/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const util = require("util");
const AttributeValue = require('../attr/attributeValue');

util.inherits(AttributeAssignment, AttributeValue);
function AttributeAssignment(attributeId, dataType, category, content,
  issuer) {
  this.attributeValueInit(dataType);
  this.attributeId = attributeId;
  this.category = category;
  this.issuer = issuer;
  this.content = content;
};

AttributeAssignment.prototype.getInstance = function (root) {
  let attributeId;
  let category = null;
  let type;
  let issuer = null;
  let content = null;

  if (root.name() !== "AttributeAssignment") {
    throw new Error("AttributeAssignment object cannot be created "
      + "with root node of type: " + root.name())
  }

  attributeId = root.attr("AttributeId").value();
  type = root.attr("DataType").name();
  const categoryNode = root.attr("DataType");
  if (categoryNode != null) {
    category = categoryNode.value();
  }

  const issuerNode = root.attr("Issuer");
  if (issuerNode != null) {
    issuer = issuerNode.value();
  }
  content = root.text();

  return new AttributeAssignment(attributeId, type, category, content, issuer);
}

AttributeAssignment.prototype.encode = function (builder) {
  builder.push("<AttributeAssignment  AttributeId=\"" + this.attributeId + "\"");

  builder.push(" DataType=\"" + this.getType() + "\"");

  if (this.category != null) {
    builder.push(" Category=\"" + this.category + "\"");
  }

  if (this.issuer != null) {
    builder.push("\" Issuer=\"" + this.issuer + "\"");
  }

  builder.push(">\n");

  if (this.content != null) {
    builder.push(this.content);
  }

  builder.push("</AttributeAssignment>\n");
}


module.exports = AttributeAssignment;