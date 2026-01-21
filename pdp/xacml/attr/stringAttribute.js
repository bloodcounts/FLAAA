/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var util = require("util");
var AttributeValue = require('./attributeValue');
var { DOMParser } = require('@xmldom/xmldom');
var identifier = "http://www.w3.org/2001/XMLSchema#string";

function StringAttribute() {};

util.inherits(StringAttribute, AttributeValue);

StringAttribute.prototype.stringAttributeInit = function (value) {
  this.attributeValueInit(identifier);
  this.value = value;
};

StringAttribute.prototype.getInstance = function (root) {
  var node = root.childNodes[0];

  if (node === null) {
    var stringAttribute = new StringAttribute();
    stringAttribute.stringAttributeInit("");
    return stringAttribute;
  }

  var type = node.nodeType;

  if (type === 3 || type === 8) { // 3 is text, 8 is comment
    return this.getInstance2(node.data);
  }
  return null;
}

StringAttribute.prototype.getInstance2 = function (value) {
  var stringAttribute = new StringAttribute();
  stringAttribute.stringAttributeInit(value);
  this.attributeValueInit(identifier);
  this.value = value;
  return stringAttribute;
};

StringAttribute.prototype.identifier = identifier;

StringAttribute.prototype.getValue = function () {
  return this.value;
};

StringAttribute.prototype.encode = function () {
  return this.value;
};

StringAttribute.prototype.equals = function (obj) {
  if (obj.type !== identifier)
    return false;

  return this.value === obj.value;
}

module.exports = StringAttribute;
