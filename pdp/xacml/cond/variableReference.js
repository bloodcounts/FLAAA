/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";


function VariableReference() { };

let variableId;
let definition = null;
let manager = null;

VariableReference.prototype.initWithVariableId = function (variableId) {
  this.variableId = variableId;
};

VariableReference.prototype.initWithDefinition = function (definition) {
  this.variableId = definition.getVariableId();
  this.definition = definition;
};

VariableReference.prototype.initWithManager = function (variableId, manager) {
  this.variableId = variableId;
  this.manager = manager;
};

VariableReference.prototype.getInstance = function (root, metaData, manager) {
  const variableId = root.attr("VariableId").value();

  // ...but we keep the manager since after this we'll probably get
  // asked for our type, etc., and the manager will also be used to
  // resolve the actual definition
  return (new VariableReference()).initWithManager(variableId, manager);
};

VariableReference.prototype.initWithManager = function () {
  return this.variableId;
};

VariableReference.prototype.getReferencedDefinition = function () {
  // we return, otherwise we query the manager (if we have one)
  if (this.definition != null) {
    return this.definition;
  } else if (this.manager != null) {
    return this.manager.getDefinition(variableId);
  }

  // if the simple constructor was used, then we have nothing
  return null;
};

VariableReference.prototype.evaluate = function () {
  const xpr = this.getReferencedDefinition().getExpression();

  return xpr.evaluate(context);
};


module.exports = VariableReference;
