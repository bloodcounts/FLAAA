/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const fs = require("fs");
const FilePolicyModule = require('./finderImpl/filePolicyModule');
const PolicyFinder = require('./finder/policyFinder');
const SelectorModule = require('./finderImpl/selectorModule');
const CurrentEnvModule = require('./finderImpl/currentEnvModule');
const AttributeFinder = require('./finder/attributeFinder');
const RequestCtxFactory = require('./ctx/requestCtxFactory');
const PDP = require('./pdp');
const PDPConfig = require('./config');
const Result = require('./ctx/result');

function Luas(policyFiles) {
  this.policyFiles = policyFiles;
  const attributeModules = [];
  const filePolicyModuleIns = new FilePolicyModule();

  policyFiles.forEach(policyFile => {
    filePolicyModuleIns.addPolicy(policyFile);
  });


  const policyFinderIns = new PolicyFinder();
  policyFinderIns.setModules([filePolicyModuleIns]);

  const envAttributeModule = new CurrentEnvModule();
  const selectorAttributeModule = new SelectorModule();

  const attributeFinder = new AttributeFinder();

  attributeModules.push(envAttributeModule);
  attributeModules.push(selectorAttributeModule);
  attributeFinder.setModules(attributeModules);

  const pdpConfig = new PDPConfig(attributeFinder, policyFinderIns, null, false);
  this.pdp = new PDP(pdpConfig);
}

Luas.prototype.getPDPInstance = async function (policyFiles) {
  try {
    console.log("Initializing PDP... policyFiles:", policyFiles);
    const luas = new Luas(policyFiles)
    await luas.pdp.init();
    return luas;
  } catch (err) {
    console.trace(err);
  }
};

Luas.prototype.evaluate = async function (requestFile) {
  try {
    const contents = await readFileToStream(requestFile);
    const decision = this.evaluateCallBack(contents);
    return decision;
  } catch (err) {
    console.trace(err);
  }
};

Luas.prototype.evaluates = function (request) {
  try {
    const decision = this.evaluateCallBack(request);
    return decision;
  } catch (err) {
    console.trace(err);
  }
};

Luas.prototype.evaluateCallBack = function (requestFile) {
  let request;
  try {
    request = RequestCtxFactory.prototype.getFactory().getRequestCtxWithRequest(requestFile);
  } catch (err) {
    return {
      obligations: JSON.stringify([]),
      attributes: JSON.stringify([]),
      decision: 'Indeterminate',
      reason: null,
      message: err.message || String(err)
    };
  }

  const responseCtx = this.pdp.evaluate(request).getResults()[0];
  const fullObligations = this.getFullObligationsFromPolicy(responseCtx.obligations);
  const decisionStr = parseRes(responseCtx.getDecision());

  // when Deny, extract any reason assignments from obligations
  let reasons = [];
  if (decisionStr === 'Deny') {
    for (const obl of fullObligations) {
      for (const a of obl.assignments) {
        if (a.attributeId && a.attributeId.toLowerCase().includes('reason')) {
          if (a.value) reasons.push(a.value);
          else if (a.designator && a.designator.attributeId) reasons.push(a.designator.attributeId);
        }
      }
    }
  }

  return {
    obligations: JSON.stringify(fullObligations),
    attributes: JSON.stringify(responseCtx.attributes),
    decision: decisionStr,
    reason: reasons.length > 0 ? reasons : null,
    message: responseCtx.status ? responseCtx.status.message : null
  };
}

Luas.prototype.getFullObligationsFromPolicy = function (obligations) {
  if (!obligations || obligations.length === 0) return [];
  const { DOMParser } = require('@xmldom/xmldom');
  const fs = require('fs');
  const ids = obligations.map(o => o.obligationId ? o.obligationId : o);
  const result = [];

  for (let pf of this.policyFiles) {
    let xml = null;
    try {
      xml = fs.readFileSync(pf, 'utf8');
    } catch (e) {
      continue;
    }
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const nodes = doc.getElementsByTagName('ObligationExpression');
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const oid = node.getAttribute('ObligationId');
      if (!ids.includes(oid)) continue;
      const fulfillOn = node.getAttribute('FulfillOn');
      const assigns = [];
      const children = node.childNodes;
      for (let j = 0; j < children.length; j++) {
        const child = children[j];
        if (child.nodeName !== 'AttributeAssignment') continue;
        const attrId = child.getAttribute('AttributeId');
        const category = child.getAttribute('Category') || null;
        const issuer = child.getAttribute('Issuer') || null;
        // find AttributeValue or AttributeDesignator inside
        let value = null;
        let dataType = null;
        let designator = null;
        const grand = child.childNodes;
        for (let k = 0; k < grand.length; k++) {
          const g = grand[k];
          if (!g.nodeName) continue;
          if (g.nodeName === 'AttributeValue') {
            dataType = g.getAttribute('DataType') || null;
            value = g.textContent;
          } else if (g.nodeName === 'AttributeDesignator') {
            designator = {
              category: g.getAttribute('Category') || null,
              attributeId: g.getAttribute('AttributeId') || null,
              dataType: g.getAttribute('DataType') || null,
              mustBePresent: g.getAttribute('MustBePresent') === 'true'
            };
          }
        }
        const entry = {
          attributeId: attrId,
          category: category,
          issuer: issuer,
          dataType: dataType,
          value: value,
          designator: designator
        };
        assigns.push(entry);
      }
      result.push({ obligationId: oid, fulfillOn: fulfillOn, assignments: assigns });
    }
  }
  // remove duplicates by obligationId
  const uniq = [];
  const seen = new Set();
  for (const o of result) {
    if (!seen.has(o.obligationId)) {
      uniq.push(o);
      seen.add(o.obligationId);
    }
  }
  return uniq;
};


const readFileToStream = (fileName) => {
  return new Promise((resolve, reject) => {
    const file = fs.createReadStream(fileName, 'utf8');
    let data = "";
    file.on('data', function (chunk) {
      data += chunk;
    })
    file.on("end", () => {
      resolve(data);
      file.destroy()
    });
    file.on("error", reject);
  });
};

const parseRes = response => {
  let decision = null;
  switch (response) {
    case Result.prototype.DECISION_PERMIT:
      decision = "Permit";
      break;
    case Result.prototype.DECISION_DENY:
      decision = "Deny";
      break;
    case Result.prototype.DECISION_INDETERMINATE:
      decision = "Indeterminate";
      break;
    case Result.prototype.DECISION_NOT_APPLICABLE:
      decision = "NotApplicable";
      break;
    case Result.prototype.DECISION_INDETERMINATE_DENY:
      decision = "Indeterminate";
      break;
    case Result.prototype.DECISION_INDETERMINATE_PERMIT:
      decision = "Indeterminate";
      break;
    case Result.prototype.DECISION_INDETERMINATE_DENY_OR_PERMIT:
      decision = "Indeterminate";
      break;
  }
  return decision;
};

module.exports = Luas;
