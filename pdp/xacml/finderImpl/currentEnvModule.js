/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
var BagAttribute = require("../attr/bagAttribute");
const EvaluationResult = require("../cond/evaluationResult");
const ENVIRONMENT_CURRENT_TIME = "urn:oasis:names:tc:xacml:1.0:environment:current-time";
const ENVIRONMENT_CURRENT_DATE = "urn:oasis:names:tc:xacml:1.0:environment:current-date";
const ENVIRONMENT_CURRENT_DATETIME = "urn:oasis:names:tc:xacml:1.0:environment:current-dateTime";
const ENT_CATEGORY = "urn:oasis:names:tc:xacml:3.0:attribute-category:environment";

var AttributeDesignator = require("../attr/attributeDesignator");
function CurrentEnvModule () { };


CurrentEnvModule.prototype.isDesignatorSupported = function () {
  return true;
};
CurrentEnvModule.prototype.isSelectorSupported = function () {
  return false;
};
CurrentEnvModule.prototype.getSupportedDesignatorTypes = function () {
  const set = [AttributeDesignator.prototype.ENVIRONMENT_TARGET];
  return set;
};

CurrentEnvModule.prototype.getSupportedCategories = function () {
  const set = ['urn:oasis:names:tc:xacml:3.0:attribute-category:environment'];
  return set;
};

CurrentEnvModule.prototype.getSupportedIds = function () {
  return null;
}

CurrentEnvModule.prototype.findAttribute = function (attributeType, attributeId, issuer, category, context) {
  if (ENT_CATEGORY !== category) {
    const result = new EvaluationResult()
    result.evaluationResultInit(BagAttribute.prototype.createEmptyBag(attributeType))
    return result;
  }
  // figure out which attribute we're looking for
  const attrName = attributeId;

  if (attrName === ENVIRONMENT_CURRENT_TIME) {
    return handleTime(attributeType, issuer, context);
  } else if (attrName === ENVIRONMENT_CURRENT_DATE) {
    return handleDate(attributeType, issuer, context);
  } else if (attrName === ENVIRONMENT_CURRENT_DATETIME) {
    return handleDateTime(attributeType, issuer, context);
  }
  const evResult = new EvaluationResult()
  evResult.evaluationResultInit(BagAttribute.prototype.createEmptyBag(attributeType))
  return evResult;
}

const handleTime = function (type, issuer, context) {
  if (type !== 'http://www.w3.org/2001/XMLSchema#time') return new EvaluationResult(BagAttribute.prototype.createEmptyBag(type));

  return makeBag(context.getCurrentTime());
}

const handleDate = function (type, issuer, context) {
  if (type !== 'http://www.w3.org/2001/XMLSchema#date') return new EvaluationResult(BagAttribute.prototype.createEmptyBag(type));

  return makeBag(context.getCurrentDate());
}

const handleDateTime = function (type, issuer, context) {
  if (type !== 'http://www.w3.org/2001/XMLSchema#dateTime') return new EvaluationResult(BagAttribute.prototype.createEmptyBag(type));

  return makeBag(context.getCurrentDateTime());
}

const makeBag = function (attribute) {
  const set = [attribute]
  const bag = new BagAttribute(attribute.type, set);
  // return {
  //   wasInd:false,
  //   value,
  //   status
  // }
  const er = new EvaluationResult()
  er.evaluationResultInit(bag)
  return er
}


module.exports = CurrentEnvModule;
