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
const BooleanAttribute = require("../attr/booleanAttribute");
const EvaluationResult = require("./evaluationResult");
const FUNCTION_NS = "urn:oasis:names:tc:xacml:1.0:function:";
const NAME_OR = `${FUNCTION_NS}or`;
const NAME_AND = `${FUNCTION_NS}and`;
const ID_OR = 0;
const ID_AND = 1;

function LogicalFunction () { };

util.inherits(LogicalFunction, FunctionBase);
LogicalFunction.prototype.logicalFunctionInit = function (functionName) {
  this.superConstructor(functionName, getId(functionName), BooleanAttribute.prototype.identifier, false, -1, BooleanAttribute.prototype.identifier, false);
}

LogicalFunction.prototype.getSupportedIdentifiers = function () {
  const set = [NAME_OR, NAME_AND];
  return set;
};

var getId = function (functionName) {
  if (functionName === NAME_OR) {
    return ID_OR;
  } else if (functionName === NAME_AND) {
    return ID_AND;
  } else {
    console.error(`unknown logical function:${functionName}`);
  }

}

LogicalFunction.prototype.evaluate = function (inputs, context) {
  for (let i = 0; i < inputs.length; i++) {
    const eva = inputs[i]
    const result = eva.evaluate(context)
    if (result.indeterminate) return result
    const argBooleanValue = result.value;
    switch (this.getFunctionId()) {
      case ID_OR:
        if (argBooleanValue)
          return EvaluationResult.prototype.getTrueInstance();
        break;
      case ID_AND:
        if (!argBooleanValue)
          return EvaluationResult.prototype.getFalseInstance();
        break;
    }
  }
  if (this.getFunctionId() == ID_OR)
    return EvaluationResult.prototype.getFalseInstance();
  else
    return EvaluationResult.prototype.getTrueInstance();

}

module.exports = LogicalFunction;
