/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var BooleanAttribute = require("../attr/booleanAttribute");
var FUNCTION_NS = "urn:oasis:names:tc:xacml:1.0:function:";
var NAME_ANY_OF = FUNCTION_NS + "any-of";
var NAME_ALL_OF = FUNCTION_NS + "all-of";
var NAME_ANY_OF_ANY = FUNCTION_NS + "any-of-any";
var NAME_ALL_OF_ANY = FUNCTION_NS + "all-of-any";
var NAME_ANY_OF_ALL = FUNCTION_NS + "any-of-all";
var NAME_ALL_OF_ALL = FUNCTION_NS + "all-of-all";

var ID_ANY_OF = 0;
var ID_ALL_OF = 1;
var ID_ANY_OF_ANY = 2;
var ID_ALL_OF_ANY = 3;
var ID_ANY_OF_ALL = 4;
var ID_ALL_OF_ALL = 5;
var idMap = [];

(function () {
	idMap[NAME_ANY_OF] = ID_ANY_OF;
	idMap[NAME_ALL_OF] = ID_ALL_OF;
	idMap[NAME_ANY_OF_ANY] = ID_ANY_OF_ANY;
	idMap[NAME_ALL_OF_ANY] = ID_ALL_OF_ANY;
	idMap[NAME_ANY_OF_ALL] = ID_ANY_OF_ALL;
	idMap[NAME_ALL_OF_ALL] = ID_ALL_OF_ALL;
})();

function HigherOrderFunction() { };


HigherOrderFunction.prototype.higherOrderFunctionInit = function (functionName) {
	var i = idMap[functionName];
	if(i === undefined) {
		console.warn("unknown function: " + functionName);
	}
	this.functionId = i;
	this.identifier = functionName;
	if (this.functionId !== ID_ANY_OF && this.functionId !== ID_ALL_OF) {
		this.secondIsBag = true;
	} else {
		this.secondIsBag = false;
	}
};

HigherOrderFunction.prototype.getSupportedIdentifiers = function () {
	return Object.keys(idMap);
};

HigherOrderFunction.prototype.getIdentifier = function () {
	return this.identifier;
};
HigherOrderFunction.prototype.returnsBag = function () {
	return false;
};

module.exports = HigherOrderFunction;
