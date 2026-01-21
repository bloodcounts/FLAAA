/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
var EvaluationResult = require("../cond/evaluationResult");
var BagAttribute = require("../attr/bagAttribute");

function AttributeFinder () { };

AttributeFinder.prototype.attributeFinderInit = function () { };

AttributeFinder.prototype.setModules = function (modules) {
  this.allModules = modules;
  this.designatorModules = [];
  this.selectorModules = [];
  for (var i = 0; i < modules.length; i++) {
    if (modules[i].isDesignatorSupported()) {
      this.designatorModules.push(modules[i]);
    }
    if (modules[i].isSelectorSupported()) {
      this.selectorModules.push(modules[i]);
    }
  }
};


AttributeFinder.prototype.findAttribute = function (attributeType, attributeId, issuer, category, context, designatorType) {
  const attributeValues = []
  for (var i = 0; i < this.designatorModules.length; i++) {
    var module = this.designatorModules[i];

    if (module.getSupportedIds() != null && module.getSupportedCategories() != null) {
      if (module.getSupportedCategories().indexOf(category) < 0 ||
        module.getSupportedIds().indexOf(attributeId) < 0) {
        continue;
      }
    }
    const result = module.findAttribute(attributeType, attributeId, issuer,
      category, context);
    if (result.indeterminate()) {
      logger.error("Error while trying to resolve values: "
        + result.getStatus().getMessage());
      return result;
    }

    const bag = result.getAttributeValue();
    if (!bag.isEmpty()) {
      for (let i = 0; i < bag.bag.length; i++) {
        const attr = bag.bag[i]
        attributeValues.push(attr);
      }
    }
    // if ((types === null) || (types.indexOf(designatorType) > -1)) {
    //   var result = module.findAttribute(attributeType, attributeId, issuer,
    //     subjectCategory, context,
    //     designatorType);

    //   if (result.indeterminate()) {
    //     return result;
    //   }
    //   var bag = result.attributeValues;
    //   if (bag !== null) {
    //     return result;
    //   }
    // }
  }

  if (attributeValues.length === 0) {
    // console.log("Request has missing attribute " + attributeId);
  }

  return {
    status: null,
    attributeValues: new BagAttribute(attributeType, attributeValues),
    wasInd: false,
    indeterminate: false
  }
};

AttributeFinder.prototype.getModules = function () {
  return allModules;
};

module.exports = AttributeFinder;
