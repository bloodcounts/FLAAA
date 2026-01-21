/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const util = require("util");
const AttributeValue = require('../attr/attributeValue');
const FunctionBase = require('./functionBase');
const StringAttribute = require("../attr/stringAttribute");
const BooleanAttribute = require("../attr/booleanAttribute");
const IntegerAttribute = require("../attr/integerAttribute");
const DoubleAttribute = require("../attr/doubleAttribute");
const DateAttribute = require("../attr/dateAttribute");
const TimeAttribute = require("../attr/timeAttribute");
const DateTimeAttribute = require("../attr/dateTimeAttribute");
const DayTimeDurationAttribute = require("../attr/dayTimeDurationAttribute");
const YearMonthDurationAttribute = require("../attr/yearMonthDurationAttribute");
const AnyURIAttribute = require("../attr/anyURIAttribute");
const X500NameAttribute = require("../attr/x500NameAttribute");
const RFC822NameAttribute = require("../attr/rfc822NameAttribute");
const HexBinaryAttribute = require("../attr/hexBinaryAttribute");
const Base64BinaryAttribute = require("../attr/base64BinaryAttribute");
const XACMLConstants = require("../XACMLConstants");

const EvaluationResult = require('./evaluationResult');
const typeMap = {};
const FUNCTION_NS = "urn:oasis:names:tc:xacml:1.0:function:";
const NAME_STRING_EQUAL = `${FUNCTION_NS}string-equal`;
const NAME_BOOLEAN_EQUAL = `${FUNCTION_NS}boolean-equal`;
const NAME_INTEGER_EQUAL = `${FUNCTION_NS}integer-equal`;
const NAME_DOUBLE_EQUAL = `${FUNCTION_NS}double-equal`;
const NAME_DATE_EQUAL = `${FUNCTION_NS}date-equal`;
const NAME_TIME_EQUAL = `${FUNCTION_NS}time-equal`;
const NAME_DATETIME_EQUAL = `${FUNCTION_NS}dateTime-equal`;
const NAME_DAYTIME_DURATION_EQUAL = `${FUNCTION_NS}dayTimeDuration-equal`;
const NAME_YEARMONTH_DURATION_EQUAL = `${FUNCTION_NS}yearMonthDuration-equal`;
const NAME_ANYURI_EQUAL = `${FUNCTION_NS}anyURI-equal`;
const NAME_X500NAME_EQUAL = `${FUNCTION_NS}x500Name-equal`;
const NAME_RFC822NAME_EQUAL = `${FUNCTION_NS}rfc822Name-equal`;
const NAME_HEXBINARY_EQUAL = `${FUNCTION_NS}hexBinary-equal`;
const NAME_BASE64BINARY_EQUAL = `${FUNCTION_NS}base64Binary-equal`;
const ID_EQUAL_CASE_IGNORE = 1;

typeMap[NAME_STRING_EQUAL] = StringAttribute.prototype.identifier;
typeMap[NAME_BOOLEAN_EQUAL] = BooleanAttribute.prototype.identifier;
typeMap[NAME_INTEGER_EQUAL] = IntegerAttribute.prototype.identifier;
typeMap[NAME_DOUBLE_EQUAL] = DoubleAttribute.prototype.identifier;
typeMap[NAME_DATE_EQUAL] = DateAttribute.prototype.identifier;
typeMap[NAME_TIME_EQUAL] = TimeAttribute.prototype.identifier;
typeMap[NAME_DATETIME_EQUAL] = DateTimeAttribute.prototype.identifier;
typeMap[NAME_DAYTIME_DURATION_EQUAL] = DayTimeDurationAttribute.prototype.identifier;
typeMap[NAME_YEARMONTH_DURATION_EQUAL] = YearMonthDurationAttribute.prototype.identifier;
typeMap[NAME_ANYURI_EQUAL] = AnyURIAttribute.prototype.identifier;
typeMap[NAME_X500NAME_EQUAL] = X500NameAttribute.prototype.identifier;
typeMap[NAME_RFC822NAME_EQUAL] = RFC822NameAttribute.prototype.identifier;
typeMap[NAME_HEXBINARY_EQUAL] = HexBinaryAttribute.prototype.identifier;
typeMap[NAME_BASE64BINARY_EQUAL] = Base64BinaryAttribute.prototype.identifier;

function EqualFunction() { };

util.inherits(EqualFunction, FunctionBase);
EqualFunction.prototype.equalFunctionInit = function (functionName) {
  this.equalFunctionInit2(functionName, this.getArgumentType(functionName));
};

EqualFunction.prototype.equalFunctionInit2 = function (functionName, argumentType) {
  this.superConstructor(functionName, 0, argumentType, false, 2, BooleanAttribute.prototype.identifier, false);
};

EqualFunction.prototype.getArgumentType = function (functionName) {
  var datatype = typeMap[functionName];

  if (datatype === null) {
    console.log("not a standard function: " + functionName);
  }
  return datatype;
};

EqualFunction.prototype.getSupportedIdentifiers = function () {
  return Object.keys(typeMap);
};

EqualFunction.prototype.evaluate = function (value, bags, context) {
  if (Array.isArray(value)) {
    return this.evaluateApply(value, bags)
  }
  const response = {
    status: null,
    value: false,
    wasInd: false,
    indeterminate: false
  }
  for (let i = 0; i < bags.length; i++) {
    const bag = bags[i];

    if (bag instanceof StringAttribute &&
      XACMLConstants.ANY === bag.getValue()) {
      return EvaluationResult.prototype.getInstance(true);
    }

    if (this.getFunctionId() === ID_EQUAL_CASE_IGNORE) {
      return EvaluationResult.prototype.getInstance(value.toLowerCase() ===
        bag.toLowerCase());
    } else {
      if (value.equals(bag)) {
        response.value = true
        return response;
      }
    }
  }
  return response;
};

EqualFunction.prototype.evaluateApply = function (value, context) {
  const response = {
    status: null,
    value: false,
    wasInd: false,
    indeterminate: false
  }

  const resultFirst = value[0].evaluate(context)
  if (resultFirst.indeterminate) return resultFirst
  const resultSecond = value[1].evaluate(context)
  if (resultSecond.indeterminate) return resultSecond

  if (resultSecond instanceof StringAttribute &&
    XACMLConstants.ANY === resultSecond.attributeValues.getValue()) {
    return EvaluationResult.prototype.getInstance(true);
  }
  if (this.getFunctionId() === ID_EQUAL_CASE_IGNORE) {
    return EvaluationResult.prototype.getInstance(resultFirst.attributeValues.getValue().toLowerCase() ===
      resultSecond.attributeValues.getValue().toLowerCase());
  } else {
    if (resultFirst.attributeValues.equals(resultSecond.attributeValues)) {
      response.value = true
      return response;
    }
  }

  return response;
};


module.exports = EqualFunction;
