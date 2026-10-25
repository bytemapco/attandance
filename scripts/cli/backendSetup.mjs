import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { logger } from "./logger.mjs";
import { findPython311Binary } from "./systemCheck.mjs";

function getVenvPython(backendDir) {
  const venvPythonPosix = path.join(backendDir, ".venv", "bin", "python");
  const venvPythonWin = path.join(backendDir, ".venv", "Scripts", "python.exe");

  if (fs.existsSync(venvPythonPosix)) return venvPythonPosix;
  if (fs.existsSync(venvPythonWin)) return venvPythonWin;
  return null;
}

function checkVenvPythonVersion(venvPython) {
  if (!venvPython || !fs.existsSync(venvPython)) return null;
  try {
    return execSync(`"${venvPython}" --version`, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf-8",
    }).trim();
  } catch {
    return null;
  }
}

function ensureBackendDirectories(backendDir) {
  const dirs = [
    "models/background_validation",
    "models/liveness_detection",
  ];

  for (const relativeDir of dirs) {
    const fullPath = path.join(backendDir, relativeDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

function ensureBackendEnv(backendDir) {
  const envPath = path.join(backendDir, ".env");
  const examplePath = path.join(backendDir, ".env.example");

  if (fs.existsSync(envPath)) {
    logger.info("Backend .env already exists. Skipping creation.");
    return;
  }

  const defaultSecret = crypto.randomBytes(32).toString("hex");
  let envContent = "";

  if (fs.existsSync(examplePath)) {
    envContent = fs.readFileSync(examplePath, "utf-8");
    envContent = envContent.replace(
      /JWT_SECRET=.*/,
      `JWT_SECRET="${defaultSecret}"`
    );
  } else {
    envContent = [
      'PROJECT_NAME="Smart Attendance System API"',
      'API_V1_STR="/api/v1"',
      'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_attendance"',
      `JWT_SECRET="${defaultSecret}"`,
      'JWT_ALGORITHM="HS256"',
      'ACCESS_TOKEN_EXPIRE_MINUTES=1440',
      'REDIS_URL="redis://localhost:6379/0"',
      'AWS_ENDPOINT_URL="http://localhost:4566"',
      'AWS_DEFAULT_REGION="us-east-1"',
      'AWS_ACCESS_KEY_ID="test"',
      'AWS_SECRET_ACCESS_KEY="test"',
      'S3_BUCKET_NAME="smartattandancesystem"',
      'FRONTEND_URL="http://localhost:3000"',
      'ENVIRONMENT="development"',
      'LOG_LEVEL="DEBUG"',
    ].join("\n");
  }

  fs.writeFileSync(envPath, envContent, "utf-8");
  logger.success("Generated backend .env with secure JWT_SECRET.");
}

function createPython311Venv(backendDir) {
  const python311 = findPython311Binary();
  if (!python311) {
    throw new Error(
      "Python 3.11 binary not found. TensorFlow requires Python 3.11 to install."
    );
  }

  const venvPython = getVenvPython(backendDir);
  const currentVersion = checkVenvPythonVersion(venvPython);

  if (currentVersion && currentVersion.includes("3.11")) {
    logger.info(`Valid Python 3.11 virtual environment found (${currentVersion}).`);
    return venvPython;
  }

  logger.info(`Creating Python 3.11 virtual environment using ${python311.path}...`);
  execSync(`"${python311.path}" -m venv --clear .venv`, {
    cwd: backendDir,
    stdio: "inherit",
  });

  const newVenvPython = getVenvPython(backendDir);
  const verifiedVersion = checkVenvPythonVersion(newVenvPython);
  logger.success(`Created virtual environment with ${verifiedVersion}.`);
  return newVenvPython;
}

export function setupBackend(rootDir) {
  const backendDir = path.join(rootDir, "backend");
  if (!fs.existsSync(backendDir)) {
    logger.warn("Backend directory not found. Skipping backend setup.");
    return;
  }

  logger.info("Setting up Backend (FastAPI + Prisma + TensorFlow)...");
  ensureBackendDirectories(backendDir);
  ensureBackendEnv(backendDir);

  const pythonExec = createPython311Venv(backendDir);
  const quotedPython = `"${pythonExec}"`;
  logger.info(`Using Python runner: ${pythonExec}`);

  logger.info("Installing Python dependencies from requirements.txt...");
  try {
    execSync(`${quotedPython} -m pip install --upgrade pip`, {
      cwd: backendDir,
      stdio: "inherit",
    });
    execSync(`${quotedPython} -m pip install -r requirements.txt`, {
      cwd: backendDir,
      stdio: "inherit",
    });
    logger.success("Python dependencies installed successfully.");
  } catch (error) {
    logger.error(`Failed to install Python requirements: ${error.message}`);
    throw error;
  }

  logger.info("Generating Prisma ORM Python client...");
  try {
    execSync(`${quotedPython} -m prisma generate`, {
      cwd: backendDir,
      stdio: "inherit",
    });
    logger.success("Prisma client generated.");
  } catch (error) {
    logger.warn(`Prisma client generation warning: ${error.message}`);
  }
}
