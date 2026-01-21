/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
var util = require("util");
var BagFunction = require('./bagFunction');
var AttributeValue = require('../attr/attributeValue');
var FunctionBase = require('./functionBase');
var EvaluationResult = require('./evaluationResult');
var IntegerAttribute = require("../attr/integerAttribute");
var FUNCTION_NS = "urn:oasis:names:tc:xacml:1.0:function:";
var ID_BASE_ONE_AND_ONLY = 0;
var ID_BASE_BAG_SIZE = 1;
var ID_BASE_BAG = 2;
var paramMap = {};

var NAME_BASE_ONE_AND_ONLY = "-one-and-only";
var NAME_BASE_BAG_SIZE = "-bag-size";
var NAME_BASE_BAG = "-bag";
var supportedIds = [];


(function () {
  const baseTypesLen = BagFunction.prototype.getBaseTypes.length
  for (let i = 0; i < baseTypesLen; i++) {
    var baseType = BagFunction.prototype.getBaseTypes[i];
    var functionBaseName = FUNCTION_NS + BagFunction.prototype.getSimpleTypes[i];
    paramMap[functionBaseName + NAME_BASE_ONE_AND_ONLY] = new BagParameters(ID_BASE_ONE_AND_ONLY, baseType, true, 1, baseType, false);
    paramMap[functionBaseName + NAME_BASE_BAG_SIZE] = new BagParameters(ID_BASE_BAG_SIZE, baseType, true, 1, IntegerAttribute.prototype.identifier, false);
    paramMap[functionBaseName + NAME_BASE_BAG] = new BagParameters(ID_BASE_BAG, baseType, false, -1, baseType, true);
  }
  supportedIds = Object.keys(paramMap);
  paramMap[NAME_BASE_ONE_AND_ONLY] = new BagParameters(ID_BASE_ONE_AND_ONLY, null, true, 1, null, false);
  paramMap[NAME_BASE_BAG_SIZE] = new BagParameters(ID_BASE_BAG_SIZE, null, true, 1, IntegerAttribute.prototype.identifier, false);
  paramMap[NAME_BASE_BAG] = new BagParameters(ID_BASE_BAG, null, false, -1, null, true);
})();

function GeneralBagFunction() { };

util.inherits(GeneralBagFunction, BagFunction);
GeneralBagFunction.prototype.generalBagFunctionInit = function (functionName) {
  this.bagFunctionInit1(functionName, getId(functionName), getArgumentType(functionName),
    getIsBag(functionName), getNumArgs(functionName),
    getReturnType(functionName), getReturnsBag(functionName));

};

function getId(functionName) {
  var params = paramMap[functionName];
  if (params == null) {
    console.error(`unknown bag function:${functionName}`);
  }
  return params.id;
};

function getArgumentType(functionName) {
  return paramMap[functionName].arg;
};

function getIsBag(functionName) {
  return paramMap[functionName].argIsBag;
};

function getNumArgs(functionName) {
  return paramMap[functionName].params;
};

function getCustomReturnType(functionType, datatype) {
  var ret = paramMap[functionType].returnType;

  if (ret == null)
    return datatype;
  else
    return ret;
};

function getReturnsBag(functionName) {
  return paramMap[functionName].returnsBag;
};

function getReturnType(functionName) {
  return paramMap[functionName].returnType;
};

GeneralBagFunction.prototype.getSupportedIdentifiers = function () {
  return supportedIds;
};

GeneralBagFunction.prototype.evaluate = function (inputs, context) {
  let argValues = [];

  const argValLength = inputs.length;

  for (let i = 0; i < argValLength; i++) {
    argValues.push(new AttributeValue());
  }

  let result = this.evalArgs(inputs, context, argValues);
  if (result != null) {
    return result;
  }
  let attrResult;

  switch (this.getFunctionId()) {
    case ID_BASE_ONE_AND_ONLY:
      var bag = argValues[0];

      if (bag.size() != 1) {
        return this.makeProcessingError(this.getFunctionName() + " expects "
          + "a bag that contains a single " + "element, got a bag with " + bag.size()
          + " elements");
      }

      attrResult = bag.getBag();

      break;
    case ID_BASE_BAG_SIZE:
      var bag = argValues[0];
      attrResult = new IntegerAttribute.integerAttributeInit(bag.size());
      break;
    case ID_BASE_BAG:
      attrResult = new BagAttribute.bagAttributeInit(this.getReturnType(), argValues);
      break;
  }

  // var evaluationResult = new EvaluationResult();
  // evaluationResult.evaluationResultInit(attrResult);

  return {
    wasInd: false,
    attributeValues: attrResult,
    status: null,
    indeterminate: false
  };
};


function BagParameters(id, arg, argIsBag, params, returnType, returnsBag) {
  this.id = id;
  this.arg = arg;
  this.argIsBag = argIsBag;
  this.params = params;
  this.returnType = returnType;
  this.returnsBag = returnsBag;
}

module.exports = GeneralBagFunction;
