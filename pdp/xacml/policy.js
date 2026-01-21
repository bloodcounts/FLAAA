/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var util = require("util");
var AbstractPolicy = require('./abstractPolicy');
var Rule = require('./rule');
const VariableManager = require("./cond/variableManager");
const CombinerParameter = require("./cond/combinerParameter");
const RuleCombinerElement = require("./combiningAlgs/ruleCombinerElement");
const { DOMParser } = require('@xmldom/xmldom');

var children = [];

function Policy() {};

util.inherits(Policy, AbstractPolicy);

Policy.prototype.policyInit = function () {};

Policy.prototype.policyInitWithRoot = function (root) {
  this.abstractPolicyInitWithRoot(root, "Policy", "RuleCombiningAlgId");
  var rules = [];
  let parameters = new Map();
  let variableIds = new Map();
  const metaData = this.getMetaData();

  for (let node of root.childNodes) {
    if (node.nodeName === "VariableDefinition") {
      const id = node.getAttribute("VariableId");
      if (variableIds.has(id)) {
        throw new Error("multiple definitions for " + "variable " + id);
      }
      variableIds.set(id, node);
    }
  }
  const manager = new VariableManager();
  manager.init(variableIds, metaData);
  this.definitions = new Set();

  for (let node of root.childNodes) {
    const name = node.nodeName;

    if (name === "Rule") {
      rules.push(Rule.prototype.getInstance(node, metaData, manager));
    } else if (name === "RuleCombinerParameters") {
      const ref = node.getAttribute("RuleIdRef");
      if (parameters.has(ref)) {
        let list = parameters.get(ref);
        this.parseParameters(list, node);
      } else {
        let list = [];
        this.parseParameters(list, node);
        parameters.set(ref, list);
      }
    } else if (name === "VariableDefinition") {
      const id = node.getAttribute("VariableId");

      this.definitions.add(manager.getDefinition(id));
    }
  }

  const elements = rules.map(rule => {
    const id = rule.idAttr;
    parameters.delete(id);
    const ruleCombinerElement = new RuleCombinerElement();
    ruleCombinerElement.initWithRule(rule, parameters)
    return ruleCombinerElement;
  });
  if (parameters.size !== 0) {
    throw new Error("Unmatched parameters in Rule");
  }
  this.setChildren(elements);
};

Policy.prototype.getInstance = function (root) {
  if (root.nodeName !== "Policy") {
    console.error(`Cannot create Policy from root of type ${root.nodeName}`)
  }
  var policy = new Policy();
  policy.policyInitWithRoot(root);
  return policy;
};

Policy.prototype.parseParameters = function (parameters, root) {
  for (let node of root.childNodes) {
    if (node.nodeName === "CombinerParameter") {
      parameters.add(CombinerParameter.prototype.getInstance(node));
    }
  }
}

module.exports = Policy;
