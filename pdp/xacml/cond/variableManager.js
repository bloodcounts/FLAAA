/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

function VariableManager() { };

VariableManager.prototype.init = function (variableIds, metaData) {
  this.idMap = new Map();

  for (let [key, val] of variableIds) {
    this.idMap.set(key, VariableState().initWithDefinition(null, val, null, false, false));
  }

  this.metaData = metaData;
};

VariableManager.prototype.getConditionInstance = function () {
  return StandardFunctionFactory.prototype.getConditionFactory();
};

const VariableState = function () {
  let definition = null;
  let rootNode = null;
  let type = null;
  let returnsBag = false;
  let handled = false;

  return {
    initWithDefinition: function (definition, rootNode, type,
      returnsBag, handled) {
      this.definition = definition;
      this.rootNode = rootNode;
      this.type = type;
      this.returnsBag = returnsBag;
      this.handled = handled;
    },
    init: function () {
      this.definition = null;
      this.rootNode = null;
      this.type = null;
      this.returnsBag = false;
      this.handled = false;
    }
  }
}

module.exports = VariableManager;


