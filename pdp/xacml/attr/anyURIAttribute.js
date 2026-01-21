/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const AttributeValue = require('./attributeValue');
const util = require("util");
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const identifier = "http://www.w3.org/2001/XMLSchema#anyURI";

function AnyURIAttribute() { };

util.inherits(AnyURIAttribute, AttributeValue);

AnyURIAttribute.prototype.anyURIAttributeInit = function (value) {
	this.attributeValueInit(identifier);
	this.value = value;
};

AnyURIAttribute.prototype.getInstance = function (value) {
	const anyURIAttribute = new AnyURIAttribute();
	anyURIAttribute.anyURIAttributeInit(value)
	return anyURIAttribute;
};

AnyURIAttribute.prototype.getInstance2 = function (root) {
	const serializedString = new XMLSerializer().serializeToString(root);
	const doc = new DOMParser().parseFromString(serializedString, 'text/xml');
	return this.getInstance(doc.childNodes[0].textContent);
};

AnyURIAttribute.prototype.encode = function () {
	return this.value.toString();
};

AnyURIAttribute.prototype.equals = function (obj) {
	if (obj.type !== identifier)
	return false;

	return this.value === obj.value;
}

AnyURIAttribute.prototype.identifier = identifier;

module.exports = AnyURIAttribute;
