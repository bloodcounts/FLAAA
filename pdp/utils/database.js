const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const dbName = "../result/result";
let dbUtil = null;
const path = require('path');
const os = require('os');
const NS_PER_SEC = 1e9;

function DbUtil() {

  if (!fs.existsSync(dbName)) {
    this.db = new sqlite3.Database(dbName);
    this.db.serialize(() => {
      this.db.run("CREATE TABLE ServiceTime (problemRef String, adjustSummary String, staticRef String,policyRef String, policyVersion Integer, policySubRef String,contextRef String, contextSubRef String, pdp String, server String, memory String, nProc Integer, reqInd Integer, rep Integer, dmRunId Long, stacsRunId Long, duration Long)");
      this.db.run("CREATE TABLE Response (problemRef String, adjustSummary String, staticRef String, policyRef String, policyVersion Integer, policySubRef String, contextRef String, contextSubRef String, pdp String, reqInd Integer, dmRunId Long, stacsRunId Long, decision String)");
      this.db.run("CREATE TABLE StacsRunControl (stacsRunId INTEGER, dateTimeStr TEXT UNIQUE ON CONFLICT ABORT, server TEXT, memory TEXT, nProc INTEGER, dmRunId INTEGER DEFAULT -1)");
      this.db.run("CREATE TABLE DmRunControl(dmRunId INTEGER, dateTimeStr TEXT UNIQUE ON CONFLICT ABORT, policyVersion TEXT DEFAULT '0.1', linkedDmRunId INTEGER DEFAULT -1)");
      this.db.run("CREATE TABLE OtherTime (problemRef String, adjustSummary String, staticRef String, policyRef String, policyVersion Integer, policySubRef String, contextRef String, contextSubRef String, pdp String, server String, memory String, nProc Integer, dmRunId Long, stacsRunId Long, duration Long)");
    });
  } else {
    this.db = new sqlite3.Database(dbName);
  }
}

DbUtil.prototype.getDb = function() {
  if (!dbUtil) {
    dbUtil = new DbUtil();
  }
  return dbUtil;
}

DbUtil.prototype.recordServiceTime = function(servicesTimeArr) {
  const serviceData = this.polReqData;
  this.serviceTimeTable = this.db.prepare("INSERT INTO ServiceTime VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

  servicesTimeArr.forEach(serviceTime => {
    const reqInd = serviceTime.req.replace("req", "").replace(".xml", "");
    const duration = serviceTime.time;
    const rep = serviceTime.rep;
    const memoryUsage = `${Math.round(serviceTime.memoryUsage/1000)}KB`;
    this.serviceTimeTable.run(serviceData.problemRef, serviceData.adjustSummary, serviceData.staticRef,
      serviceData.policyRef, serviceData.policyVersion, serviceData.policySubRef,
      serviceData.contextRef, serviceData.contextSubRef, serviceData.pdpVersion,
      serviceData.server, memoryUsage, serviceData.nProc,
      reqInd, rep, serviceData.dmRunId, serviceData.stacsRunId, duration[0] * NS_PER_SEC + duration[1]);
  });

  this.serviceTimeTable.finalize();
}

DbUtil.prototype.recordOtherTime = function(policyLoadDuration, memoryUsage) {
  this.otherTimeTable = this.db.prepare("INSERT INTO OtherTime VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const serviceData = this.polReqData;

  this.otherTimeTable.run(serviceData.problemRef, serviceData.adjustSummary, serviceData.staticRef, serviceData.policyRef,
                      serviceData.policyVersion, serviceData.policySubRef, serviceData.contextRef, serviceData.contextSubRef,
                      serviceData.pdpVersion, serviceData.server, `${Math.round(memoryUsage/1000)}KB`, serviceData.nProc, serviceData.dmRunId,
                      serviceData.stacsRunId, policyLoadDuration[0] * NS_PER_SEC + policyLoadDuration[1]);
  this.otherTimeTable.finalize();
}

DbUtil.prototype.recordResponse =  function(responses) {
  this.responseTable = this.db.prepare("INSERT INTO Response VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  responses.forEach(resp => {
    const reqInd = resp.req.replace("req", "").replace(".xml", "");
    const serviceData = this.polReqData;
    this.responseTable.run(serviceData.problemRef, serviceData.adjustSummary, serviceData.staticRef, serviceData.policyRef,
                     serviceData.policyVersion, serviceData.policySubRef, serviceData.contextRef, serviceData.contextSubRef,
                    serviceData.pdpVersion, reqInd, serviceData.dmRunId, serviceData.stacsRunId, resp.decision);
  });

 this.responseTable.finalize();
}

DbUtil.prototype.parseTableRecord = function(policyPath, reqDir) {
  const rootDir = `${os.homedir()}/policyRequest`
  const polDataArr = policyPath.replace(`${rootDir}/policy/`, '').split('/');
  const reqDataArr = reqDir.replace(`${rootDir}/request/`, '').split('/');
  this.polReqData = {
    problemRef: polDataArr[0],
    adjustSummary: reqDataArr[4],
    staticRef: polDataArr[1],
    policyRef: polDataArr[2],
    policyVersion: polDataArr[3],
    policySubRef: polDataArr[4],
    contextRef: reqDataArr[5],
    contextSubRef: reqDataArr[6],
    pdpVersion: 'njsPDP',
    server: 'atlasserver',
    nProc: os.cpus().length,
    dmRunId: reqDataArr[7],
    stacsRunId: 0,
  }
}

DbUtil.prototype.close = function() {
  this.db.close((error => {
    if (!error) {
      console.log("********** Result Saved **********");
    }
  }));
}

module.exports = DbUtil;
