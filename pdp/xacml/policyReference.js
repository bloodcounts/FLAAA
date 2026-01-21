/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/

const util = require("util");
const AbstractPolicy = require("./abstractPolicy");
const VersionConstraints = require("./versionConstraints");
const POLICY_REFERENCE = 0;
const POLICYSET_REFERENCE = 1;

function PolicyReference() { };
util.inherits(PolicyReference, AbstractPolicy);

PolicyReference.prototype.init = function (reference, policyType, finder,
  parentMetaData) {
  this.initWithConstraints(reference, policyType, new VersionConstraints(null, null, null), finder,
    parentMetaData);
};

PolicyReference.prototype.initWithConstraints = function (reference, policyType, constraints,
  finder, parentMetaData) {
  if ((policyType != POLICY_REFERENCE) && (policyType != POLICYSET_REFERENCE))
    throw new Error("Input policyType is not a" + "valid value");

  this.reference = reference;
  this.policyType = policyType;
  this.constraints = constraints;
  this.finder = finder;
  this.parentMetaData = parentMetaData;
};

PolicyReference.prototype.getInstance = function (root, finder,
  metaData) {
  let reference;
  let policyType;

  const name = root.name();
  if (name === "PolicyIdReference") {
    policyType = POLICY_REFERENCE;
  } else if (name === "PolicySetIdReference") {
    policyType = POLICYSET_REFERENCE;
  } else {
    throw new Error("Unknown reference type: " + name);
  }

  reference = root.childNodes()[0].text();
  let versionConstraint = null;
  versionNode = root.attr("Version");
  if (versionNode != null)
    versionConstraint = versionNode.value();

  let earlyConstraint = null;
  const earlyNode = root.attr("EarliestVersion");
  if (earlyNode != null)
    earlyConstraint = earlyNode.value();

  let lateConstraint = null;
  const lateNode = root.attr("LatestVersion");
  if (lateNode != null)
    lateConstraint = lateNode.value();

  const constraints = new VersionConstraints(versionConstraint, earlyConstraint,
    lateConstraint);

  const policyReference = new PolicyReference();
  policyReference.initWithConstraints(reference, policyType, constraints, finder, metaData)
  return policyReference;
};

PolicyReference.prototype.getReference = function () {
  return this.reference;
};

PolicyReference.prototype.getConstraints = function () {
  return this.constraints;
};

PolicyReference.prototype.getReferenceType = function () {
  return this.policyType;
};

PolicyReference.prototype.getId = function () {
  return this.resolvePolicy().getId();
};

PolicyReference.prototype.getVersion = function () {
  return this.resolvePolicy().getVersion();
};

PolicyReference.prototype.getCombiningAlg = function () {
  return this.resolvePolicy().getCombiningAlg();
};

PolicyReference.prototype.POLICY_REFERENCE = POLICY_REFERENCE;
PolicyReference.prototype.POLICYSET_REFERENCE = POLICYSET_REFERENCE;

PolicyReference.prototype.resolvePolicy = function () {
  if (finder == null) {

    console.warn("PolicyReference with id " + this.reference
      + " was queried but was " + "not configured with a PolicyFinder");


    throw new Error("couldn't find the policy with " + "a null finder");
  }

  const pfr = finder.findPolicy(reference, policyType, constraints,
    parentMetaData);

  if (pfr.notApplicable())
    throw new Error("couldn't resolve the policy");

  if (pfr.indeterminate())
    throw new Error("error resolving the policy");

  return pfr.getPolicy();
}

module.exports = PolicyReference;
