/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
var util = require("util");
var moment = require('moment');
var FunctionBase = require('./functionBase');
const EvaluationResult = require("./evaluationResult");
const AttributeValue = require("../attr/attributeValue");
var BooleanAttribute = require("../attr/booleanAttribute");
var StringAttribute = require("../attr/stringAttribute");
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

var FUNCTION_NS = "urn:oasis:names:tc:xacml:1.0:function:";
var NAME_INTEGER_GREATER_THAN = FUNCTION_NS + "integer-greater-than";
var NAME_INTEGER_GREATER_THAN_OR_EQUAL = FUNCTION_NS + "integer-greater-than-or-equal";
var NAME_INTEGER_LESS_THAN = FUNCTION_NS + "integer-less-than";
var NAME_INTEGER_LESS_THAN_OR_EQUAL = FUNCTION_NS + "integer-less-than-or-equal";
var NAME_DOUBLE_GREATER_THAN = FUNCTION_NS + "double-greater-than";
var NAME_DOUBLE_GREATER_THAN_OR_EQUAL = FUNCTION_NS + "double-greater-than-or-equal";
var NAME_DOUBLE_LESS_THAN = FUNCTION_NS + "double-less-than";
var NAME_DOUBLE_LESS_THAN_OR_EQUAL = FUNCTION_NS + "double-less-than-or-equal";
var NAME_STRING_GREATER_THAN = FUNCTION_NS + "string-greater-than";
var NAME_STRING_GREATER_THAN_OR_EQUAL = FUNCTION_NS + "string-greater-than-or-equal";
var NAME_STRING_LESS_THAN = FUNCTION_NS + "string-less-than";
var NAME_STRING_LESS_THAN_OR_EQUAL = FUNCTION_NS + "string-less-than-or-equal";
var NAME_TIME_GREATER_THAN = FUNCTION_NS + "time-greater-than";
var NAME_TIME_GREATER_THAN_OR_EQUAL = FUNCTION_NS + "time-greater-than-or-equal";
var NAME_TIME_LESS_THAN = FUNCTION_NS + "time-less-than";
var NAME_TIME_LESS_THAN_OR_EQUAL = FUNCTION_NS + "time-less-than-or-equal";
var NAME_DATETIME_GREATER_THAN = FUNCTION_NS + "dateTime-greater-than";
var NAME_DATETIME_GREATER_THAN_OR_EQUAL = FUNCTION_NS + "dateTime-greater-than-or-equal";
var NAME_DATETIME_LESS_THAN = FUNCTION_NS + "dateTime-less-than";
var NAME_DATETIME_LESS_THAN_OR_EQUAL = FUNCTION_NS + "dateTime-less-than-or-equal";
var NAME_DATE_GREATER_THAN = FUNCTION_NS + "date-greater-than";
var NAME_DATE_GREATER_THAN = FUNCTION_NS + "date-greater-than";
var NAME_DATE_GREATER_THAN_OR_EQUAL = FUNCTION_NS + "date-greater-than-or-equal";
var NAME_DATE_LESS_THAN = FUNCTION_NS + "date-less-than";
var NAME_DATE_LESS_THAN_OR_EQUAL = FUNCTION_NS + "date-less-than-or-equal";

var ID_INTEGER_GREATER_THAN = 0;
var ID_INTEGER_GREATER_THAN_OR_EQUAL = 1;
var ID_INTEGER_LESS_THAN = 2;
var ID_INTEGER_LESS_THAN_OR_EQUAL = 3;
var ID_DOUBLE_GREATER_THAN = 4;
var ID_DOUBLE_GREATER_THAN_OR_EQUAL = 5;
var ID_DOUBLE_LESS_THAN = 6;
var ID_DOUBLE_LESS_THAN_OR_EQUAL = 7;
var ID_STRING_GREATER_THAN = 8;
var ID_STRING_GREATER_THAN_OR_EQUAL = 9;
var ID_STRING_LESS_THAN = 10;
var ID_STRING_LESS_THAN_OR_EQUAL = 11;
var ID_TIME_GREATER_THAN = 12;
var ID_TIME_GREATER_THAN_OR_EQUAL = 13;
var ID_TIME_LESS_THAN = 14;
var ID_TIME_LESS_THAN_OR_EQUAL = 15;
var ID_DATE_GREATER_THAN = 16;
var ID_DATE_GREATER_THAN_OR_EQUAL = 17;
var ID_DATE_LESS_THAN = 18;
var ID_DATE_LESS_THAN_OR_EQUAL = 19;
var ID_DATETIME_GREATER_THAN = 20;
var ID_DATETIME_GREATER_THAN_OR_EQUAL = 21;
var ID_DATETIME_LESS_THAN = 22;
var ID_DATETIME_LESS_THAN_OR_EQUAL = 23;

var idMap = {};
var typeMap = {};

idMap[NAME_INTEGER_GREATER_THAN] = ID_INTEGER_GREATER_THAN;
idMap[NAME_INTEGER_GREATER_THAN_OR_EQUAL] = ID_INTEGER_GREATER_THAN_OR_EQUAL;
idMap[NAME_INTEGER_LESS_THAN] = ID_INTEGER_LESS_THAN;
idMap[NAME_INTEGER_LESS_THAN_OR_EQUAL] = ID_INTEGER_LESS_THAN_OR_EQUAL;
idMap[NAME_DOUBLE_GREATER_THAN] = ID_DOUBLE_GREATER_THAN;
idMap[NAME_DOUBLE_GREATER_THAN_OR_EQUAL] = ID_DOUBLE_GREATER_THAN_OR_EQUAL;
idMap[NAME_DOUBLE_LESS_THAN] = ID_DOUBLE_LESS_THAN;
idMap[NAME_DOUBLE_LESS_THAN_OR_EQUAL] = ID_DOUBLE_LESS_THAN_OR_EQUAL;
idMap[NAME_STRING_GREATER_THAN] = ID_STRING_GREATER_THAN;
idMap[NAME_STRING_GREATER_THAN_OR_EQUAL] = ID_STRING_GREATER_THAN_OR_EQUAL;
idMap[NAME_STRING_LESS_THAN] = ID_STRING_LESS_THAN;
idMap[NAME_STRING_LESS_THAN_OR_EQUAL] = ID_STRING_LESS_THAN_OR_EQUAL;
idMap[NAME_TIME_GREATER_THAN] = ID_TIME_GREATER_THAN;
idMap[NAME_TIME_GREATER_THAN_OR_EQUAL] = ID_TIME_GREATER_THAN_OR_EQUAL;
idMap[NAME_TIME_LESS_THAN] = ID_TIME_LESS_THAN;
idMap[NAME_TIME_LESS_THAN_OR_EQUAL] = ID_TIME_LESS_THAN_OR_EQUAL;
idMap[NAME_DATE_GREATER_THAN] = ID_DATE_GREATER_THAN;
idMap[NAME_DATE_GREATER_THAN_OR_EQUAL] = ID_DATE_GREATER_THAN_OR_EQUAL;
idMap[NAME_DATE_LESS_THAN] = ID_DATE_LESS_THAN;
idMap[NAME_DATE_LESS_THAN_OR_EQUAL] = ID_DATE_LESS_THAN_OR_EQUAL;
idMap[NAME_DATETIME_GREATER_THAN] = ID_DATETIME_GREATER_THAN;
idMap[NAME_DATETIME_GREATER_THAN_OR_EQUAL] = ID_DATETIME_GREATER_THAN_OR_EQUAL;
idMap[NAME_DATETIME_LESS_THAN] = ID_DATETIME_LESS_THAN;
idMap[NAME_DATETIME_LESS_THAN_OR_EQUAL] = ID_DATETIME_LESS_THAN_OR_EQUAL;

typeMap[NAME_INTEGER_GREATER_THAN] = IntegerAttribute.prototype.identifier;
typeMap[NAME_INTEGER_GREATER_THAN_OR_EQUAL] = IntegerAttribute.prototype.identifier;
typeMap[NAME_INTEGER_LESS_THAN] = IntegerAttribute.prototype.identifier;
typeMap[NAME_INTEGER_LESS_THAN_OR_EQUAL] = IntegerAttribute.prototype.identifier;
typeMap[NAME_DOUBLE_GREATER_THAN] = DoubleAttribute.prototype.identifier;
typeMap[NAME_DOUBLE_GREATER_THAN_OR_EQUAL] = DoubleAttribute.prototype.identifier;
typeMap[NAME_DOUBLE_LESS_THAN] = DoubleAttribute.prototype.identifier;
typeMap[NAME_DOUBLE_LESS_THAN_OR_EQUAL] = DoubleAttribute.prototype.identifier;
typeMap[NAME_STRING_GREATER_THAN] = StringAttribute.prototype.identifier;
typeMap[NAME_STRING_GREATER_THAN_OR_EQUAL] = StringAttribute.prototype.identifier;
typeMap[NAME_STRING_LESS_THAN] = StringAttribute.prototype.identifier;
typeMap[NAME_STRING_LESS_THAN_OR_EQUAL] = StringAttribute.prototype.identifier;
typeMap[NAME_TIME_GREATER_THAN] = TimeAttribute.prototype.identifier;
typeMap[NAME_TIME_GREATER_THAN_OR_EQUAL] = TimeAttribute.prototype.identifier;
typeMap[NAME_TIME_LESS_THAN] = TimeAttribute.prototype.identifier;
typeMap[NAME_TIME_LESS_THAN_OR_EQUAL] = TimeAttribute.prototype.identifier;
typeMap[NAME_DATETIME_GREATER_THAN] = DateTimeAttribute.prototype.identifier;
typeMap[NAME_DATETIME_GREATER_THAN_OR_EQUAL] = DateTimeAttribute.prototype.identifier;
typeMap[NAME_DATETIME_LESS_THAN] = DateTimeAttribute.prototype.identifier;
typeMap[NAME_DATETIME_LESS_THAN_OR_EQUAL] = DateTimeAttribute.prototype.identifier;
typeMap[NAME_DATE_GREATER_THAN] = DateAttribute.prototype.identifier;
typeMap[NAME_DATE_GREATER_THAN_OR_EQUAL] = DateAttribute.prototype.identifier;
typeMap[NAME_DATE_LESS_THAN] = DateAttribute.prototype.identifier;
typeMap[NAME_DATE_LESS_THAN_OR_EQUAL] = DateAttribute.prototype.identifier;

function ComparisonFunction() { };

util.inherits(ComparisonFunction, FunctionBase);
ComparisonFunction.prototype.comparisonFunctionInit = function (functionName) {
	this.superConstructor(functionName, getId(functionName), getArgumentType(functionName), false, 2, BooleanAttribute.prototype.identifier, false);
};

var getId = function (functionName) {
	var i = idMap[functionName];
	if (i === undefined) {
		console.error("unknown comparison function " + functionName);
	}
	return i;
};

var getArgumentType = function (functionName) {
	return typeMap[functionName];
}

const dateCompare = function (d1, n1, d2, n2) {
	let result;

	if (moment(d1).isBefore(d2)) result = -1
	if (moment(d1).isAfter(d2)) result = 1
	if (!moment(d1).isSame(d2)) return result

	if (n1 === n2) {
		return 0
	}

	return ((n1 > n2) ? 1 : -1);
}

ComparisonFunction.prototype.getSupportedIdentifiers = function () {
	return Object.keys(typeMap);
};

ComparisonFunction.prototype.evaluate = function (inputs, context) {
	const argValues = [];

	// Evaluate argument expressions into BagAttributes
	const evalErr = this.evalArgs(inputs, context, argValues);
	if (evalErr) return evalErr;

	// extract single values from the bags or direct attribute values
	const a0 = argValues[0];
	const a1 = argValues[1];
	const v0 = (a0 && typeof a0.size === 'function') ? a0.getBag() : a0;
	const v1 = (a1 && typeof a1.size === 'function') ? a1.getBag() : a1;

	let boolResult = false;

	switch (this.getFunctionId()) {

		case ID_INTEGER_GREATER_THAN: {
			let arg0 = ((IntegerAttribute)(argValues[0])).getValue();
			let arg1 = ((IntegerAttribute)(argValues[1])).getValue();

			boolResult = (arg0 > arg1);

			break;
		}

		case ID_INTEGER_GREATER_THAN_OR_EQUAL: {
			let arg0 = argValues[0].getValue();
			let arg1 = argValues[1].getValue();

			boolResult = (arg0 >= arg1);

			break;
		}

		case ID_INTEGER_LESS_THAN: {
			let arg0 = argValues[0].getValue();
			let arg1 = argValues[1].getValue();

			boolResult = (arg0 < arg1);

			break;
		}

		case ID_INTEGER_LESS_THAN_OR_EQUAL: {
			let arg0 = argValues[0].getValue();
			let arg1 = argValues[1].getValue();

			boolResult = (arg0 <= arg1);

			break;
		}

		case ID_DOUBLE_GREATER_THAN: {
			let arg0 = argValues[0].getValue();
			let arg1 = argValues[1].getValue();

			boolResult = (arg0 > arg1);

			break;
		}

		case ID_DOUBLE_GREATER_THAN_OR_EQUAL: {
			let arg0 = argValues[0].getValue();
			let arg1 = argValues[1].getValue();

			boolResult = (arg0 - arg1 >= 0);

			break;
		}

		case ID_DOUBLE_LESS_THAN: {
			let arg0 = argValues[0].getValue();
			let arg1 = argValues[1].getValue();

			boolResult = arg0 - arg1 < 0

			break;
		}

		case ID_DOUBLE_LESS_THAN_OR_EQUAL: {
			let arg0 = ((DoubleAttribute)(argValues[0])).getValue();
			let arg1 = ((DoubleAttribute)(argValues[1])).getValue();

			boolResult = (doubleCompare(arg0, arg1) <= 0);

			break;
		}

		case ID_STRING_GREATER_THAN: {
			let arg0 = ((StringAttribute)(argValues[0])).getValue();
			let arg1 = ((StringAttribute)(argValues[1])).getValue();

			boolResult = (arg0.compareTo(arg1) > 0);

			break;
		}

		case ID_STRING_GREATER_THAN_OR_EQUAL: {
			let arg0 = ((StringAttribute)(argValues[0])).getValue();
			let arg1 = ((StringAttribute)(argValues[1])).getValue();

			boolResult = (arg0.compareTo(arg1) >= 0);

			break;
		}

		case ID_STRING_LESS_THAN: {
			let arg0 = ((StringAttribute)(argValues[0])).getValue();
			let arg1 = ((StringAttribute)(argValues[1])).getValue();

			boolResult = (arg0.compareTo(arg1) < 0);

			break;
		}

		case ID_STRING_LESS_THAN_OR_EQUAL: {
			let arg0 = ((StringAttribute)(argValues[0])).getValue();
			let arg1 = ((StringAttribute)(argValues[1])).getValue();

			boolResult = (arg0.compareTo(arg1) <= 0);

			break;
		}

		case ID_TIME_GREATER_THAN: {
			let arg0 = (TimeAttribute)(argValues[0]);
			let arg1 = (TimeAttribute)(argValues[1]);

			boolResult = (dateCompare(arg0.getValue(), arg0.getNanoseconds(), arg1.getValue(),
				arg1.getNanoseconds()) > 0);

			break;
		}

		case ID_TIME_GREATER_THAN_OR_EQUAL: {
			let arg0 = argValues[0];
			let arg1 = argValues[1];

			boolResult = (dateCompare(new Date(arg0.timeGMT), arg0.nanoseconds, new Date(arg1.timeGMT),
				arg1.nanoseconds) >= 0);

			break;
		}

		case ID_TIME_LESS_THAN: {
			let arg0 = (TimeAttribute)(argValues[0]);
			let arg1 = (TimeAttribute)(argValues[1]);

			boolResult = (dateCompare(arg0.getValue(), arg0.getNanoseconds(), arg1.getValue(),
				arg1.getNanoseconds()) < 0);

			break;
		}

		case ID_TIME_LESS_THAN_OR_EQUAL: {
			let arg0 = argValues[0];
			let arg1 = argValues[1];

			boolResult = (dateCompare(new Date(arg0.timeGMT), arg0.nanoseconds, new Date(arg1.timeGMT),
				arg1.nanoseconds) <= 0);

			break;
		}

		case ID_DATETIME_GREATER_THAN: {
			if (!v0 || !v1) return this.makeProcessingError('Missing datetime values');
			console.log('ComparisonFunction DATETIME args:', { v0, v1 });
			boolResult = (dateCompare(v0.value || v0.getValue(), v0.nanoseconds || v0.nanoseconds, v1.value || v1.getValue(), v1.nanoseconds || v1.nanoseconds) > 0);

			break;
		}

		case ID_DATETIME_GREATER_THAN_OR_EQUAL: {
			if (!v0 || !v1) return this.makeProcessingError('Missing datetime values');
			boolResult = (dateCompare(v0.value || v0.getValue(), v0.nanoseconds || v0.nanoseconds, v1.value || v1.getValue(), v1.nanoseconds || v1.nanoseconds) >= 0);

			break;
		}

		case ID_DATETIME_LESS_THAN: {
			if (!v0 || !v1) return this.makeProcessingError('Missing datetime values');
			boolResult = (dateCompare(v0.value || v0.getValue(), v0.nanoseconds || v0.nanoseconds, v1.value || v1.getValue(), v1.nanoseconds || v1.nanoseconds) < 0);

			break;
		}

		case ID_DATETIME_LESS_THAN_OR_EQUAL: {
			if (!v0 || !v1) return this.makeProcessingError('Missing datetime values');
			boolResult = (dateCompare(v0.value || v0.getValue(), v0.nanoseconds || v0.nanoseconds, v1.value || v1.getValue(), v1.nanoseconds || v1.nanoseconds) <= 0);

			break;
		}

		case ID_DATE_GREATER_THAN: {
			let arg0 = ((DateAttribute)(argValues[0])).getValue();
			let arg1 = ((DateAttribute)(argValues[1])).getValue();

			boolResult = (arg0.compareTo(arg1) > 0);

			break;
		}

		case ID_DATE_GREATER_THAN_OR_EQUAL: {
			let arg0 = ((DateAttribute)(argValues[0])).getValue();
			let arg1 = ((DateAttribute)(argValues[1])).getValue();

			boolResult = (arg0.compareTo(arg1) >= 0);

			break;
		}

		case ID_DATE_LESS_THAN: {
			let arg0 = ((DateAttribute)(argValues[0])).getValue();
			let arg1 = ((DateAttribute)(argValues[1])).getValue();

			boolResult = (arg0.compareTo(arg1) < 0);

			break;
		}

		case ID_DATE_LESS_THAN_OR_EQUAL: {
			let arg0 = argValues[0].getValue();
			let arg1 = argValues[1].getValue();

			boolResult = (arg0.compareTo(arg1) <= 0);

			break;
		}
	}
	return EvaluationResult.prototype.getInstance(boolResult);
};

module.exports = ComparisonFunction;
