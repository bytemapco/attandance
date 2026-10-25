import { execSync } from "node:child_process";
import path from "node:path";
import { logger } from "./logger.mjs";

export function findPython311Binary() {
  const candidates = [
    "python3.11",
    path.join(process.env.HOME || "", ".local", "bin", "python3.11"),
    "/usr/bin/python3.11",
    "/usr/local/bin/python3.11",
    "python3",
  ];

  for (const candidate of candidates) {
    try {
      const output = execSync(`"${candidate}" --version`, {
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf-8",
      }).trim();
      if (output.includes("3.11")) {
        return { path: candidate, version: output };
      }
    } catch {
      // Continue searching next candidate
    }
  }

  return null;
}

function getCommandOutput(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

export function runSystemCheck() {
  logger.info("Verifying system dependencies...");

  const nodeVersion = getCommandOutput("node -v");
  if (nodeVersion) {
    logger.success(`Node.js: detected (${nodeVersion})`);
  } else {
    logger.error("Node.js: NOT FOUND. Install Node.js 20+ from https://nodejs.org");
    throw new Error("Missing Node.js runtime.");
  }

  const npmVersion = getCommandOutput("npm -v");
  if (npmVersion) {
    logger.success(`npm: detected (${npmVersion})`);
  } else {
    logger.error("npm: NOT FOUND. Install npm.");
    throw new Error("Missing npm.");
  }

  const python311 = findPython311Binary();
  if (python311) {
    logger.success(`Python 3.11: detected (${python311.version} at ${python311.path})`);
  } else {
    logger.error("Python 3.11: NOT FOUND. Python 3.11 is strictly required for TensorFlow/DeepFace.");
    throw new Error("Python 3.11 is required. Please install Python 3.11.");
  }


  const psqlVersion = getCommandOutput("psql --version");
  if (psqlVersion) {
    logger.success(`PostgreSQL Client: detected (${psqlVersion})`);
  } else {
    logger.warn("PostgreSQL Client: Not detected. Ensure Postgres with pgvector is running.");
  }

  const redisVersion = getCommandOutput("redis-cli --version");
  if (redisVersion) {
    logger.success(`Redis CLI: detected (${redisVersion})`);
  } else {
    logger.warn("Redis CLI: Not detected. Ensure Redis server is accessible.");
  }
}
