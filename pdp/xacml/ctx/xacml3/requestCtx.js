/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const XACMLConstants = require("../../XACMLConstants");
const Attributes = require("../../xacml3/attributes");

function RequestCtx() { };

RequestCtx.prototype.initWithAttributesSet = function (attributesSet, documentRoot) {
  this.init(documentRoot, attributesSet, false, false, null, null);
};

RequestCtx.prototype.init = function (documentRoot, attributesSet, returnPolicyIdList,
  combinedDecision, multiRequests,
  defaults) {
  this.xacmlVersion = XACMLConstants.XACML_VERSION_3_0;
  this.documentRoot = documentRoot;
  this.attributesSet = attributesSet;
  this.returnPolicyIdList = returnPolicyIdList;
  this.combinedDecision = combinedDecision;
  this.multiRequests = multiRequests;
  this.defaults = defaults;
};

RequestCtx.prototype.getInstance = function (xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  const root = doc.documentElement;

  let attributesElements;
  let returnPolicyIdList = false;
  let combinedDecision = false;
  let multiRequests = null;
  let defaults = null;

  const tagName = root.nodeName;
  if (tagName !== "Request") {
    throw new Error("Request cannot be constructed using type: " + tagName);
  }

  let attributeValue = root.getAttribute(XACMLConstants.RETURN_POLICY_LIST);
  if ("true" === attributeValue) {
    returnPolicyIdList = true;
  }

  attributeValue = root.getAttribute(XACMLConstants.COMBINE_DECISION);
  if ("true" === attributeValue) {
    combinedDecision = true;
  }

  attributesElements = [];
  const children = root.childNodes;
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    const tag = node.nodeName;
    if (tag === XACMLConstants.ATTRIBUTES_ELEMENT) {
      const serializedStringNode = new XMLSerializer().serializeToString(node);
      const attributes = Attributes.prototype.getInstance(serializedStringNode);
      attributesElements.push(attributes);
    }

    if (tag === XACMLConstants.MULTI_REQUESTS) {
      if (multiRequests != null) {
        throw new Error("Too many MultiRequests elements are defined.");
      }
      multiRequests = MultiRequests.prototype.getInstance(node);
    }

    if (tag === XACMLConstants.REQUEST_DEFAULTS) {
      if (multiRequests != null) {
        throw new Error("Too many RequestDefaults elements are defined.");
      }
      defaults = RequestDefaults.getInstance(node);
    }
  }

  if (attributesElements.length === 0) {
    throw new Error("Request must contain at least one AttributesType");
  }

  const requestCtx = new RequestCtx;
  requestCtx.init(root, attributesElements, returnPolicyIdList, combinedDecision,
    multiRequests, defaults)
  return requestCtx;
}

module.exports = RequestCtx;

