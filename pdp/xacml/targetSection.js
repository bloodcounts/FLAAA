/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const MatchResult = require("./matchResult");
const TargetMatch = require("./targetMatch");
const TargetMatchGroup = require("./targetMatchGroup");

function TargetSection(matchGroups, matchType, xacmlVersion) {
  this.matchGroups = matchGroups == null ? [] : matchGroups;
  this.matchType = matchType;
  this.xacmlVersion = xacmlVersion;
};

TargetSection.prototype.getInstance = function (root, matchType, metaData) {
  const groups = [];
  const children = root.getChildNodes();

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const name = child.name();
    const typeName = TargetMatch.prototype.NAMES[matchType];

    if (name === typeName) {
      groups.add(TargetMatchGroup.prototype.getInstance(child, matchType,
        metaData));
    } else if (name === "Any" + typeName) {
      // in a schema-valid policy, the Any element will always be
      // the only element, so if we find this we stop
      break;
    }
  }

  // at this point the list is non-empty (it has specific groups to
  // match) or is empty (it applies to any request using the 1.x or
  // 2.0 syntax)
  return new TargetSection(groups, matchType,
    metaData.getXACMLVersion());
};

TargetSection.prototype.match = function (context) {
  if (this.matchGroups.length === 0) {
    const matchResult = new MatchResult;
    matchResult.matchResultInit(MatchResult.prototype.MATCH);
    return matchResult;
  }

  // there are specific matching elements, so prepare to iterate
  // through the list
  let firstIndeterminateStatus = null;

  // in order for this section to match, one of the groups must match
  for (let group of matchGroups) {
    // get the next group and try matching it
    const result = group.match(context);

    // we only need one match, so if this matched, then we're done
    if (result.getResult() == MatchResult.prototype.MATCH)
      return result;

    // if we didn't match then it was either a NO_MATCH or
    // INDETERMINATE...in the second case, we need to remember
    // it happened, 'cause if we don't get a MATCH, then we'll
    // be returning INDETERMINATE
    if (result.getResult() == MatchResult.prototype.INDETERMINATE) {
      if (firstIndeterminateStatus == null)
        firstIndeterminateStatus = result.getStatus();
    }
  }
  const matchResult = new MatchResult;

  if (firstIndeterminateStatus == null) {
    matchResult.matchResultInit(MatchResult.NO_MATCH);
  }
  else {
    matchResult.setResult(MatchResult.prototype.INDETERMINATE,
      firstIndeterminateStatus);
  }
  return matchResult;
}



module.exports = TargetSection;
