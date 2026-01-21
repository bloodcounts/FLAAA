/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var ResourceFinderResult = require('./resourceFinderResult');

function ResourceFinder() { };

ResourceFinder.prototype.setModules = function (modules) {
  this.allModules = modules;
  for (var i = 0; i < modules.length; i++) {

    if (modules[i].isChildSupported()) {
      this.childModules.push(modules[i]);
    }
    if (modules[i].isDescendantSupported()) {
      this.descendantModules.push(modules[i]);
    }
  }
};

ResourceFinder.prototype.findChildResources = function (parentResourceId, context) {
  const childModulesLength = childModules.length;
  for (let i = 0; i < childModulesLength; i++) {
    const module = childModules[i];
    const result = module.findChildResources(parentResourceId, context);
    if (result != null) {
      return result;
    }
  }
  return new ResourceFinderResult.resourceFinderResultInit();
};

ResourceFinder.prototype.findDescendantResources = function (parentResourceId, context) {
  for (var i = 0; i < this.descendantModules.length; i++) {
    var module = this.descendantModules[i];
    var result = module.findDescendantResources(parentResourceId, context);
    if (result != null) {
      return result;
    }
  }
  return new ResourceFinderResult.resourceFinderResultInit();
};

module.exports = ResourceFinder;
