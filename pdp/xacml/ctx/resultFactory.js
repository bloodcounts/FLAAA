/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const XACMLConstants = require("../XACMLConstants");
const ResultXACML3 = require("./xacml3/result");
const ResultXACML2 = require("./result");
const decisionLogger = require("../../utils/decisionLogger");
let factoryInstance = null;
function ResultFactory() { };

ResultFactory.prototype.getResult = function (decision, status, version) {

  if (version == XACMLConstants.XACML_VERSION_3_0) {
    const resultXACML3 = new ResultXACML3;
    resultXACML3.initWithObligationResults(decision, status, null, null, evaluationCtx)
    return resultXACML3;
  } else {
    const resultXACML2 = new ResultXACML2;
    resultXACML2.initWithStatus(decision, status)
    return resultXACML2;
  }
};

ResultFactory.prototype.getResultWithCtx = function (decision, evaluationCtx) {
  if (evaluationCtx.requestCtx.xacmlVersion == XACMLConstants.XACML_VERSION_3_0) {
    const resultXACML3 = new ResultXACML3;
    resultXACML3.initWithObligationResults(decision, null, null, null, evaluationCtx);
    try { decisionLogger.logDecision(decision, evaluationCtx, null); } catch (e) {}
    return resultXACML3;
  } else {
    throw new Error('This Implementation does not support XACML 2.0')
  }
};

ResultFactory.prototype.getResultWithStatus = function (decision, status, evaluationCtx) {
  if (evaluationCtx.requestCtx.xacmlVersion == XACMLConstants.XACML_VERSION_3_0) {
    const resultXACML3 = new ResultXACML3;
    resultXACML3.initWithObligationResults(decision, status, null, null, evaluationCtx);
    try { decisionLogger.logDecision(decision, evaluationCtx, { status: status }); } catch (e) {}
    return resultXACML3;
  } else {
    throw new Error('This Implementation does not support XACML 2.0')
  }
};

ResultFactory.prototype.getResultWithObligationResults = function (decision, obligationResults,
  advices, evaluationCtx) {
  if (evaluationCtx.requestCtx.xacmlVersion == XACMLConstants.XACML_VERSION_3_0) {
    const resultXACML3 = new ResultXACML3;
    resultXACML3.initWithObligationResults(decision, null, obligationResults,
      advices, evaluationCtx);
    try { decisionLogger.logDecision(decision, evaluationCtx, { obligationResults: obligationResults, advices: advices }); } catch (e) {}
    return resultXACML3;
  } else {
    throw new Error('This Implementation does not support XACML 2.0')
  }
};

ResultFactory.prototype.getFactory = function () {
  if (factoryInstance == null) {
    factoryInstance = new ResultFactory();
  }
  return factoryInstance;
};



module.exports = ResultFactory;

