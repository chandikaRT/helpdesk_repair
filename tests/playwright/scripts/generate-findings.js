#!/usr/bin/env node
/**
 * generate-findings.js
 *
 * Reads tests/playwright/reports/results.json (Playwright JSON reporter output)
 * and produces tests/playwright/reports/findings.html — a self-contained offline
 * HTML report with:
 *  - Summary table (total/passed/failed/skipped/duration)
 *  - Per-workflow collapsible sections (one per spec file)
 *  - Consolidated Failures section with error messages and inline screenshots
 *  - Coverage matrix: which repair flow each test covers
 */

const fs   = require('fs');
const path = require('path');

const REPORTS_DIR  = path.join(__dirname, '..', 'reports');
const INPUT_FILE   = path.join(REPORTS_DIR, 'results.json');
const OUTPUT_FILE  = path.join(REPORTS_DIR, 'findings.html');

// ---------------------------------------------------------------------------
// Coverage matrix definition
// ---------------------------------------------------------------------------
const FLOWS = ['RUG', 'External-not-RUG', 'With-Serial', 'Without-Serial', 'Diagnosis', 'Stage', 'Cancel/Reopen', 'Menus'];

const SPEC_FLOW_MAP = {
  '00-master-data.spec.js':        ['RUG', 'External-not-RUG', 'With-Serial', 'Without-Serial'],
  '01-rug-flow.spec.js':           ['RUG'],
  '02-external-not-rug.spec.js':   ['External-not-RUG'],
  '03-normal-with-serial.spec.js': ['With-Serial', 'Diagnosis'],
  '04-normal-without-serial.spec.js': ['Without-Serial'],
  '05-diagnosis-tab.spec.js':      ['Diagnosis'],
  '06-stage-progression.spec.js':  ['Stage'],
  '07-cancel-reopen.spec.js':      ['Cancel/Reopen'],
  '08-menus.spec.js':              ['Menus'],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escape(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusBadge(status) {
  const map = {
    passed:    ['PASS',  '#2d9e52', '#e6f9ee'],
    failed:    ['FAIL',  '#d94040', '#fdecea'],
    skipped:   ['SKIP',  '#888',    '#f5f5f5'],
    timedOut:  ['TIMEOUT','#c46b00','#fff3e0'],
    unexpected:['FAIL',  '#d94040', '#fdecea'],
    expected:  ['PASS',  '#2d9e52', '#e6f9ee'],
  };
  const [label, color, bg] = map[status] ?? ['UNKNOWN', '#555', '#eee'];
  return `<span style="background:${bg};color:${color};border:1px solid ${color};border-radius:3px;padding:2px 7px;font-size:11px;font-weight:700;white-space:nowrap">${label}</span>`;
}

function fmtMs(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function specBasename(titlePath) {
  if (!titlePath || !titlePath.length) return 'unknown';
  const first = titlePath[0] ?? '';
  return path.basename(first);
}

// ---------------------------------------------------------------------------
// Parse Playwright JSON results
// ---------------------------------------------------------------------------
function parseResults(data) {
  const suites   = [];
  const failures = [];
  let totalPassed  = 0;
  let totalFailed  = 0;
  let totalSkipped = 0;
  let totalDuration = 0;

  function walkSuite(suite, parentFile) {
    const file = suite.file ?? parentFile ?? '';
    const baseName = path.basename(file);

    if (suite.specs && suite.specs.length) {
      let suiteSummary = suites.find(s => s.file === baseName);
      if (!suiteSummary) {
        suiteSummary = { file: baseName, title: suite.title ?? baseName, tests: [] };
        suites.push(suiteSummary);
      }

      for (const spec of suite.specs) {
        for (const test of (spec.tests ?? [])) {
          const result = (test.results ?? [])[0] ?? {};
          const status   = result.status ?? test.status ?? 'unknown';
          const duration = result.duration ?? 0;
          const errors   = result.errors ?? [];
          const attachments = result.attachments ?? [];

          const normalised =
            status === 'expected'   ? 'passed'  :
            status === 'unexpected' ? 'failed'  :
            status === 'skipped'    ? 'skipped' :
            status;

          totalDuration += duration;
          if (normalised === 'passed')  totalPassed++;
          else if (normalised === 'failed') totalFailed++;
          else if (normalised === 'skipped') totalSkipped++;

          const entry = {
            title:    spec.title ?? test.title ?? '(unnamed)',
            status:   normalised,
            duration,
            errors,
            attachments,
            file:     baseName,
          };

          suiteSummary.tests.push(entry);

          if (normalised === 'failed') {
            failures.push(entry);
          }
        }
      }
    }

    for (const child of (suite.suites ?? [])) {
      walkSuite(child, file);
    }
  }

  for (const suite of (data.suites ?? [])) {
    walkSuite(suite);
  }

  // Fallback: use stats block if present
  if (data.stats) {
    const s = data.stats;
    if (!totalPassed && !totalFailed) {
      totalPassed  = s.expected  ?? 0;
      totalFailed  = s.unexpected ?? 0;
      totalSkipped = s.skipped   ?? 0;
      totalDuration = s.duration ?? 0;
    }
  }

  const totalTests = totalPassed + totalFailed + totalSkipped;

  return { suites, failures, totalTests, totalPassed, totalFailed, totalSkipped, totalDuration };
}

// ---------------------------------------------------------------------------
// Inline screenshot as base64
// ---------------------------------------------------------------------------
function inlineScreenshot(attachments) {
  const shot = (attachments ?? []).find(a =>
    a.contentType?.startsWith('image/') && a.path
  );
  if (!shot) return '';
  try {
    const data = fs.readFileSync(shot.path);
    const b64  = data.toString('base64');
    return `<img src="data:${shot.contentType};base64,${b64}" style="max-width:100%;border:1px solid #ddd;border-radius:4px;margin-top:8px" alt="failure screenshot">`;
  } catch {
    return `<em style="color:#888">(screenshot not found: ${escape(shot.path)})</em>`;
  }
}

// ---------------------------------------------------------------------------
// HTML builder
// ---------------------------------------------------------------------------
function buildHtml(parsed) {
  const { suites, failures, totalTests, totalPassed, totalFailed, totalSkipped, totalDuration } = parsed;
  const passRate = totalTests ? Math.round((totalPassed / totalTests) * 100) : 0;
  const statusColor = totalFailed > 0 ? '#d94040' : '#2d9e52';

  // ── Coverage matrix rows ──────────────────────────────────────────────────
  function coverageRow(spec) {
    const coveredFlows = SPEC_FLOW_MAP[spec.file] ?? [];
    const cells = FLOWS.map(flow => {
      const covered = coveredFlows.includes(flow);
      const suiteTests = spec.tests ?? [];
      const allPass = suiteTests.length > 0 && suiteTests.every(t => t.status === 'passed');
      const anyFail = suiteTests.some(t => t.status === 'failed');
      let bg = '#f5f5f5';
      let label = '—';
      if (covered) {
        if (anyFail)      { bg = '#fdecea'; label = '✗'; }
        else if (allPass) { bg = '#e6f9ee'; label = '✓'; }
        else              { bg = '#fff3e0'; label = '~'; }
      }
      return `<td style="text-align:center;background:${bg};padding:6px 10px">${label}</td>`;
    });
    return `<tr><td style="padding:6px 10px;white-space:nowrap">${escape(spec.file)}</td>${cells.join('')}</tr>`;
  }

  // ── Per-suite sections ────────────────────────────────────────────────────
  const suiteSections = suites.map((suite, si) => {
    const passed  = suite.tests.filter(t => t.status === 'passed').length;
    const failed  = suite.tests.filter(t => t.status === 'failed').length;
    const skipped = suite.tests.filter(t => t.status === 'skipped').length;
    const summaryColor = failed > 0 ? '#d94040' : '#2d9e52';

    const rows = suite.tests.map(t => {
      const errHtml = t.errors.length
        ? `<pre style="font-size:11px;background:#fafafa;border:1px solid #eee;padding:8px;border-radius:4px;overflow:auto;white-space:pre-wrap;margin:6px 0">${escape(t.errors.map(e => e.message ?? '').join('\n\n'))}</pre>${inlineScreenshot(t.attachments)}`
        : '';
      return `
        <tr>
          <td style="padding:6px 10px">${statusBadge(t.status)}</td>
          <td style="padding:6px 10px">${escape(t.title)}</td>
          <td style="padding:6px 10px;text-align:right;color:#666">${fmtMs(t.duration)}</td>
        </tr>
        ${errHtml ? `<tr><td colspan="3" style="padding:0 10px 10px 10px">${errHtml}</td></tr>` : ''}
      `;
    }).join('');

    return `
      <details id="suite-${si}" style="margin-bottom:16px;border:1px solid #e0e0e0;border-radius:6px;overflow:hidden">
        <summary style="cursor:pointer;padding:12px 16px;background:#fafafa;font-weight:600;display:flex;justify-content:space-between;align-items:center;list-style:none">
          <span>${escape(suite.file)}</span>
          <span style="color:${summaryColor};font-size:13px">${passed} passed / ${failed} failed / ${skipped} skipped</span>
        </summary>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#f0f0f0">
              <th style="padding:8px 10px;text-align:left;width:80px">Status</th>
              <th style="padding:8px 10px;text-align:left">Test</th>
              <th style="padding:8px 10px;text-align:right;width:80px">Duration</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </details>
    `;
  }).join('');

  // ── Failures section ──────────────────────────────────────────────────────
  const failureItems = failures.map((f, fi) => `
    <div style="margin-bottom:20px;border:1px solid #f5c5c5;border-radius:6px;overflow:hidden">
      <div style="padding:10px 16px;background:#fdecea;font-weight:600;display:flex;justify-content:space-between">
        <span>${escape(f.file)} › ${escape(f.title)}</span>
        <span style="color:#888;font-size:12px">${fmtMs(f.duration)}</span>
      </div>
      <div style="padding:12px 16px">
        ${f.errors.map(e => `
          <pre style="font-size:12px;background:#fafafa;border:1px solid #eee;padding:10px;border-radius:4px;overflow:auto;white-space:pre-wrap">${escape(e.message ?? '')}${e.stack ? '\n\n' + escape(e.stack) : ''}</pre>
        `).join('')}
        ${inlineScreenshot(f.attachments)}
      </div>
    </div>
  `).join('');

  const failuresSection = failures.length
    ? `<h2 style="margin-top:32px">Failed Tests (${failures.length})</h2>${failureItems}`
    : `<p style="color:#2d9e52;padding:12px;background:#e6f9ee;border-radius:6px">✓ No failures</p>`;

  // ── Coverage matrix ───────────────────────────────────────────────────────
  const headerCells = FLOWS.map(f => `<th style="padding:8px 10px;white-space:nowrap">${escape(f)}</th>`).join('');
  const matrixRows  = suites.map(coverageRow).join('');

  // ── Full document ─────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Helpdesk Repair – E2E Test Findings</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#222; margin:0; padding:24px; background:#fff; }
  h1 { font-size:22px; margin-bottom:4px; }
  h2 { font-size:16px; margin-top:28px; margin-bottom:12px; border-bottom:2px solid #e0e0e0; padding-bottom:6px; }
  table { width:100%; border-collapse:collapse; }
  th,td { border:1px solid #e0e0e0; }
  th { background:#f5f5f5; font-size:12px; font-weight:600; }
  details > summary::-webkit-details-marker { display:none; }
  pre { margin:0; }
</style>
</head>
<body>
<h1>Helpdesk Repair – E2E Test Findings</h1>
<p style="color:#666;font-size:13px;margin-top:2px">Generated: ${new Date().toISOString()}</p>

<h2>Summary</h2>
<table style="font-size:14px;width:auto">
  <thead><tr>
    <th style="padding:8px 14px">Total</th>
    <th style="padding:8px 14px">Passed</th>
    <th style="padding:8px 14px">Failed</th>
    <th style="padding:8px 14px">Skipped</th>
    <th style="padding:8px 14px">Duration</th>
    <th style="padding:8px 14px">Pass Rate</th>
  </tr></thead>
  <tbody><tr>
    <td style="padding:8px 14px;text-align:center">${totalTests}</td>
    <td style="padding:8px 14px;text-align:center;color:#2d9e52;font-weight:700">${totalPassed}</td>
    <td style="padding:8px 14px;text-align:center;color:${statusColor};font-weight:700">${totalFailed}</td>
    <td style="padding:8px 14px;text-align:center;color:#888">${totalSkipped}</td>
    <td style="padding:8px 14px;text-align:center">${fmtMs(totalDuration)}</td>
    <td style="padding:8px 14px;text-align:center;font-weight:700;color:${statusColor}">${passRate}%</td>
  </tr></tbody>
</table>

<h2>Coverage Matrix</h2>
<div style="overflow-x:auto">
  <table style="font-size:12px;width:auto">
    <thead><tr>
      <th style="padding:8px 10px;text-align:left">Spec File</th>
      ${headerCells}
    </tr></thead>
    <tbody>${matrixRows}</tbody>
  </table>
</div>

<h2>Results by Spec File</h2>
${suiteSections}

${failuresSection}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`[generate-findings] Input not found: ${INPUT_FILE}`);
    console.error('Run "npm test" first to generate results.json.');
    process.exit(1);
  }

  const raw  = fs.readFileSync(INPUT_FILE, 'utf8');
  const data = JSON.parse(raw);
  const parsed = parseResults(data);
  const html   = buildHtml(parsed);

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, html, 'utf8');

  console.log(`[generate-findings] Written: ${OUTPUT_FILE}`);
  console.log(`  Total: ${parsed.totalTests}  Passed: ${parsed.totalPassed}  Failed: ${parsed.totalFailed}  Skipped: ${parsed.totalSkipped}`);
}

main();
