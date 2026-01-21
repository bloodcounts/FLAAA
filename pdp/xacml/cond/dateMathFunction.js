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
var DateAttribute = require("../attr/dateAttribute");
var DateTimeAttribute = require("../attr/dateTimeAttribute");
var DayTimeDurationAttribute = require("../attr/dayTimeDurationAttribute");
var YearMonthDurationAttribute = require("../attr/yearMonthDurationAttribute");
var DoubleAttribute = require("../attr/doubleAttribute");

var FUNCTION_NS = "urn:oasis:names:tc:xacml:1.0:function:";
var NAME_DATETIME_ADD_DAYTIMEDURATION = FUNCTION_NS + "dateTime-add-dayTimeDuration";
var NAME_DATETIME_SUBTRACT_DAYTIMEDURATION = FUNCTION_NS + "dateTime-subtract-dayTimeDuration";
var NAME_DATETIME_ADD_YEARMONTHDURATION = FUNCTION_NS + "dateTime-add-yearMonthDuration";
var NAME_DATETIME_SUBTRACT_YEARMONTHDURATION = FUNCTION_NS + "dateTime-subtract-yearMonthDuration";
var NAME_DATE_ADD_YEARMONTHDURATION = FUNCTION_NS + "date-add-yearMonthDuration";
var NAME_DATE_SUBTRACT_YEARMONTHDURATION = FUNCTION_NS + "date-subtract-yearMonthDuration";

var ID_DATETIME_ADD_DAYTIMEDURATION = 0;
var ID_DATETIME_SUBTRACT_DAYTIMEDURATION = 1;
var ID_DATETIME_ADD_YEARMONTHDURATION = 2;
var ID_DATETIME_SUBTRACT_YEARMONTHDURATION = 3;
var ID_DATE_ADD_YEARMONTHDURATION = 4;
var ID_DATE_SUBTRACT_YEARMONTHDURATION = 5;

var dateTimeDayTimeDurationArgTypes = [DateTimeAttribute.prototype.identifier, DayTimeDurationAttribute.prototype.identifier];
var dateTimeYearMonthDurationArgTypes = [DateTimeAttribute.prototype.identifier, YearMonthDurationAttribute.prototype.identifier];
var dateYearMonthDurationArgTypes = [DateAttribute.prototype.identifier, YearMonthDurationAttribute.prototype.identifier];


var bagParams = [false, false];
var idMap = {};
var typeMap = {};

initValue();

function initValue() {
  idMap[NAME_DATETIME_ADD_DAYTIMEDURATION] = ID_DATETIME_ADD_DAYTIMEDURATION;
  idMap[NAME_DATETIME_SUBTRACT_DAYTIMEDURATION] = ID_DATETIME_SUBTRACT_DAYTIMEDURATION;
  idMap[NAME_DATETIME_ADD_YEARMONTHDURATION] = ID_DATETIME_ADD_YEARMONTHDURATION;
  idMap[NAME_DATETIME_SUBTRACT_YEARMONTHDURATION] = ID_DATETIME_SUBTRACT_YEARMONTHDURATION;
  idMap[NAME_DATE_ADD_YEARMONTHDURATION] = ID_DATE_ADD_YEARMONTHDURATION;
  idMap[NAME_DATE_SUBTRACT_YEARMONTHDURATION] = ID_DATE_SUBTRACT_YEARMONTHDURATION;

  typeMap[NAME_DATETIME_ADD_DAYTIMEDURATION] = dateTimeDayTimeDurationArgTypes;
  typeMap[NAME_DATETIME_SUBTRACT_DAYTIMEDURATION] = dateTimeDayTimeDurationArgTypes;
  typeMap[NAME_DATETIME_ADD_YEARMONTHDURATION] = dateTimeYearMonthDurationArgTypes;
  typeMap[NAME_DATETIME_SUBTRACT_YEARMONTHDURATION] = dateTimeYearMonthDurationArgTypes;
  typeMap[NAME_DATE_ADD_YEARMONTHDURATION] = dateYearMonthDurationArgTypes;
  typeMap[NAME_DATE_SUBTRACT_YEARMONTHDURATION] = dateYearMonthDurationArgTypes;
};

function DateMathFunction() {};


util.inherits(DateMathFunction, FunctionBase);
DateMathFunction.prototype.dateMathFunctionInit = function (functionName) {
  this.superConstructor(functionName, getId(functionName), getArgumentTypes(functionName), bagParams, getReturnType(functionName), false);
};

var getId = function (functionName) {
  var i = idMap[functionName];
  if (i === undefined) {
    console.error("unknown datemath function " + functionName);
  }
  return i;
};

var getArgumentTypes = function (functionName) {
  return typeMap[functionName];
};

var getReturnType = function (functionName) {
  if ((functionName === NAME_DATE_ADD_YEARMONTHDURATION) && (functionName === NAME_DATE_SUBTRACT_YEARMONTHDURATION)) {
    return DateAttribute.prototype.identifier;
  } else {
    return DateTimeAttribute.prototype.identifier;
  }
};

DateMathFunction.prototype.getSupportedIdentifiers = function () {
  return Object.keys(idMap);
};


module.exports = DateMathFunction;
