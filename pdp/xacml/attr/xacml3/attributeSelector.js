/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const Status = require('../../ctx/status');
function AttributeSelector() { };


AttributeSelector.prototype.init = function (category, type, contextSelectorId, path,
  mustBePresent, xpathVersion) {
  this.category = category;
  this.type = type;
  this.contextSelectorId = contextSelectorId;
  this.mustBePresent = mustBePresent;
  this.xpathVersion = xpathVersion;
  this.path = path;

};

AttributeSelector.prototype.getInstance = function (root, metaData) {
  let contextSelectorId = null;
  let xpathVersion = metaData.getXPathIdentifier();

  if (xpathVersion == null) {
    throw new Error("An XPathVersion is required for "
      + "any policies that use selectors");
  }

  const category = root.attr("Category").value();
  const type = root.attr("DataType").value();
  const path = root.attr("Path").value();

  const stringValue = root.attr("MustBePresent").value();
  const mustBePresent = stringValue === "true" ? true : false;

  const node = root.attr("ContextSelectorId");
  if (node !== null) {
    contextSelectorId = node.value();
  }
  return (new AttributeSelector()).init(category, type, contextSelectorId, path, mustBePresent,
    xpathVersion);
};

AttributeSelector.prototype.evaluate = function (context) {
  const result = context.getAttribute(this.path, this.type, this.category,
    this.contextSelectorId, this.xpathVersion);

  if (!result.indeterminate()) {
    let bag = result.attributeValues;
    if (bag.isEmpty()) {
      if (this.mustBePresent) {
        let code = [Status.prototype.STATUS_MISSING_ATTRIBUTE];
        const message = "couldn't resolve XPath expression " + this.path
          + " for type " + this.type.toString();

        return new EvaluationResult((new Status()).statusInit2(code, message));
      } else {
        return result;
      }
    } else {
      return result;
    }
  } else {
    return result;
  }

}

AttributeSelector.prototype.returnsBag = () => true;

AttributeSelector.prototype.evaluatesToBag = () => true;

AttributeSelector.prototype.getChildren = () => null;

module.exports = AttributeSelector;

