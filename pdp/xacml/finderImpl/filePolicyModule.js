/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const { DOMParser } = require('@xmldom/xmldom');

var fs = require('fs').promises;
var PolicyFinderResult = require('../finder/policyFinderResult');
var Policy = require('../policy');
var PolicySet = require('../policySet');
var Status = require('../ctx/status');
var MatchResult = require('../matchResult');
const PolicyFilter = require('../policyFilter')

function FilePolicyModule() {
  this.fileNames = [];
  this.policies = [];
};

FilePolicyModule.prototype.addPolicy = function (fileName) {
  this.fileNames.push(fileName);
};

FilePolicyModule.prototype.isRequestSupport = function () {
  return true;
};
FilePolicyModule.prototype.isIdReferenceSupported = function () {
  return true;
};

FilePolicyModule.prototype.init = async function (finder) {
  try {
    this.finder = finder;
    for (var i = 0; i < this.fileNames.length; i++) {
      var fname = this.fileNames[i];
      const policy_instance = await this.loadPolicy(fname, this.finder, this.schemaFile);

      if (policy_instance !== null) {
        this.policy = policy_instance;
        this.policies.push(this.policy);
      }
    }
    return true;
  } catch (e) {
    console.log(e)
  }
};

FilePolicyModule.prototype.loadPolicy = async function (filename, finder, schemaFile) {
  const policyDoc = await parseXmlFile(filename);
  var name = policyDoc.documentElement.nodeName;

  if (name == "Policy") {
    return Policy.prototype.getInstance(policyDoc.documentElement);
  } else if (name == "PolicySet") {
    return PolicySet.prototype.getInstance(policyDoc.documentElement, finder);
  }
};

FilePolicyModule.prototype.findPolicy = function (context) {

  var selectedPolicy = null;
  const policiesLength = this.policies.length;
  console.log(`Evaluating ${policiesLength} policy(ies)`);
  for (var i = 0; i < policiesLength; i++) {
    var policy = this.policies[i];

    var match = policy.match(context);
    var result = match.getResult();

    console.log(`Policy ${policy.idAttr} match result: ${result}`);

    if (result == MatchResult.prototype.INDETERMINATE) {
      var policyFinderResult = new PolicyFinderResult();
      policyFinderResult.policyFinderResultInit(match.getStatus())
      return policyFinderResult;
    }
    if (result == MatchResult.prototype.MATCH) {

      if (selectedPolicy != null) {

        var code = [];
        code.push(Status.prototype.STATUS_PROCESSING_ERROR);
        var status = new Status();
        status.statusInit2(code, "too many applicable top-" + "level policies");
        var policyFinderResult = new PolicyFinderResult();
        policyFinderResult.policyFinderResultInit(status);
        return policyFinderResult;
      }

      selectedPolicy = policy;
      console.log(`Selected policy: ${selectedPolicy.idAttr}`);
      
    }
  }
  if (selectedPolicy != null) {
    PolicyFilter.getInstance().setPolicySetId(selectedPolicy.idAttr);
    
    var policyFinderResult = new PolicyFinderResult();
    policyFinderResult.policyFinderResultInit2(selectedPolicy);

    return policyFinderResult;
  } else {
    var policyFinderResult = new PolicyFinderResult();
    policyFinderResult.policyFinderResultInit3();
    return policyFinderResult;
  }
};

const parseXmlFile = async (filePath) => {
  try {
    // Load the XML file as a string
    const xmlString = await fs.readFile(filePath, "utf8");
    // Parse the XML string into a DOM object
    const doc = new DOMParser().parseFromString(xmlString.trim(), "text/xml");
    return doc;
  } catch (error) {
    console.error("Error:", error.message);
  }
}


const readFileToStream = (fileName) => {
  return new Promise((resolve, reject) => {
    const file = fs.createReadStream(fileName, 'utf8');
    let data = "";
    file.on('data', function (chunk) {
      data += chunk;
    })
    file.on("end", () => { resolve(data); file});
    file.on("error", reject);
  });
}
module.exports = FilePolicyModule;