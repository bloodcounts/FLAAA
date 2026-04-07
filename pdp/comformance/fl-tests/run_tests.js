const fs = require('fs');
const path = require('path');
const Luas = require('../../xacml/luas');

async function loadPDP() {
  const policyFile = path.resolve(__dirname, 'policyset_obligation.xml');
  console.log('🔧 Initializing PDP with policy:', policyFile);
  const luas = await Luas.create([policyFile]);
  return luas;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function formatDecision(decision) {
  const decisionMap = {
    0: 'Permit',
    1: 'Deny',
    2: 'NotApplicable',
    3: 'Indeterminate'
  };
  return decisionMap[decision] || decision;
}

function printTestResult(testId, expected, actual, pass, index, total) {
  const status = pass ? '✅ PASS' : '❌ FAIL';
  const expectedStr = formatDecision(expected);
  const actualStr = formatDecision(actual);
  const progress = `[${index + 1}/${total}]`;

  if (pass) {
    console.log(`${progress} ${testId}: ${status} (${actualStr})`);
  } else {
    console.log(`${progress} ${testId}: ${status} (expected: ${expectedStr}, got: ${actualStr})`);
  }
}

function printSummary(results, startTime) {
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => r.pass === false).length;
  const errors = results.filter(r => r.error).length;
  const duration = Date.now() - startTime;

  console.log('\n' + '='.repeat(60));
  console.log('📊 XACML CONFORMANCE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed:    ${passed}`);
  console.log(`❌ Failed:    ${failed}`);
  console.log(`⚠️  Errors:    ${errors}`);
  console.log(`⏱️  Duration:  ${duration}ms`);
  console.log('='.repeat(60));

  if (failed > 0 || errors > 0) {
    console.log('\n❌ FAILED/ERROR TESTS:');
    results.filter(r => !r.pass || r.error).forEach(r => {
      if (r.error) {
        console.log(`   ${r.test_id}: ⚠️  ERROR - ${r.error}`);
      } else {
        console.log(`   ${r.test_id}: ❌ FAIL (expected: ${formatDecision(r.expected)}, got: ${formatDecision(r.actual)})`);
      }
    });
  }

  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
  }
}

async function run() {
  const startTime = Date.now();
  const base = path.resolve(__dirname, 'xacml_test_cases');
  const jsonFile = path.join(base, 'test_cases.json');
  if (!fs.existsSync(jsonFile)) {
    console.error('❌ Cannot find', jsonFile);
    process.exit(2);
  }

  const tests = readJson(jsonFile);
  console.log(`🚀 Starting XACML Conformance Tests (${tests.length} tests)\n`);

  const luas = await loadPDP();
  const results = [];

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
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
      printTestResult(id, t.expected_decision, 'N/A', false, i, tests.length);
      continue;
    }

    try {
      // Temporarily suppress verbose XACML logs during testing
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      console.log = () => {};
      console.error = () => {};

      const out = await luas.evaluates(requestXml);

      // Restore console functions
      console.log = originalConsoleLog;
      console.error = originalConsoleError;

      const pass = out.decision === t.expected_decision;
      results.push({ test_id: id, expected: t.expected_decision, actual: out.decision, pass, details: out });
      printTestResult(id, t.expected_decision, out.decision, pass, i, tests.length);
    } catch (err) {
      results.push({ test_id: id, error: String(err), expected: t.expected_decision });
      printTestResult(id, t.expected_decision, 'ERROR', false, i, tests.length);
    }
  }

  printSummary(results, startTime);

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
