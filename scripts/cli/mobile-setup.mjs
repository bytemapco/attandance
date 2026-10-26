import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { logger } from "./logger.mjs";

function ensureMobileEnv(mobileDir) {
  const envPath = path.join(mobileDir, ".env");
  const envExamplePath = path.join(mobileDir, ".env.example");

  if (fs.existsSync(envPath)) {
    logger.info("Mobile .env already exists. Skipping creation.");
    return;
  }

  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
  } else {
    fs.writeFileSync(
      envPath,
      "API_BASE_URL=https://attendance-backend.bytemap.in/api/v1\n",
      "utf-8"
    );
  }

  logger.success("Created mobile/.env configuration.");
}

export function setupMobile(rootDir) {
  const mobileDir = path.join(rootDir, "mobile");
  if (!fs.existsSync(mobileDir)) {
    logger.warn("Mobile directory not found. Skipping mobile setup.");
    return;
  }

  logger.info("Setting up Mobile App (Flutter 3.x + Riverpod + Hive)...");
  ensureMobileEnv(mobileDir);

  logger.info("Verifying Flutter installation...");
  try {
    const flutterVersion = execSync("flutter --version", { encoding: "utf-8" }).split("\n")[0];
    logger.success(`Flutter detected: ${flutterVersion}`);
  } catch (error) {
    logger.error("Flutter is not installed or not in system PATH.");
    throw error;
  }

  logger.info("Installing Mobile dependencies (flutter pub get)...");
  try {
    execSync("flutter pub get", {
      cwd: mobileDir,
      stdio: "inherit",
    });
    logger.success("Mobile dependencies installed successfully.");
  } catch (error) {
    logger.error(`Failed to install mobile dependencies: ${error.message}`);
    throw error;
  }

  logger.info("Running mobile static analysis...");
  try {
    execSync("flutter analyze", {
      cwd: mobileDir,
      stdio: "inherit",
    });
    logger.success("Mobile static analysis completed with zero issues.");
  } catch (error) {
    logger.warn(`Mobile analysis reported warnings: ${error.message}`);
  }
}
