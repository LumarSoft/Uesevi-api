import { sanitizeConsoleArgument } from "./safeLogging.js";

const originalError = console.error.bind(console);

console.error = (...args) => {
  originalError(...args.map(sanitizeConsoleArgument));
};
