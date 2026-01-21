/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const util = require("util");
const AttributeValue = require("../attr/attributeValue");
const FunctionBase = require('./functionBase');
const IntegerAttribute = require("../attr/integerAttribute");
const EvaluationResult = require("./evaluationResult");
const DoubleAttribute = require("../attr/doubleAttribute");
const FUNCTION_NS = "urn:oasis:names:tc:xacml:1.0:function:";
const NAME_INTEGER_SUBTRACT = FUNCTION_NS + "integer-subtract";
const NAME_DOUBLE_SUBTRACT = FUNCTION_NS + "double-subtract";
const ID_INTEGER_SUBTRACT = 0;
const ID_DOUBLE_SUBTRACT = 1;

function SubtractFunction() { };

util.inherits(SubtractFunction, FunctionBase);
SubtractFunction.prototype.subtractFunctionInit = function (functionName) {
  this.superConstructor(functionName, getId(functionName), getArgumentType(functionName), false, 2, getArgumentType(functionName), false)
};

SubtractFunction.prototype.getSupportedIdentifiers = function () {
  let set = [];
  set.push(NAME_INTEGER_SUBTRACT);
  set.push(NAME_DOUBLE_SUBTRACT);
  return set;
};
SubtractFunction.prototype.evaluate = function (inputs, context) {
  const argValues = [];
  inputs.forEach(element => {
    argValues.push(new AttributeValue())
  });

  let result = this.evalArgs(inputs, context, argValues);

  if (result != null)
    return result;

  // const evaluationResult = new EvaluationResult;

  switch (this.getFunctionId()) {
    case ID_INTEGER_SUBTRACT:
      {
        let arg0 = argValues[0].getValue();
        let arg1 = argValues[1].getValue();
        let difference = arg0 - arg1;

        const integerAttribute = new IntegerAttribute;
        integerAttribute.init(difference)
        // evaluationResult.evaluationResultInit(integerAttribute)
        // result = evaluationResult;
        result = {
          wasInd: false,
          value: integerAttribute,
          status: null,
          attributeValues: integerAttribute,
          indeterminate: false
        }
        break;
      }
    case ID_DOUBLE_SUBTRACT:
      {
        let arg0 = argValues[0].getValue();
        let arg1 = argValues[1].getValue();
        let difference = arg0 - arg1;

        // result = new EvaluationResult(new DoubleAttribute(difference));
        const value = new DoubleAttribute(difference);
        result = {
          wasInd: false,
          value,
          status: null,
          attributeValues: value,
          indeterminate: false
        }
        break;
      }
  }

  return result;
};

const getId = (functionName) => {
  switch (functionName) {
    case NAME_INTEGER_SUBTRACT:
      return ID_INTEGER_SUBTRACT;
    case NAME_DOUBLE_SUBTRACT:
      return ID_DOUBLE_SUBTRACT;
    default:
      console.log("unknown subtract function " + functionName);
      break;
  }
};

const getArgumentType = (functionName) => {
  const identifier = functionName == NAME_INTEGER_SUBTRACT ? IntegerAttribute.prototype.identifier : DoubleAttribute.prototype.identifier
  return identifier;
};

module.exports = SubtractFunction;
