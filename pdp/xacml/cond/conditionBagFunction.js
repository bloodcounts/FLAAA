/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var util = require("util");
var BagFunction = require('./bagFunction');
var argMap = {};
var baseTypes = BagFunction.prototype.getBaseTypes;
var simpleTypes = BagFunction.prototype.getSimpleTypes;
var FUNCTION_NS = "urn:oasis:names:tc:xacml:1.0:function:";

(function() {
	for (var i = 0; i < baseTypes.length; i++) {
		argMap[FUNCTION_NS + simpleTypes[i] + BagFunction.prototype.NAME_BASE_IS_IN] = baseTypes[i];
	}
})();

function ConditionBagFunction() { };

util.inherits(ConditionBagFunction, BagFunction);
ConditionBagFunction.prototype.conditionBagFunctionInit = function (functionName) {
	this.bagFunctionInit2(functionName, 0, getArguments(functionName));
};

ConditionBagFunction.prototype.getSupportedIdentifiers = function () {
	return Object.keys(argMap);
};

var getArguments = function (functionName) {
	var arg = argMap[functionName];
	if (arg === null) {
		console.log("unknown bag function: " + functionName);
	}
	return argMap[functionName];
};

module.exports = ConditionBagFunction;
