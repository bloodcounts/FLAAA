/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const AttributeFinder = require('./finder/attributeFinder');
const PolicyFinder = require('./finder/policyFinder');
const ResourceFinder = require('./finder/resourceFinder');

function Config(attributeFinder, policyFinder, resourceFinder, multipleRequestHandler) {
  if (attributeFinder !== null ) {
    this.attributeFinder = attributeFinder;
  } else {
    this.attributeFinder = new AttributeFinder();
  }
  if (policyFinder !== null) {
    this.policyFinder = policyFinder;

  } else {
    this.policyFinder = new PolicyFinder();
  }
  if (resourceFinder !== null) {
    this.resourceFinder = resourceFinder;
  } else {
    this.resourceFinder = new ResourceFinder();
  }
  this.multipleRequestHandler = multipleRequestHandler;
};

Config.prototype.getAttributeFinder = function () {
  return this.attributeFinder;
};

Config.prototype.getPolicyFinder = function () {
  return this.policyFinder;
};

Config.prototype.getResourceFinder = function () {
  return this.resourceFinder;
};
Config.prototype.isMultipleRequestHandle = function () {
  return this.multipleRequestHandler;
};

module.exports = Config;
