/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";


var util = require("util");
var FunctionBase = require('./functionBase');
var IntegerAttribute = require("../attr/integerAttribute");
var DoubleAttribute = require("../attr/doubleAttribute");
var FUNCTION_NS = "urn:oasis:names:tc:xacml:1.0:function:";
var NAME_DOUBLE_TO_INTEGER = FUNCTION_NS + "double-to-integer";
var NAME_INTEGER_TO_DOUBLE = FUNCTION_NS + "integer-to-double";
var ID_DOUBLE_TO_INTEGER = 0;
var ID_INTEGER_TO_DOUBLE = 1;

function NumericConvertFunction() {};


util.inherits(NumericConvertFunction, FunctionBase);
NumericConvertFunction.prototype.numericConvertFunctionInit = function (functionName) {
  this.superConstructor(functionName, getId(functionName), getArgumentType(functionName), false, 1, getReturnType(functionName), false);
};

var getId = function (functionName) {
  if (functionName === NAME_DOUBLE_TO_INTEGER) {
    return ID_DOUBLE_TO_INTEGER;
  } else if (functionName === NAME_INTEGER_TO_DOUBLE) {
    return ID_INTEGER_TO_DOUBLE;
  } else {
    console.error(`unknown convert function ${functionName}`);
  }
};

var getArgumentType = function (functionName) {
  if (functionName === NAME_DOUBLE_TO_INTEGER) {
    return DoubleAttribute.prototype.identifier;
  } else {
    return IntegerAttribute.prototype.identifier;
  }
};

var getReturnType = function (functionName) {
  if (functionName === NAME_DOUBLE_TO_INTEGER) {
    return IntegerAttribute.prototype.identifier
  } else {
    return DoubleAttribute.prototype.identifier;
  }
};

NumericConvertFunction.prototype.getSupportedIdentifiers = function () {
  var set = [];
  set.push(NAME_DOUBLE_TO_INTEGER);
  set.push(NAME_INTEGER_TO_DOUBLE);
  return set;
};


module.exports = NumericConvertFunction;
