/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const util = require("util");
const BooleanAttribute = require('../../attr/booleanAttribute');
const FunctionBase = require('../functionBase');
const StringAttribute = require('../../attr/stringAttribute');
const AnyURIAttribute = require('../../attr/anyURIAttribute');
const EvaluationResult = require('../evaluationResult');

const FUNCTION_NS_3 = 'urn:oasis:names:tc:xacml:3.0:function:';
const NAME_STRING_START_WITH = `${FUNCTION_NS_3}string-starts-with`;
const NAME_ANY_URI_START_WITH = `${FUNCTION_NS_3}anyURI-starts-with`;
const NAME_STRING_ENDS_WITH = `${FUNCTION_NS_3}string-ends-with`;
const NAME_ANY_URI_ENDS_WITH = `${FUNCTION_NS_3}anyURI-ends-with`;
const NAME_STRING_CONTAIN = `${FUNCTION_NS_3}"string-contains`;
const NAME_ANY_URI_CONTAIN = `${FUNCTION_NS_3}anyURI-contains`;

const ID_STRING_START_WITH = 0;
const ID_ANY_URI_START_WITH = 1;
const ID_STRING_ENDS_WITH = 2;
const ID_ANY_URI_ENDS_WITH = 3;
const ID_STRING_CONTAIN = 4;
const ID_ANY_URI_CONTAIN = 5;

function StringComparingFunction() { };

util.inherits(StringComparingFunction, FunctionBase);
StringComparingFunction.prototype.init = function (functionName) {
  this.superConstructor(functionName, getId(functionName), getArgumentType(functionName), false, 2,
    BooleanAttribute.prototype.identifier, false);
};


StringComparingFunction.prototype.getSupportedIdentifiers = () => [NAME_STRING_START_WITH,
  NAME_ANY_URI_START_WITH, NAME_STRING_ENDS_WITH, NAME_STRING_CONTAIN, NAME_ANY_URI_CONTAIN
];

const getId = function (functionName) {
  if (functionName === NAME_STRING_START_WITH) {
    return ID_STRING_START_WITH;
  } else if (functionName === NAME_ANY_URI_START_WITH) {
    return ID_ANY_URI_START_WITH;
  } else if (functionName === NAME_STRING_ENDS_WITH) {
    return ID_STRING_ENDS_WITH;
  } else if (functionName === NAME_ANY_URI_ENDS_WITH) {
    return ID_ANY_URI_ENDS_WITH;
  } else if (functionName === NAME_STRING_CONTAIN) {
    return ID_STRING_CONTAIN;
  } else if (functionName === NAME_ANY_URI_CONTAIN) {
    return ID_ANY_URI_CONTAIN;
  } else {
    throw new Error("unknown start-with function ", functionName);
  }
}

StringComparingFunction.prototype.evaluate = function (inputs, context) {

  const argValues = inputs.map(input => {
    return new AttributeValue();
  });

  const result = evalArgs(inputs, context, argValues);
  if (result != null) {
    return result;
  }

  const id = this.getFunctionId();
  if (id === ID_STRING_START_WITH || id === ID_ANY_URI_START_WITH) {

    return EvaluationResult.prototype.getInstance(argValues[1].encode().startsWith(argValues[0].encode()));
  } else if (id === ID_STRING_ENDS_WITH || id === ID_ANY_URI_ENDS_WITH) {

    return EvaluationResult.prototype.getInstance(argValues[1].encode().endsWith(argValues[0].encode()));
  } else {

    return EvaluationResult.prototype.getInstance(argValues[1].encode().includes(argValues[0].encode()));
  }
}

const getArgumentType = function (functionName) {
  if (functionName === NAME_STRING_START_WITH || functionName === NAME_STRING_ENDS_WITH ||
    functionName === NAME_STRING_CONTAIN) {
    return StringAttribute.prototype.identifier;
  } else {
    return AnyURIAttribute.prototype.identifier;
  }
}

module.exports = StringComparingFunction;
