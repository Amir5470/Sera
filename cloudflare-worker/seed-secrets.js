#!/usr/bin/env node
// Simple seeding script: reads a local .env and POSTs each value to the Worker
// Usage:
// WORKER_URL=https://<your-worker>.workers.dev ADMIN_TOKEN=<token> node seed-secrets.js [path/to/.env]

const fs = require("fs");
const path = require("path");

const workerUrl = process.env.WORKER_URL;
const adminToken = process.env.ADMIN_TOKEN;

if (!workerUrl || !adminToken) {
  console.error(
    "Set WORKER_URL and ADMIN_TOKEN environment variables before running.",
  );
  process.exit(1);
}

const envPath = path.resolve(
  process.argv[2] || path.join(__dirname, "..", ".env"),
);
if (!fs.existsSync(envPath)) {
  console.error("No .env file found at", envPath);
  process.exit(1);
}

const content = fs.readFileSync(envPath, "utf8");
const lines = content.split(/\r?\n/);
const kv = {};
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const m = trimmed.match(/^([A-Za-z0-9_]+)=(?:"([\s\S]*)"|'([\s\S]*)'|(.*))$/);
  if (m) {
    const key = m[1];
    const val = (m[2] ?? m[3] ?? m[4] ?? "").trim();
    if (val.length) kv[key] = val;
  }
}

(async () => {
  for (const [name, value] of Object.entries(kv)) {
    console.log("Storing", name);
    try {
      const res = await fetch(`${workerUrl.replace(/\/+$/, "")}/secrets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name, value }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Failed storing", name, res.status, text);
      } else {
        console.log("Stored", name);
      }
    } catch (err) {
      console.error("Error storing", name, err);
    }
  }
  console.log("Done.");
})();
