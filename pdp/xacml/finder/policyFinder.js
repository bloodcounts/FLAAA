/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const Status = require('../ctx/status');
const PolicyFinderResult = require('./policyFinderResult');

function PolicyFinder() {
  this.requestModules = [];
  this.referenceModules = [];
  this.allModules = [];
};

PolicyFinder.prototype.init = async function () {
  try {
    for (var i = 0; i < this.allModules.length; i++) {
      var module = this.allModules[i];
      await module.init(this);
      if (i + 1 === this.allModules.length) {
        return true;
      }
    }

  } catch (e) {
    throw new Error("Error ", e);
  }

};

PolicyFinder.prototype.setModules = function (modules) {
  this.allModules = modules;

  for (var i = 0; i < modules.length; i++) {

    if (modules[i].isRequestSupport()) {
      this.requestModules.push(modules[i]);
    }
    if (modules[i].isIdReferenceSupported()) {
      this.referenceModules.push(modules[i]);
    }
  }
};
PolicyFinder.prototype.requestModules = this.requestModules;

PolicyFinder.prototype.findPolicy = function (context) {

  let result = null;
  for (let i = 0; i < this.requestModules.length; i++) {
    const module = this.requestModules[i],
      newResult = module.findPolicy(context);

    if (newResult.indeterminate()) {
      return newResult;
    }
    if (!newResult.notApplicable()) {
      if (result !== null) {
        const code = [];
        code.push(Status.prototype.STATUS_PROCESSING_ERROR);
        const status = new Status()
        status.statusInit2(code, "too many applicable " +
          "top-level policies");
        const policyFinderResult = new PolicyFinderResult();
        policyFinderResult.policyFinderResultInit(status);
        return policyFinderResult;
      }
      result = newResult;
    }
  }
  if (result !== null) {
    return result;
  } else {
    return new PolicyFinderResult();
  }
};
PolicyFinder.prototype.getModules = function () {
  return this.allModules;
};



module.exports = PolicyFinder;