type LogColor = 'error' | 'success' | 'warning' | 'info' | 'caution' | 'standard';
/**
 * Logs a message with a specific color.
 * @param color - The color to use for the log.
 * @param restArgs - The arguments to log.
 */
declare const colorLog: (color: LogColor, ...restArgs: unknown[]) => void;
export { colorLog };
