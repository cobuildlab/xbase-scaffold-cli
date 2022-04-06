import * as yargs from 'yargs';

import { Context } from '../../common/context';
import { translations } from '../../common/translations';
import { ProjectController } from '../controllers/projectController';

type ResolverParams = {
  name: string;
  mockName: string;
  silent: boolean;
};

// eslint-disable-next-line import/no-default-export
export default {
  command: 'mock <name>',
  /**
   * @param {ResolverParams} params - Params.
   * @param {Context} context - Context.
   * @returns {void}
   */
  handler: async (params: ResolverParams, context: Context) => {
    const { name, mockName, silent } = params;

    ProjectController.generateMock(context, {
      name: mockName,
      silent,
      functionName: name,
    });
  },

  describe: translations.i18n.t('generate_mock_describe'),
  /**
   * @param {yargs.Argv} args - Args.
   * @returns {yargs.Argv} - Yargs.
   */
  builder: (args: yargs.Argv): yargs.Argv =>
    args
      .usage(translations.i18n.t('generate_mock_usage'))
      .option('silent', {
        describe: translations.i18n.t('silent_describe'),
        default: false,
        type: 'boolean',
      })
      .option('mockName', {
        alias: 'm',
        describe: translations.i18n.t('generate_mock_name_describe'),
        default: 'request',
        type: 'string',
      }),
};
