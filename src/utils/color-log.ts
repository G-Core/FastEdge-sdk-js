type LogColor = 'error' | 'success' | 'warning' | 'info' | 'caution' | 'standard';

const NO_COLOUR = '\u001B[0m';
const promptColors: Record<LogColor, string> = {
  error: '\u001B[31m', // Red
  success: '\u001B[32m', // Green
  warning: '\u001B[33m', // Yellow
  info: '\u001B[34m', // Blue
  caution: '\u001B[35m', // Magenta
  standard: NO_COLOUR,
};

/**
 * Logs a message with a specific color.
 * @param color - The color to use for the log.
 * @param restArgs - The arguments to log.
 */
const colorLog = (color: LogColor, ...restArgs: unknown[]): void => {
  if (color === 'error') {
    // eslint-disable-next-line no-console
    console.error(promptColors[color] ?? NO_COLOUR, ...restArgs, NO_COLOUR);
    return;
  }
  // eslint-disable-next-line no-console
  console.info(promptColors[color] ?? NO_COLOUR, ...restArgs, NO_COLOUR);
};

export { colorLog };
