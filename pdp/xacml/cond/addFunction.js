/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const util = require("util");
const FunctionBase = require('./functionBase');
const IntegerAttribute = require("../attr/integerAttribute");
const DoubleAttribute = require("../attr/doubleAttribute");

const FUNCTION_NS = "urn:oasis:names:tc:xacml:1.0:function:";
const NAME_INTEGER_ADD = `${FUNCTION_NS}integer-add`;
const NAME_DOUBLE_ADD = `${FUNCTION_NS}double-add`;
const ID_INTEGER_ADD = 0
const ID_DOUBLE_ADD = 1;

function AddFunction() {};

util.inherits(AddFunction, FunctionBase);
AddFunction.prototype.addFunctionInit = function (functionName) {
  this.superConstructor(functionName, getId(functionName), getArgumentType(functionName), false, -1, 2, getArgumentType(functionName), false)
};

AddFunction.prototype.getSupportedIdentifiers = function () {
  const set = [NAME_INTEGER_ADD, NAME_DOUBLE_ADD];
  return set;
};

var getId = function (functionName) {
  switch (functionName) {
    case NAME_INTEGER_ADD:
      return ID_INTEGER_ADD;
    case NAME_DOUBLE_ADD:
      return ID_DOUBLE_ADD;
    default:
      console.error("unknown add function " + functionName);
      break;
  }
};

var getArgumentType = function (functionName) {
  if (functionName === NAME_INTEGER_ADD) {
    return IntegerAttribute.prototype.identifier;
  } else {
    return DoubleAttribute.prototype.identifier;
  }
};

module.exports = AddFunction;
