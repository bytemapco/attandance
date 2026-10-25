#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "./cli/logger.mjs";
import { runSystemCheck } from "./cli/systemCheck.mjs";
import { setupBackend } from "./cli/backendSetup.mjs";
import { setupFrontend } from "./cli/frontendSetup.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function printUsage() {
  logger.banner();
  process.stdout.write(
    `Usage: npm run [command]  OR  node scripts/setup.mjs [options]\n\n` +
    `Commands:\n` +
    `  npm run setup         Run full workspace setup (Frontend + Backend)\n` +
    `  npm run check         Check system dependencies only\n` +
    `  npm run backend:setup Setup backend (Python venv, pip, Prisma, env)\n` +
    `  npm run frontend:setup Setup frontend (Next.js, npm, env)\n\n` +
    `Options:\n` +
    `  --setup, -s           Full setup (default)\n` +
    `  --check, -c           Run system checks only\n` +
    `  --backend, -b         Setup backend only\n` +
    `  --frontend, -f        Setup frontend only\n` +
    `  --help, -h            Show this help message\n\n`
  );
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    return;
  }

  logger.banner();

  const isCheckOnly = args.includes("--check") || args.includes("-c");
  const isBackendOnly = args.includes("--backend") || args.includes("-b");
  const isFrontendOnly = args.includes("--frontend") || args.includes("-f");
  const isFullSetup =
    args.includes("--setup") ||
    args.includes("-s") ||
    (!isCheckOnly && !isBackendOnly && !isFrontendOnly);

  const startTime = Date.now();

  try {
    if (isCheckOnly) {
      logger.step(1, 1, "System Environment Check");
      runSystemCheck();
      logger.success("System check completed successfully!");
      return;
    }

    if (isBackendOnly) {
      logger.step(1, 2, "System Environment Check");
      runSystemCheck();
      logger.step(2, 2, "Backend Setup");
      setupBackend(rootDir);
      logger.success("Backend setup completed!");
      return;
    }

    if (isFrontendOnly) {
      logger.step(1, 2, "System Environment Check");
      runSystemCheck();
      logger.step(2, 2, "Frontend Setup");
      setupFrontend(rootDir);
      logger.success("Frontend setup completed!");
      return;
    }

    if (isFullSetup) {
      logger.step(1, 3, "System Environment Check");
      runSystemCheck();

      logger.step(2, 3, "Frontend Setup (Next.js)");
      setupFrontend(rootDir);

      logger.step(3, 3, "Backend Setup (FastAPI & Prisma)");
      setupBackend(rootDir);

      const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.divider();
      logger.success(`Complete workspace setup finished in ${elapsedSeconds}s!`);
      logger.info("Next steps to run the application:");
      process.stdout.write(
        `  • Start Backend:  npm run dev:backend   (or: cd backend && uvicorn main:app --reload --port 8000)\n` +
        `  • Start Frontend: npm run dev:frontend  (or: cd frontend && npm run dev)\n` +
        `  • Start All:      npm run dev\n\n`
      );
    }
  } catch (error) {
    logger.error(`Setup process failed: ${error.message}`);
    process.exit(1);
  }
}

main();
