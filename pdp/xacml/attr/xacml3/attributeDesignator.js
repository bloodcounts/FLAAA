/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const Status = require('../../ctx/status');
const XACMLConstants = require("../../XACMLConstants");
const StatusDetail = require('../../ctx/statusDetail');
const EvaluationResult = require('../../cond/evaluationResult');
const MissingAttributeDetail = require("../../ctx/missingAttributeDetail");
const { DOMParser } = require('@xmldom/xmldom');
let cacheType, cacheId, cacheIssuer, cacheCategory,cacheResult, cacheAttributes;

function AttributeDesignator() {};


AttributeDesignator.prototype.init = function (type, id, mustBePresent, category) {
  this.initWithIssuer(type, id, mustBePresent, null, category);
};

AttributeDesignator.prototype.initWithIssuer = function (type, id, mustBePresent, issuer,
  category) {
  this.type = type;
  this.id = id;
  this.mustBePresent = mustBePresent;
  this.issuer = issuer;
  this.category = category;
};

AttributeDesignator.prototype.getInstance = function (xmlOrNode) {
  let root;
  // accept either a DOM node or an XML string
  if (xmlOrNode && (xmlOrNode.nodeType === 1 || xmlOrNode.tagName)) {
    root = xmlOrNode;
  } else {
    const doc = new DOMParser().parseFromString(String(xmlOrNode || ''), 'application/xml');
    root = doc.documentElement;
  }

  let type = null;
  let id = null;
  let issuer = null;
  let category = null;
  let mustBePresent = false;

  const tagName = root.tagName;
  if (tagName !== "AttributeDesignator") {
    throw new Error(`AttributeDesignator cannot be constructed using type: ${tagName}`);
  }

  id = root.getAttribute("AttributeId");
  category = root.getAttribute("Category");
  let nodeValue = root.getAttribute("MustBePresent");
  if (nodeValue === "true") {
    mustBePresent = true;
  }
  type = root.getAttribute("DataType");
  let node = root.getAttribute("Issuer");
  if (node) {
    issuer = node;
  }
  const attributeDesignator = new AttributeDesignator();
  attributeDesignator.initWithIssuer(type, id, mustBePresent, issuer, category);

  return attributeDesignator;
};


AttributeDesignator.prototype.getType = function () {
  return this.type;
};
AttributeDesignator.prototype.getId = function () {
  return this.id;
};
AttributeDesignator.prototype.getCategory = function () {
  return this.category;
};
AttributeDesignator.prototype.getIssuer = function () {
  return this.issuer;
};

AttributeDesignator.prototype.mustBePresent = function () {
  return this.mustBePresent;
};

AttributeDesignator.prototype.returnsBag = function () {
  return true;
};

AttributeDesignator.prototype.getChildren = () => [];

AttributeDesignator.prototype.evaluate = function (context) {
  let result = null;
  if (cacheType === this.type && cacheId === this.id && cacheIssuer === this.issuer && cacheCategory === this.category && cacheAttributes === context.attributesSet) {
    result = cacheResult;
  } else {
    result = context.getAttribute(this.type, this.id, this.issuer, this.category);
    cacheType = this.type;
    cacheId = this.id;
    cacheIssuer = this.issuer;
    cacheCategory = this.category;
    cacheResult = result;
    cacheAttributes = context.attributesSet;
  }


  if (result.indeterminate) {
    return result;
  }

  let bag = result.attributeValues;

  try {
    const bagSize = bag && typeof bag.size === 'function' ? bag.size() : (bag && bag.bag ? bag.bag.length : 'unknown');
    console.log(`AttributeDesignator lookup: id=${this.id}, category=${this.category}, type=${this.type}, bagSize=${bagSize}`);
  } catch (e) {
    console.log(`AttributeDesignator lookup (id=${this.id}) error printing bag size: ${e}`);
  }

  if (bag.size() === 0) {
    if (this.mustBePresent) {
      console.error(`AttributeDesignator failed to resolve a
        value for a required attribute: ${this.id}`)


      let code = [Status.prototype.STATUS_MISSING_ATTRIBUTE];
      let missingAttributes = [];

      const missingAttribute = new MissingAttributeDetail();
      missingAttribute.initWithIssuerAndAttributes(this.id, this.type,
        this.category, this.issuer, null, XACMLConstants.XACML_VERSION_3_0);

      missingAttributes.push(missingAttribute);
      const detail = new StatusDetail;
      detail.initWithMissingAttribute(missingAttributes);

      const message = "Couldn't find AttributeDesignator attribute";
      // const evaluationResult = new EvaluationResult()
      const status = new Status();
      status.statusInit3(code, message, detail);
      // evaluationResult.evaluationResultInit_status(status)
      const result = {
        wasInd: true,
        value: null,
        status: status,
        indeterminate: true
      }
      return result;
    }
  }
  return result;
}

module.exports = AttributeDesignator;
