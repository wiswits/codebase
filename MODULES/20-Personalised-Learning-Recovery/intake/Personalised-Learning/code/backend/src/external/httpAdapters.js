'use strict';

/**
 * Live HTTP adapters for QBank + Curriculum.
 * Uses global fetch (Node 18+). No cross-module require() — only network.
 */

const QBANK = process.env.QBANK_API_BASE;
const CURRICULUM = process.env.CURRICULUM_API_BASE;

async function getJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`external ${res.status} ${url}`);
  return res.json();
}

async function postJson(url, body) {
  return getJson(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const curriculumApi = {
  getPrerequisiteGraph: () => getJson(`${CURRICULUM}/prerequisite-graph`),
};

const qbankApi = {
  pick: (params) => postJson(`${QBANK}/pick`, params),
  pickOne: (params) => postJson(`${QBANK}/pick-one`, params),
  get: (id) => getJson(`${QBANK}/questions/${id}`),
  getOptionMeta: (id, opt) => getJson(`${QBANK}/questions/${id}/options/${opt}`),
};

module.exports = { curriculumApi, qbankApi };
