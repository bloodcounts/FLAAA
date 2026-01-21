/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const { DOMParser } = require('@xmldom/xmldom');
const XACMLConstants = require("../XACMLConstants");
const Attribute = require("../ctx/attribute");

function Attributes() {};

Attributes.prototype.init = function (category, content, attributes, id) {
  this.category = category;
  this.content = content;
  this.attributes = attributes;
  this.id = id;
};

Attributes.prototype.initWithCategory = function (category, attributes) {
  this.init(category, null, attributes, null);
};

Attributes.prototype.getInstance = function (xmlString) {
  const doc = new DOMParser().parseFromString(xmlString, 'text/xml');
  const root = doc.documentElement;
  let category;
  let content = null;
  let id = null;
  let attributes = [];

  if (root.nodeName !== XACMLConstants.ATTRIBUTES_ELEMENT) {
    throw new Error(`Attributes object cannot be created 
    with root node of type: ${root.nodeName}`);
  }

  category = root.getAttribute(XACMLConstants.ATTRIBUTES_CATEGORY);
  const idNode = root.getAttribute(XACMLConstants.ATTRIBUTES_ID);
  if (idNode != null) {
    id = idNode;
  }
  const nodes = root.childNodes;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.nodeName === XACMLConstants.ATTRIBUTES_CONTENT) {
      // only one value can be in an Attribute
      if (content != null) {
        throw new Error("Too many content elements are defined.");
      }
      // now get the value
      content = node.firstChild;
    } else if (node.nodeName === XACMLConstants.ATTRIBUTE_ELEMENT) {
      attributes.push(Attribute.prototype.getInstance(node, XACMLConstants.XACML_VERSION_3_0));
    }
  }

  if (content != null) {
    throw new Error("need an implementation")
  }

  const attributesIns = new Attributes();
  attributesIns.init(category, content, attributes, id);
  return attributesIns;
};

Attributes.prototype.getCategory = function () {
  return this.category;
};
Attributes.prototype.getAttributes = function () {
  return this.attributes;
};
Attributes.prototype.getContent = function () {
  return this.content;
};
Attributes.prototype.getId = function () {
  return this.id;
};

module.exports = Attributes;
