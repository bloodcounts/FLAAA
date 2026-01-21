/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/

"use strict";
const { DOMParser, XMLSerializer } = require("@xmldom/xmldom");
const XACMLConstants = require("../XACMLConstants");
const RequestCtxXACML3 = require("./xacml3/requestCtx");
const RequestCtxXACML2 = require("./requestCtx");
const InputParser = require("./inputParser");

let factoryInstance = null;

function RequestCtxFactory() { }

RequestCtxFactory.prototype.getRequestCtxWithRoot = function (root) {
  // Get the namespace URI from the root element
  const requestCtxNs = root.namespaceURI;

  if (requestCtxNs != null) {
    if (XACMLConstants.REQUEST_CONTEXT_3_0_IDENTIFIER === requestCtxNs.trim()) {
      return RequestCtxXACML3.prototype.getInstance(root);
    } else if (
      XACMLConstants.REQUEST_CONTEXT_1_0_IDENTIFIER === requestCtxNs.trim() ||
      XACMLConstants.REQUEST_CONTEXT_2_0_IDENTIFIER === requestCtxNs.trim()
    ) {
      return RequestCtxXACML2.prototype.getInstance1(root);
    } else {
      throw new Error("Invalid namespace in XACML request");
    }
  } else {
    console.warn(
      "No Namespace defined in XACML request and Assume as XACML 3.0"
    );
    return RequestCtxXACML3.prototype.getInstance(root);
  }
};

RequestCtxFactory.prototype.getRequestCtxWithRequest = function (request) {
  const root = getXacmlRequest(request);
  const requestCtxNs = root.namespaceURI;
  const serializedString = new XMLSerializer().serializeToString(root);

  if (requestCtxNs != null) {
    if (XACMLConstants.REQUEST_CONTEXT_3_0_IDENTIFIER === requestCtxNs.trim()) {
      return RequestCtxXACML3.prototype.getInstance(serializedString);
    } else if (
      XACMLConstants.REQUEST_CONTEXT_1_0_IDENTIFIER === requestCtxNs.trim() ||
      XACMLConstants.REQUEST_CONTEXT_2_0_IDENTIFIER === requestCtxNs.trim()
    ) {
      return RequestCtxXACML2.prototype.getInstance1(serializedString);
    } else {
      throw new Error("Invalid namespace in XACML request");
    }
  } else {
    console.warn(
      "No Namespace defined in XACML request and Assume as XACML 3.0"
    );
    return RequestCtxXACML3.prototype.getInstance(serializedString);
  }
};

RequestCtxFactory.prototype.getFactory = function () {
  if (factoryInstance == null) {
    factoryInstance = new RequestCtxFactory();
  }
  return factoryInstance;
};

const getXacmlRequest = (request) => {
  return InputParser.prototype.parseInput(request, "Request");
};

module.exports = RequestCtxFactory;
