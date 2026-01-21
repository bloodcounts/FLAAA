/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var TargetMatch = require("./targetMatch");
var MatchResult = require("./matchResult");
const TargetSection = require("./targetSection");

function Target() {};

Target.prototype.targetInit = function (subjects, resources, actions) {
  this.subjects = subjects;
  this.resources = resources;
  this.actions = actions;
};


Target.prototype.getInstance = function (root, xpathVersion) {
  let subjects = null;
  let resources = null;
  let actions = null;
  let environments = null;

  const childNodes = root.childNodes();

  for (var i = 0; i < childNodes.length; i++) {
    var child = childNodes[i];
    var name = child.name();
    if (name === "Subjects") {
      subjects = getAttributes(child, "Subject", xpathVersion);
    } else if (name === "Resources") {
      resources = getAttributes(child, "Resource", xpathVersion);
    } else if (name === "Actions") {
      actions = getAttributes(child, "Action", xpathVersion);
    } else if (name === "Environments") {
      environments = TargetSection.getInstance(child, TargetMatch.prototype.ENVIRONMENT, metaData);
    }
  }
  var target = new Target();
  target.targetInit(subjects, resources, actions);

  return target;
}

function getAttributes(root, prefix, xpathVersion) {
  var matches = [];
  var childNodes = root.childNodes();
  for (var i = 0; i < childNodes.length; i++) {
    var child = childNodes[i];
    var name = child.name();
    if (name == prefix) {
      matches.push(getMatches(child, prefix, xpathVersion));
    } else if (name == "Any" + prefix) {
      return null;
    }

  }

  return matches;
}

function getMatches(root, prefix, xpathVersion) {
  var list = [];
  var childNodes = root.childNodes();
  for (var i = 0; i < childNodes.length; i++) {
    var child = childNodes[i];
    var name = child.name();
    if (name == prefix + "Match") {
      list.push(TargetMatch.prototype.getInstance(child, prefix, xpathVersion));
    }
  }
  return list;
};

Target.prototype.getActions = function () {
  return this.actions;
};

Target.prototype.match = function (context) {

  if (this.subjects != null) {
    var result = this.checkSet(this.subjects, context);
    // console.log(this.subjects)
    // console.log(result.getResult() == MatchResult.prototype.MATCH)
    if (result.getResult() != MatchResult.prototype.MATCH) {
      //console.log("failed to match Subjects section of Target");
      return result;
    }
  }

  if (this.resources != null) {
    var result = this.checkSet(this.resources, context);
    if (result.getResult() != MatchResult.prototype.MATCH) {
      //console.log("failed to match Resources section of Target");
      return result;
    }
  }

  if (this.actions != null) {
    //console.log(this.actions.length)
    var result = this.checkSet(this.actions, context);
    if (result.getResult() != MatchResult.prototype.MATCH) {
      //console.log("failed to match Actions section of Target");
      return result;
    }
  }

  var matchResult = new MatchResult();
  matchResult.matchResultInit(MatchResult.prototype.MATCH);
  return matchResult;
};

Target.prototype.checkSet = function (matchList, context) {

  var allFalse = true;
  var firstIndeterminateStatus = null;

  for (var i = 0; i < matchList.length; i++) {

    var list = matchList[i];

    var result = null;

    for (var j = 0; j < list.length; j++) {

      var tm = list[j];

      result = tm.match(context);

      if (result.getResult() != MatchResult.prototype.MATCH) {

        break;
      }
    }

    if (result.getResult() == MatchResult.prototype.MATCH) {

      return result;
    }
    if (result.getResult() == MatchResult.prototype.INDETERMINATE) {

      allFalse = false;
      if (firstIndeterminateStatus == null) {
        firstIndeterminateStatus = result.getStatus();
      }
    }
  }
  var matchResult = new MatchResult();
  if (allFalse) {

    matchResult.matchResultInit(MatchResult.prototype.NO_MATCH);
    return matchResult;
  } else {
    matchResult.setResult(MatchResult.prototype.INDETERMINATE,
      firstIndeterminateStatus);
    return matchResult;
  }

};

module.exports = Target;
