/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

function BaseFunctionFactory() { };

BaseFunctionFactory.prototype.baseFunctionFactoryInit = function () {
	this.baseFunctionFactoryInit2(null);
};

BaseFunctionFactory.prototype.baseFunctionFactoryInit2 = function (superset) {
	this.functionMap = {};
	this.superset = superset;
};

BaseFunctionFactory.prototype.baseFunctionFactoryInit3 = function (supportedFunctions, supportedAbstractFunctions) {
	this.baseFunctionFactoryInit4(null, supportedFunctions, supportedAbstractFunctions);
};

BaseFunctionFactory.prototype.baseFunctionFactoryInit4 = function (superset, supportedFunctions, supportedAbstractFunctions) {
	this.baseFunctionFactoryInit2(superset);

	for (var i = 0; i < supportedFunctions.length; i++) {
		var _function = supportedFunctions[i];

		this.functionMap[_function.getIdentifier()] = _function;
		//console.log( supportedFunctions.length);
		//console.log(_function.getIdentifier());

	}

	var it = Object.keys(supportedAbstractFunctions);

	for (var i = 0; i < it.length; i++) {
		var id = it[i];
		var proxy = supportedAbstractFunctions[id];
		this.functionMap[id] = proxy;

	}
};

BaseFunctionFactory.prototype.addFunction = function (_function) {
	var id = _function.getIdentifier();
	if (_.contains(functionMap[id])) {
		console.log("function already exists");
	}
	this.functionMap[id] = _function;
};

BaseFunctionFactory.prototype.createFunction = function (URIIdentity) {
	var entry = this.functionMap[URIIdentity];
	if (entry !== null) {
		return entry;
	} else {
		console.error(`functions of type ${URIIdentity} are not
			supported by this factory`);
	}
};


module.exports = BaseFunctionFactory;

