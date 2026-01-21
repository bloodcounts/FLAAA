/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const util = require("util");

const AttributeFactory = require('../../attr/attributeFactory');
const BooleanAttribute = require('../../attr/booleanAttribute');
const IntegerAttribute = require('../../attr/integerAttribute');
const DoubleAttribute = require('../../attr/doubleAttribute');
const DateAttribute = require('../../attr/dateAttribute');
const TimeAttribute = require('../../attr/timeAttribute');
const DateTimeAttribute = require('../../attr/dateTimeAttribute');
const DayTimeDurationAttribute = require('../../attr/dayTimeDurationAttribute');
const YearMonthDurationAttribute = require('../../attr/yearMonthDurationAttribute');
const AnyURIAttribute = require('../../attr/anyURIAttribute');
const X500NameAttribute = require('../../attr/x500NameAttribute');
const RFC822NameAttribute = require('../../attr/rFC822NameAttribute');
const IPAddressAttribute = require('../../attr/ipAddressAttribute');
const DNSNameAttribute = require('../../attr/dnsNameAttribute');


const FunctionBase = require('../functionBase');
const StringAttribute = require('../../attr/stringAttribute');
const AnyURIAttribute = require('../../attr/anyURIAttribute');
const EvaluationResult = require('../evaluationResult');

const FUNCTION_NS_3 = 'urn:oasis:names:tc:xacml:3.0:function:';
const NAME_BOOLEAN_FROM_STRING = `${FUNCTION_NS_3}boolean-from-string`;
const NAME_INTEGER_FROM_STRING = `${FUNCTION_NS_3}integer-from-string`;
const NAME_DOUBLE_FROM_STRING = `${FUNCTION_NS_3}double-from-string`;
const NAME_TIME_FROM_STRING = `${FUNCTION_NS_3}time-from-string`;
const NAME_DATE_FROM_STRING = `${FUNCTION_NS_3}date-from-string`;
const NAME_DATE_TIME_FROM_STRING = `${FUNCTION_NS_3}dateTime-from-string`;
const NAME_URI_FROM_STRING = `${FUNCTION_NS_3}anyURI-from-string`;
const NAME_DAYTIME_DURATION_FROM_STRING = `${FUNCTION_NS_3}dayTimeDuration-from-string`;
const NAME_YEAR_MONTH_DURATION_FROM_STRING = `${FUNCTION_NS_3}yearMonthDuration-from-string`;
const NAME_X500NAME_FROM_STRING = `${FUNCTION_NS_3}x500Name-from-string`;
const NAME_RFC822_FROM_STRING = `${FUNCTION_NS_3}rfc822Name-from-string`;
const NAME_IP_ADDRESS_FROM_STRING = `${FUNCTION_NS_3}ipAddress-from-string`;
const NAME_DNS_FROM_STRING = `${FUNCTION_NS_3}dnsName-from-string`;

var dataTypeMap = new Map();

function StringConversionFunction() {};

(function () {
  dataTypeMap.set(NAME_BOOLEAN_FROM_STRING, BooleanAttribute.prototype.identifier);
  dataTypeMap.set(NAME_INTEGER_FROM_STRING, IntegerAttribute.prototype.identifier);
  dataTypeMap.set(NAME_DOUBLE_FROM_STRING, DoubleAttribute.prototype.identifier);
  dataTypeMap.set(NAME_DATE_FROM_STRING, DateAttribute.prototype.identifier);
  dataTypeMap.set(NAME_TIME_FROM_STRING, TimeAttribute.prototype.identifier);
  dataTypeMap.set(NAME_DATE_TIME_FROM_STRING, DateTimeAttribute.prototype.identifier);
  dataTypeMap.set(NAME_DAYTIME_DURATION_FROM_STRING, DayTimeDurationAttribute.prototype.identifier);
  dataTypeMap.set(NAME_YEAR_MONTH_DURATION_FROM_STRING, YearMonthDurationAttribute.prototype.identifier);
  dataTypeMap.sett(NAME_URI_FROM_STRING, AnyURIAttribute.prototype.identifier);
  dataTypeMap.set(NAME_X500NAME_FROM_STRING, X500NameAttribute.prototype.identifier);
  dataTypeMap.set(NAME_RFC822_FROM_STRING, RFC822NameAttribute.prototype.identifier);
  dataTypeMap.set(NAME_IP_ADDRESS_FROM_STRING, IPAddressAttribute.prototype.identifier);
  dataTypeMap.set(NAME_DNS_FROM_STRING, DNSNameAttribute.prototype.identifier);
})();

util.inherits(StringConversionFunction, FunctionBase);

StringConversionFunction.prototype.init = function (functionName) {
  this.superConstructor(functionName, 0, StringAttribute.prototype.identifier, false, 1, this.getReturnType(functionName), false);
};


StringConversionFunction.prototype.getReturnType = function (functionName) {
  return dataTypeMap.get(functionName);
}

StringConversionFunction.prototype.getSupportedIdentifiers = function (functionName) {
  return dataTypeMap.keys();
}

StringConversionFunction.prototype.evaluate = function (inputs, context) {

  const argValues = inputs.map(input => {
    return new AttributeValue();
  });

  const result = evalArgs(inputs, context, argValues);
  if (result != null) {
    return result;
  }

  const dataType = dataTypeMap.get(this.getFunctionName());
  const value = AttributeFactory.prototype.getInstance().getFactory().createValue4(dataType, argValues[0]);

  const evaluationResult = new EvaluationResult();
  evaluationResult.evaluationResultInit(value);
  return evaluationResult;
}

module.exports = StringConversionFunction;
