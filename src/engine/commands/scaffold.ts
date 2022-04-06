/* eslint-disable import/no-default-export */
import * as yargs from 'yargs';
import { Context } from '../../common/context';
import { translations } from '../../common/translations';
import { ask } from '../../common/interactive';
import { createQueryColumnsList, TableSchema } from '@8base/utils';
import { exportTables } from '@8base/api-client';

type ViewCommandConfig = {
  tableName: string;
  depth: number;
  all: boolean;
};

type Screen = {
  tableId: string;
  screenName?: string;
  tableFields?: string[];
  formFields?: string[];
};

type EightBaseConfig = {
  appName: string;
};

/**
 * @param {string[]} columns - Columns.
 * @param {string} message - Message.
 * @returns {string[]} - String.
 */
const promptColumns = async (
  columns: string[],
  message: string,
): Promise<string[]> => {
  const result = await ask({
    name: 'columns',
    type: 'multiselect',
    message: message,
    choices: columns.map((column) => {
      return {
        title: column,
        value: column,
      };
    }),
  });

  return result.columns;
};

/**
 * @param {TableSchema[]} tables - Tables.
 * @param {string} tableName - TableName.
 * @returns {TableSchema} - TableSchema.
 */
const getTable = (tables: TableSchema[], tableName: string): TableSchema => {
  const table = tables.find(
    ({ name, displayName }) =>
      tableName.toLowerCase() === name.toLowerCase() ||
      tableName.toLowerCase() === displayName.toLowerCase(),
  );

  if (!table) {
    throw new Error(
      translations.i18n.t('generate_scaffold_table_error', { tableName }),
    );
  }

  return table;
};

/**
 * @param {{ withMeta: boolean } & ViewCommandConfig} params - Params.
 * @param {TableSchema[]} tables - TableSchema.
 * @returns {string[]} - Column names.
 */
const getColumnsNames = (
  params: { withMeta: boolean } & ViewCommandConfig,
  tables: TableSchema[],
): string[] => {
  const { name } = getTable(tables, params.tableName);
  const table = getTable(tables, name);

  const columns = createQueryColumnsList(tables, table.id, {
    deep: params.depth,
    withMeta: params.withMeta,
  });

  const columnsNames = columns.map(({ name }) => name);

  return columnsNames;
};

export default {
  command: 'scaffold [tableName]',
  describe: translations.i18n.t('generate_scaffold_describe'),
  /**
   * @param {ResolverParams} params - Params.
   * @param {Context} context - Context.
   * @returns {void}
   */
  handler: async (params: ViewCommandConfig, context: Context) => {
    context.spinner.start('Fetching table data');
    const tables: TableSchema[] = (
      await exportTables(context.request.bind(context), {
        withSystemTables: true,
      })
    ).filter((table) => !table.isSystem);
    // List tables
    if (!params.tableName) {
      context.spinner.stop();
      context.logger.info(`
      TABLES:
        ${tables.map((table) => `${table.displayName} \n`)}
      `);
      process.exit();
    }

    const { name, id } = getTable(tables, params.tableName);

    context.spinner.stop();

    let tableFields, formFields;

    if (!params.all) {
      const columnsTableNames = getColumnsNames(
        { ...params, withMeta: true },
        tables,
      );
      tableFields =
        (await promptColumns(columnsTableNames, 'Choose table fields')) || [];

      const columnsFormNames = getColumnsNames(
        { ...params, withMeta: false, depth: 1 },
        tables,
      );
      formFields =
        (await promptColumns(columnsFormNames, 'Choose form fields')) || [];
    }

    const generatorScreen = {
      tableId: id,
      screenName: name,
      formFields: formFields,
      tableFields: tableFields,
    };

    const generatorConfig = {
      depth: params.depth,
    };
    console.log(generatorScreen, generatorConfig);
  },
  /**
   * @param {yargs.Argv} args - Args.
   * @returns {yargs.Argv} - Yargs.
   */
  builder: (args: yargs.Argv): yargs.Argv => {
    return args
      .usage(translations.i18n.t('generate_scaffold_usage'))
      .option('depth', {
        describe: translations.i18n.t('generate_scaffold_depth_describe'),
        type: 'number',
        default: 1,
      })
      .option('all', {
        type: 'boolean',
        default: false,
        hidden: true,
      });
  },
};
