#!/usr/bin/env node
/*
  Contract validation (lightweight JSON Schema subset)

  Why this exists:
  - We ship a JSON Schema (contracts/dashboard-payload-v2.schema.json)
  - We want CI to fail if demo fixtures drift from the contract
  - We intentionally avoid external NPM deps in this bundle

  Supported schema keywords:
    - $ref (internal #/... refs)
    - type (object|array|string|number|integer|boolean|null)
    - required
    - properties
    - items
    - enum
    - const
    - oneOf (any branch may pass)
    - additionalProperties (ignored for objects; handled for 'object' with schema)
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function getByPointer(obj, pointer) {
  // pointer like #/definitions/foo
  if (!pointer.startsWith('#/')) {
    throw new Error(`Only internal $ref pointers are supported. Got: ${pointer}`);
  }
  const parts = pointer.slice(2).split('/').map(s => s.replace(/~1/g, '/').replace(/~0/g, '~'));
  let cur = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object' || !(part in cur)) {
      throw new Error(`Invalid $ref pointer: ${pointer} (missing ${part})`);
    }
    cur = cur[part];
  }
  return cur;
}

function typeOfValue(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v; // object|string|number|boolean|undefined|function
}

function isInteger(n) {
  return typeof n === 'number' && Number.isFinite(n) && Math.floor(n) === n;
}

function validate(schemaRoot, schema, value, atPath, errors) {
  if (!schema || typeof schema !== 'object') return;

  // Resolve $ref
  if (schema.$ref) {
    const resolved = getByPointer(schemaRoot, schema.$ref);
    return validate(schemaRoot, resolved, value, atPath, errors);
  }

  // oneOf
  if (Array.isArray(schema.oneOf)) {
    const branchErrors = [];
    let ok = false;
    for (let i = 0; i < schema.oneOf.length; i++) {
      const tmp = [];
      validate(schemaRoot, schema.oneOf[i], value, atPath, tmp);
      if (tmp.length === 0) {
        ok = true;
        break;
      }
      branchErrors.push(tmp);
    }
    if (!ok) {
      errors.push(`${atPath}: failed oneOf (${branchErrors.length} branches)`);
    }
    return;
  }

  // const
  if (Object.prototype.hasOwnProperty.call(schema, 'const')) {
    if (value !== schema.const) {
      errors.push(`${atPath}: expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}`);
    }
  }

  // enum
  if (Array.isArray(schema.enum)) {
    if (!schema.enum.includes(value)) {
      errors.push(`${atPath}: expected one of ${JSON.stringify(schema.enum)}, got ${JSON.stringify(value)}`);
    }
  }

  // type
  if (schema.type) {
    const t = schema.type;
    const actual = typeOfValue(value);

    if (t === 'object') {
      if (actual !== 'object') {
        errors.push(`${atPath}: expected object, got ${actual}`);
        return;
      }

      // required
      if (Array.isArray(schema.required)) {
        for (const k of schema.required) {
          if (!Object.prototype.hasOwnProperty.call(value, k)) {
            errors.push(`${atPath}: missing required property '${k}'`);
          }
        }
      }

      // properties
      if (schema.properties && typeof schema.properties === 'object') {
        for (const [k, propSchema] of Object.entries(schema.properties)) {
          if (Object.prototype.hasOwnProperty.call(value, k)) {
            validate(schemaRoot, propSchema, value[k], `${atPath}.${k}`, errors);
          }
        }
      }

      // additionalProperties: if it's a schema, validate all keys not in properties
      if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        const props = schema.properties && typeof schema.properties === 'object' ? new Set(Object.keys(schema.properties)) : new Set();
        for (const [k, v] of Object.entries(value)) {
          if (!props.has(k)) {
            validate(schemaRoot, schema.additionalProperties, v, `${atPath}.${k}`, errors);
          }
        }
      }

      return;
    }

    if (t === 'array') {
      if (actual !== 'array') {
        errors.push(`${atPath}: expected array, got ${actual}`);
        return;
      }
      if (schema.items) {
        for (let i = 0; i < value.length; i++) {
          validate(schemaRoot, schema.items, value[i], `${atPath}[${i}]`, errors);
        }
      }
      return;
    }

    if (t === 'string') {
      if (actual !== 'string') errors.push(`${atPath}: expected string, got ${actual}`);
      return;
    }

    if (t === 'number') {
      if (actual !== 'number' || !Number.isFinite(value)) errors.push(`${atPath}: expected finite number, got ${JSON.stringify(value)}`);
      return;
    }

    if (t === 'integer') {
      if (!isInteger(value)) errors.push(`${atPath}: expected integer, got ${JSON.stringify(value)}`);
      return;
    }

    if (t === 'boolean') {
      if (actual !== 'boolean') errors.push(`${atPath}: expected boolean, got ${actual}`);
      return;
    }

    if (t === 'null') {
      if (value !== null) errors.push(`${atPath}: expected null, got ${actual}`);
      return;
    }
  }
}



// --- Dashboard field audit (stronger than schema) ---
// The JSON Schema is intentionally permissive (additionalProperties=true) to allow extension.
// This audit checks that the payload contains the concrete keys actually rendered by dashboard.bundle.js.
//
// NOTE: We keep this audit aligned to the *current* dashboard JS pick() lists.
// If you add/remove KPI tiles or panels, update REQUIRED_METRIC_KEYS below.
const REQUIRED_METRIC_KEYS = [
  "codiviumScore",
  "breadthOverall",
  "breadthMicro",
  "breadthInterview",
  "breadthMcq",
  "weightedMcqScore",
  "firstTryPassRate",
  "avgAttemptsToAC",
  "medianTimeToACMinutes",
  "codiviumPointsAll",
  "codiviumPoints30",
  "efficiencyPtsPerHr",
  "depthOverall",
  "depthMicro",
  "depthInterview",
];

function auditRenderablePayload(payload, fileLabel, errors){
  function fail(msg){ errors.push(`${fileLabel}: ${msg}`); }

  if (!payload || typeof payload !== "object") { fail("payload is not an object"); return; }
  if (!payload.overall || typeof payload.overall !== "object") { fail("missing overall"); return; }
  if (!payload.overall.metrics || typeof payload.overall.metrics !== "object") { fail("missing overall.metrics"); return; }

  for (const k of REQUIRED_METRIC_KEYS){
    if (!(k in payload.overall.metrics)){
      fail(`missing overall.metrics.${k}`);
    }
  }

  // Time-on-platform: the dashboard will densify, but it needs an array (may be empty in prod).
  if (!payload.overall.timeOnPlatform || typeof payload.overall.timeOnPlatform !== "object"){
    fail("missing overall.timeOnPlatform");
  } else {
    const daily = payload.overall.timeOnPlatform.daily;
    if (!Array.isArray(daily)) fail("overall.timeOnPlatform.daily must be an array (can be empty)");
  }

  // Combined coding block drives default panel data
  const cc = payload.combinedCoding;
  if (!cc || typeof cc !== "object"){ fail("missing combinedCoding"); return; }

  if (!Array.isArray(cc.allocation)) fail("combinedCoding.allocation must be an array");
  if (!Array.isArray(cc.depthByCategory)) fail("combinedCoding.depthByCategory must be an array");
  if (typeof cc.depthAvg !== "number") fail("combinedCoding.depthAvg must be a number");

  const hm = cc.convergenceHeatmap;
  if (!hm || typeof hm !== "object"){ fail("missing combinedCoding.convergenceHeatmap"); return; }
  if (!Array.isArray(hm.categories)) fail("combinedCoding.convergenceHeatmap.categories must be an array");
  if (!Array.isArray(hm.buckets)) fail("combinedCoding.convergenceHeatmap.buckets must be an array");
  if (!Array.isArray(hm.values)) fail("combinedCoding.convergenceHeatmap.values must be an array");
  // counts is optional in the JS, but if present it must be an array of arrays of ints
  if (hm.counts !== undefined){
    if (!Array.isArray(hm.counts)) fail("combinedCoding.convergenceHeatmap.counts must be an array when present");
  }

  // Track blocks exist even if empty
  for (const t of ["micro","interview"]){
    const blk = payload[t];
    if (!blk || typeof blk !== "object"){ fail(`missing ${t}`); continue; }
    if (!Array.isArray(blk.allocation)) fail(`${t}.allocation must be an array`);
    if (!Array.isArray(blk.depthByCategory)) fail(`${t}.depthByCategory must be an array`);
    if (typeof blk.depthAvg !== "number") fail(`${t}.depthAvg must be a number`);
    const thm = blk.convergenceHeatmap;
    if (!thm || typeof thm !== "object"){ fail(`missing ${t}.convergenceHeatmap`); continue; }
    if (!Array.isArray(thm.categories)) fail(`${t}.convergenceHeatmap.categories must be an array`);
    if (!Array.isArray(thm.buckets)) fail(`${t}.convergenceHeatmap.buckets must be an array`);
    if (!Array.isArray(thm.values)) fail(`${t}.convergenceHeatmap.values must be an array`);
  }

  // MCQ namespace: dashboard expects payload.mcq.mcq object (may be empty)
  if (!payload.mcq || typeof payload.mcq !== "object"){
    fail("missing mcq namespace");
  } else {
    if (!("mcq" in payload.mcq)) fail("missing mcq.mcq block");
  }
}

function main() {
  const schemaPath = path.join(ROOT, 'contracts', 'dashboard-payload-v2.schema.json');
  const schema = readJson(schemaPath);

  const demoDir = path.join(ROOT, 'demo');
  const demoFiles = fs
    .readdirSync(demoDir)
    .filter((n) => /^payload_example\d+\.json$/i.test(n))
    .sort((a, b) => a.localeCompare(b))
    .map((n) => path.join(demoDir, n));


  // Also validate demo JS payloads (demo_data_*.js) used by preset demos.
  const demoJsFiles = fs
    .readdirSync(demoDir)
    .filter((n) => /^demo_data_.*\.js$/i.test(n))
    .sort((a, b) => a.localeCompare(b))
    .map((n) => path.join(demoDir, n));

  function readDemoJsPayload(filePath){
    const raw = fs.readFileSync(filePath, 'utf8');
    const m = raw.match(/window\.__CODIVIUM_DASHBOARD_DATA__\s*=\s*(\{[\s\S]*\})\s*;\s*$/);
    if (!m) return null;
    try {
      return JSON.parse(m[1]);
    } catch (e) {
      return { __parseError: String(e && e.message ? e.message : e) };
    }
  }

  if (!demoFiles.length) {
    console.error('FAIL: no demo payload fixtures found (expected demo/payload_example*.json)');
    process.exit(1);
  }

  let failed = false;

  for (const f of demoFiles) {
    const data = readJson(f);
    const errors = [];
    validate(schema, schema, data, path.basename(f), errors);
    auditRenderablePayload(data, path.basename(f), errors);

    if (errors.length) {
      failed = true;
      console.error(`\nFAIL: ${path.basename(f)} does not match dashboard-payload-v2.schema.json`);
      for (const e of errors.slice(0, 50)) {
        console.error(`  - ${e}`);
      }
      if (errors.length > 50) console.error(`  ... and ${errors.length - 50} more`);
    } else {
      console.log(`OK: ${path.basename(f)} matches dashboard-payload-v2.schema.json`);
    }
  }


  for (const f of demoJsFiles) {
    const data = readDemoJsPayload(f);
    if (!data) {
      failed = true;
      console.error(`\nFAIL: ${path.basename(f)} does not contain a parseable window.__CODIVIUM_DASHBOARD_DATA__ assignment`);
      continue;
    }
    if (data.__parseError) {
      failed = true;
      console.error(`\nFAIL: ${path.basename(f)} JSON parse error: ${data.__parseError}`);
      continue;
    }
    const errors = [];
    validate(schema, schema, data, path.basename(f), errors);
    auditRenderablePayload(data, path.basename(f), errors);
    if (errors.length) {
      failed = true;
      console.error(`\nFAIL: ${path.basename(f)} does not match dashboard-payload-v2.schema.json`);
      for (const e of errors.slice(0, 50)) {
        console.error(`  - ${e}`);
      }
      if (errors.length > 50) console.error(`  ... and ${errors.length - 50} more`);
    } else {
      console.log(`OK: ${path.basename(f)} matches dashboard-payload-v2.schema.json`);
    }
  }

  if (failed) {
    process.exit(1);
  }
}

main();
