/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

function AttributeSelector() { };

AttributeSelector.prototype.attributeSelectorInit = function (type, contextPath, mustBePresent, xpathVersion) {
	this.attributeSelectorInit2(type, contextPath, null, mustBePresent, xpathVersion);
};

AttributeSelector.prototype.attributeSelectorInit2 = function (type, contextPath, policyRoot, mustBePresent, xpathVersion) {
	this.type = type;
	this.contextPath = contextPath;
	this.mustBePresent = mustBePresent;
	this.xpathVersion = xpathVersion;
	this.policyRoot = policyRoot;

};

AttributeSelector.prototype.getInstance = function (root, metaData) {
	let type;
	let contextPath;
	let mustBePresent = false;

	const xpathVersion = metaData.getXPathIdentifier();
	if (xpathVersion == null) {
		throw new Error(`An XPathVersion is required for any policies that use selectors`);
	}

	type = root.attr("DataType").value();
	contextPath = root.attr("RequestContextPath").value();
	let node = root.attr("MustBePresent");

	if (node !== null) {
		if (node.value() == "true") {
			mustBePresent = true;
		}
	}
	var policyRoot = null;
	node = root.parent();

	while ((node != null) && (node.type() == "element")) {
		policyRoot = node;
		node = root.parent();
	}
	return new AttributeSelector.attributeSelectorInit2(type, contextPath, policyRoot,
		mustBePresent, xpathVersion);
};

AttributeSelector.prototype.returnsBag = () => true;

module.exports = AttributeSelector;

