import {
  GraphqlActions,
  GraphqlAsyncActionsType,
} from '../consts/GraphqlActions';
import { sleep, upload } from './utils';
import { AsyncStatus } from '../consts/AsyncStatus';
import { BuildController } from '../engine/controllers/buildController';
import { Context } from './context';
import { DEFAULT_ENVIRONMENT_NAME } from '../consts/Environment';
import { RequestOptions } from '../interfaces/Common';

type variablesType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export const executeAsync = async (
  context: Context,
  query: GraphqlAsyncActionsType,
  variables: variablesType = {},
  options?: RequestOptions,
): Promise<void> => {
  const {
    system: {
      async: { sessionId },
    },
  } = await context.request(query, variables, options);

  let result;
  do {
    result = (
      await context.request(
        GraphqlActions.asyncSessionStatus,
        { sessionId },
        { customEnvironment: DEFAULT_ENVIRONMENT_NAME },
      )
    ).status;

    context.logger.debug(result);
    await sleep(2000);
    context.spinner.stop();
    context.spinner.start(
      context.i18n.t('async_in_progress', {
        status: result.status,
        message: result.message,
      }),
    );
  } while (
    result.status !== AsyncStatus.completeSuccess &&
    result.status !== AsyncStatus.completeError
  );

  context.spinner.stop();

  if (result.status === AsyncStatus.completeError) {
    let gqlError;
    try {
      gqlError = JSON.parse(result.message); // result.message contains valid gqlError, should be threw as is
    } catch (e) {
      throw new Error(result.message);
    }
    throw gqlError;
  }

  if (result.message) {
    context.logger.info(result.message);
  }
};

/**
 * @param {Context} context - Context.
 * @param {RequestOptions} options - Options.
 * @returns { { buildName: string} } - Build name.
 */
export const uploadProject = async (
  context: Context,
  options?: RequestOptions,
): Promise<{ buildName: string }> => {
  const buildDir = await BuildController.package(context);
  context.logger.debug(`build dir: ${buildDir}`);

  const { prepareDeploy } = await context.request(
    GraphqlActions.prepareDeploy,
    {},
    options,
  );

  await upload(prepareDeploy.uploadBuildUrl, buildDir.build, context);
  context.logger.debug('upload source code complete');
  return { buildName: prepareDeploy.buildName };
};

/**
 * @param {Context} context - Context.
 * @param {any} deployOptions - Options.
 * @param {RequestOptions} options - Options.
 * @returns {void}
 */
export const executeDeploy = async (
  context: Context,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deployOptions: any,
  options?: RequestOptions,
): Promise<void> => {
  context.spinner.start(
    context.i18n.t('deploy_in_progress', { status: 'prepare to upload' }),
  );

  const buildDir = await BuildController.package(context);
  context.logger.debug(`build dir: ${buildDir}`);

  const { prepareDeploy } = await context.request(
    GraphqlActions.prepareDeploy,
    null,
    options,
  );

  await upload(prepareDeploy.uploadMetaDataUrl, buildDir.meta, context);
  context.logger.debug('upload meta data complete');

  await upload(prepareDeploy.uploadBuildUrl, buildDir.build, context);
  context.logger.debug('upload source code complete');

  await context.request(
    GraphqlActions.deploy,
    { data: { buildName: prepareDeploy.buildName, options: deployOptions } },
    options,
  );

  let result;
  do {
    result = (
      await context.request(GraphqlActions.deployStatus, {
        buildName: prepareDeploy.buildName,
      })
    ).deployStatus;
    context.logger.debug(result);
    await sleep(2000);
    context.spinner.stop();
    context.spinner.start(
      context.i18n.t('deploy_in_progress', {
        status: result.status,
        message: result.message,
      }),
    );
  } while (
    result.status !== AsyncStatus.completeSuccess &&
    result.status !== AsyncStatus.completeError
  );

  BuildController.clearBuild(context);
  context.spinner.stop();

  if (result.status === AsyncStatus.completeError) {
    let gqlError;
    try {
      gqlError = JSON.parse(result.message); // result.message contains valid gqlError, should be threw as is
    } catch (e) {
      throw new Error(result.message);
    }
    throw gqlError;
  }
};
