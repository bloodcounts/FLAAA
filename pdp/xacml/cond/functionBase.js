/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const Status = require("../ctx/status");
const EvaluationResult = require("./evaluationResult");

function FunctionBase() {
  this.processingErrList = null;
}

FunctionBase.prototype.superConstructor = function () {
  switch (arguments.length) {
    case 4:
      this.init(...arguments);
      break;
    case 6:
      this.initWithMultiType(...arguments);
      break;
    case 7:
      this.initWithNoMinParams(...arguments);
      break;
    case 8:
      this.initWithMinParams(...arguments);
      break;
  }
};

FunctionBase.prototype.initWithNoMinParams = function (
  functionName,
  functionId,
  paramType,
  paramIsBag,
  numParams,
  returnType,
  returnsBag
) {
  this.init(functionName, functionId, returnType, returnsBag);
  this.singleType = true;
  this.paramType = paramType;
  this.paramIsBag = paramIsBag;
  this.numParams = numParams;
  this.minParams = 0;
};

FunctionBase.prototype.initWithMinParams = function (
  functionName,
  functionId,
  paramType,
  paramIsBag,
  numParams,
  minParams,
  returnType,
  returnsBag
) {
  this.init(functionName, functionId, returnType, returnsBag);
  this.singleType = true;
  this.paramType = paramType;
  this.paramIsBag = paramIsBag;
  this.numParams = numParams;
  this.minParams = minParams;
};

FunctionBase.prototype.initWithMultiType = function (
  functionName,
  functionId,
  paramTypes,
  paramIsBag,
  returnType,
  returnsBag
) {
  this.init(functionName, functionId, returnType, returnsBag);
  this.singleType = false;
  this.paramTypes = paramTypes;
  this.paramsAreBags = paramIsBag;
};

FunctionBase.prototype.init = function (
  functionName,
  functionId,
  returnType,
  returnsBag
) {
  this.functionName = functionName;
  this.functionId = functionId;
  this.returnType = returnType;
  this.returnsBag = returnsBag;
};

FunctionBase.prototype.evalArgs = function (params, context, args) {
  const paramLength = params.length;
  for (var i = 0; i < paramLength; i++) {
    var evals = params[i];

    var result = evals.evaluate(context);
    if (result.indeterminate) {
      return result;
    }

    args[i] = result.attributeValues;
  }
  return null;
};
FunctionBase.prototype.getFunctionId = function () {
  return this.functionId;
};

FunctionBase.prototype.getIdentifier = function () {
  return this.functionName;
};

FunctionBase.prototype.checkInputsNoBag = function (inputs) {
  if (this.singleType) {
    if (this.paramIsBag) {
      throw new Error(this.functionName + "needs" + "bags on input");
    }
    if (this.numParams != -1) {
      if (inputs.length != this.numParams)
        throw new Error("wrong number of args" + " to " + this.functionName);
    } else {
      if (inputs.length < this.minParams)
        throw new Error("not enough args" + " to " + this.functionName);
    }
    for (let i = 0; i < inputs.length; i++) {
      let evals = inputs[i];
      if (evals.type !== this.paramType) throw new Error("illegal parameter");
    }
  } else {
    if (this.paramTypes.length !== inputs.length) {
      throw new Error("wrong number of args" + " to " + this.functionName);
    }

    let i = 0;
    inputs.forEach((input) => {

      if (!input.type === this.paramTypes[i] || this.paramsAreBags[i]) {
        throw new Error("illegal parameter");
      }
      i++;
    });
  }
};

FunctionBase.prototype.checkInputs = function (inputs) {
  if (this.singleType) {
    if (this.numParams != -1) {
      if (inputs.length != this.numParams) {
        throw new Error(`wrong number of args to ${this.functionName}`);
      }
    } else {
      if (inputs.length < this.minParams)
        throw new Error(`not enough args ${this.functionName}`);
    }
    for (let i = 0; i < inputs.length; i++) {
      let evals = inputs[i];
      if (evals.getType() !== this.paramType) {
        throw new Error("illegal parameter");
      }
    }
  } else {
    if (this.paramTypes.length !== inputs.length) {
      throw new Error("wrong number of args" + " to " + this.functionName);
    }

    let i = 0;
    inputs.forEach((input) => {
      if (!input.type === this.paramTypes[i] || this.paramsAreBags[i]) {
        throw new Error("illegal parameter");
      }
      i++;
    });
  }
};

FunctionBase.prototype.getType = function () {
  return this.returnType;
};

FunctionBase.prototype.getReturnType = function () {
  return this.getType();
};

FunctionBase.prototype.returnsBags = function () {
  return this.returnsBag;
};

FunctionBase.prototype.getFunctionName = function () {
  return this.functionName;
};

FunctionBase.prototype.makeProcessingError = function (message) {
  if (this.processingErrList == null) {
    const errStrings = [Status.prototype.STATUS_PROCESSING_ERROR];
    this.processingErrList = errStrings;
  }
  const errStatus = new Status();
  errStatus.statusInit2(this.processingErrList, message);
  const processingError = new EvaluationResult();
  processingError.evaluationResultInit_status(errStatus);
  return processingError;
};

module.exports = FunctionBase;
