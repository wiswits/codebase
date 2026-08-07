'use strict';
const { success } = require('../../../utils/response');
const { audit } = require('../../../utils/audit');
const { AppError, asyncHandler } = require('../_kit');
const { getActiveSchool, getWriteSchool } = require('../../../utils/activeSchool');
const { resolveEventAudience, resolveRules } = require('../../../services/audience');
const eventService = require('../core/event.service');
const queries = require('./audience.queries');

/**
 * Every entry point re-reads the event through the SAME branch-scoped read the
 * rest of the module uses. Knowing an event id must not be enough to read or
 * rewrite who another campus is inviting — the second ring matters as much as
 * the first, which is the lesson migration 046 was written for.
 */
async function mustSeeEvent(req) {
  const event = await eventService.getEventById(
    req.params.eventId, req.user.org_id, await getActiveSchool(req));
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.');
  return event;
}

const getAudience = asyncHandler(async (req, res) => {
  await mustSeeEvent(req);
  const [rules, resolved, options] = await Promise.all([
    queries.listRules(req.user.org_id, req.params.eventId),
    resolveEventAudience(req.user.org_id, req.params.eventId),
    queries.pickerOptions(req.user.org_id),
  ]);
  // The ids themselves are not returned. The screen asks "how many and what
  // kind"; a list of every recipient's user id is a bigger answer than the
  // question and belongs to delivery, not to the picker.
  return success(res, {
    rules,
    counts: resolved.counts,
    wholeOrg: resolved.wholeOrg,
    options,
  }, 'Audience fetched');
});

const setAudience = asyncHandler(async (req, res) => {
  const event = await mustSeeEvent(req);
  const rules = req.body.rules || [];

  await queries.replaceRules(req.user.org_id, event.id, rules, req.user.user_id);
  const resolved = await resolveEventAudience(req.user.org_id, event.id);

  // Audited with the SENTENCE, not the row ids: "who is this event for" is the
  // question somebody will be asking of the log a term later, and a list of
  // primary keys cannot answer it.
  await audit(req, 'EVENT_AUDIENCE_SET', 'event', event.id, {
    new_data: {
      title: event.title,
      rules: rules.map((r) => ({
        mode: r.mode || 'include',
        selector: r.selector,
        selectorId: r.selectorId ?? null,
        selectorValue: r.selectorValue || null,
        appliesTo: r.appliesTo || 'both',
      })),
      reaches: resolved.counts.total,
    },
  });

  return success(res, {
    rules: await queries.listRules(req.user.org_id, event.id),
    counts: resolved.counts,
    wholeOrg: resolved.wholeOrg,
  }, rules.length ? 'Audience saved' : 'Audience cleared — this event is for the whole school');
});

/**
 * Price a rule set WITHOUT saving it, so the picker can say "reaches 214
 * people" before the school commits. Same resolver as the real thing — a
 * preview computed by a second code path is a preview that will eventually
 * disagree with what gets sent.
 */
const previewAudience = asyncHandler(async (req, res) => {
  const event = await mustSeeEvent(req);
  const resolved = await resolveRules(
    req.user.org_id, req.body.rules || [], event.school_id || event.schoolId || null);
  return success(res, { counts: resolved.counts, wholeOrg: resolved.wholeOrg }, 'Audience previewed');
});

/**
 * The same preview, for an event that does not exist yet.
 *
 * A school picks who an event is for WHILE creating it — that is the moment
 * the decision is being made, and asking them to save first, reopen, and then
 * discover the audience reaches nobody is three clicks and a nasty surprise
 * (§1: ≤ 3 clicks, and never a form that hides its own consequence).
 *
 * The branch comes from getWriteSchool — the same answer the event itself will
 * be stamped with when it is created, so the number shown before saving is the
 * number that will apply after.
 */
const previewDraftAudience = asyncHandler(async (req, res) => {
  const resolved = await resolveRules(
    req.user.org_id, req.body.rules || [], await getWriteSchool(req));
  return success(res, { counts: resolved.counts, wholeOrg: resolved.wholeOrg }, 'Audience previewed');
});

module.exports = { getAudience, setAudience, previewAudience, previewDraftAudience };
