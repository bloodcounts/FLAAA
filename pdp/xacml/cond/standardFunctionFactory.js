/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var util = require("util");
var BaseFunctionFactory = require('./baseFunctionFactory');
var ConditionBagFunctionCluster = require('../condCluster/conditionBagFunctionCluster');
var EqualFunctionCluster = require('../condCluster/equalFunctionCluster');
var LogicalFunctionCluster = require('../condCluster/logicalFunctionCluster');
var NOfFunctionCluster = require('../condCluster/nOfFunctionCluster');
var NotFunctionCluster = require('../condCluster/notFunctionCluster');
var ComparisonFunctionCluster = require('../condCluster/comparisonFunctionCluster');
var MatchFunctionCluster = require('../condCluster/matchFunctionCluster');
var ConditionBagFunctionCluster = require('../condCluster/conditionBagFunctionCluster');
var ConditionSetFunctionCluster = require('../condCluster/conditionSetFunctionCluster');
var HigherOrderFunctionCluster = require('../condCluster/higherOrderFunctionCluster');
var AddFunctionCluster = require('../condCluster/addFunctionCluster');
var SubtractFunctionCluster = require('../condCluster/subtractFunctionCluster');
var MultiplyFunctionCluster = require('../condCluster/multiplyFunctionCluster');
var DivideFunctionCluster = require('../condCluster/divideFunctionCluster');
var ModFunctionCluster = require('../condCluster/modFunctionCluster');
var AbsFunctionCluster = require('../condCluster/absFunctionCluster');
var RoundFunctionCluster = require('../condCluster/roundFunctionCluster');
var FloorFunctionCluster = require('../condCluster/floorFunctionCluster');
var DateMathFunctionCluster = require('../condCluster/dateMathFunctionCluster');
var GeneralBagFunctionCluster = require('../condCluster/generalBagFunctionCluster');
var NumericConvertFunctionCluster = require('../condCluster/numericConvertFunctionCluster');
var StringNormalizeFunctionCluster = require('../condCluster/stringNormalizeFunctionCluster');
var GeneralSetFunctionCluster = require('../condCluster/generalSetFunctionCluster');
var MapFunction = require('./mapFunction');
var MapFunctionProxy = require('./mapFunctionProxy');
var BasicFunctionFactoryProxy = require('./basicFunctionFactoryProxy');

var generalFactory = null;
var conditionFactory = null;
var targetFactory = null;
var generalFunctions = [];
var conditionFunctions = [];
var targetFunctions = [];
var targetAbstractFunctions = [];
var conditionAbstractFunctions = [];
var generalAbstractFunctions = {};
var supportedFunctions = [];
var supportedAbstractFunctions = {};

function StandardFunctionFactory() { };
util.inherits(StandardFunctionFactory, BaseFunctionFactory);
StandardFunctionFactory.prototype.standardFunctionFactoryInit = function (supportedFunctions, supportedAbstractFunctions) {
	this.baseFunctionFactoryInit3(supportedFunctions, supportedAbstractFunctions);
	this.supportedFunctions = supportedFunctions;
	this.supportedAbstractFunctions = supportedAbstractFunctions;
}

StandardFunctionFactory.prototype.initTargetFunctions = function () {
	Array.prototype.push.apply(targetFunctions, (new EqualFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(targetFunctions, (new LogicalFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(targetFunctions, (new NOfFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(targetFunctions, (new NotFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(targetFunctions, (new ComparisonFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(targetFunctions, (new MatchFunctionCluster()).getSupportedFunctions());
}

StandardFunctionFactory.prototype.initConditionFunctions = function () {

	if (targetFunctions.length === 0) {
		this.initTargetFunctions();
	}
	conditionFunctions = targetFunctions;

	Array.prototype.push.apply(conditionFunctions, (new ConditionBagFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(conditionFunctions, (new ConditionSetFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(conditionFunctions, (new HigherOrderFunctionCluster()).getSupportedFunctions());
	conditionAbstractFunctions = targetAbstractFunctions;
}


StandardFunctionFactory.prototype.initGeneralFunctions = function () {

	if (conditionFunctions.length === 0) {
		this.initConditionFunctions();
	}

	generalFunctions = conditionFunctions;
	Array.prototype.push.apply(generalFunctions, (new AddFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(generalFunctions, (new SubtractFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(generalFunctions, (new ModFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(generalFunctions, (new MultiplyFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(generalFunctions, (new DivideFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(generalFunctions, (new ModFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(generalFunctions, (new RoundFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(generalFunctions, (new FloorFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(generalFunctions, (new DateMathFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(generalFunctions, (new GeneralBagFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(generalFunctions, (new NumericConvertFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(generalFunctions, (new StringNormalizeFunctionCluster()).getSupportedFunctions());
	Array.prototype.push.apply(generalFunctions, (new GeneralSetFunctionCluster()).getSupportedFunctions());

	generalAbstractFunctions[MapFunction.prototype.NAME_MAP] = new MapFunctionProxy();
};

StandardFunctionFactory.prototype.getGeneralFactory = function () {

	if (!generalFactory) {

		if (generalFunctions.length === 0) {
			this.initGeneralFunctions();
			var standardFunctionFactory = new StandardFunctionFactory();
			standardFunctionFactory.standardFunctionFactoryInit(generalFunctions, generalAbstractFunctions);
			generalFactory = standardFunctionFactory;
		}

	}
	return generalFactory;
};

StandardFunctionFactory.prototype.getConditionFactory = function () {
	if (!conditionFactory) {
		if (conditionFunctions.length === 0) {
			this.initConditionFunctions();
		}
		if (!conditionFactory) {
			var standardFunctionFactory = new StandardFunctionFactory();
			standardFunctionFactory.standardFunctionFactoryInit(conditionFunctions, conditionAbstractFunctions);
			conditionFactory = standardFunctionFactory;
		}

	}
	return conditionFactory;
};

StandardFunctionFactory.prototype.getTargetFactory = function () {

	if (!targetFactory) {

		if (targetFunctions.length === 0) {

			this.initTargetFunctions();
		}
		if (!targetFactory) {
			var standardFunctionFactory = new StandardFunctionFactory();
			standardFunctionFactory.standardFunctionFactoryInit(targetFunctions, targetAbstractFunctions);
			targetFactory = standardFunctionFactory;
		}

	}
	return targetFactory;
};

StandardFunctionFactory.prototype.getStandardFunctions = function () {
	return supportedFunctions;
};

StandardFunctionFactory.prototype.getStandardAbstractFunctions = function () {
	return supportedAbstractFunctions;
}

StandardFunctionFactory.prototype.getNewFactoryProxy = function () {
	var general = this.getGeneralFactory();
	var newGeneral = (new BaseFunctionFactory).baseFunctionFactoryInit3(general.getStandardFunctions(), general.getStandardAbstractFunctions());
	var condition = this.getConditionFactory();
	var newCondition = (new BaseFunctionFactory).baseFunctionFactoryInit4(newGeneral,
		condition.getStandardFunctions(),
		condition.getStandardAbstractFunctions());
	var target = this.getTargetFactory();
	var newTarget = (new BaseFunctionFactory).baseFunctionFactoryInit4(newCondition,
		target.getStandardFunctions(),
		target.getStandardAbstractFunctions());
	return (new BasicFunctionFactoryProxy).basicFunctionFactoryProxyInit(newTarget, newCondition,
		newGeneral);
};


module.exports = StandardFunctionFactory;
