/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as ejs from 'ejs';
import * as mkdirp from 'mkdirp';
import * as changeCase from 'change-case';
import * as _ from 'lodash';

import { StaticConfig } from '../../config';
import { InvalidConfiguration } from '../../errors';
import { GraphqlController } from '../../engine/controllers/graphqlController';
import {
  ExtensionsContainer,
  ExtensionType,
  GraphQLFunctionType,
  TriggerType,
  TriggerOperation,
  ResolverDefinition,
  SyntaxType,
} from '../../interfaces/Extensions';
import { ProjectDefinition } from '../../interfaces/Project';
import { Context } from '../../common/context';

type FunctionDeclarationOptions = {
  operation?: string;
  method?: string;
  path?: string;
  type?: string;
  schedule?: string;
};

type FunctionGeneratationOptions = {
  type: ExtensionType;
  name: string;
  mocks: boolean;
  syntax: SyntaxType;
  projectPath?: string;
  silent?: boolean;
  extendType?: string;
};

type MockGeneratationOptions = {
  name: string;
  functionName: string;
  projectPath?: string;
  silent?: boolean;
};

type PluginGenerationOptions = {
  name: string;
  syntax?: SyntaxType;
  projectPath?: string;
  silent?: boolean;
};

type DeclarationType = {
  type: ExtensionType;
  handler: {
    code: string;
  };
};

/**
 *
 * @param context - Description.
 * @param root0 - Description.
 * @param root0.dirPath - Description.
 * @param root0.templatePath - Description.
 * @param root1 - Description.
 * @param root1.syntax - Description.
 * @param root1.silent - Description.
 * @param root1.mocks - Description.
 * @param options - Description.
 */
const processTemplate = (
  context: Context,
  { dirPath, templatePath }: { dirPath: string; templatePath: string },
  { syntax, silent, mocks }: ProcessTemplateOptions,
  options?: Record<string, any>,
): void => {
  mkdirp.sync(dirPath);

  fs.readdirSync(templatePath).forEach((file) => {
    if (file.indexOf('.') === -1) {
      if (file !== 'mocks' || mocks) {
        processTemplate(
          context,
          {
            dirPath: path.join(dirPath, file),
            templatePath: path.join(templatePath, file),
          },
          {
            syntax,
            silent,
            mocks,
          },
          options,
        );
      }

      return;
    }

    if (
      new RegExp(
        `.${syntax === SyntaxType.js ? SyntaxType.ts : SyntaxType.js}.ejs$`,
      ).test(file)
    ) {
      return;
    }

    const data = fs.readFileSync(path.resolve(templatePath, file));

    const content = ejs.compile(data.toString())({
      ...options,
      changeCase,
    });

    let fileName = file.replace(/\.ejs$/, '');

    fileName = fileName.replace('mockName', _.get(options, 'mockName'));

    fs.writeFileSync(path.resolve(dirPath, fileName), content);

    if (!silent) {
      context.logger.info(
        context.i18n.t('project_created_file', {
          path: path.join(dirPath, fileName),
        }),
      );
    }
  });
};

namespace TriggerUtils {
  /**
   *
   * @param operation - Description.
   * @param funcName - Description.
   * @returns {TriggerOperation} - TriggerOperation.
   */
  export const resolveTriggerOperation = (
    operation: string,
    funcName: string,
  ): TriggerOperation => {
    const resolvedOperation = (TriggerOperation as any)[operation];
    if (_.isNil(resolvedOperation)) {
      throw new InvalidConfiguration(
        StaticConfig.serviceConfigFileName,
        'Invalid trigger operation ' + operation + ' in function ' + funcName,
      );
    }

    return resolvedOperation as TriggerOperation;
  };

  /**
   *
   * @param type - "resolve", "trigger.before", "trigger.after", "subscription".
   * @param functionName - Function name.
   * @returns TriggerStageType.
   */
  export const resolveTriggerType = (
    type: string,
    functionName: string,
  ): TriggerType => {
    const triggerType = type.split('.')[1];
    const resolvedType = (TriggerType as any)[triggerType];
    if (_.isNil(resolvedType)) {
      throw new InvalidConfiguration(
        StaticConfig.serviceConfigFileName,
        'Invalid trigger type ' + type + ' in function ' + functionName,
      );
    }

    return resolvedType as TriggerType;
  };
}

namespace FunctionUtils {
  /**
   * @param name - Name.
   * @param handler - Handler.
   * @returns {string} - String.
   */
  export const resolveHandler = (name: string, handler: any): string => {
    if (_.isString(handler.code)) {
      return handler.code;
    }
    throw new InvalidConfiguration(
      StaticConfig.serviceConfigFileName,
      'handler is invalid for function "' + name + '"',
    );
  };

  /**
   *
   * @param func - Function.
   * @param name - Name.
   */
  export const validateFunctionDefinition = (func: any, name: string): void => {
    if (_.isNil(func.handler)) {
      throw new InvalidConfiguration(
        StaticConfig.serviceConfigFileName,
        'handler is absent for function "' + name + '"',
      );
    }

    if (
      func.handler.code &&
      !fs.existsSync(
        path.join(StaticConfig.rootExecutionDir, func.handler.code),
      )
    ) {
      throw new InvalidConfiguration(
        StaticConfig.serviceConfigFileName,
        'unable to determine function "' + name + '" source code',
      );
    }

    if (
      !StaticConfig.supportedCompileExtension.has(
        path.extname(func.handler.code),
      )
    ) {
      throw new InvalidConfiguration(
        StaticConfig.serviceConfigFileName,
        'function "' + name + '" have unsupported file extension',
      );
    }
  };

  /**
   *
   * @param type - "resolve", "trigger.before", "trigger.after", "subscription", "webhook".
   * @param functionName - Function name.
   * @returns FunctionType.
   */
  export const resolveFunctionType = (
    type: string,
    functionName: string,
  ): ExtensionType => {
    const funcType = type.split('.')[0];
    const resolvedType = (ExtensionType as any)[funcType];
    if (_.isNil(resolvedType)) {
      throw new InvalidConfiguration(
        StaticConfig.serviceConfigFileName,
        'Invalid function type ' + type + ' in function ' + functionName,
      );
    }

    return resolvedType as ExtensionType;
  };
}

namespace ResolverUtils {
  /**
   * @param resolvers - Resolvers.
   * @param {any} types - Types.
   * @returns {ResolverDefinition[]} - Resolver Definition.
   */
  export const resolveGqlFunctionTypes = (
    resolvers: ResolverDefinition[],
    types: { [functionName: string]: GraphQLFunctionType },
  ): ResolverDefinition[] => {
    resolvers.forEach((func) => {
      const type = types[func.name];
      if (_.isNil(type)) {
        throw new Error(
          'Cannot define graphql type for function "' + func.name + '"',
        );
      }
      func.gqlType = type;
    });
    return resolvers;
  };
}

/**
 * @param {FunctionGeneratationOptions} params - Params.
 * @param {string} dirPath - DirPath.
 * @param {FunctionDeclarationOptions} options - Options.
 * @returns {DeclarationType} - Declaration.
 */
const generateFunctionDeclaration = (
  params: FunctionGeneratationOptions,
  dirPath: string,
  options: FunctionDeclarationOptions,
): DeclarationType => {
  const { type, syntax } = params;
  let declaration = {
    type,
    handler: {
      code: `${dirPath}/handler.${syntax}`,
    },
  };

  if (type === ExtensionType.resolver) {
    declaration = _.merge(declaration, {
      schema: `${dirPath}/schema.graphql`,
    });
  } else if (type === ExtensionType.task && options.schedule) {
    declaration = _.merge(declaration, {
      schedule: options.schedule,
    });
  } else if (type === ExtensionType.trigger) {
    declaration = _.merge(declaration, {
      type: `trigger.${options.type || 'before'}`,
      operation: options.operation || 'Users.create',
    });
  } else if (type === ExtensionType.webhook) {
    declaration = _.merge(declaration, {
      path: options.path || '/webhook',
      method: options.method || 'POST',
    });
  }

  return declaration;
};

export class ProjectController {
  /**
   * Public functions.
   */

  /**
   * @param {Context} context - Context.
   * @returns {ProjectDefinition} - ProjectDefinition.
   */
  static initialize(context: Context): ProjectDefinition {
    const name = path.basename(context.config.rootExecutionDir);
    context.logger.debug('start initialize project "' + name + '"');

    context.logger.debug('load main yml file');
    const config = ProjectController.loadConfigFile(context);

    context.logger.debug('load extensions');
    const extensions = ProjectController.loadExtensions(config);

    const gqlSchema = GraphqlController.loadSchema(
      ProjectController.getSchemaPaths(extensions),
    );

    context.logger.debug(
      'load functions count = ' + extensions.functions.length,
    );

    context.logger.debug('resolve function graphql types');
    const functionGqlTypes = GraphqlController.defineGqlFunctionsType(
      gqlSchema,
    );
    extensions.resolvers = ResolverUtils.resolveGqlFunctionTypes(
      extensions.resolvers,
      functionGqlTypes,
    );

    context.logger.debug('initialize project complete');
    return {
      extensions,
      name,
      gqlSchema,
    };
  }

  /**
   * @param { Context} context - Context.
   * @returns {string[]} - String.
   */
  static getFunctionSourceCode(context: Context): string[] {
    return _.map(context.project.extensions.functions, (f) =>
      path.join(context.config.rootExecutionDir, f.pathToFunction),
    );
  }

  /**
   * @param {ProjectDefinition} project - Project.
   * @param {string} outDir - OutDir.
   */
  static saveSchema(project: ProjectDefinition, outDir: string): void {
    const graphqlFilePath = path.join(outDir, 'schema.graphql');
    fs.writeFileSync(graphqlFilePath, project.gqlSchema);
  }

  /**
   * @param {ProjectDefinition} project - Project.
   * @param {string} outDir - OutDir.
   * @returns {void}
   */
  static saveProject(project: ProjectDefinition, outDir: string): void {
    const projectObject = {
      name: project.name,
      functions: project.extensions.functions,
    };

    const projectFilePath = path.join(outDir, 'project.json');
    return fs.writeFileSync(
      projectFilePath,
      JSON.stringify(projectObject, null, 2),
    );
  }

  /**
   * @param {ProjectDefinition} project - Project.
   * @param {string} outDir - OutDir.
   * @returns {void}
   */
  static saveMetaDataFile(project: ProjectDefinition, outDir: string): void {
    const summaryFile = path.join(outDir, '__summary__functions.json');
    fs.writeFileSync(
      summaryFile,
      JSON.stringify(
        {
          functions: project.extensions.functions.map((f) => {
            return {
              name: f.name,
              handler: f.handler,
            };
          }),
          resolvers: project.extensions.resolvers.map((r) => {
            return {
              name: r.name,
              functionName: r.functionName,
              gqlType: r.gqlType,
            };
          }),
          triggers: project.extensions.triggers,
          webhooks: project.extensions.webhooks,
        },
        null,
        2,
      ),
    );
  }

  /**
   * @param {ExtensionsContainer} extensions - Extensions.
   * @returns {string[]} - Schema paths.
   */
  static getSchemaPaths(extensions: ExtensionsContainer): string[] {
    return _.map(extensions.resolvers, (f) => {
      const p = path.join(StaticConfig.rootExecutionDir, f.gqlSchemaPath);
      if (!fs.existsSync(p)) {
        throw new Error('schema path "' + p + '" not present');
      }
      return p;
    });
  }

  /**
   * Private functions.
   */

  /**
   * @param {Context} context - Context.
   * @param {string} projectPath - String.
   * @returns {any} - Any.
   */
  private static loadConfigFile(context: Context, projectPath?: string): any {
    const pathToYmlConfig = projectPath
      ? path.join(projectPath, '8base.yml')
      : StaticConfig.serviceConfigFileName;

    context.logger.debug('check exist yaml file = ' + pathToYmlConfig);

    if (!fs.existsSync(pathToYmlConfig)) {
      throw new Error(context.i18n.t('8base_config_is_missing'));
    }

    try {
      return yaml.safeLoad(fs.readFileSync(pathToYmlConfig, 'utf8'));
    } catch (ex) {
      throw new InvalidConfiguration(
        StaticConfig.serviceConfigFileName,
        ex.message,
      );
    }
  }

  /**
   * @param {Context} context - Context.
   * @param {Record<string, any>} config - Config.
   * @param {string} projectPath - ProjectPath.
   * @param {string} silent - Silent.
   */
  private static saveConfigFile(
    context: Context,
    config: Record<string, any>,
    projectPath?: string,
    silent?: boolean,
  ): any {
    const pathToYmlConfig = projectPath
      ? path.join(projectPath, '8base.yml')
      : StaticConfig.serviceConfigFileName;

    fs.writeFileSync(pathToYmlConfig, yaml.safeDump(config));

    if (!silent) {
      context.logger.info(
        context.i18n.t('project_updated_file', {
          path: pathToYmlConfig,
        }),
      );
    }
  }

  /**
   * @param {any} config - Config.
   * @returns {ExtensionsContainer} - ExtensionsContainer.
   */
  private static loadExtensions(config: any): ExtensionsContainer {
    return _.reduce<any, ExtensionsContainer>(
      config.functions,
      (extensions, data, functionName) => {
        FunctionUtils.validateFunctionDefinition(data, functionName);

        extensions.functions.push({
          name: functionName,
          // TODO: create class FunctionDefinition
          handler: functionName + '.handler', // this handler generate in compile step
          pathToFunction: FunctionUtils.resolveHandler(
            functionName,
            data.handler,
          ),
        });

        switch (FunctionUtils.resolveFunctionType(data.type, functionName)) {
          case ExtensionType.resolver:
            extensions.resolvers.push({
              name: functionName,
              functionName: functionName,
              gqlSchemaPath: data.schema,
              gqlType: undefined,
            });
            break;

          case ExtensionType.task:
            extensions.tasks.push({
              name: functionName,
              functionName: functionName,
            });
            break;

          case ExtensionType.trigger:
            if (_.isNil(data.operation)) {
              throw new InvalidConfiguration(
                StaticConfig.serviceConfigFileName,
                'operation field not present in trigger ' + functionName,
              );
            }

            // const operation = data.operation.split('.'); // TableName.TriggerType

            extensions.triggers.push({
              name: functionName,
              operation: TriggerUtils.resolveTriggerOperation(
                data.operation.split('.')[1],
                functionName,
              ),
              tableName: data.operation.split('.')[0],
              functionName,
              type: TriggerUtils.resolveTriggerType(data.type, functionName),
            });
            break;

          case ExtensionType.webhook:
            if (!data.method) {
              throw new InvalidConfiguration(
                StaticConfig.serviceConfigFileName,
                'Parameter \'method\' is missing in webhook \'' +
                  functionName +
                  '\'',
              );
            }

            extensions.webhooks.push({
              name: functionName,
              functionName,
              httpMethod: data.method,
              path: data.path ? data.path : functionName,
            });
            break;

          default:
            break;
        }

        if (data.schedule) {
          extensions.schedules.push({
            name: functionName,
            functionName,
            scheduleExpression: data.schedule,
          });
        }

        return extensions;
      },
      {
        resolvers: [],
        tasks: [],
        functions: [],
        webhooks: [],
        triggers: [],
        schedules: [],
      },
    );
  }

  /**
   * @param {Context} context - Context.
   * @param {string} name - Name.
   * @param {Record<string, any>} declaration - Declaration.
   * @param {string} projectPath - ProjectPath.
   * @param {string} silent - Silent.
   */
  static addPluginDeclaration(
    context: Context,
    name: string,
    declaration: Record<string, any>,
    projectPath?: string,
    silent?: boolean,
  ): void {
    const config = ProjectController.loadConfigFile(context, projectPath);

    const plugins = config.plugins || [];

    if (_.some(plugins, { name })) {
      throw new Error(
        context.i18n.t('plugins_with_name_already_defined', { name }),
      );
    }

    config.plugins = [...plugins, declaration];

    ProjectController.saveConfigFile(context, config, projectPath, silent);
  }

  /**
   * @param {Context} context - Context.
   * @param {string} name - Name.
   * @param {Record<string, any>} declaration - Declaration.
   * @param {string} projectPath - ProjectPath.
   * @param {string} silent - Silent.
   */
  static addFunctionDeclaration(
    context: Context,
    name: string,
    declaration: Record<string, any>,
    projectPath?: string,
    silent?: boolean,
  ): void {
    let config = ProjectController.loadConfigFile(context, projectPath) || {
      functions: {},
    };

    if (_.has(config, ['functions', name])) {
      throw new Error(
        context.i18n.t('function_with_name_already_defined', { name }),
      );
    }

    config = _.set(config, ['functions', name], declaration);

    ProjectController.saveConfigFile(context, config, projectPath, silent);
  }

  /**
   *
   * @param {Context} context - Context.
   * @param {} root0 - Root.
   * @param {} root0.type - Type.
   * @param {} root0.name - Name.
   * @param {} root0.mocks - Mocks.
   * @param {} root0.syntax - Syntax.
   * @param {} root0.extendType - Extendtype.
   * @param {} root0.projectPath - ProjectPath.
   * @param {} root0.silent - Silent.
   * @param {} options - Options.
   */
  static generateFunction(
    context: Context,
    {
      type,
      name,
      mocks,
      syntax,
      extendType = 'Query',
      projectPath = '.',
      silent,
    }: FunctionGeneratationOptions,
    options: FunctionDeclarationOptions = {},
  ): void {
    const dirPath = `src/${type}s/${name}`;

    ProjectController.addFunctionDeclaration(
      context,
      name,
      generateFunctionDeclaration(
        { type, name, syntax, mocks },
        dirPath,
        options,
      ),
      projectPath,
      silent,
    );

    const functionTemplatePath = path.resolve(
      context.config.functionTemplatesPath,
      type,
    );

    processTemplate(
      context,
      {
        dirPath: path.join(projectPath, dirPath),
        templatePath: functionTemplatePath,
      },
      { syntax, mocks, silent },
      { functionName: name, type, extendType },
    );

    if (!silent) {
      context.logger.info('');

      context.logger.info(
        context.i18n.t('generate_function_grettings', {
          name,
        }),
      );
    }
  }

  /**
   * @param {Context} context - Context.
   * @param root0 - Description.
   * @param root0.name - Description.
   * @param root0.syntax - Description.
   * @param root0.silent - Description.
   * @param root0.projectPath - Description.
   */
  static generatePlugin(
    context: Context,
    { name, syntax, silent, projectPath = '.' }: PluginGenerationOptions,
  ): void {
    const functionName = `${name}Resolver`;
    const extendType = _.upperFirst(`${name}Mutation`);
    const pluginPath = path.join('plugins', name);
    const functionPath = path.join(
      pluginPath,
      'src',
      'resolvers',
      functionName,
    );
    const pluginTemplatePath = context.config.pluginTemplatePath;
    const resolverTemplatePath = path.resolve(
      context.config.functionTemplatesPath,
      ExtensionType.resolver,
    );

    ProjectController.addPluginDeclaration(
      context,
      name,
      {
        name,
        path: path.join(pluginPath, '8base.yml'),
      },
      projectPath,
      silent,
    );

    processTemplate(
      context,
      {
        dirPath: path.join(projectPath, pluginPath),
        templatePath: pluginTemplatePath,
      },
      { syntax, silent },
      { name, syntax, functionName },
    );

    processTemplate(
      context,
      {
        dirPath: path.join(projectPath, functionPath),
        templatePath: resolverTemplatePath,
      },
      { syntax, mocks: false, silent },
      { functionName, type: ExtensionType.resolver, extendType },
    );

    if (!silent) {
      context.logger.info('');

      context.logger.info(
        context.i18n.t('generate_plugin_grettings', {
          name,
        }),
      );
    }
  }

  /**
   *
   * @param context - Description.
   * @param functionName - Description.
   * @param mockName - Description.
   * @returns {string} - Description.
   */
  static getMock(
    context: Context,
    functionName: string,
    mockName: string,
  ): string {
    const config = ProjectController.loadConfigFile(context, '.') || {
      functions: {},
    };

    if (!_.has(config, ['functions', functionName])) {
      throw new Error(
        context.i18n.t('function_with_name_not_defined', {
          name: functionName,
        }),
      );
    }

    const type = _.get(config, ['functions', functionName]).type.match(
      /^\w+/,
    )[0];

    const mockPath = `src/${type}s/${functionName}/mocks/${mockName}.json`;

    if (!fs.existsSync(mockPath)) {
      throw new Error(
        context.i18n.t('mock_with_name_not_defined', {
          functionName,
          mockName,
        }),
      );
    }

    return fs.readFileSync(mockPath).toString();
  }

  /**
   *
   * @param context - Context.
   * @param root0 - Description.
   * @param root0.name - Description.
   * @param root0.functionName - Description.
   * @param root0.projectPath - Description.
   * @param root0.silent - Description.
   */
  static generateMock(
    context: Context,
    { name, functionName, projectPath = '.', silent }: MockGeneratationOptions,
  ): void {
    const config = ProjectController.loadConfigFile(context, projectPath) || {
      functions: {},
    };

    if (!_.has(config, ['functions', functionName])) {
      throw new Error(
        context.i18n.t('function_with_name_not_defined', {
          name: functionName,
        }),
      );
    }

    const fn = _.get(config, ['functions', functionName]);

    const type = fn.type.match(/^\w+/)[0];

    const mockPath = `src/${type}s/${functionName}/mocks/${name}.json`;

    if (fs.existsSync(mockPath)) {
      throw new Error(
        context.i18n.t('mock_with_name_already_defined', {
          mockName: name,
          functionName,
        }),
      );
    }

    const dirPath = `src/${type}s/${functionName}/mocks`;

    processTemplate(
      context,
      {
        dirPath: path.join(projectPath, dirPath),
        templatePath: context.config.mockTemplatePath,
      },
      { silent },
      { mockName: name },
    );

    if (!silent) {
      context.logger.info('');

      context.logger.info(
        context.i18n.t('generate_mock_grettings', {
          name,
        }),
      );
    }
  }
}

type ProcessTemplateOptions = {
  syntax?: SyntaxType;
  silent?: boolean;
  mocks?: boolean;
};
