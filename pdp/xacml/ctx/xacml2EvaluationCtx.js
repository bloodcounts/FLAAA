/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const BasicEvaluationCtx = require("./basicEvaluationCtx");
const XACMLConstants = require("../XACMLConstants");

class XACML2EvaluationCtx extends BasicEvaluationCtx {
  constructor(requestCtx, pdpConfig) {
    if (requestCtx !== null && pdpConfig !== null) {
      this.pdpConfig = pdpConfig;
      this.requestCtx = requestCtx;
      this.xacmlVersion = requestCtx.getXacmlVersion();
      this.requestRoot = requestCtx.getDocumentRoot();

      attributesSet = requestCtx.getAttributesSet();
      this.useCachedEnvValues = false;
      currentDate = null;
      currentTime = null;
      currentDateTime = null;

      this.subjectMap = {};
      this.setupSubjects(requestCtx.getSubjects());

      this.resourceMap = {};
      this.setupResource(requestCtx.getResource());

      this.actionMap = {};
      this.mapAttributes(requestCtx.getAction(), this.actionMap);

      this.environmentMap = {};
      this.mapAttributes(requestCtx.getEnvironmentAttributes(), this.environmentMap);
    }
  }

  setupSubjects(subjects) {
    if (subjects.length == 0) {
      console.log("Request must a contain subject");
    }
    for (let i = 0; i < subjects.length; i++) {
      let subject = subjects[i];
      let category = subject.getCategory();
      let categoryMap = {};

      if (this.subjectMap[category] != null) {
        categoryMap = this.subjectMap[category];
      } else {
        this.subjectMap[category] = categoryMap;
      }
      let attrIterator = subject.getAttributes();

      for (let j = 0; j < attrIterator.length; j++) {
        let attr = attrIterator[j];
        let id = attr.getId();
        if (categoryMap[id] != null) {
          let existingIds = [];
          existingIds = categoryMap[id];
          existingIds.push(attr);
        } else {
          let newIds = [];
          newIds.push(attr);
          categoryMap[id] = newIds;
        }
      }
    }
  }

  setupResource(resource) {
    this.mapAttributes(resource, this.resourceMap);

    if (this.resourceMap[RESOURCE_ID] == null) {
      console.log("Resource must contain resource-id attr");
    } else {
      var set = [];
      set.push(this.resourceMap[RESOURCE_ID]);
      this.resourceId = set[0][0].getValue();
    }
    if (this.resourceMap[RESOURCE_SCOPE] != null) {

      var set = [];
      set.push(this.resourceMap[RESOURCE_SCOPE]);
      var attr = set[0];

      var attrValue = attr.getValue();

      var value = attrValue.getValue();
      if (value == "Immediate") {
        this.scope = SCOPE_IMMEDIATE;
      } else if (value == "Children") {
        this.scope = SCOPE_CHILDREN;
      } else if (value == "Descendants") {
        this.scope = SCOPE_DESCENDANTS;
      } else {
        console.log("Unknown scope type: " + value);
      }
    } else {
      this.scope = SCOPE_IMMEDIATE;
    }
  }

  setResourceId(resourceId, attributesSet) {
    this.resourceId = resourceId;
    var attrSet = [];
    attrSet = this.resourceMap[RESOURCE_ID];
    var attr = attrSet[0];

    var idx = attrSet.indexOf(attr);
    if (idx != -1) {
      attrSet.splice(idx, 1);
    }
    attrSet.push(new Attribute(attr.getId(), attr.getIssuer(), attr.getIssueInstant(),
      resourceId, XACMLConstants.XACML_VERSION_2_0));
  }
}
const mapAttributes = function (inputs, output) {
  for (var i = 0; i < inputs.length; i++) {
    var attr = inputs[i];
    var id = attr.getId();
    if (output[id] != null) {
      var set = [];
      set = output[id];
      set.push(attr);
    } else {

      var set = [];
      set.push(attr);
      output[id] = set;
      if (id.indexOf('resource') > -1) {
        this.resourceMap[id] = set;
      } else if (id.indexOf('action') > -1) {
        this.actionMap[id] = set;
      }
    }
  }
};
module.exports = XACML2EvaluationCtx;