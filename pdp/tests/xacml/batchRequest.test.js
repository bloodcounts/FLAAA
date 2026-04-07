const { expect } = require('chai');
const sinon = require('sinon');
const BatchRequest = require('../../xacml/batchRequest');

describe('BatchRequest', function() {
  let batchRequest;
  let fsStub;
  let osStub;
  let sqlite3Stub;
  let shelljsStub;
  let consoleStub;
  let processStub;
  let setTimeoutStub;
  let dbMock;

  beforeEach(function() {
    // Create stubs for all dependencies
    fsStub = {
      existsSync: sinon.stub(),
      mkdirSync: sinon.stub()
    };

    osStub = {
      cpus: sinon.stub().returns([{ model: 'Intel CPU', speed: 2400 }])
    };

    dbMock = {
      serialize: sinon.stub(),
      run: sinon.stub(),
      prepare: sinon.stub().returns({
        run: sinon.stub(),
        finalize: sinon.stub()
      }),
      close: sinon.stub()
    };

    sqlite3Stub = {
      Database: sinon.stub().returns(dbMock)
    };

    shelljsStub = {
      exec: sinon.stub()
    };

    consoleStub = {
      time: sinon.stub(),
      timeEnd: sinon.stub(),
      log: sinon.stub()
    };

    processStub = {
      memoryUsage: sinon.stub().returns({ heapUsed: 1024000 })
    };

    setTimeoutStub = sinon.stub();

    // Create BatchRequest instance with mocked dependencies
    batchRequest = new BatchRequest({
      fs: fsStub,
      os: osStub,
      sqlite3: sqlite3Stub,
      shelljs: shelljsStub,
      console: consoleStub,
      process: processStub,
      setTimeout: setTimeoutStub
    });
  });

  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const defaultBatchRequest = new BatchRequest();
      expect(defaultBatchRequest.resultDir).to.equal('../result');
      expect(defaultBatchRequest.dbPath).to.equal('../result/result');
      expect(defaultBatchRequest.rep).to.equal(0);
      expect(defaultBatchRequest.stacsRunId).to.equal(1);
      expect(defaultBatchRequest.dmRunId).to.equal(2);
      expect(defaultBatchRequest.server).to.equal('atlasserver');
      expect(defaultBatchRequest.delay).to.equal(500);
      expect(defaultBatchRequest.iterations).to.equal(9);
    });

    it('should accept custom options', function() {
      const customBatchRequest = new BatchRequest({
        resultDir: '/custom/result',
        rep: 5,
        server: 'custom-server'
      });
      expect(customBatchRequest.resultDir).to.equal('/custom/result');
      expect(customBatchRequest.rep).to.equal(5);
      expect(customBatchRequest.server).to.equal('custom-server');
    });
  });

  describe('Database Setup', function() {
    it('should create result directory when it does not exist', function() {
      fsStub.existsSync.withArgs('../result').returns(false);

      batchRequest.initializeDatabase();

      expect(fsStub.mkdirSync.calledWith('../result')).to.be.true;
    });

    it('should not create result directory when it already exists', function() {
      fsStub.existsSync.withArgs('../result').returns(true);

      batchRequest.initializeDatabase();

      expect(fsStub.mkdirSync.notCalled).to.be.true;
    });

    it('should create database tables when database does not exist', function() {
      fsStub.existsSync.withArgs('../result').returns(true);
      fsStub.existsSync.withArgs('../result/result').returns(false);

      dbMock.serialize.callsFake((callback) => callback());

      batchRequest.initializeDatabase();

      expect(sqlite3Stub.Database.calledWith('../result/result')).to.be.true;
      expect(dbMock.serialize.calledOnce).to.be.true;
      expect(dbMock.run.callCount).to.equal(5); // 5 CREATE TABLE statements
      expect(consoleStub.log.calledWith('Creating tables in sqlite')).to.be.true;
    });

    it('should use existing database when it already exists', function() {
      fsStub.existsSync.withArgs('../result').returns(true);
      fsStub.existsSync.withArgs('../result/result').returns(true);

      batchRequest.initializeDatabase();

      expect(sqlite3Stub.Database.calledWith('../result/result')).to.be.true;
      expect(dbMock.serialize.notCalled).to.be.true;
      expect(consoleStub.log.calledWith('db exists')).to.be.true;
    });
  });

  describe('Timestamp Generation', function() {
    it('should generate proper timestamp format', function() {
      const mockDate = new Date(2026, 2, 1, 12, 30, 45); // March 1, 2026, 12:30:45
      const timestamp = batchRequest.generateTimestamp(mockDate);

      // Expected format: YYYYMMDD_HHMMSS
      expect(timestamp).to.match(/^\d{8}_\d{6}$/);
      expect(timestamp).to.equal('20260301_123045');
    });
  });

  describe('Batch Processing', function() {
    beforeEach(function() {
      // Setup database as initialized
      batchRequest.db = dbMock;
    });

    it('should execute PDP tests in a loop', async function() {
      await batchRequest.executeBatch();

      expect(shelljsStub.exec.callCount).to.equal(9);
      for (let i = 0; i < 9; i++) {
        expect(shelljsStub.exec.getCall(i).calledWith(`node --max-old-space-size=3072 xacml/pdpTest.js --rep ${i}`)).to.be.true;
      }

      expect(consoleStub.time.calledWith('njsPDP-total-running-time')).to.be.true;
      expect(consoleStub.timeEnd.calledWith('njsPDP-total-running-time')).to.be.true;
      expect(consoleStub.log.calledWith('njsPDP starts processing')).to.be.true;
      expect(consoleStub.log.calledWith('njsPDP finished processing')).to.be.true;
    });

    it('should record run control data', async function() {
      await batchRequest.executeBatch();

      expect(dbMock.prepare.callCount).to.equal(2);
      expect(dbMock.close.calledOnce).to.be.true;
    });

    it('should calculate memory usage in KB', async function() {
      processStub.memoryUsage.returns({ heapUsed: 2048000 }); // 2MB

      await batchRequest.executeBatch();

      const prepareCall = dbMock.prepare.getCall(0);
      const preparedStatement = prepareCall.returnValue;
      const runCall = preparedStatement.run.getCall(0);

      expect(runCall.args[3]).to.equal('2048KB'); // 2048000 / 1000 = 2048
    });
  });

  describe('Run Method', function() {
    it('should delay execution using setTimeout', async function() {
      setTimeoutStub.callsFake((callback) => callback());

      const promise = batchRequest.run();

      expect(setTimeoutStub.calledWith(sinon.match.func, 500)).to.be.true;

      await promise;
      expect(batchRequest.db).to.not.be.null;
    });

    it('should respect custom delay', async function() {
      const customBatchRequest = new BatchRequest({
        delay: 1000,
        fs: fsStub,
        os: osStub,
        sqlite3: sqlite3Stub,
        shelljs: shelljsStub,
        console: consoleStub,
        process: processStub,
        setTimeout: setTimeoutStub
      });

      setTimeoutStub.callsFake((callback) => callback());

      await customBatchRequest.run();

      expect(setTimeoutStub.calledWith(sinon.match.func, 1000)).to.be.true;
    });
  });

  describe('System Information', function() {
    it('should detect number of CPUs', function() {
      expect(batchRequest.numCPUs).to.equal(1); // From our mock
    });
  });

  describe('Configuration Constants', function() {
    it('should have correct default values', function() {
      expect(batchRequest.rep).to.equal(0);
      expect(batchRequest.stacsRunId).to.equal(1);
      expect(batchRequest.dmRunId).to.equal(2);
      expect(batchRequest.server).to.equal('atlasserver');
      expect(batchRequest.iterations).to.equal(9);
      expect(batchRequest.pdpCommand).to.equal('node --max-old-space-size=3072 xacml/pdpTest.js --rep');
    });
  });
});