/*Copyright (c) 2019, Fan Zhang, Waterford Institute of Technology (WIT), Ireland
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const Status = require('./ctx/status'),
  Result = require('./ctx/result'),
  ResponseCtx = require('./ctx/responseCtx'),
  ResultFactory = require('./ctx/resultFactory'),
  EvaluationCtxFactory = require("./ctx/evaluationCtxFactory"),
  AbstractResult = require("./ctx/abstractResult"),
  XACML3EvaluationCtx = require("./ctx/xacml3/xacml3EvaluationCtx"),
  Policy = require("./policy"),
  XACMLConstants = require('./XACMLConstants'),
  PolicyReference = require("./policyReference");

const SCOPE_IMMEDIATE = 0,
  SCOPE_CHILDREN = 1,
  SCOPE_DESCENDANTS = 2;

function PDP(config) { 
  this.attributeFinder = config.getAttributeFinder();
  this.policyFinder = config.getPolicyFinder();
  this.pdpConfig = config;
};

PDP.prototype.init = async function () {
  await this.policyFinder.init();
  this.resourceFinder = this.pdpConfig.getResourceFinder();
};

PDP.prototype.evaluate = function (request) {
  const evalContext = EvaluationCtxFactory.prototype.getFactory().getEvaluationCtx(request, this.pdpConfig);
  return this.evaluateCtx(evalContext);
};

PDP.prototype.evaluateCtx = function (context) {
  // check whether this PDP configure to support multiple decision profile
  if (this.pdpConfig.isMultipleRequestHandle()) {

    let evaluationCtxSet;
    const multipleCtxResult = context.getMultipleEvaluationCtx();
    if (multipleCtxResult.isIndeterminate()) {
      return new ResponseCtx(ResultFactory.getFactory().
        getResult(AbstractResult.DECISION_INDETERMINATE, multipleCtxResult.getStatus(), context));
    } else {
      evaluationCtxSet = multipleCtxResult.getEvaluationCtxSet();
      const results = [];
      for (let ctx of evaluationCtxSet) {
        // do the evaluation, for all evaluate context
        const result = this.evaluateContext(ctx);
        // add the result
        results.push(result);
      }
      // XACML 3.0.version
      const responseCtx = new ResponseCtx();
      responseCtx.initWithResults(results, XACMLConstants.XACML_VERSION_3_0);
      return responseCtx;
    }
  } else {
    if (context instanceof XACML3EvaluationCtx && context.
      multipleAttributes) {
      const code = [];
      code.push(Status.prototype.STATUS_SYNTAX_ERROR);

      const status = new Status();
      status.statusInit2(code, "PDP does not supports multiple decision profile. " +
        "Multiple AttributesType elements with the same Category can be existed");

      const responseCtx = new ResponseCtx();
      responseCtx.responseCtxInit(ResultFactory.prototype.getFactory().
      getResultWithStatus(AbstractResult.prototype.DECISION_INDETERMINATE,
          status, context));
      return responseCtx;

    } else if (context instanceof XACML3EvaluationCtx && context.
      requestCtx.combinedDecision) {
      const code = [];
      code.push(Status.prototype.STATUS_PROCESSING_ERROR);
      const status = new Status;
      status.statusInit2(code, "PDP does not supports multiple decision profile. " +
        "Multiple decision is not existed to combine them");
      const responseCtx = new ResponseCtx();
      responseCtx.responseCtxInit(ResultFactory.prototype.getFactory().
      getResultWithStatus(AbstractResult.prototype.DECISION_INDETERMINATE,
          status, context));
      return responseCtx;

    } else {
      const responseCtx = new ResponseCtx();
      responseCtx.responseCtxInit(this.evaluateContext(context));

      return responseCtx;
    }
  }
};

PDP.prototype.evaluateContext = function (context) {
  var finderResult = this.policyFinder.findPolicy(context);

  if (finderResult.notApplicable()) {
    return ResultFactory.prototype.getFactory().getResultWithCtx(AbstractResult.prototype.DECISION_NOT_APPLICABLE, context);
  }
  if (finderResult.indeterminate()) {
    return ResultFactory.prototype.getFactory().getResultWithStatus(AbstractResult.prototype.DECISION_INDETERMINATE,
        finderResult.getStatus(), context);
  }

  if (context instanceof XACML3EvaluationCtx && context.requestCtx.
    returnPolicyIdList) {
    const references = [];
    processPolicyReferences(finderResult.getPolicy(), references);
    context.setPolicyReferences(references);
  }

  return finderResult.getPolicy().evaluate(context);
};

const processPolicyReferences = function (policy, references) {

  if (policy instanceof Policy) {
    const policyReference = new PolicyReference;
    policyReference.init(policy.getId(),
    PolicyReference.prototype.POLICY_REFERENCE, null, null);

    references.add(policyReference);
  } else if (policy instanceof PolicySet) {
    throw new Error("Implementation PolicySet")
    const elements = policy.childNodes;
    if (elements != null && elements.size() > 0) {
      for (let element of elements) {
        const treeElement = element.getElement();
        if (treeElement instanceof AbstractPolicy) {
          processPolicyReferences(treeElement, references);
        } else {
          references.add(new PolicyReference(policy.getId(),
            PolicyReference.POLICYSET_REFERENCE, null, null));
        }
      }
    }
  }
}

module.exports = PDP;