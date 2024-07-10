import enquirer from 'enquirer';

const { Confirm, Input, MultiSelect, Select } = enquirer;

const NO_COLOUR = '\x1b[0m';
const promptColors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

/**
 *
 * @param {'blue'|'green'|'red'|'yellow'|'magenta'} color
 * @param  {...any} restArgs
 */
const colorLog = (color, ...restArgs) => {
  // eslint-disable-next-line no-console
  console.info(promptColors[color] ?? NO_COLOUR, ...restArgs, NO_COLOUR);
};

const inputPrompt = async (question, initial) => {
  const prompt = new Input({
    message: question,
    initial,
  });
  return prompt.run();
};

const selectPrompt = async (question, choices, initial) => {
  const prompt = new Select({
    name: question,
    message: question,
    initial,
    choices,
  });
  const selection = await prompt.run();
  const { value } = choices.find((choice) => choice.name === selection);
  return value ?? selection;
};

const selectAll = { name: '< All >', value: 'all' };

const multiPrompt = async (question, choices, initial) => {
  const prompt = new MultiSelect({
    name: question,
    message: question,
    hint: '(Use <space> to select, <return> to submit)',
    initial,
    choices,
  });
  const selections = await prompt.run();
  const isAll = selections.find((selection) => selection === selectAll.name);
  if (isAll) {
    return choices
      .map((choice) => (choice.value === selectAll.value ? undefined : choice.value))
      .filter(Boolean);
  }
  return selections.map((selection) => choices.find((choice) => choice.name === selection).value);
};

const confirmPrompt = async (question, defaultValue = true) => {
  const prompt = new Confirm({
    name: question,
    message: question,
    initial: defaultValue,
    format: () => '',
  });
  return prompt.run();
};

export { colorLog, confirmPrompt, inputPrompt, multiPrompt, selectPrompt };
