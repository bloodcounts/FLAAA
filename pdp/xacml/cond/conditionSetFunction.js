/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var util = require("util");
var SetFunction = require('./setFunction');
var BooleanAttribute = require('../attr/booleanAttribute');
var FUNCTION_NS = "urn:oasis:names:tc:xacml:1.0:function:";
var idMap = {};
var typeMap = {};
var supportedIds = [];
var ID_BASE_AT_LEAST_ONE_MEMBER_OF = 0;
var ID_BASE_SUBSET = 1;
var ID_BASE_SET_EQUALS = 2;


initValue();

function initValue() {
  var baseTypes = SetFunction.prototype.baseTypes;
  var simpleTypes = SetFunction.prototype.simpleTypes;
  for (var i = 0; i < baseTypes.length; i++) {
    var baseName = FUNCTION_NS + simpleTypes[i];
    var baseType = baseTypes[i];
    idMap[baseName + SetFunction.prototype.NAME_BASE_AT_LEAST_ONE_MEMBER_OF] = ID_BASE_AT_LEAST_ONE_MEMBER_OF;
    idMap[baseName + SetFunction.prototype.NAME_BASE_SUBSET] = ID_BASE_SUBSET;
    idMap[baseName + SetFunction.prototype.NAME_BASE_SET_EQUALS] = ID_BASE_SET_EQUALS;
    typeMap[baseName + SetFunction.prototype.NAME_BASE_AT_LEAST_ONE_MEMBER_OF] = baseType;
    typeMap[baseName + SetFunction.prototype.NAME_BASE_SUBSET] = baseType;
    typeMap[baseName + SetFunction.prototype.NAME_BASE_SET_EQUALS] = baseType;
  }
  supportedIds = Object.keys(idMap);
  idMap[SetFunction.prototype.NAME_BASE_AT_LEAST_ONE_MEMBER_OF] = ID_BASE_AT_LEAST_ONE_MEMBER_OF;
  idMap[SetFunction.prototype.NAME_BASE_SUBSET] = ID_BASE_SUBSET;
  idMap[SetFunction.prototype.NAME_BASE_SET_EQUALS] = ID_BASE_SET_EQUALS;
}

function ConditionSetFunction() {};

util.inherits(ConditionSetFunction, SetFunction);
ConditionSetFunction.prototype.conditionSetFunctionInit = function (functionName) {
  this.setFunctionInit(functionName, getId(functionName), getArgumentType(functionName), BooleanAttribute.prototype.identifier, false);
};

var getId = function (functionName) {
  var id = idMap[functionName];
  if (id === undefined) {
    console.error(`unknown set function ${functionName}`);
  }
  return id;
};

var getArgumentType = function (functionName) {
  return typeMap[functionName];
};

ConditionSetFunction.prototype.getSupportedIdentifiers = function () {

  return supportedIds;
};



module.exports = ConditionSetFunction;
