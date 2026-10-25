const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
};

export const logger = {
  banner() {
    process.stdout.write(
      `\n${colors.cyan}${colors.bold}=======================================================\n` +
      `       SMART ATTENDANCE SYSTEM - WORKSPACE SETUP       \n` +
      `=======================================================${colors.reset}\n\n`
    );
  },

  step(stepIndex, totalSteps, title) {
    const header = `[${stepIndex}/${totalSteps}] ${title}`;
    process.stdout.write(`\n${colors.cyan}${colors.bold}▶ ${header}${colors.reset}\n`);
    process.stdout.write(`${colors.gray}${"─".repeat(header.length + 2)}${colors.reset}\n`);
  },

  info(message) {
    process.stdout.write(`${colors.cyan}ℹ${colors.reset} ${message}\n`);
  },

  success(message) {
    process.stdout.write(`${colors.green}✔${colors.reset} ${message}\n`);
  },

  warn(message) {
    process.stdout.write(`${colors.yellow}⚠${colors.reset} ${colors.yellow}${message}${colors.reset}\n`);
  },

  error(message) {
    process.stdout.write(`${colors.red}✖${colors.reset} ${colors.red}${message}${colors.reset}\n`);
  },

  divider() {
    process.stdout.write(`${colors.gray}${"─".repeat(55)}${colors.reset}\n`);
  },
};
