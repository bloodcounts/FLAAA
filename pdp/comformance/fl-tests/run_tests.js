const fs = require('fs');
const path = require('path');
const Luas = require('../../xacml/luas');

async function loadPDP() {
  const policyFile = path.resolve(__dirname, 'policyset_obligation.xml');
  console.log('Initializing PDP with policy:', policyFile);
  const luas = await Luas.prototype.getPDPInstance([policyFile]);
  return luas;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function run() {
  const base = path.resolve(__dirname, 'xacml_test_cases');
  const jsonFile = path.join(base, 'test_cases.json');
  if (!fs.existsSync(jsonFile)) {
    console.error('Cannot find', jsonFile);
    process.exit(2);
  }

  const tests = readJson(jsonFile);
  const luas = await loadPDP();
  const results = [];
  for (const t of tests) {
    const id = t.test_id;
    const xmlFile = path.join(base, `${id}.xml`);
    let requestXml;
    if (fs.existsSync(xmlFile)) {
      requestXml = fs.readFileSync(xmlFile, 'utf8');
    } else {
      // fallback: try E-TC or other naming
      const alt = fs.readdirSync(base).find(f => f.startsWith(id));
      if (alt) requestXml = fs.readFileSync(path.join(base, alt), 'utf8');
    }

    if (!requestXml) {
      results.push({ test_id: id, error: 'Request XML not found', expected: t.expected_decision });
      continue;
    }

    try {
      const out = await luas.evaluates(requestXml);
      const pass = out.decision === t.expected_decision;
      results.push({ test_id: id, expected: t.expected_decision, actual: out.decision, pass, details: out });
      console.log(`${id}: expected=${t.expected_decision} actual=${out.decision} ${pass ? 'PASS' : 'FAIL'}`);
    } catch (err) {
      results.push({ test_id: id, error: String(err), expected: t.expected_decision });
      console.error(id, 'error', err);
    }
  }

  const report = {
    run_at: new Date().toISOString(),
    policy: path.resolve(__dirname, '../policyset_obligation.xml'),
    total: results.length,
    passed: results.filter(r => r.pass).length,
    failed: results.filter(r => r.pass === false).length,
    items: results
  };

  const reportJson = path.join(base, 'test_report.json');
  fs.writeFileSync(reportJson, JSON.stringify(report, null, 2));

  // human-readable summary
  const md = [];
  md.push(`# XACML Test Run Report`);
  md.push(`Run at: ${report.run_at}`);
  md.push(`Policy: ${report.policy}`);
  md.push(`Total: ${report.total}  Passed: ${report.passed}  Failed: ${report.failed}`);
  md.push('');
  for (const r of results) {
    if (r.pass) md.push(`- ${r.test_id}: PASS (${r.actual})`);
    else if (r.error) md.push(`- ${r.test_id}: ERROR - ${r.error}`);
    else md.push(`- ${r.test_id}: FAIL (expected ${r.expected} got ${r.actual})`);
  }
  const mdFile = path.join(base, 'TEST_REPORT.md');
  fs.writeFileSync(mdFile, md.join('\n'));

  console.log(`\nReport written to ${reportJson} and ${mdFile}`);
}

run().catch(err => {
  console.error('Run failed:', err);
  process.exit(1);
});
