/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const BasicEvaluationCtx = require("../basicEvaluationCtx");
const XACMLConstants = require("../../XACMLConstants");
const BagAttribute = require("../../attr/bagAttribute");
const EvaluationResult = require("../../cond/evaluationResult");
const Attribute = require("../attribute");
const MultipleCtxResult = require("./multipleCtxResult");
const Status = require('../status');
const RequestCtx = require('./requestCtx');

class XACML3EvaluationCtx extends BasicEvaluationCtx {
  constructor(requestCtx, pdpConfig) {
    super()
    if (requestCtx !== null && pdpConfig !== null) {
      this.currentDate = null;
      this.currentTime = null;
      this.currentDateTime = null;

      this.mapAttributes = [];

      this.attributesSet = requestCtx.attributesSet;
      this.pdpConfig = pdpConfig;
      this.requestCtx = requestCtx;
      this.resourceScope = 0;
      this.multipleContentSelectors = null;
      this.initAttributes(this.attributesSet, this.mapAttributes);
    }
  }

  getAttributeByType(type, id, issuer, category) {
    const attributeValues = [];
    const attributesSet = this.mapAttributes[category.toString()];

    if (attributesSet != null && this.attributesSet.length > 0) {
      const attributeSet = this.attributesSet[0].getAttributes();
      for (let attribute of attributeSet) {
        if (attribute.getId().toString() === id.toString() &&
          attribute.getType().toString() === type.toString() &&
          (issuer == null || issuer === attribute.getIssuer()) &&
          attribute.getValue() != null) {
          const attributeValueList = attribute.getValues();
          for (let attributeVal of attributeValueList) {
            attributeValues.add(attributeVal);
          }
        }
      }
    }

    if (attributeValues.isEmpty()) {
      return this.callHelper(type, id, issuer, category);
    }

    const evaluationResult = new EvaluationResult();
    const bagAttribute = new BagAttribute();
    bagAttribute.bagAttributeInit(type, attributeValues);
    evaluationResult.evaluationResultInit(bagAttribute);

    return evaluationResult;
  }

  getAttributeByPath(path, type, category, contextSelector, xpathVersion) {
    if (this.pdpConfig.getAttributeFinder() == null) {

      Console.warn("Context tried to invoke AttributeFinder but was " +
        "not configured with one");
      return new EvaluationResult(BagAttribute.createEmptyBag(type));
    }

    let attributesSet = null;

    if (category != null) {
      attributesSet = mapAttributes[category.toString()];
    }
    if (attributesSet != null && attributesSet.length > 0) {
      const attributes = attributesSet[0];
      const content = attributes.getContent();
      if (content instanceof Node) {
        const root = content;
        if (contextSelector != null && contextSelector.toString().trim().length > 0) {
          for (let attribute of attributes.getAttributes()) {
            if (attribute.getId() === contextSelector) {
              const values = attribute.getValues();
              for (let value of values) {
                if (value instanceof XPathAttribute) {
                  const xPathAttribute = value;
                  if (xPathAttribute.getXPathCategory() === category.toString()) {
                    return this.pdpConfig.getAttributeFinder().findAttribute(path,
                      xPathAttribute.getValue(), type,
                      root, this, xpathVersion);
                  }
                }
              }
            }
          }
        } else {
          return pdpConfig.getAttributeFinder().findAttribute(path, null, type, root, this, xpathVersion);
        }
      }
    }

    const evaluationResult = new EvaluationResult();
    evaluationResult.evaluationResultInit(BagAttribute.prototype.createEmptyBag(type));
    return evaluationResult;
  }

  initAttributes(attributeSet, mapAttributes) {
    for (let attributeArr of attributeSet) {
      const category = attributeArr.category;
      const attributes = attributeArr.attributes;
      for (let j = 0, jl = attributes.length; j < jl; j++) {
        const attribute = attributes[j];

        if (XACMLConstants.RESOURCE_CATEGORY === category && XACMLConstants.RESOURCE_SCOPE_2_0 === attribute.id) {
          this.resourceScopeAttribute = attribute;
          const value = attribute.getValue();
          if (value instanceof StringAttribute) {
            const scope = value.getValue();
            if (scope === "Children") {
              this.resourceScope = XACMLConstants.SCOPE_CHILDREN;
            } else if (scope === "Descendants") {
              this.resourceScope = XACMLConstants.SCOPE_DESCENDANTS;
            }
          } else {
            throw new Error("scope attribute must be a string");
          }

        }

        if (attribute.id === XACMLConstants.MULTIPLE_CONTENT_SELECTOR) {
          if (this.multipleContentSelectors == null) {
            this.multipleContentSelectors = [];
          }
          this.multipleContentSelectors.push(attributes);
        }
      }

      if (mapAttributes[category] != null) {
        const set = mapAttributes[category];

        set.push(attributeArr);
        this.multipleAttributes = true;
      } else {
        const set = [attributeArr];
        this.mapAttributes[category] = set;
      }
    }
  }


  setResourceId(resourceId, attributesSet) {
    for (let attributes of attributesSet) {
      if (XACMLConstants.RESOURCE_CATEGORY === attributes.getCategory().toString()) {
        const attributeSet = attributes.getAttributes();
        const newSet = attributeSet;
        let resourceIdAttribute = null;

        for (let attribute of newSet) {
          if (XACMLConstants.RESOURCE_ID === attribute.getId().toString()) {
            resourceIdAttribute = attribute;
            delete attributeSet[attribute];
          } else if (XACMLConstants.RESOURCE_SCOPE_2_0 === attribute.getId().toString()) {
            delete attributeSet[attribute];
          }
        }

        if (resourceIdAttribute != null) {
          const attribute = new Attribute;
          attribute.initWithResult(resourceIdAttribute.getId(), resourceIdAttribute.getIssuer(),
            resourceIdAttribute.getIssueInstant(), resourceId, resourceIdAttribute.isIncludeInResult(),
            XACMLConstants.XACML_VERSION_3_0)
          attributeSet.push(attribute);
        }
        break;
      }

    }
  }


  getAttribute(type, id, issuer, category) {
    let attributeValues = [];
    const attributesSet = this.mapAttributes[category];

    if (attributesSet != null && attributesSet.length > 0) {
      const attributeSet = attributesSet[0].attributes;
      for (let i = 0, l = attributeSet.length; i < l; i++) {
        const attribute = attributeSet[i];
        if (attribute.id === id &&
          attribute.type === type &&
          (issuer === null || issuer === attribute.issuer) &&
          attribute.getValue() !== null) {
          attributeValues.push(...attribute.attributeValues)
        }
      }
    }

    if (attributeValues.length === 0) {
      return this.callHelper(type, id, issuer, category);
    }

    return {
      status: null,
      attributeValues: new BagAttribute(type, attributeValues),
      wasInd: false,
      indeterminate: false
    }
  }

  callHelper(type, id, issuer, category) {
    if (this.pdpConfig.getAttributeFinder() !== null) {
      return this.pdpConfig.getAttributeFinder().findAttribute(type, id, issuer, category, this);
    } else {
      console.warn("Context tried to invoke AttributeFinder but was " +
        "not configured with one");
      const evaluationResult = new EvaluationResult;
      const bagAttribute = BagAttribute.createEmptyBag(type);
      evaluationResult.evaluationResultInit(bagAttribute)
      return evaluationResult;
    }
  }

  getMultipleEvaluationCtx() {
    const evaluationCtxSet = [];
    const multiRequests = this.requestCtx.getMultiRequests();

    if (multiRequests !== null) {

      const result = processMultiRequestElement(this);
      if (result.isIndeterminate()) {
        return result;
      } else {
        evaluationCtxSet.push(...result.getEvaluationCtxSet());
      }
    }

    if (evaluationCtxSet.length > 0) {
      const newSet = evaluationCtxSet;
      for (let evaluationCtx of newSet) {
        if (evaluationCtx.isMultipleAttributes()) {
          remove_array_element(evaluationCtxSet, evaluationCtx);
          const result = this._processMultipleAttributes(evaluationCtx);
          if (result.isIndeterminate()) {
            return result;
          } else {
            evaluationCtxSet.push(...result.getEvaluationCtxSet());
          }
        }
      }
    } else {
      if (this.multipleAttributes) {
        const result = this._processMultipleAttributes(this);
        if (result.isIndeterminate()) {
          return result;
        } else {
          evaluationCtxSet.push(...result.getEvaluationCtxSet());
        }
      }
    }

    if (evaluationCtxSet.length > 0) {
      const newSet = evaluationCtxSet;
      for (let evaluationCtx of newSet) {
        if (evaluationCtx.getResourceScope() !== XACMLConstants.SCOPE_IMMEDIATE) {
          evaluationCtxSet.remove(evaluationCtx);
          const result = processHierarchicalAttributes(evaluationCtx);
          if (result.isIndeterminate()) {
            return result;
          } else {
            evaluationCtxSet.push(...result.getEvaluationCtxSet());
          }
        } else if (evaluationCtx.getMultipleContentSelectors() !== null) {
          const result = processMultipleContentSelectors(evaluationCtx);
          if (result.isIndeterminate()) {
            return result;
          } else {
            evaluationCtxSet.addAll(result.getEvaluationCtxSet());
          }
        }
      }
    } else {
      if (this.resourceScope != XACMLConstants.SCOPE_IMMEDIATE) {
        const result = processHierarchicalAttributes(this);
        if (result.isIndeterminate()) {
          return result;
        } else {
          evaluationCtxSet.push(...result.getEvaluationCtxSet());
        }
      } else if (this.multipleContentSelectors !== null) {
        const result = processMultipleContentSelectors(this);
        if (result.isIndeterminate()) {
          return result;
        } else {
          evaluationCtxSet.push(...result.getEvaluationCtxSet());
        }
      }
    }
    if (evaluationCtxSet.length > 0) {
      return new MultipleCtxResult(evaluationCtxSet);
    } else {
      evaluationCtxSet.push(this);
      return new MultipleCtxResult(evaluationCtxSet);
    }
  }

  _processMultipleAttributes(evaluationCtx) {
    const children = [];

    const mapAttributes = Object.entries(evaluationCtx.getMapAttributes());
    let tempRequestAttributes = [evaluationCtx.getAttributesSet()];

    for (let [mapAttributesKey, mapAttributesValue] of mapAttributes) {
      if (mapAttributesValue.length > 1) {
        const temp = [];
        for (let attributesElement of mapAttributesValue) {
          for (let tempRequestAttribute of tempRequestAttributes) {
            const newSet = tempRequestAttribute;
            remove_array_elements(newSet, mapAttributesValue);
            newSet.push(attributesElement);
            temp.push(newSet);
          }
        }
        tempRequestAttributes = temp;
      }
    }

    for (let ctx of tempRequestAttributes) {
      const requestCtx = new RequestCtx();
      requestCtx.initWithAttributesSet(ctx, null);
      children.push(new XACML3EvaluationCtx(requestCtx, this.pdpConfig));
    }

    return new MultipleCtxResult(children);
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
const processMultiRequestElement = function (evaluationCtx) {
  const children = [];
  multiRequests = requestCtx.getMultiRequests();
  if (multiRequests == null) {
    return new MultipleCtxResult(children);
  }
  const requestReferences = multiRequests.getRequestReferences();
  for (let reference of requestReferences) {
    const attributesReferences = reference.getReferences();
    if (attributesReferences != null && attributesReferences.size() > 0) {
      const attributes = [];
      for (let attributesReference of attributesReferences) {
        const referenceId = attributesReference.getId();
        if (referenceId !== null) {
          let newAttributes = null;
          for (let attribute of evaluationCtx.getAttributesSet()) {

            if (attribute.getId() != null && attribute.getId() === referenceId) {
              newAttributes = attribute;
            }
          }
          if (newAttributes != null) {
            attributes.push(newAttributes);
          } else {
            // This must be only for one result. But here it is used to create error for
            const code = [];
            code.push(Status.prototype.STATUS_SYNTAX_ERROR);

            const status = new Status();
            status.statusInit2(code,
              "Invalid reference to attributes")
            return status;
          }
        }
      }
      const ctx = new RequestCtx();
      ctx.initWithAttributesSet(attributes, null)
      children.add(new XACML3EvaluationCtx(ctx, pdpConfig));
    }
  }
};

const remove_array_element = (array, n) => {
  const index = array.indexOf(n);
  if (index > -1) {
    array.splice(index, 1);
  }
};

const remove_array_elements = (array, elements) => {
  const elementsLength = elements.length;
  for (let i = 0; i < elementsLength; i++) {
    const index = array.indexOf(elements[i]);
    array.splice(index, 1);
  }

}

module.exports = XACML3EvaluationCtx;
