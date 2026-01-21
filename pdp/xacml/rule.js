/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/


var Result = require('./ctx/result')
var Target = require('./target');
const TargetFactory = require("./targetFactory");
var Apply = require('./cond/apply');
var MatchResult = require('./matchResult');
const PolicyMetaData = require('./PolicyMetaData');
const XACMLConstants = require('./XACMLConstants');
const Condition = require('./cond/condition');
const ResultFactory = require('./ctx/resultFactory');
const AbstractResult = require('./ctx/abstractResult');
const { DOMParser } = require('@xmldom/xmldom');
const ObligationFactory = require('./obligationFactory');

function Rule(id, effect, description, target, condition,
  obligationExpressions, adviceExpressions,
  xacmlVersion) {
  this.idAttr = id;
  this.effectAttr = effect;
  this.description = description;
  this.target = target;
  this.condition = condition;
  this.adviceExpressions = adviceExpressions;
  this.obligationExpressions = obligationExpressions;
  this.xacmlVersion = xacmlVersion;
};

Rule.prototype.getInstance = function (root, metaData, manager) {
  let effect = 0;
  let description = null;
  let target = null;
  let condition = null;
  let obligationExpressions = [];
  let adviceExpressions = [];


  const id = root.getAttribute("RuleId");
  const str = root.getAttribute("Effect");

  if (str.toLowerCase() === "permit") {
    effect = Result.prototype.DECISION_PERMIT;
  } else if (str.toLowerCase() === "deny") {
    effect = Result.prototype.DECISION_DENY;
  } else {
    throw new Error(`Invalid Effect: ${str}`);
  }

  var children = root.childNodes;
  for (var i = 0; i < children.length; i++) {
    const child = children[i];
    const cname = child.nodeName;

    if (cname === "Description") {
      description = child.textContent;
    } else if (cname === "Target") {
      target = TargetFactory.prototype.getTarget(child, metaData);
    } else if (cname === "Condition") {
      condition = Condition.prototype.getInstance(child, metaData, null);
    } else if (cname === "ObligationExpressions") {
      const obChildren = child.childNodes;
      for (let j = 0; j < obChildren.length; j++) {
        const obNode = obChildren[j];
        if (obNode.nodeName === 'ObligationExpression') {
          obligationExpressions.push(ObligationFactory.prototype.getFactory().getObligation(obNode, metaData));
        }
      }
    } else if (cname === "AdviceExpressions") {
      // AdviceExpressions parsing not implemented; ignore for now
    }
  }
  return new Rule(id, effect, description, target, condition, obligationExpressions,
    adviceExpressions, metaData.getXACMLVersion());
};

Rule.prototype.evaluate = function (context) {
  let match = null;
  if (this.target != null) {

    match = this.target.match(context);
    var result = match.getResult();

    console.log(`Rule ${this.idAttr} target match result: ${result}`);

    if (result == MatchResult.prototype.NO_MATCH) {
      return ResultFactory.prototype.getFactory().getResultWithCtx(Result.prototype.DECISION_NOT_APPLICABLE, context);
    }
    if (result == MatchResult.prototype.INDETERMINATE) {

      if (this.xacmlVersion == XACMLConstants.XACML_VERSION_3_0) {
        if (this.effectAttr == AbstractResult.prototype.DECISION_PERMIT) {
          return ResultFactory.prototype.getFactory().getResultWithStatus(Result.prototype.DECISION_INDETERMINATE_PERMIT,
            match.getStatus(), context);
        } else {
          return ResultFactory.prototype.getFactory().getResultWithStatus(Result.prototype.DECISION_INDETERMINATE_DENY,
            match.getStatus(), context);
        }
      }
      return ResultFactory.prototype.getFactory().getResultWithStatus(Result.prototype.DECISION_INDETERMINATE,
        match.getStatus(), context);
    }
  }
  if (this.condition == null) {

    return ResultFactory.prototype.getFactory().getResultWithObligationResults(this.effectAttr, this.processObligations(context),
      this.processAdvices(context), context);
  }

  result = this.condition.evaluate(context);

  console.log(`Rule ${this.idAttr} condition evaluation: indeterminate=${result.indeterminate}, value=${result.value}`);

  if (result.indeterminate) {
    if (this.xacmlVersion == XACMLConstants.XACML_VERSION_3_0) {
      if (this.effectAttr == AbstractResult.prototype.DECISION_PERMIT) {
        return ResultFactory.prototype.getFactory().getResultWithStatus(Result.prototype.DECISION_INDETERMINATE_PERMIT,
          result.status, context);
      } else {
        return ResultFactory.prototype.getFactory().getResultWithStatus(Result.prototype.DECISION_INDETERMINATE_DENY,
          result.status, context);
      }
    }

    return ResultFactory.prototype.getFactory().getResult(Result.prototype.DECISION_INDETERMINATE,
      result.getStatus(), context);
  } else {

    if (result.value) {
      return ResultFactory.prototype.getFactory().getResultWithObligationResults(this.effectAttr, this.processObligations(context),
        this.processAdvices(context), context);
    } else {
      return ResultFactory.prototype.getFactory().getResultWithCtx(Result.prototype.DECISION_NOT_APPLICABLE, context);
    }
  }
};

Rule.prototype.processObligations = function (evaluationCtx) {
  if (this.obligationExpressions != null && this.obligationExpressions.length > 0) {
    let results = [];
    for (let obligationExpression of this.obligationExpressions) {
      if (obligationExpression.getFulfillOn() == this.effectAttr) {
        results.push(obligationExpression.evaluate(evaluationCtx));
      }
    }

    return results;
  }
  return null;
}

Rule.prototype.processAdvices = function (evaluationCtx) {
  if (this.adviceExpressions != null && this.adviceExpressions.length > 0) {
    let advices = [];
    for (let adviceExpression of this.adviceExpressions) {
      if (adviceExpression.getAppliesTo() == this.effectAttr) {
        advices.push(adviceExpression.evaluate(evaluationCtx));
      }
    }
    return advices;
  }
  return null;
}

module.exports = Rule;
