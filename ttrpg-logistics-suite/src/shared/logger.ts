/**
 * Debug logger: prefix all messages with [Tag] for filterable logs in DevTools/terminal.
 * Use debug() for flow/data; warn() for recoverable issues; error() for failures.
 */
const PREFIX = '[TTRPG]';

export function debug(tag: string, message: string, ...args: unknown[]): void {
  console.debug(`${PREFIX}[${tag}]`, message, ...args);
}

export function warn(tag: string, message: string, ...args: unknown[]): void {
  console.warn(`${PREFIX}[${tag}]`, message, ...args);
}

export function error(tag: string, message: string, ...args: unknown[]): void {
  console.error(`${PREFIX}[${tag}]`, message, ...args);
}
