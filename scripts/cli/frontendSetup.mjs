import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { logger } from "./logger.mjs";

function ensureFrontendEnv(frontendDir) {
  const envLocalPath = path.join(frontendDir, ".env.local");
  const envExamplePath = path.join(frontendDir, ".env.example");

  if (fs.existsSync(envLocalPath)) {
    logger.info("Frontend .env.local already exists. Skipping creation.");
    return;
  }

  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envLocalPath);
  } else {
    fs.writeFileSync(
      envLocalPath,
      "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1\n",
      "utf-8"
    );
  }

  logger.success("Created frontend/.env.local configuration.");
}

export function setupFrontend(rootDir) {
  const frontendDir = path.join(rootDir, "frontend");
  if (!fs.existsSync(frontendDir)) {
    logger.warn("Frontend directory not found. Skipping frontend setup.");
    return;
  }

  logger.info("Setting up Frontend (Next.js 16 + React 19 + Tailwind)...");
  ensureFrontendEnv(frontendDir);

  logger.info("Installing Frontend npm dependencies...");
  try {
    execSync("npm install", {
      cwd: frontendDir,
      stdio: "inherit",
    });
    logger.success("Frontend dependencies installed successfully.");
  } catch (error) {
    logger.error(`Failed to install frontend dependencies: ${error.message}`);
    throw error;
  }
}
