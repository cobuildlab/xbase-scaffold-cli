/* eslint-disable import/no-default-export */
import * as yargs from 'yargs';

import { Context } from '../../common/context';
import { translations } from '../../common/translations';
import { ExtensionType, SyntaxType } from '../../interfaces/Extensions';
import { ProjectController } from '../controllers/projectController';

type ResolverParams = {
  name: string;
  mocks: boolean;
  syntax: SyntaxType;
  silent: boolean;
};

export default {
  command: 'resolver <name>',
  handler: async (params: ResolverParams, context: Context) => {
    const { name, mocks, syntax, silent } = params;

    ProjectController.generateFunction(context, {
      type: ExtensionType.resolver,
      name,
      mocks,
      syntax,
      silent,
      extendType: 'Query',
    });
  },

  describe: translations.i18n.t('generate_resolver_describe'),
  /**
   * @param {yargs.Argv} args - Args.
   * @returns {yargs.Argv} - Yargs.
   */
  builder: (args: yargs.Argv): yargs.Argv =>
    args
      .usage(translations.i18n.t('generate_resolver_usage'))
      .option('mocks', {
        alias: 'x',
        describe: translations.i18n.t('generate_mocks_describe'),
        default: true,
        type: 'boolean',
      })
      .option('syntax', {
        alias: 's',
        describe: translations.i18n.t('generate_syntax_describe'),
        default: 'ts',
        type: 'string',
        choices: Object.values(SyntaxType),
      })
      .option('silent', {
        describe: translations.i18n.t('silent_describe'),
        default: false,
        type: 'boolean',
      }),
};
