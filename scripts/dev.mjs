#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "backend");
const frontendDir = path.join(rootDir, "frontend");

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  green: "\x1b[32m",
};

function getPythonExecutable() {
  const venvPythonPosix = path.join(backendDir, ".venv", "bin", "python");
  const venvPythonWin = path.join(backendDir, ".venv", "Scripts", "python.exe");

  if (fs.existsSync(venvPythonPosix)) return venvPythonPosix;
  if (fs.existsSync(venvPythonWin)) return venvPythonWin;
  return process.platform === "win32" ? "python" : "python3";
}

function pipeOutput(childProcess, prefix, color) {
  const handleData = (chunk) => {
    const lines = chunk.toString().split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue;
      process.stdout.write(`${color}${colors.bold}[${prefix}]${colors.reset} ${line}\n`);
    }
  };

  if (childProcess.stdout) childProcess.stdout.on("data", handleData);
  if (childProcess.stderr) childProcess.stderr.on("data", handleData);
}

const pythonExec = getPythonExecutable();

process.stdout.write(`\n${colors.green}${colors.bold}Starting Backend (FastAPI :8000) & Frontend (Next.js :3000)...${colors.reset}\n\n`);

const backendProcess = spawn(
  pythonExec,
  ["-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
  {
    cwd: backendDir,
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  }
);

pipeOutput(backendProcess, "BACKEND", colors.cyan);

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const frontendProcess = spawn(
  npmCmd,
  ["run", "dev"],
  {
    cwd: frontendDir,
    env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --no-deprecation`.trim() },
    stdio: ["ignore", "pipe", "pipe"],
  }
);

pipeOutput(frontendProcess, "FRONTEND", colors.magenta);

function shutdown() {
  process.stdout.write(`\n${colors.red}${colors.bold}Shutting down development servers...${colors.reset}\n`);
  try {
    backendProcess.kill("SIGTERM");
  } catch {}
  try {
    frontendProcess.kill("SIGTERM");
  } catch {}
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

backendProcess.on("close", (code) => {
  if (code !== 0 && code !== null) {
    process.stdout.write(`${colors.red}[BACKEND] Process exited with code ${code}${colors.reset}\n`);
  }
});

frontendProcess.on("close", (code) => {
  if (code !== 0 && code !== null) {
    process.stdout.write(`${colors.red}[FRONTEND] Process exited with code ${code}${colors.reset}\n`);
  }
});
