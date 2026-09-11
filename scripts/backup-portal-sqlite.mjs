#!/usr/bin/env node
import Database from "better-sqlite3";
import { access, mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function usage() {
  console.error("Usage: node backup-portal-sqlite.mjs SOURCE DESTINATION");
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function backup(source, destination) {
  if (!(await exists(source))) {
    console.log(`SQLite source does not exist; no backup required: ${source}`);
    return { skipped: true };
  }

  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.tmp-${process.pid}`;
  await rm(temporary, { force: true });

  const sourceDb = new Database(source, { readonly: true, fileMustExist: true });
  try {
    await sourceDb.backup(temporary);
  } finally {
    sourceDb.close();
  }

  try {
    const backupDb = new Database(temporary, { readonly: true, fileMustExist: true });
    try {
      const result = backupDb.pragma("integrity_check", { simple: true });
      if (result !== "ok") throw new Error(`SQLite integrity_check failed: ${String(result)}`);
      // A valid portal backup must contain the application state table, not merely
      // be a syntactically valid empty SQLite database.
      const portalState = backupDb.prepare("SELECT COUNT(*) AS count FROM portal_state").get();
      if (!portalState || portalState.count < 1) throw new Error("Backup contains no portal state");
    } finally {
      backupDb.close();
    }
    await rename(temporary, destination);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }

  console.log(`Verified SQLite backup: ${destination}`);
  return { skipped: false };
}

const [source, destination] = process.argv.slice(2);
if (!source || !destination) {
  usage();
  process.exitCode = 2;
} else {
  await backup(path.resolve(source), path.resolve(destination));
}
