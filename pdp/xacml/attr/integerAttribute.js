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

const identifier = "http://www.w3.org/2001/XMLSchema#integer";

function IntegerAttribute() { };
util.inherits(IntegerAttribute, AttributeValue);

IntegerAttribute.prototype.init = function (value) {
	this.attributeValueInit(identifier);
	this.value = value;
};

IntegerAttribute.prototype.getInstance = function (root) {
	const xmlStringRoot = new XMLSerializer().serializeToString(root);
	const doc = new DOMParser().parseFromString(xmlStringRoot, 'text/xml');
	return this.getInstance2(doc.documentElement.childNodes[0].textContent);
};

IntegerAttribute.prototype.getInstance2 = function (value) {
	if ((value.length >= 1) && (value.charAt(0) == '+')) {
		value = value.substring(1);
	}
	const integerAttribute = new IntegerAttribute;
	integerAttribute.init(parseInt(value));

	return integerAttribute;
};

IntegerAttribute.prototype.identifier = identifier;

IntegerAttribute.prototype.getValue = function () {
	return this.value;
}

module.exports = IntegerAttribute;
