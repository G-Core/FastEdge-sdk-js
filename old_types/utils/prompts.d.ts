interface Choice<T> {
    message?: string;
    name: string;
    value: T;
}
type LogColor = 'error' | 'success' | 'warning' | 'info' | 'caution' | 'standard';
/**
 * Logs a message with a specific color.
 * @param color - The color to use for the log.
 * @param restArgs - The arguments to log.
 */
declare const colorLog: (color: LogColor, ...restArgs: unknown[]) => void;
/**
 * Prompts the user for input.
 * @param question - The question to ask.
 * @param initial - The initial value for the input.
 * @returns The user's input.
 */
declare const inputPrompt: (question: string, initial?: string) => Promise<string>;
/**
 * Prompts the user to select a single option.
 * @param question - The question to ask.
 * @param choices - The choices to present.
 * @param initial - The initial value for the selection.
 * @returns The selected value.
 */
declare const selectPrompt: <T>(question: string, choices: Array<Choice<T>>, initial: string) => Promise<T | undefined>;
/**
 * Prompts the user to select multiple options.
 * @param question - The question to ask.
 * @param choices - The choices to present.
 * @param initial - The initial values for the selections.
 * @returns The selected values.
 */
declare const multiPrompt: <T>(question: string, choices: Array<Choice<T>>, initial?: string[]) => Promise<Array<T | undefined>>;
/**
 * Prompts the user for confirmation.
 * @param question - The question to ask.
 * @param defaultValue - The default value for the confirmation.
 * @returns The user's confirmation.
 */
declare const confirmPrompt: (question: string, defaultValue?: boolean) => Promise<boolean>;
export { colorLog, confirmPrompt, inputPrompt, multiPrompt, selectPrompt };
