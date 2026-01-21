/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const BooleanAttribute = require("../attr/booleanAttribute");

function EvaluationResult() {}


EvaluationResult.prototype.evaluationResultInit = function (value) {
  this.wasInd = false;
  this.value = value;
  this.status = null;
};

EvaluationResult.prototype.evaluationResultInit_status = function (status) {
  this.wasInd = true;
  this.value = null;
  this.status = status;
};

EvaluationResult.prototype.getInstance = function (value) {
  if (value)
    return this.getTrueInstance();
  else
    return this.getFalseInstance();
};

EvaluationResult.prototype.getAttributeValue = function () {
  return this.value;
};

EvaluationResult.prototype.indeterminate = function () {
  return this.wasInd;
};

EvaluationResult.prototype.getStatus = function () {
  return this.status;
};

EvaluationResult.prototype.getTrueInstance = function () {
  if (!this.trueBooleanResult) {
    // var evaluationResult = new EvaluationResult();
    // evaluationResult.evaluationResultInit(BooleanAttribute.prototype.getTrueInstance())
    this.trueBooleanResult = {
      status: null,
      value: true,
      wasInd: false,
      indeterminate: false
    };
  }
  return this.trueBooleanResult;
};

EvaluationResult.prototype.getFalseInstance = function () {
  if (!this.falseBooleanResult) {
    // var evaluationResult = new EvaluationResult();
    // this.evaluationResult.evaluationResultInit(BooleanAttribute.prototype.getFalseInstance())
    this.falseBooleanResult = {
      status: null,
      value: false,
      wasInd: false,
      indeterminate: false
    }
  }
  return this.falseBooleanResult;
};

module.exports = EvaluationResult;
