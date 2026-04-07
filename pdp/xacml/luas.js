/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
'use strict';

const fs = require('fs');
const { DOMParser } = require('@xmldom/xmldom');
const FilePolicyModule = require('./finderImpl/filePolicyModule');
const PolicyFinder = require('./finder/policyFinder');
const SelectorModule = require('./finderImpl/selectorModule');
const CurrentEnvModule = require('./finderImpl/currentEnvModule');
const AttributeFinder = require('./finder/attributeFinder');
const RequestCtxFactory = require('./ctx/requestCtxFactory');
const PDP = require('./pdp');
const PDPConfig = require('./config');
const Result = require('./ctx/result');

class Luas {
  constructor(policyFiles) {
    this.policyFiles = policyFiles;

    const filePolicyModule = new FilePolicyModule();
    policyFiles.forEach(f => filePolicyModule.addPolicy(f));

    const policyFinder = new PolicyFinder();
    policyFinder.setModules([filePolicyModule]);

    const attributeFinder = new AttributeFinder();
    attributeFinder.setModules([new CurrentEnvModule(), new SelectorModule()]);

    const pdpConfig = new PDPConfig(attributeFinder, policyFinder, null, false);
    this.pdp = new PDP(pdpConfig);
  }

  static async create(policyFiles) {
    const luas = new Luas(policyFiles);
    await luas.pdp.init();
    return luas;
  }

  async evaluate(requestFile) {
    const contents = await _readFileToStream(requestFile);
    return this._evaluateCallBack(contents);
  }

  evaluates(request) {
    return this._evaluateCallBack(request);
  }

  _evaluateCallBack(requestXml) {
    let request;
    try {
      request = RequestCtxFactory.prototype.getFactory().getRequestCtxWithRequest(requestXml);
    } catch (err) {
      return {
        obligations: JSON.stringify([]),
        attributes: JSON.stringify([]),
        decision: 'Indeterminate',
        reason: null,
        message: err.message || String(err),
      };
    }

    const responseCtx = this.pdp.evaluate(request).getResults()[0];
    const fullObligations = this._getFullObligationsFromPolicy(responseCtx.obligations);
    const decisionStr = _parseDecision(responseCtx.getDecision());

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
      message: responseCtx.status ? responseCtx.status.message : null,
    };
  }

  _getFullObligationsFromPolicy(obligations) {
    if (!obligations || obligations.length === 0) return [];
    const ids = obligations.map(o => (o.obligationId ? o.obligationId : o));
    const result = [];

    for (const pf of this.policyFiles) {
      let xml;
      try {
        xml = fs.readFileSync(pf, 'utf8');
      } catch {
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
                mustBePresent: g.getAttribute('MustBePresent') === 'true',
              };
            }
          }
          assigns.push({
            attributeId: child.getAttribute('AttributeId'),
            category: child.getAttribute('Category') || null,
            issuer: child.getAttribute('Issuer') || null,
            dataType,
            value,
            designator,
          });
        }
        result.push({ obligationId: oid, fulfillOn, assignments: assigns });
      }
    }

    // deduplicate by obligationId
    const seen = new Set();
    return result.filter(o => {
      if (seen.has(o.obligationId)) return false;
      seen.add(o.obligationId);
      return true;
    });
  }
}

function _readFileToStream(fileName) {
  return new Promise((resolve, reject) => {
    const file = fs.createReadStream(fileName, 'utf8');
    let data = '';
    file.on('data', chunk => { data += chunk; });
    file.on('end', () => { resolve(data); file.destroy(); });
    file.on('error', reject);
  });
}

function _parseDecision(response) {
  switch (response) {
    case Result.prototype.DECISION_PERMIT:              return 'Permit';
    case Result.prototype.DECISION_DENY:                return 'Deny';
    case Result.prototype.DECISION_NOT_APPLICABLE:      return 'NotApplicable';
    case Result.prototype.DECISION_INDETERMINATE:
    case Result.prototype.DECISION_INDETERMINATE_DENY:
    case Result.prototype.DECISION_INDETERMINATE_PERMIT:
    case Result.prototype.DECISION_INDETERMINATE_DENY_OR_PERMIT:
      return 'Indeterminate';
    default:
      return null;
  }
}

module.exports = Luas;
