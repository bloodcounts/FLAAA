/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var util = require("util");
var FunctionBase = require("./functionBase");
var BooleanAttribute = require("../attr/booleanAttribute");
var EvaluationResult = require("./evaluationResult");

var NAME_NOT = "urn:oasis:names:tc:xacml:1.0:function:not";

function NotFunction() {}

util.inherits(NotFunction, FunctionBase);
NotFunction.prototype.notFunctionInit = function (functionName) {
  this.superConstructor(
    NAME_NOT,
    0,
    BooleanAttribute.prototype.identifier,
    false,
    1,
    BooleanAttribute.prototype.identifier,
    false
  );
  if (functionName !== NAME_NOT) {
    console.error(`unknown not function:${functionName}`);
  }
};

NotFunction.prototype.getSupportedIdentifiers = function () {
  var set = [];
  set.push(NAME_NOT);
  return set;
};

// Evaluate when used as a general function: signature (inputs, context)
NotFunction.prototype.evaluate = function (inputs, context) {
  if (Array.isArray(inputs)) {
    return this.evaluateApply(inputs, context);
  }

  // If called with a direct boolean-like evaluation result, invert it.
  const value = inputs;
  if (value && typeof value === 'object' && 'value' in value) {
    if (value.indeterminate) return value;
    return EvaluationResult.prototype.getInstance(!value.value);
  }

  return EvaluationResult.prototype.getInstance(!Boolean(value));
};

// Evaluate when used with an Apply (value is an array of one expression)
NotFunction.prototype.evaluateApply = function (value, context) {
  const resultFirst = value[0].evaluate(context);
  if (resultFirst.indeterminate) return resultFirst;

  return EvaluationResult.prototype.getInstance(!resultFirst.value);
};

module.exports = NotFunction;
