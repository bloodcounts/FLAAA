/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var util = require("util");
var FunctionBase = require('./functionBase');
var IntegerAttribute = require("../attr/integerAttribute");
var DoubleAttribute = require("../attr/doubleAttribute");
var FUNCTION_NS = "urn:oasis:names:tc:xacml:1.0:function:";
var NAME_INTEGER_ABS = FUNCTION_NS + "integer-abs";
var NAME_DOUBLE_ABS = FUNCTION_NS + "double-abs";
var ID_INTEGER_ABS = 0;
var ID_DOUBLE_ABS = 1;

function AbsFunction() { };

util.inherits(AbsFunction, FunctionBase);
AbsFunction.prototype.absFunctionInit = function (functionName) {
	this.superConstructor(functionName, getId(functionName), getArgumentType(functionName), false, 1, getArgumentType(functionName), false);
};

AbsFunction.prototype.getSupportedIdentifiers = () => [NAME_INTEGER_ABS, NAME_DOUBLE_ABS];

const getId = function (functionName) {
	if (functionName === NAME_INTEGER_ABS) {
		return ID_INTEGER_ABS;
	} else if (functionName === NAME_DOUBLE_ABS) {
		return ID_DOUBLE_ABS;
	} else {
		console.log("unknown abs function " + functionName);
	}
};

const getArgumentType = function (functionName) {
	if (functionName === NAME_INTEGER_ABS) {
		return IntegerAttribute.prototype.identifier;
	} else {
		return DoubleAttribute.prototype.identifier;
	}
};


module.exports = AbsFunction;
