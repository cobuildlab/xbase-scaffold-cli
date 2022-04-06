/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prompts = require('prompts');

export type InteractiveInput = {
  name: string;
  message?: string;
  initial?: string | boolean;
  choices?: any[];
  type: 'select' | 'password' | 'text' | 'multiselect' | 'confirm';
};

export const ask = (options: InteractiveInput): Promise<any> => {
  return prompts(options);
};
