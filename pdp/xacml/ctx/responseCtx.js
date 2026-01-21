/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const XACMLConstants = require("../XACMLConstants");

function ResponseCtx() {
  this.results = [];
};

ResponseCtx.prototype.responseCtxInit = function (result) {
  this.version = result.getVersion();
  this.results.push(result);
};

ResponseCtx.prototype.initWithResults = function (results, version) {
  this.version = version;
  this.results = results;
};

ResponseCtx.prototype.getResults = function () {
  return this.results;
  //return results;
};

ResponseCtx.prototype.encode = function () {
  let builder = [];

  builder.push("<Response");
  if (this.version == XACMLConstants.XACML_VERSION_3_0) {
    builder.push(" xmlns=\"urn:oasis:names:tc:xacml:3.0:core:schema:wd-17\"");
  }
  builder.push(">");

  this.results.forEach(result => {
    result.encode(builder);
  })
  builder.push("</Response>");
  this.results = [];
  return builder.join("");
};
// ResponseCtx.prototype.getResult = function(){
//     return results;
// };

module.exports = ResponseCtx;
