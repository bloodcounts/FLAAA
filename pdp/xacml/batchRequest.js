/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/

const shelljs = require('shelljs');
const fs = require('fs');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();

class BatchRequest {
  constructor(options = {}) {
    // Dependencies for testing (set first)
    this.fs = options.fs || fs;
    this.os = options.os || os;
    this.sqlite3 = options.sqlite3 || sqlite3;
    this.shelljs = options.shelljs || shelljs;
    this.process = options.process || process;
    this.console = options.console || console;
    this.setTimeout = options.setTimeout || global.setTimeout;

    this.resultDir = options.resultDir || '../result';
    this.dbPath = options.dbPath || '../result/result';
    this.rep = options.rep || 0;
    this.stacsRunId = options.stacsRunId || 1;
    this.dmRunId = options.dmRunId || 2;
    this.server = options.server || "atlasserver";
    this.numCPUs = options.numCPUs || this.os.cpus().length;
    this.delay = options.delay || 500;
    this.iterations = options.iterations || 9;
    this.pdpCommand = options.pdpCommand || 'node --max-old-space-size=3072 xacml/pdpTest.js --rep';

    this.db = null;
  }

  /**
   * Initialize the database and create tables if needed
   */
  initializeDatabase() {
    // Ensure result directory exists
    if (!this.fs.existsSync(this.resultDir)){
      this.fs.mkdirSync(this.resultDir);
      this.db = new this.sqlite3.Database(this.dbPath);
    }

    const dbExists = this.fs.existsSync(this.dbPath);

    if(!dbExists){
      this.console.log('Creating tables in sqlite');
      this.db = new this.sqlite3.Database(this.dbPath);
      this.db.serialize(() => {
        this.db.run("CREATE TABLE ServiceTime (problemRef String, adjustSummary String, staticRef String,policyRef String, policyVersion Integer, policySubRef String,contextRef String, contextSubRef String, pdp String, server String, memory String, nProc Integer, reqInd Integer, rep Integer, dmRunId Long, stacsRunId Long, duration Long)");
        this.db.run("CREATE TABLE Response (problemRef String, adjustSummary String, staticRef String, policyRef String, policyVersion Integer, policySubRef String, contextRef String, contextSubRef String, pdp String, reqInd Integer, dmRunId Long, stacsRunId Long, decision String)");
        this.db.run("CREATE TABLE StacsRunControl (stacsRunId INTEGER, dateTimeStr TEXT UNIQUE ON CONFLICT ABORT, server TEXT, memory TEXT, nProc INTEGER, dmRunId INTEGER DEFAULT -1)");
        this.db.run("CREATE TABLE DmRunControl(dmRunId INTEGER, dateTimeStr TEXT UNIQUE ON CONFLICT ABORT, policyVersion TEXT DEFAULT '0.1', linkedDmRunId INTEGER DEFAULT -1)");
        this.db.run("CREATE TABLE OtherTime (problemRef String, adjustSummary String, staticRef String, policyRef String, policyVersion Integer, policySubRef String, contextRef String, contextSubRef String, pdp String, server String, memory String, nProc Integer, dmRunId Long, stacsRunId Long, duration Long)");
      });
    } else {
      this.console.log('db exists');
      this.db = new this.sqlite3.Database(this.dbPath);
    }

    return this.db;
  }

  /**
   * Generate timestamp string in YYYYMMDD_HHMMSS format
   */
  generateTimestamp(date = new Date()) {
    return date.getFullYear().toString() +
           ("0" + (date.getMonth() + 1)).toString().slice(-2) +
           ("0" + date.getDate()).toString().slice(-2) + "_" +
           ("0" + date.getHours()).toString().slice(-2) +
           ("0" + date.getMinutes()).toString().slice(-2) +
           ("0" + date.getSeconds()).toString().slice(-2);
  }

  /**
   * Execute the batch processing
   */
  async executeBatch() {
    if (!this.db) {
      this.initializeDatabase();
    }

    const stacsRunControlTable = this.db.prepare("INSERT INTO StacsRunControl VALUES (?, ?, ?, ?, ?, ?)");
    const dmRunControlTable = this.db.prepare("INSERT INTO DmRunControl VALUES (?, ?, ?, ?)");
    const date = new Date();
    const dateTimeStr = this.generateTimestamp(date);

    this.console.time('njsPDP-total-running-time');
    this.console.log('njsPDP starts processing');

    for(let i = 0; i < this.iterations; i++){
      this.shelljs.exec(this.pdpCommand + ' ' + this.rep);
      this.rep++;
    }

    this.console.log('njsPDP finished processing');
    this.console.timeEnd('njsPDP-total-running-time');

    const memoryUsage = Math.floor(this.process.memoryUsage().heapUsed / 1000) + "KB";
    stacsRunControlTable.run(this.stacsRunId, dateTimeStr, this.server, memoryUsage, this.numCPUs, this.dmRunId);
    dmRunControlTable.run(this.dmRunId, dateTimeStr, "0.1", this.dmRunId);

    stacsRunControlTable.finalize();
    dmRunControlTable.finalize();

    this.db.close();
  }

  /**
   * Run the batch request with optional delay
   */
  run() {
    return new Promise((resolve) => {
      this.setTimeout(async () => {
        await this.executeBatch();
        resolve();
      }, this.delay);
    });
  }
}

// Export for testing
module.exports = BatchRequest;

// For backward compatibility, run if this file is executed directly
if (require.main === module) {
  const batchRequest = new BatchRequest();
  batchRequest.run().catch(console.error);
}
