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
var StringAttribute = require("../attr/stringAttribute");
var BooleanAttribute = require("../attr/booleanAttribute");
var IntegerAttribute = require("../attr/integerAttribute");
var DoubleAttribute = require("../attr/doubleAttribute");
var DateAttribute = require("../attr/dateAttribute");
var TimeAttribute = require("../attr/timeAttribute");
var DateTimeAttribute = require("../attr/dateTimeAttribute");
var DayTimeDurationAttribute = require("../attr/dayTimeDurationAttribute");
var YearMonthDurationAttribute = require("../attr/yearMonthDurationAttribute");
var AnyURIAttribute = require("../attr/anyURIAttribute");
var X500NameAttribute = require("../attr/x500NameAttribute");
var RFC822NameAttribute = require("../attr/rfc822NameAttribute");
var HexBinaryAttribute = require("../attr/hexBinaryAttribute");
var Base64BinaryAttribute = require("../attr/base64BinaryAttribute");

var baseTypes = [
	StringAttribute.prototype.identifier,
	BooleanAttribute.prototype.identifier,
	IntegerAttribute.prototype.identifier,
	DoubleAttribute.prototype.identifier,
	DateAttribute.prototype.identifier,
	DateTimeAttribute.prototype.identifier,
	TimeAttribute.prototype.identifier,
	AnyURIAttribute.prototype.identifier,
	HexBinaryAttribute.prototype.identifier,
	Base64BinaryAttribute.prototype.identifier,
	DayTimeDurationAttribute.prototype.identifier,
	YearMonthDurationAttribute.prototype.identifier,
	X500NameAttribute.prototype.identifier,
	RFC822NameAttribute.prototype.identifier
];

var simpleTypes = [
	"string",
	"boolean",
	"integer",
	"double",
	"date",
	"dateTime",
	"time",
	"anyURI",
	"hexBinary",
	"base64Binary",
	"dayTimeDuration",
	"yearMonthDuration",
	"x500Name",
	"rfc822Name"
]

var NAME_BASE_IS_IN = "-is-in";


var bagParams = [true, false];

function BagFunction() { };

util.inherits(BagFunction, FunctionBase);
BagFunction.prototype.bagFunctionInit1 = function (functionName, functionId, paramType, paramIsBag, numParams, returnType, returnsBag) {
	this.superConstructor(functionName, functionId, paramType, paramIsBag, numParams, returnType, returnsBag);
};
BagFunction.prototype.bagFunctionInit2 = function (functionName, functionId, paramTypes) {
	this.superConstructor(functionName, functionId, paramTypes, bagParams, BooleanAttribute.prototype.identifier, false);
};
BagFunction.prototype.getBaseTypes = baseTypes;
BagFunction.prototype.getSimpleTypes = simpleTypes;
BagFunction.prototype.NAME_BASE_IS_IN = NAME_BASE_IS_IN;

module.exports = BagFunction;



