import enquirer from 'enquirer';

// @ts-expect-error - enquirer types are not implemented and/or provided
const { Confirm, Input, MultiSelect, Select } = enquirer;

interface Choice<T> {
  message?: string;
  name: string;
  value: T;
}

/**
 * Prompts the user for input.
 * @param question - The question to ask.
 * @param initial - The initial value for the input.
 * @returns The user's input.
 */
const inputPrompt = async (question: string, initial?: string): Promise<string> => {
  const prompt = new Input({
    message: question,
    initial,
  });
  return prompt.run();
};

/**
 * Prompts the user to select a single option.
 * @param question - The question to ask.
 * @param choices - The choices to present.
 * @param initial - The initial value for the selection.
 * @returns The selected value.
 */
const selectPrompt = async <T>(
  question: string,
  choices: Array<Choice<T>>,
  initial: string,
): Promise<T | undefined> => {
  const prompt = new Select({
    name: question,
    message: question,
    initial,
    choices,
  });
  const selection = await prompt.run();
  const { value } = choices.find((choice) => choice.name === selection) ?? {
    value: undefined,
  };
  return value ?? selection;
};

const selectAll: Choice<'all'> = { name: '< All >', value: 'all' };

/**
 * Prompts the user to select multiple options.
 * @param question - The question to ask.
 * @param choices - The choices to present.
 * @param initial - The initial values for the selections.
 * @returns The selected values.
 */
const multiPrompt = async <T>(
  question: string,
  choices: Array<Choice<T>>,
  initial?: string[],
): Promise<Array<T | undefined>> => {
  const prompt = new MultiSelect({
    name: question,
    message: question,
    hint: '(Use <space> to select, <return> to submit)',
    initial,
    choices,
  });
  const selections = (await prompt.run()) as Array<unknown>;
  const isAll = selections.find((selection) => selection === selectAll.name);
  if (isAll) {
    return choices
      .map((choice) => (choice.value === selectAll.value ? undefined : choice.value))
      .filter(Boolean);
  }
  return selections.map((selection) => choices.find((choice) => choice.name === selection)?.value);
};

/**
 * Prompts the user for confirmation.
 * @param question - The question to ask.
 * @param defaultValue - The default value for the confirmation.
 * @returns The user's confirmation.
 */
const confirmPrompt = async (question: string, defaultValue: boolean = true): Promise<boolean> => {
  const prompt = new Confirm({
    name: question,
    message: question,
    initial: defaultValue,
    format: () => '',
  });
  return prompt.run();
};

export { confirmPrompt, inputPrompt, multiPrompt, selectPrompt };
