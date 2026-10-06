const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const sinon = require('sinon');
const DecisionLogger = require('../../utils/decisionLogger');
const { verifyAudit } = require('../../scripts/verify_audit');

function readJsonl(filename) {
  return fs.readFileSync(filename, 'utf8').split('\n').filter((line) => line.trim()).map(JSON.parse);
}

describe('Signed audit verification and recovery', () => {
  let directory;
  let previousEnv;
  let publicKeys;
  let mockPino;
  const makeLogger = () => new DecisionLogger({ pino: mockPino, disableFileTransport: true });

  function rotateKey(kid) {
    const pair = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    const filename = path.join(directory, `${kid}.pem`);
    fs.writeFileSync(filename, pair.privateKey);
    process.env.SIGNING_KEY_PATH = filename;
    process.env.SIGNING_KID = kid;
    publicKeys.set(kid, pair.publicKey);
  }

  beforeEach(() => {
    previousEnv = { ...process.env };
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'flaaa-audit-'));
    publicKeys = new Map();
    mockPino = sinon.stub().returns({ info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() });
    Object.assign(process.env, {
      REQUIRE_ES256_SIGNING: 'true', DECISION_AUDIT_ENABLED: 'true', SIGNING_ALG: 'ES256',
      AUDIT_LOG_PATH: path.join(directory, 'audit.jsonl'),
      AUDIT_CHECKPOINT_PATH: path.join(directory, 'anchors.jsonl'), AUDIT_CHECKPOINT_EVERY: '2',
    });
    rotateKey('key-1');
  });

  afterEach(() => {
    process.env = previousEnv;
    fs.rmSync(directory, { recursive: true, force: true });
    sinon.restore();
  });

  function appendRecords() {
    const logger = makeLogger();
    logger.log('Permit', null, { action: 'train', task_id: 'study', node_id: '123' });
    logger.log('Deny', null, { action: 'aggregate', task_id: 'study', node_id: '123' });
    return logger;
  }

  it('verifies ES256 records and anchors across restart and key rotation', () => {
    appendRecords();
    rotateKey('key-2');
    const logger = makeLogger();
    logger.log('Permit', null, {});
    logger.log('Permit', null, {});
    const entries = readJsonl(process.env.AUDIT_LOG_PATH);
    const anchors = readJsonl(process.env.AUDIT_CHECKPOINT_PATH);
    expect(verifyAudit(entries, anchors, publicKeys)).to.deep.equal({
      ok: true, records: 4, checkpoints: 2, lastAnchoredSequence: 4,
    });
    expect(entries[0].pdpAudit.subject).to.equal('123');
    expect(entries[0].pdpAudit.resource).to.equal('study');
    expect(entries[0].pdpAudit.action).to.equal('train');
    publicKeys.delete('key-1');
    expect(() => verifyAudit(entries, anchors, publicKeys)).to.throw('key id');
  });

  it('rejects edits, deleted and reordered records, forged anchors, and anchored truncation', () => {
    appendRecords();
    const entries = readJsonl(process.env.AUDIT_LOG_PATH);
    const anchors = readJsonl(process.env.AUDIT_CHECKPOINT_PATH);
    const edited = JSON.parse(JSON.stringify(entries));
    edited[0].pdpAudit.decision = 'Deny';
    expect(() => verifyAudit(edited, anchors, publicKeys)).to.throw('payload mismatch');
    expect(() => verifyAudit(entries.slice(1), anchors, publicKeys)).to.throw('discontinuity');
    expect(() => verifyAudit([...entries].reverse(), anchors, publicKeys)).to.throw('discontinuity');
    expect(() => verifyAudit(entries.slice(0, 1), anchors, publicKeys)).to.throw('truncation');
    expect(() => verifyAudit(entries, [{ ...anchors[0], event_hash: 'f'.repeat(64) }], publicKeys)).to.throw('signature');
  });

  it('refuses recovery from corruption or a deleted anchored audit log', () => {
    appendRecords();
    fs.writeFileSync(process.env.AUDIT_LOG_PATH, '{}\n');
    expect(makeLogger).to.throw('Cannot resume audit chain');
    fs.unlinkSync(process.env.AUDIT_LOG_PATH);
    expect(makeLogger).to.throw('retained checkpoints');
  });

  it('preserves sequence on append failure and stops mandatory writes', () => {
    const logger = appendRecords();
    sinon.stub(logger.fs, 'appendFileSync').throws(new Error('disk full'));
    expect(() => logger.log('Permit', null, {})).to.throw('disk full');
    expect(logger.sequence).to.equal(2);
    expect(() => logger.log('Permit', null, {})).to.throw('Audit writer stopped');
  });

  it('rejects disabled mandatory accounting and invalid checkpoint intervals', () => {
    process.env.DECISION_AUDIT_ENABLED = 'false';
    expect(makeLogger).to.throw('Mandatory audit signing');
    process.env.DECISION_AUDIT_ENABLED = 'true';
    process.env.AUDIT_CHECKPOINT_EVERY = '-1';
    expect(makeLogger).to.throw('positive integer');
  });
});
