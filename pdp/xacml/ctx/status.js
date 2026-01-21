/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var STATUS_OK = "urn:oasis:names:tc:xacml:1.0:status:ok";
var STATUS_MISSING_ATTRIBUTE = "urn:oasis:names:tc:xacml:1.0:status:missing-attribute";
var STATUS_SYNTAX_ERROR = "urn:oasis:names:tc:xacml:1.0:status:syntax-error";
var STATUS_PROCESSING_ERROR = "urn:oasis:names:tc:xacml:1.0:status:processing-error";
var okStatus;
var code = [];

function Status() { };

Status.prototype.statusInit = function (code) {
	this.statusInit3(code, null, null);
};

Status.prototype.statusInit2 = function (code, message) {
	this.statusInit3(code, message, null);
};

Status.prototype.statusInit3 = function (code, message, detail) {
	if (detail != null) {
		var c = code[0];
		if (c == STATUS_OK || c == STATUS_SYNTAX_ERROR ||
			c == STATUS_PROCESSING_ERROR) {
			console.log("status detail cannot be " + "included with " + c);
		}
	}
	this.code = code;
	this.message = message;
	this.detail = detail;
};
valueInit();
function valueInit() {
	code.push(STATUS_OK);
	var status = new Status();
	status.statusInit(code);
	okStatus = status;
};

Status.prototype.getCode = function () {
	return code;
};

Status.prototype.getMessage = function () {
	return this.message;
};

Status.prototype.getDetail = function () {
	return this.detail;
};

Status.prototype.getOkInstance = function () {
	return okStatus;
};

Status.prototype.encode = function (builder) {
	builder.push("<Status>");

	encodeStatusCode(code, builder);

	if (this.message != null) {
		builder.push(`<StatusMessage>${this.message}</StatusMessage>`);
	}

	if (this.detail != null) {
		builder.push(this.detail.getEncoded());
	}

	builder.push("</Status>");
};

function encodeStatusCode(iterator, builder) {
	const code  = iterator[0];
	if (iterator.length > 1) {
		builder.push("<StatusCode Value=\"" + code + "\">");
		encodeStatusCode(iterator, builder);
		builder.push("</StatusCode>");
	} else {
		builder.push("<StatusCode Value=\"" + code + "\"/>");
	}
};

Status.prototype.STATUS_OK = STATUS_OK;
Status.prototype.STATUS_MISSING_ATTRIBUTE = STATUS_MISSING_ATTRIBUTE;
Status.prototype.STATUS_SYNTAX_ERROR = STATUS_SYNTAX_ERROR;
Status.prototype.STATUS_PROCESSING_ERROR = STATUS_PROCESSING_ERROR;


module.exports = Status;
