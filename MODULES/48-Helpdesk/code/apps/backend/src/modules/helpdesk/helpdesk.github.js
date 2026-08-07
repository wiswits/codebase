'use strict';
/**
 * Ticket → GitHub issue bridge.
 *
 * Why it exists: a ticket sitting in a database is not work anybody is doing.
 * An issue in github.com/wiswits/wiswits-code, carrying the page, the module,
 * the failed API call and the JS error, is something that can be picked up and
 * fixed without asking the reporter a single follow-up question.
 *
 * ENTIRELY OPTIONAL. With no GITHUB_TOKEN set, every function here no-ops and
 * the helpdesk works exactly as before — mirroring must never be able to break
 * ticket creation. Nothing here throws to its caller.
 *
 * Uses fetch (Node 18+) — no new dependency for one REST call.
 *
 * .env:
 *   GITHUB_TOKEN=<a fine-grained PAT with Issues: read+write on that repo ONLY>
 *   GITHUB_REPO=wiswits/wiswits-code        (optional, this is the default)
 */
const logger = require('../../utils/logger');

const REPO = process.env.GITHUB_REPO || 'wiswits/wiswits-code';
const TOKEN = process.env.GITHUB_TOKEN || '';
const API = 'https://api.github.com';

const enabled = () => !!TOKEN;

const SEV_LABEL = { P1: 'priority: P1', P2: 'priority: P2', P3: 'priority: P3' };

/** The issue body: everything needed to reproduce, nothing the reporter had to type. */
function issueBody(ticket, context) {
  const crumbs = Array.isArray(context?.breadcrumbs) ? context.breadcrumbs : [];
  const lines = [
    `**Reported by** ${ticket.reporter_name || '—'} (${ticket.reporter_role || '—'}) · org ${ticket.org_id}`,
    `**Page** \`${ticket.page_url || '—'}\``,
    `**Module** ${ticket.module_slug || '—'}${ticket.section ? ` › ${ticket.section}` : ''}`,
    `**Build** \`${ticket.app_build || 'unknown'}\``,
  ];

  // Where to start looking. Every line here is a GUESS — the area is the
  // nearest tagged ancestor of whatever was last clicked, the file comes from a
  // hand-maintained manifest, and the RC code is a keyword match. They are
  // labelled "likely" so nobody reads them as findings, and each is omitted
  // entirely when we have nothing rather than printed as an em dash that looks
  // like an answer.
  const likely = [
    ticket.area_path ? `\`${ticket.area_path}\`` : null,
    ticket.nearest_element ? `last touched: "${ticket.nearest_element}"` : null,
    ticket.source_file_hint ? `likely file: \`${ticket.source_file_hint}\`` : null,
    ticket.suggested_rc_code ? `possibly ${ticket.suggested_rc_code} (PLATFORM_STANDARDS §30)` : null,
  ].filter(Boolean);
  if (likely.length) lines.push(`**Likely location** ${likely.join(' · ')}`);

  lines.push(
    '',
    '### What they said',
    ticket.description || '—',
  );
  if (crumbs.length) {
    lines.push('', '### What failed just before', '```',
      ...crumbs.map((b) => `[${b.kind}] ${b.detail}`), '```');
  }
  if (context?.viewport || context?.user_agent) {
    lines.push('', `**Device** ${context.viewport || ''} ${context.user_agent || ''}`.trim());
  }
  lines.push('', '---',
    `WisWits ticket ${ticket.ticket_no} · do not edit this line — the helpdesk matches on it.`);
  return lines.join('\n');
}

async function gh(method, path, body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`GitHub ${method} ${path} -> ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

/**
 * Open an issue for a ticket. Returns { number, url } or null.
 * Never throws — a GitHub outage must not cost us a bug report.
 */
async function createIssue(ticket, context) {
  if (!enabled()) return null;
  try {
    const issue = await gh('POST', `/repos/${REPO}/issues`, {
      title: `[${ticket.ticket_no}] ${ticket.title}`.slice(0, 250),
      body: issueBody(ticket, context),
      labels: ['helpdesk', SEV_LABEL[ticket.severity] || 'priority: P3',
               ...(ticket.module_slug ? [`module: ${ticket.module_slug}`] : [])],
    });
    logger.info('[HELPDESK] github issue opened', { ticket: ticket.ticket_no, issue: issue.number });
    return { number: issue.number, url: issue.html_url };
  } catch (e) {
    logger.warn('[HELPDESK] github issue failed:', e.message);
    return null;
  }
}

/** Note a status change on the issue, and close it when the ticket closes. */
async function syncStatus(ticket, status) {
  if (!enabled() || !ticket.github_issue_no) return;
  try {
    await gh('POST', `/repos/${REPO}/issues/${ticket.github_issue_no}/comments`,
      { body: `Helpdesk status → **${status}**` });
    if (status === 'closed') {
      await gh('PATCH', `/repos/${REPO}/issues/${ticket.github_issue_no}`, {
        state: 'closed', state_reason: 'completed',
      });
    }
  } catch (e) {
    logger.warn('[HELPDESK] github sync failed:', e.message);
  }
}

/**
 * The other direction: issues closed on GitHub whose ticket is still open.
 * Returns [{ ticket_id, issue_no }] for the caller to act on. Polled by
 * scripts/helpdesk_github_sync.js rather than a webhook, so there is no public
 * endpoint to secure for a once-a-day job.
 */
async function closedIssues(issueNumbers) {
  if (!enabled() || !issueNumbers.length) return [];
  const closed = [];
  for (const n of issueNumbers) {
    try {
      const issue = await gh('GET', `/repos/${REPO}/issues/${n}`);
      if (issue.state === 'closed') closed.push(n);
    } catch (e) {
      logger.warn(`[HELPDESK] github read #${n} failed:`, e.message);
    }
  }
  return closed;
}

module.exports = { enabled, createIssue, syncStatus, closedIssues, REPO };
