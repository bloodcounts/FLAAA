'use strict';

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'result', 'result');
const DB_DIR = path.join(__dirname, '..', '..', 'result');

const DbUtil = require('../../utils/database');

function teardown(done) {
  if (DbUtil.dbUtil && DbUtil.dbUtil.db) {
    DbUtil.dbUtil.db.close(() => {
      DbUtil.dbUtil = null;
      try { if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH); } catch (_) { /* ignore */ }
      done();
    });
  } else {
    DbUtil.dbUtil = null;
    try { if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH); } catch (_) { /* ignore */ }
    done();
  }
}

describe('DbUtil', () => {
  before(() => {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  });

  beforeEach((done) => teardown(done));
  afterEach((done) => teardown(done));

  describe('getDb()', () => {
    it('should return a singleton instance', () => {
      const db1 = DbUtil.getDb();
      const db2 = DbUtil.getDb();
      expect(db1).to.equal(db2);
    });

    it('should expose the sqlite3 database object', () => {
      const db = DbUtil.getDb();
      expect(db.db).to.exist;
    });

    it('should not throw', () => {
      expect(() => DbUtil.getDb()).to.not.throw();
    });

    it('should create a new instance after singleton is reset', (done) => {
      const db1 = DbUtil.getDb();
      DbUtil.dbUtil = null;
      const db2 = DbUtil.getDb();
      expect(db1).to.not.equal(db2);
      // close the abandoned connection with a callback so it fully drains before afterEach deletes the file
      db1.db.close(done);
    });
  });

  describe('database schema', () => {
    let db;

    beforeEach((done) => {
      db = DbUtil.getDb();
      db.db.run('SELECT 1', done);
    });

    it('should have ServiceTime table with correct columns', (done) => {
      db.db.all('PRAGMA table_info(ServiceTime)', (err, columns) => {
        expect(err).to.be.null;
        const names = columns.map((c) => c.name);
        expect(names).to.include('problemRef');
        expect(names).to.include('policyRef');
        expect(names).to.include('duration');
        expect(names).to.include('dmRunId');
        done();
      });
    });

    it('should have Response table with correct columns', (done) => {
      db.db.all('PRAGMA table_info(Response)', (err, columns) => {
        expect(err).to.be.null;
        const names = columns.map((c) => c.name);
        expect(names).to.include('problemRef');
        expect(names).to.include('decision');
        expect(names).to.include('dmRunId');
        done();
      });
    });

    it('should have StacsRunControl table', (done) => {
      db.db.get(
        'SELECT name FROM sqlite_master WHERE type="table" AND name="StacsRunControl"',
        (err, row) => {
          expect(err).to.be.null;
          expect(row).to.exist;
          done();
        },
      );
    });

    it('should have DmRunControl table', (done) => {
      db.db.get(
        'SELECT name FROM sqlite_master WHERE type="table" AND name="DmRunControl"',
        (err, row) => {
          expect(err).to.be.null;
          expect(row).to.exist;
          done();
        },
      );
    });
  });

  describe('recordServiceTime()', () => {
    const mockPolReqData = {
      problemRef: 'test-problem',
      adjustSummary: 'test-summary',
      staticRef: 'test-static',
      policyRef: 'test-policy',
      policyVersion: 1,
      policySubRef: 'test-sub',
      contextRef: 'test-context',
      contextSubRef: 'test-sub-context',
      pdpVersion: 'njsPDP',
      server: 'test-server',
      nProc: 4,
      dmRunId: 1,
      stacsRunId: 0,
    };

    let db;

    beforeEach((done) => {
      db = DbUtil.getDb();
      db.polReqData = mockPolReqData;
      db.db.run('SELECT 1', done);
    });

    it('should insert a single service time record', (done) => {
      db.recordServiceTime([{
        req: 'req1.xml',
        time: [0, 1000000],
        rep: 1,
        memoryUsage: 1024000,
        dmRunId: 1,
        stacsRunId: 0,
      }]);

      db.db.get('SELECT COUNT(*) as count FROM ServiceTime', (err, row) => {
        expect(err).to.be.null;
        expect(row.count).to.equal(1);
        done();
      });
    });

    it('should insert multiple service time records', (done) => {
      db.recordServiceTime([
        { req: 'req1.xml', time: [0, 1000000], rep: 1, memoryUsage: 1024000, dmRunId: 1, stacsRunId: 0 },
        { req: 'req2.xml', time: [0, 2000000], rep: 2, memoryUsage: 2048000, dmRunId: 1, stacsRunId: 0 },
      ]);

      db.db.get('SELECT COUNT(*) as count FROM ServiceTime', (err, row) => {
        expect(err).to.be.null;
        expect(row.count).to.greaterThan(0);
        done();
      });
    });
  });
});
