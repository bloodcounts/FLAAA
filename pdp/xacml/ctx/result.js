/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/

const util = require("util");
const AbstractResult = require("./abstractResult");
const Status = require('./status');
const XACMLConstants = require("../XACMLConstants");
const DECISION_PERMIT = 0;
const DECISION_DENY = 1;
const DECISION_INDETERMINATE = 2;
const DECISION_NOT_APPLICABLE = 3;
const DECISION_INDETERMINATE_DENY = 4;
const DECISION_INDETERMINATE_PERMIT = 5;
const DECISION_INDETERMINATE_DENY_OR_PERMIT = 6;

const DECISIONS = ["Permit", "Deny", "Indeterminate", "NotApplicable"];
const decision = -1;
const status = null;
const resource = null;

function Result() {};
util.inherits(Result, AbstractResult);

Result.prototype.initWithStatus = function (decision, status) {
  this.init(decision, status, XACMLConstants.XACML_VERSION_2_0);
};
Result.prototype.resultInit = function (decision, resource, obligations) {
  this.resultInit3(decision, null, resource, obligations);
};
Result.prototype.resultInit2 = function (decision, status, resource) {
  this.resultInit3(decision, status, resource, null);

};
Result.prototype.resultInit3 = function (decision, status, resource, obligations) {
  if ((decision != DECISION_PERMIT) && (decision != DECISION_DENY) &&
    (decision != DECISION_INDETERMINATE) &&
    (decision != DECISION_NOT_APPLICABLE)) {
    console.log("invalid decision value");
  }
  this.decision = decision;
  this.resource = resource;

  if (status == null) {

    this.status = Status.prototype.getOkInstance();
  } else {
    this.status = status;
  }
  if (obligations == null) {
    this.obligations = [];
  } else {
    this.obligations = obligations;
  }
};

Result.prototype.resultInit4 = function (decision, resource) {
  this.resultInit3(decision, null, resource, null);
};

Result.prototype.getObligations = function () {
  return this.obligations;
};
Result.prototype.DECISION_INDETERMINATE = DECISION_INDETERMINATE;
Result.prototype.DECISION_NOT_APPLICABLE = DECISION_NOT_APPLICABLE;

Result.prototype.DECISION_PERMIT = DECISION_PERMIT;
Result.prototype.DECISION_DENY = DECISION_DENY;

Result.prototype.DECISION_INDETERMINATE_DENY = DECISION_INDETERMINATE_DENY;
Result.prototype.DECISION_INDETERMINATE_PERMIT = DECISION_INDETERMINATE_PERMIT;
Result.prototype.DECISION_INDETERMINATE_DENY_OR_PERMIT = DECISION_INDETERMINATE_DENY_OR_PERMIT;
Result.prototype.getDecision = function () {
  return this.decision;
};

Result.prototype.encode = function (indenter) {
  var indent = indenter.makeString();
  indenter.in();
  var indentNext = indenter.makeString();
  if (this.resource == null) {
    console.log(indent + "<Result>");
  }
  else {
    console.log(indent + "<Result ResourceID=\"" + this.resource + "\">");
  }
  console.log(indentNext + "<Decision>" + DECISIONS[this.decision] +
    "</Decision>");
  if (this.status != null) {
    this.status.encode(indenter);
  }
  if (this.obligations.length != 0) {
    console.log(indentNext + "<Obligations>");
    for (var i = 0; i < obligations.length; i++) {
      var obligation = obligations[i];
      obligation.encode(output, indenter);
    }
    indenter.out();
    console.log(indentNext + "</Obligations>");
  }
  indenter.out();
  console.log(indent + "</Result>");
};

module.exports = Result;
