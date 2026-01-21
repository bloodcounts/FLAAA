/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const AttributeFactory = require('./attr/attributeFactory');
const Result = require('./ctx/result');

function Obligation() { };
Obligation.prototype.obligationInit = function (id, fulfillOn, assignments) {
  this.id = id;
  this.fulfillOn = fulfillOn;
  this.assignments = assignments;
};

Obligation.prototype.getInstance = function (root) {
  var id;
  var fulfillOn = -1;
  var assignments = [];
  var attrFactory = AttributeFactory.prototype.getInstance();
  var attrs = root.attrs();

  id = attrs.attr("ObligationId").value();

  var effect = attrs.attr("FulfillOn").value();
  if (effect == "Permit") {
    fulfillOn = Result.prototype.DECISION_PERMIT;
  } else if (effect == "Deny") {
    fulfillOn = Result.prototype.DECISION_DENY;
  } else {
    console.log("Invlid Effect type: " + effect);
  }

  var nodes = root.childNodes();
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node.name() == "AttributeAssignment") {
      var attrId = node.attr("AttributeId").value();
      var attrValue = attrFactory.createValue1(node);
      assignments.push(new Attribute.attributeInit2(attrId, null, null, attrValue));
    }
  }

  return new Obligation.obligationInit(id, fulfillOn, assignments);
};
Obligation.prototype.getId = function () {
  return id;
};

Obligation.prototype.getFulfillOn = function () {
  return fulfillOn;
};

Obligation.prototype.getAssignments = function () {
  return assignments;
};

/*Encode to XML
Obligation.prototype.encode = function(output){
        encode(output, new Indenter(0));
};
*/
module.exports = Obligation;