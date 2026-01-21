/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var requestLength = 0;
var repIndex = 0;
var sqlite3 = require('sqlite3').verbose();
var db;
var responseTable;

function DBUtil(dbconn, dbresponseTable){
	db = dbconn;
	responseTable = dbresponseTable;
}

DBUtil.prototype.requestLength = requestLength;

DBUtil.prototype.setRequestLength = function(requestLength){
		this.requestLength = requestLength - 1;
}


DBUtil.prototype.setRepIndex = function(repIndex){
		this.requestLength = requestLength - 1;
}

DBUtil.prototype.insert = function(result, reqInd, decision){

		var problemRef = result[0];
		var adjustSummary = result[1];
		var staticRef = result[2];
		var policyRef = result[3];
		var policyVersion = result[4];
		var policySubRef = result[5];
		var contextRef = result[6];
		var contextSubRef = result[7];
		var pdpVersion = result[8];
		var dmRunId = result[9];
		var stacsRunId = result[10];
		var reqInd = reqInd;
		var decision = decision;

		db.serialize(function() {
				responseTable.run(problemRef, adjustSummary, staticRef, policyRef, policyVersion, policySubRef, contextRef, contextSubRef, pdpVersion, reqInd, dmRunId, stacsRunId, decision);
		});
}

DBUtil.prototype.closeDB = function(){
		responseTable.finalize();
		db.close();
}

module.exports = DBUtil;
