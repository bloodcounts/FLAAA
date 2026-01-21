/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const { DOMParser } = require('@xmldom/xmldom');
const Apply = require('./apply');
const AttributeFactory = require('../attr/attributeFactory');
const AttributeDesignatorFactory = require("../attr/attributeDesignatorFactory");
const AttributeSelectorFactory = require("../attr/attributeSelectorFactory");
const FunctionFactory = require("./functionFactory");
const VariableReference = require("./variableReference")

function ExpressionHandler() { }

ExpressionHandler.prototype.parseExpression = function (root, metaData, manager) {
  const name = root.nodeName;

  switch (name) {
    case 'Apply':
      return Apply.prototype.getInstanceBasedOnDOM(root, metaData, manager);
    case 'AttributeValue':
      return AttributeFactory.prototype.getInstance().createValue1(root);
    case 'AttributeDesignator':
      return getAbstractDesignator(root, metaData);
    case 'SubjectAttributeDesignator':
      return getAbstractDesignator(root, metaData);
    case 'ResourceAttributeDesignator':
      return getAbstractDesignator(root, metaData);
    case 'ActionAttributeDesignator':
      return getAbstractDesignator(root, metaData);
    case 'EnvironmentAttributeDesignator':
      return getAbstractDesignator(root, metaData);
    case 'AttributeSelector':
      return AttributeSelectorFactory.prototype.getFactory().getAbstractSelector(root, metaData);
    case 'Function':
      return this.getFunction(root, metaData, FunctionFactory.prototype.getGeneralInstance());
    case 'VariableReference':
      return VariableReference.prototype.getInstance(root, metaData, manager);
    default:
      return null;
  }
};

const getAbstractDesignator = (root, metaData) => AttributeDesignatorFactory.prototype.getFactory().getAbstractDesignator(root, metaData);

ExpressionHandler.prototype.getFunction = function (root, metaData, factory) {
  const functionNode = root.getAttribute('FunctionId');
  const functionName = functionNode;

  try {
    return factory.createFunction(functionName);
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = ExpressionHandler;
