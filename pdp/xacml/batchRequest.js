/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
require('shelljs/global');
var fs = require('fs');
var exists = fs.existsSync('../result/result');
var sqlite3 = require('sqlite3').verbose();
var resultDir = '../result';
var rep = 0;
var stacsRunId = 1;
var dmRunId = 2;
var server = "atlasserver";
var numCPUs = require('os').cpus().length;

if (!fs.existsSync(resultDir)){
    fs.mkdirSync(resultDir);
    db = new sqlite3.Database('../result/result');
}

if(!exists){
	db.serialize(function() {
	console.log('Creating tables in sqlite');
	db.run("CREATE TABLE ServiceTime (problemRef String, adjustSummary String, staticRef String,policyRef String, policyVersion Integer, policySubRef String,contextRef String, contextSubRef String, pdp String, server String, memory String, nProc Integer, reqInd Integer, rep Integer, dmRunId Long, stacsRunId Long, duration Long)");
	db.run("CREATE TABLE Response (problemRef String, adjustSummary String, staticRef String, policyRef String, policyVersion Integer, policySubRef String, contextRef String, contextSubRef String, pdp String, reqInd Integer, dmRunId Long, stacsRunId Long, decision String)");
	db.run("CREATE TABLE StacsRunControl (stacsRunId INTEGER, dateTimeStr TEXT UNIQUE ON CONFLICT ABORT, server TEXT, memory TEXT, nProc INTEGER, dmRunId INTEGER DEFAULT -1)");
	db.run("CREATE TABLE DmRunControl(dmRunId INTEGER, dateTimeStr TEXT UNIQUE ON CONFLICT ABORT, policyVersion TEXT DEFAULT '0.1', linkedDmRunId INTEGER DEFAULT -1)");
  db.run("CREATE TABLE OtherTime (problemRef String, adjustSummary String, staticRef String, policyRef String, policyVersion Integer, policySubRef String, contextRef String, contextSubRef String, pdp String, server String, memory String, nProc Integer, dmRunId Long, stacsRunId Long, duration Long)");
  });
}else{
	console.log('db exists');
	db = new sqlite3.Database('../result/result');
}



setTimeout(function () {
		var stacsRunControlTable = db.prepare("INSERT INTO StacsRunControl VALUES (?, ?, ?, ?, ?, ?)");
		var dmRunControlTable = db.prepare("INSERT INTO DmRunControl VALUES (?, ?, ?, ?)");
		var date = new Date();
		var dateTimeStr = date.getFullYear().toString() + ("0" + (date.getMonth() + 1)).slice(-2).toString() + date.getDate().toString() + "_" + date.getHours().toString() + (date.getMinutes()<10?'0':'') + date.getMinutes().toString() + date.getSeconds().toString();
		console.time('njsPDP-total-running-time');
		console.log('njsPDP starts processing');
		for(var i = 0; i < 9; i++){
				exec('node --max-old-space-size=3072 xacml/pdpTest.js --rep ' + rep);
				rep ++;
		}


		console.log('njsPDP finished processing');
		console.timeEnd('njsPDP-total-running-time');

		stacsRunControlTable.run(stacsRunId, dateTimeStr, server, Math.floor(process.memoryUsage().heapUsed/1000)+"KB", numCPUs, dmRunId);
		dmRunControlTable.run(dmRunId, dateTimeStr, "0.1", dmRunId);

		stacsRunControlTable.finalize();
		dmRunControlTable.finalize();

		db.close();
}, 500)
