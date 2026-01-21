/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const MatchResult = require("../matchResult");
const TargetMatch = require("../targetMatch");
const { DOMParser } = require('@xmldom/xmldom');

function AllOfSelection(matches) {
  this.matches = matches;
};

AllOfSelection.prototype.getInstance = function (root, metaData) {
  const doc = new DOMParser().parseFromString(root.toString(), "text/xml");
  const childNodes = Array.from(doc.childNodes[0].childNodes);

  const targetMatches = childNodes
    .filter(node => node.nodeName === "Match")
    .map(node => TargetMatch.prototype.getInstanceWithMetaData(node, metaData));

  if (targetMatches.length === 0) {
    throw new Error("AllOf must contain at least one Match");
  }

  return new AllOfSelection(targetMatches);
};

AllOfSelection.prototype.match = function (context) {
  let firstIndeterminateStatus = null;
  const size = this.matches.length;
  for (let i = 0; i < size; i++) {
    const result = this.matches[i].match(context);
    if (result.result === MatchResult.prototype.NO_MATCH) {
      return result;
    }

    if (result.result == MatchResult.prototype.INDETERMINATE) {
      if (firstIndeterminateStatus === null) {
        firstIndeterminateStatus = result.getStatus();
      }
    }
  }

  const matchResult = firstIndeterminateStatus === null ? {
    result: MatchResult.prototype.MATCH,
    status: null
  } : {
    result: MatchResult.prototype.INDETERMINATE,
    status: firstIndeterminateStatus
  }

  return matchResult;
}

AllOfSelection.prototype.encode = function (builder) {
  builder += "<AllOf>\n";

  if (this.matches != null) {
    for (let match of this.matches) {
      match.encode(builder);
    }
  }

  builder += "</AllOf>\n";
}



module.exports = AllOfSelection;
