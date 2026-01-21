/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const MatchResult = require("../matchResult");
const AllOfSelection = require("./allOfSelection");
const { DOMParser } = require('@xmldom/xmldom');

function AnyOfSelection(allOfSelections) {
  this.allOfSelections = allOfSelections == null ? [] : allOfSelections;
};

AnyOfSelection.prototype.getInstance = function (root, metaData) {
  const allOfSelections = Array.from(root.childNodes).filter(node => "AllOf" === node.nodeName).map(node => {
    return AllOfSelection.prototype.getInstance(node, metaData);
  });

  if (allOfSelections.length === 0) {
    throw new Error("AnyOf must contain at least one AllOf");
  }

  return new AnyOfSelection(allOfSelections);
};

AnyOfSelection.prototype.match = function (context) {
  let firstIndeterminateStatus = null;
  const size = this.allOfSelections.length;
  for (let i = 0; i < size; i++) {
    const result = this.allOfSelections[i].match(context);
    if (result.result == MatchResult.prototype.MATCH) {
      return result;
    }

    if (result.result == MatchResult.prototype.INDETERMINATE) {
      if (firstIndeterminateStatus == null)
        firstIndeterminateStatus = result.status;
    }
  }

  const matchResult = new MatchResult();
  if (firstIndeterminateStatus == null) {
    matchResult.matchResultInit(MatchResult.prototype.NO_MATCH);

  } else {
    matchResult.setResult(MatchResult.prototype.INDETERMINATE,
      firstIndeterminateStatus);
  }
  return matchResult;
}

AnyOfSelection.prototype.encode = function (builder) {
  builder += "<AnyOf>\n";

  if (this.allOfSelections != null) {
    for (let allOfSelection of this.allOfSelections) {
      allOfSelection.encode(builder);
    }
  }

  builder += "</AnyOf>\n";
}



module.exports = AnyOfSelection;
