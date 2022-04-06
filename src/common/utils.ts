/* eslint-disable @typescript-eslint/no-explicit-any */
import * as path from 'path';
import 'isomorphic-fetch';
import * as request from 'request';
import * as fs from 'fs';
import * as archiver from 'archiver';
import { ask } from './interactive';
import * as _ from 'lodash';
import { Context } from './context';
import { Readable } from 'stream';
import { CommandController } from '../engine/controllers/commandController';
import { translations } from './translations';

import MemoryStream = require('memorystream');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const streamToBuffer = require('stream-to-buffer');

type workspace = { name: string; id: string };

/**
 * @param {any} m - M.
 * @returns {any} - Any.
 */
export const undefault = (m: any): any => {
  return m.default ? m.default : m;
};

/**
 * @param {any} cmd - M.
 * @returns {{ result: any; error: Error }} - Result.
 */
export const safeExecution = (cmd: any): { result: any; error: Error } => {
  try {
    return {
      result: cmd(),
      error: null,
    };
  } catch (err) {
    return {
      result: null,
      error: err,
    };
  }
};

/**
 * @param {string} targetDirectory - TargetDirectory.
 * @param {Map<string, string>} files - Files.
 * @param {any} fs - Fs.
 * @param {Context} context - Context.
 * @returns {string} - String.
 */
export const installFiles = (
  targetDirectory: string,
  files: Map<string, string>,
  fs: any,
  context: Context,
): string => {
  files.forEach((data, name) => {
    const fullName = path.join(targetDirectory, name);
    const fullPath = path.dirname(fullName);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
    }

    fs.writeFileSync(fullName, data);
    context.logger.debug('install file = ' + fullName);
  });
  return targetDirectory;
};

/**
 * @param {string} url - Url.
 * @param {Readable} fileStream - File.
 * @param {Context} context - Context.
 * @returns {void}
 */
export const upload = async (
  url: string,
  fileStream: Readable,
  context: Context,
): Promise<void> => {
  context.logger.debug('start upload file');
  context.logger.debug('url: ' + url);

  return new Promise<void>((resolve, reject) => {
    streamToBuffer(fileStream, (err: Error, data: any) => {
      request(
        {
          method: 'PUT',
          url: url,
          body: data,
          headers: {
            'Content-Length': data.length,
          },
        },
        (err: any, res: any) => {
          if (err) {
            return reject(err);
          }
          if (res && res.statusCode !== 200) {
            return reject(new Error(res.body));
          }
          context.logger.debug('upload file success');
          resolve();
        },
      );
    });
  });
};

/**
 * @param {{ source: string; dist?: string }[]} directories - Directories.
 * @param {Context} context - Context.
 * @returns {Readable} - Readable.
 */
export const archiveToMemory = async (
  directories: { source: string; dist?: string }[],
  context: Context,
): Promise<Readable> => {
  const memoryStream = new MemoryStream(null);

  return new Promise<Readable>((resolve, reject) => {
    const zip = archiver('zip', { zlib: { level: 0 } });

    zip.pipe(memoryStream);

    directories.forEach((sourcePath) => {
      const source = fs.statSync(sourcePath.source);
      context.logger.debug(
        'archive files from directory = ' +
          sourcePath.source +
          ' dist = ' +
          sourcePath.dist +
          ' is file = ' +
          source.isFile(),
      );

      source.isFile()
        ? zip.file(sourcePath.source, {})
        : zip.directory(sourcePath.source, sourcePath.dist || false);
    });

    zip.on('error', (err: any) => {
      context.logger.debug('Error while zipping build: ' + err);
      reject(new Error(err));
    });

    zip.on('finish', () => {
      context.logger.debug('zipping finish');
      memoryStream.end();
      resolve(memoryStream);
    });

    zip.on('end', () => {
      context.logger.debug('zipping end');
    });

    zip.on('warning', (error: archiver.ArchiverError) => {
      context.logger.warn(error);
    });

    zip.finalize();
  });
};

export const promptWorkspace = async (
  workspaces: workspace[],
  context: Context,
): Promise<{ id: string }> => {
  if (_.isEmpty(workspaces)) {
    throw new Error(context.i18n.t('logout_error'));
  }

  if (workspaces.length === 1) {
    return workspaces[0];
  }

  const result = await ask({
    name: 'workspace',
    type: 'select',
    message: 'choose workspace',
    choices: workspaces.map((workspace) => {
      return {
        title: workspace.name,
        value: workspace.id,
      };
    }),
  });

  return {
    id: result.workspace,
  };
};

/**
 * @param {number} ms - Ms.
 * @returns {void}
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * @param {string} url - Url.
 * @returns {string} - String.
 */
export const trimLastSlash = (url: string): string => {
  if (!_.isString(url) || url.length === 0) {
    return '';
  }

  return url[url.length - 1] === '/' ? url.substr(0, url.length - 1) : url;
};

/**
 * @param {string} commandsDirPath - CommandsDirPath.
 * @returns {Record<string, any>} - Object.
 */
export const commandDirMiddleware = (commandsDirPath: string) => (
  commandObject: { [key: string]: any },
  pathName: string,
): Record<string, any> => {
  const cmd = commandObject.default || commandObject;
  const fileDepth = path.relative(commandsDirPath, pathName).split(path.sep)
    .length;

  if (fileDepth <= 2 && !!cmd.command) {
    return {
      ...cmd,
      handler: CommandController.wrapHandler(cmd.handler, translations),
    };
  }
};
