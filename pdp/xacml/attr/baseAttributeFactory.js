const { DOMParser } = require('@xmldom/xmldom');

/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";


var attributeMap = {};

function BaseAttributeFactory() { };

BaseAttributeFactory.prototype.baseAttributeFactoryInit = function (attributes) {
	var it = Object.keys(attributes);
	const attLength = it.length;
	for (let i = 0; i < attLength; i++) {
		var id = it[i];
		var proxy = attributes[id];
		attributeMap[id] = proxy;
	}
};

BaseAttributeFactory.prototype.createValue1 = function (root) {
	var node = root.getAttribute("DataType");
	return this.createValue3(root, node);
};

BaseAttributeFactory.prototype.createValue2 = function (root, dataType) {
	return this.createValue3(root, dataType);
};

BaseAttributeFactory.prototype.createValue3 = function (root, type) {
	var proxy = attributeMap[type];
	if (proxy != null) {
		const val = proxy.getInstance(root);
		if (val === null || typeof val === 'undefined') {
			throw new Error("Malformed attribute value for type: " + type);
		}
		return val;
	} else {
		console.log("Attributes of type " + type + " aren't supported.");
	}
};

BaseAttributeFactory.prototype.createValue4 = function (dataType, value, params) {
	let type = dataType;
	let proxy = attributeMap[type];
	if (proxy != null) {
		return proxy.prototype.getInstance(value, params);
	} else {
		console.log("Attributes of type " + type + " aren't supported.");
	}

};

module.exports = BaseAttributeFactory;
