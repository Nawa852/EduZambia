#!/usr/bin/env node
/**
 * Role-based route crawler.
 *
 * Visits every route registered in src/App.tsx once per stakeholder role and
 * reports broken pages, console errors, failed API calls and empty shells.
 *
 * Usage:
 *   node scripts/crawl-routes.mjs                       # all roles
 *   node scripts/crawl-routes.mjs --roles student,teacher
 *   node scripts/crawl-routes.mjs --base http://localhost:8080 --out /tmp/crawl.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const BASE = arg('base', 'http://localhost:8080');
const OUT = arg('out', 'crawl-report.json');
const ROLES = arg(
  'roles',
  'student,teacher,guardian,institution,ministry,doctor,entrepreneur,developer,skills,cybersecurity',
).split(',');
const TIMEOUT = Number(arg('timeout', '15000'));
const THIN_THRESHOLD = Number(arg('thin', '400'));

/** Extract route paths from App.tsx. */
function collectRoutes() {
  const src = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const paths = new Set();
  for (const m of src.matchAll(/<Route\s+path=["']([^"']+)["']/g)) {
    let p = m[1];
    if (p === '*') continue;
    // Give params concrete sample values so the page actually renders.
    p = p.replace(/:[A-Za-z0-9_]+/g, 'demo');
    if (!p.startsWith('/')) p = `/${p}`;
    paths.add(p);
  }
  return [...paths].sort();
}

async function crawlRole(browser, role, routes) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1800 } });
  const page = await context.newPage();

  // Enter demo mode as this role so guards resolve without real credentials.
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate((r) => {
    localStorage.setItem('edu-zambia-demo', 'true');
    sessionStorage.setItem('demo_mode', 'true');
    sessionStorage.setItem('demo_role', r);
    sessionStorage.setItem('demo_started', String(Date.now()));
  }, role);

  const results = [];
  for (const route of routes) {
    const consoleErrors = [];
    const failedRequests = [];
    const onConsole = (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
    };
    const onResponse = (r) => {
      if (r.status() >= 400) failedRequests.push({ status: r.status(), url: r.url().slice(0, 300) });
    };
    page.on('console', onConsole);
    page.on('response', onResponse);

    let bodyLength = 0;
    let error = null;
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: TIMEOUT });
      await page.waitForTimeout(800);
      const text = await page.innerText('body');
      bodyLength = text.length;
      if (/Loading your experience/i.test(text)) error = 'stuck-loader';
      if (/Something went wrong|Application error/i.test(text)) error = 'error-boundary';
    } catch (e) {
      error = `navigation: ${String(e.message).slice(0, 160)}`;
    }

    page.off('console', onConsole);
    page.off('response', onResponse);

    const apiFailures = failedRequests.filter((r) => /supabase|functions\/v1|\/api\//.test(r.url));
    const status =
      error ? 'broken'
      : apiFailures.length ? 'api-error'
      : bodyLength < THIN_THRESHOLD ? 'thin'
      : consoleErrors.length ? 'warn'
      : 'ok';

    results.push({ role, route, status, bodyLength, error, consoleErrors, failedRequests, apiFailures });
    process.stdout.write(status === 'ok' ? '.' : status === 'warn' ? '!' : 'X');
  }

  await context.close();
  process.stdout.write('\n');
  return results;
}

async function main() {
  const routes = collectRoutes();
  console.log(`Crawling ${routes.length} routes x ${ROLES.length} roles = ${routes.length * ROLES.length} checks\n`);

  const browser = await chromium.launch({ headless: true });
  const all = [];
  for (const role of ROLES) {
    console.log(`— role: ${role}`);
    all.push(...(await crawlRole(browser, role, routes)));
  }
  await browser.close();

  const broken = all.filter((r) => r.status === 'broken');
  const apiErrors = all.filter((r) => r.status === 'api-error');
  const thin = all.filter((r) => r.status === 'thin');
  const warn = all.filter((r) => r.status === 'warn');

  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    totals: {
      checks: all.length,
      routes: routes.length,
      roles: ROLES.length,
      ok: all.length - broken.length - apiErrors.length - thin.length - warn.length,
      broken: broken.length,
      apiErrors: apiErrors.length,
      thin: thin.length,
      warn: warn.length,
    },
    results: all,
  };
  writeFileSync(OUT, JSON.stringify(report, null, 2));

  console.log('\n=== Crawl summary ===');
  console.table(report.totals);
  const show = (label, list) => {
    if (!list.length) return;
    console.log(`\n${label}:`);
    list.slice(0, 40).forEach((r) => console.log(`  [${r.role}] ${r.route} — ${r.error ?? r.apiFailures?.[0]?.url ?? `${r.bodyLength} chars`}`));
    if (list.length > 40) console.log(`  …and ${list.length - 40} more`);
  };
  show('BROKEN', broken);
  show('API FAILURES', apiErrors);
  show('THIN PAGES', thin);
  console.log(`\nFull report written to ${OUT}`);

  process.exit(broken.length || apiErrors.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
