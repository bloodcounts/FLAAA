/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const AttributeAssignment = require("../ctx/attributeAssignment");

function Obligation(assignments, obligationId) {
  this.assignments = assignments;
  this.obligationId = obligationId;
};

Obligation.prototype.getObligation = function (root) {
  let obligationId;
  const assignments = [];

  if (root.name() !== "Obligation") {
    throw new Error("Obligation object cannot be created "
      + "with root node of type: " + DOMHelper.getLocalName(root));
  }

  obligationId = root.attr("ObligationId").value();

  root.getChildNodes().forEach(child => {
    if ("AttributeAssignment" === child.name()) {
      assignments.push(AttributeAssignment.prototype.getInstance(child));
    }
  });

  return new Obligation(assignments, obligationId);
}

Obligation.prototype.encode = function (builder) {
  builder.push("<Obligation ObligationId=\"" + this.obligationId + "\">");

  if (this.assignments != null && this.assignments.length > 0) {
    for (let assignment of this.assignments) {
      assignment.encode(builder);
    }
  }
  this.assignments = null;
  builder.push("</Obligation>");
}



module.exports = Obligation;