/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var util = require("util");
var FunctionBase = require("./functionBase");
var AttributeValue = require("../attr/attributeValue");
var StringAttribute = require("../attr/stringAttribute");
var BooleanAttribute = require("../attr/booleanAttribute");
var IntegerAttribute = require("../attr/integerAttribute");
var DoubleAttribute = require("../attr/doubleAttribute");
var DateAttribute = require("../attr/dateAttribute");
var TimeAttribute = require("../attr/timeAttribute");
var DateTimeAttribute = require("../attr/dateTimeAttribute");
var EvaluationResult = require("./evaluationResult");
var DayTimeDurationAttribute = require("../attr/dayTimeDurationAttribute");
var YearMonthDurationAttribute = require("../attr/yearMonthDurationAttribute");
var AnyURIAttribute = require("../attr/anyURIAttribute");
var X500NameAttribute = require("../attr/x500NameAttribute");
var RFC822NameAttribute = require("../attr/rfc822NameAttribute");
var HexBinaryAttribute = require("../attr/hexBinaryAttribute");
var Base64BinaryAttribute = require("../attr/base64BinaryAttribute");
var FUNCTION_NS = "urn:oasis:names:tc:xacml:1.0:function:";
var NAME_REGEXP_STRING_MATCH = FUNCTION_NS + "regexp-string-match";
var NAME_X500NAME_MATCH = FUNCTION_NS + "x500Name-match";
var NAME_RFC822NAME_MATCH = FUNCTION_NS + "rfc822Name-match";
const NAME_ANYURI_REGEXP_MATCH = FUNCTION_NS + "anyURI-regexp-match";
var ID_REGEXP_STRING_MATCH = 0;
var ID_X500NAME_MATCH = 1;
var ID_RFC822NAME_MATCH = 2;
const ID_ANYURI_REGEXP_MATCH = 4;
var bagParams = [false, false];
var regexpParams = [
  StringAttribute.prototype.identifier,
  StringAttribute.prototype.identifier,
];

var anyURIRegexpParams = [
  StringAttribute.prototype.identifier,
  AnyURIAttribute.prototype.identifier,
];

var x500Params = [
  X500NameAttribute.prototype.identifier,
  X500NameAttribute.prototype.identifier,
];
var rfc822Params = [
  StringAttribute.prototype.identifier,
  RFC822NameAttribute.prototype.identifier,
];

function MatchFunction(functionName) {
  this.superConstructor(
    functionName,
    getId(functionName),
    getArgumentTypes(functionName),
    bagParams,
    BooleanAttribute.prototype.identifier,
    false
  );
}

util.inherits(MatchFunction, FunctionBase);

var getId = function (functionName) {
  switch (functionName) {
    case NAME_REGEXP_STRING_MATCH:
      return ID_REGEXP_STRING_MATCH;
    case NAME_X500NAME_MATCH:
      return ID_X500NAME_MATCH;
    case NAME_RFC822NAME_MATCH:
      return ID_RFC822NAME_MATCH;
    case NAME_ANYURI_REGEXP_MATCH:
      return ID_ANYURI_REGEXP_MATCH;
  }
  console.log("unknown match function: " + functionName);
};

var getArgumentTypes = function (functionName) {
  if (functionName === NAME_REGEXP_STRING_MATCH) {
    return regexpParams;
  } else if (functionName === NAME_X500NAME_MATCH) {
    return x500Params;
  } else if (functionName === NAME_RFC822NAME_MATCH) {
    return rfc822Params;
  } else if (functionName === NAME_ANYURI_REGEXP_MATCH) {
    return anyURIRegexpParams;
  }
};

MatchFunction.prototype.getSupportedIdentifiers = function () {
  const set = [
    NAME_REGEXP_STRING_MATCH,
    NAME_X500NAME_MATCH,
    NAME_RFC822NAME_MATCH,
    NAME_ANYURI_REGEXP_MATCH
  ];
  return set;
};

MatchFunction.prototype.evaluate = function (inputs, bags, context) {
  const response = {
    status: null,
    value: false,
    wasInd: false,
    indeterminate: false
  }
  
  if (bags.constructor.name !== 'XACML3EvaluationCtx') {
    if (inputs.length) inputs.push(...bags)
    else inputs = [inputs, ...bags]
  }

  var argValues = [];

  for (var i = 0; i < inputs.length; i++) {
    argValues.push(new AttributeValue());
  }
  var result = this.evalArgs(inputs, bags, argValues);
  if (result != null) {
    return result;
  }
  var boolResult = false;

  switch (this.getFunctionId()) {
    case ID_REGEXP_STRING_MATCH:
      var arg0 = argValues[0].value;
      var arg1 = argValues[1].value;

      boolResult = regexpHelper(arg0, arg1);
      break;
    case ID_X500NAME_MATCH:
      break;

    case ID_ANYURI_REGEXP_MATCH:
      var arg0 = argValues[0].value;
      var arg1 = argValues[1].value;

      boolResult = regexpHelper(arg0, arg1);
      break;

    case ID_RFC822NAME_MATCH:
      var arg0 = argValues[0].getValue();
      var arg1 = argValues[1].getValue();
      if (arg0.indexOf("@") != -1) {
        var rFC822NameAttribute = new RFC822NameAttribute();
        rFC822NameAttribute.rFC822NameAttributeInit(arg0);
        var normalized = rFC822NameAttribute.getValue();
        boolResult = normalized.equals(arg1);
      } else if (arg0.charAt(0) == ".") {
        boolResult = endsWith(arg1, arg0.toLowerCase());
      } else {
        var mailDomain = arg1.substring(arg1.indexOf("@") + 1);
        boolResult = arg0.toLowerCase() == mailDomain;
      }
      break;
  }

  response.value = boolResult
  return response;
};

function regexpHelper(arg0, arg1) {
  var buf = arg0;
  if (arg0.charAt(0) != "^") {
    buf = insert(buf, 0, ".*");
  }
  if (arg0.charAt(arg0.length - 1) != "$") {
    buf = insert(buf, buf.length, ".*");
  }
  var idx = -1;
  idx = buf.indexOf("\\p{Is", 0);
  while (idx != -1) {
    buf =
      myString.substring(0, idx) +
      "\\p{In" +
      myString.substring(idx + 5, buf.length);
    idx = buf.indexOf("\\p{Is", idx);
  }
  idx = -1;
  idx = buf.indexOf("\\P{Is", 0);
  while (idx != -1) {
    buf =
      myString.substring(0, idx) +
      "\\p{In" +
      myString.substring(idx + 5, buf.length);
    idx = buf.indexOf("\\P{Is", idx);
  }
  idx = -1;
  idx = buf.indexOf("-[", 0);
  while (idx != -1) {
    buf =
      myString.substring(0, idx) +
      "&&[^" +
      myString.substring(idx + 2, buf.length);
    idx = buf.indexOf("-[", idx);
  }
  arg0 = buf.toString();
  arg0 = arg0.replace('$', '\\$')//side effects for regex
  var patt = new RegExp(arg0);
  return patt.test(arg1);
}

function insert(str, index, value) {
  return str.substr(0, index) + value + str.substr(index);
}

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
module.exports = MatchFunction;
