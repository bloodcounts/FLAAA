const { expect } = require('chai');
const sinon = require('sinon');
const crypto = require('crypto');
const DecisionLogger = require('../../utils/decisionLogger');

function canonicalStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalStringify(value[key])}`
  )).join(',')}}`;
}

describe('DecisionLogger hash-chain and checkpoints', () => {
  let mockFs;
  let mockPino;
  let mockLogger;
  let originalEnv;
  let appended;

  beforeEach(() => {
    originalEnv = { ...process.env };
    appended = [];

    mockFs = {
      existsSync: sinon.stub().returns(true),
      readFileSync: sinon.stub().callsFake((filePath) => (
        String(filePath).endsWith('.jsonl') ? '' : 'mock-key-content'
      )),
      mkdirSync: sinon.stub(),
      appendFileSync: sinon.stub().callsFake((filePath, data) => {
        appended.push({ filePath, data });
      }),
    };

    mockLogger = {
      info: sinon.stub(),
      error: sinon.stub(),
      warn: sinon.stub(),
      debug: sinon.stub(),
    };

    mockPino = sinon.stub().returns(mockLogger);
    mockPino.transport = sinon.stub().returns({});

    process.env.LOG_LEVEL = 'info';
    process.env.SIGNING_KID = 'test-key';
    process.env.SIGNING_ALG = 'ES256';
    delete process.env.REQUIRE_ES256_SIGNING;
    delete process.env.AUDIT_LOG_PATH;
    delete process.env.AUDIT_CHECKPOINT_EVERY;
  });

  afterEach(() => {
    process.env = originalEnv;
    sinon.restore();
  });

  function makeLogger(extraEnv = {}) {
    Object.assign(process.env, extraEnv);
    return new DecisionLogger({ fs: mockFs, pino: mockPino, disableFileTransport: true });
  }

  it('assigns a monotonically increasing sequence number starting at 1', () => {
    const logger = makeLogger();
    const first = logger.log('Permit', null, null);
    const second = logger.log('Permit', null, null);
    const third = logger.log('Deny', null, null);

    expect(first.pdpAudit.sequence).to.equal(1);
    expect(second.pdpAudit.sequence).to.equal(2);
    expect(third.pdpAudit.sequence).to.equal(3);
  });

  it('chains each record to the previous record hash, starting from genesis', () => {
    const logger = makeLogger();
    const first = logger.log('Permit', null, null);
    expect(first.pdpAudit.previous_event_hash).to.equal('0'.repeat(64));
    expect(first.event_hash).to.be.a('string').with.length(64);

    const second = logger.log('Permit', null, null);
    expect(second.pdpAudit.previous_event_hash).to.equal(first.event_hash);
  });

  it('produces a different event_hash if any field of the record differs', () => {
    const logger = makeLogger();
    const permit = logger.log('Permit', null, null);
    const logger2 = makeLogger();
    const deny = logger2.log('Deny', null, null);
    expect(permit.event_hash).to.not.equal(deny.event_hash);
  });

  it('hashes the exact JSON-persisted representation when decision fields are undefined', () => {
    const logger = makeLogger();
    const entry = logger.log({ decision: 'Permit', optionalField: undefined }, null, null);
    const persisted = JSON.parse(JSON.stringify(entry));
    const claimedHash = persisted.event_hash;
    delete persisted.event_hash;
    const recomputed = crypto.createHash('sha256')
      .update(canonicalStringify(persisted), 'utf8').digest('hex');
    expect(claimedHash).to.equal(recomputed);
  });

  it('writes a signed checkpoint every AUDIT_CHECKPOINT_EVERY records', () => {
    const logger = makeLogger({ AUDIT_LOG_PATH: '/tmp/audit.jsonl', AUDIT_CHECKPOINT_EVERY: '3' });
    logger.log('Permit', null, null);
    logger.log('Permit', null, null);
    const third = logger.log('Permit', null, null);

    const checkpointWrites = appended.filter((a) => a.filePath === '/tmp/audit.jsonl.checkpoints.jsonl');
    expect(checkpointWrites).to.have.length(1);
    const checkpoint = JSON.parse(checkpointWrites[0].data);
    expect(checkpoint.checkpoint_sequence).to.equal(3);
    expect(checkpoint.event_hash).to.equal(third.event_hash);
  });

  it('does not write a checkpoint file when AUDIT_LOG_PATH is not set', () => {
    const logger = makeLogger({ AUDIT_CHECKPOINT_EVERY: '1' });
    logger.log('Permit', null, null);
    expect(appended).to.have.length(0);
  });
});
