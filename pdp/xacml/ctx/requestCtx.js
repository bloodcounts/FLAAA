/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const { DOMParser } = require('@xmldom/xmldom');
var InputParser = require("./inputParser");
var Attribute = require("./attribute");
var Subject = require("./subject");

function RequestCtx() {};

RequestCtx.prototype.requestCtxInit = function (subjects, resource, action, environment, documentRoot) {
  this.requestCtxInit2(subjects, resource, action, environment, documentRoot, null);
};
RequestCtx.prototype.requestCtxInit2 = function (subjects, resource, action, environment, documentRoot, resourceContent) {
  this.subjects = subjects;
  this.resource = resource;
  this.action = action;
  this.environment = environment;
  this.documentRoot = documentRoot;
  this.resourceContent = resourceContent;

};

RequestCtx.prototype.getInstance1 = function (root) {

  var newSubjects = [];
  var newResource = null;
  var newAction = null;
  var newEnvironment = null;
  var resourceContent = null;

  console.log ("root:>>>>>> " + root);

  var tagName = root.nodeName;
  if (tagName != "Request") {
    console.log("Request cannot be constructed using " + "type: " + root.nodeName);
  }
  var children = root.childNodes;

  for (var i = 0; i < children.length; i++) {
    var node = children[i];
    var tag = node.nodeName;
    if (tag == "Subject") {
      var catNode = node.getAttribute("SubjectCategory");
      var category;
      if (catNode != null) {
        category = catNode;

      }
      var attributes = this.parseAttributes(node);
      var subject = new Subject();
      subject.subjectInit(category, attributes);
      newSubjects.push(subject);
    } else if (tag == "Resource") {
      newResource = this.parseAttributes(node);
    } else if (tag == "Action") {
      newAction = this.parseAttributes(node);
    } else if (tag == "Environment") {
      newEnvironment = this.parseAttributes(node);
    }
  }
  if (newEnvironment == null) {
    newEnvironment = [];
  }
  var requestCtx = new RequestCtx();

  requestCtx.requestCtxInit(newSubjects, newResource, newAction, newEnvironment, root);
  return requestCtx;
};

RequestCtx.prototype.getInstance2 = function (input) {
  return this.getInstance1(new DOMParser().parseFromString(input, "text/xml").documentElement);
};

RequestCtx.prototype.parseAttributes = function (root) {
  var set = [];
  var nodes = root.childNodes;
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node.nodeName == "Attribute") {
      set.push(Attribute.prototype.getInstance(node));
    }
  }
  return set;
};


RequestCtx.prototype.getDocumentRoot = function () {
  return this.documentRoot;
};

RequestCtx.prototype.getResource = function () {
  return this.resource;
};

RequestCtx.prototype.getSubjects = function () {
  return this.subjects;
};

RequestCtx.prototype.getAction = function () {

  return this.action;
};

RequestCtx.prototype.getEnvironmentAttributes = function () {

  return this.environment;
};

RequestCtx.prototype.getXacmlVersion = function () {
  return this.xacmlVersion;
}

RequestCtx.prototype.encode = function (indenter) {
  var indent = indenter.makeString();
  console.log(indent + '<Response>');
  indenter.in();
  for (var i = 0; i < results; i++) {
    var result = results[i];
    result.encode(out, indenter);
  }
  indenter.out();
  console.log(indent + "</Response>");
};

module.exports = RequestCtx;
