/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs-extra';
import * as path from 'path';
import * as mkdirp from 'mkdirp';

/**
 * @param {Array} array - Array.
 * @param {() => void} callback - Callback.
 * @returns {void}
 */
const asyncForEach = async(
  array: string[],
  callback: (arg0: string, arg1: number, arg2: string[]) => void,
): Promise<void> => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

/**
 * @param {string} relativePath - Path.
 * @param {Record<string, any>} data - Path.
 * @param {Record<string, any>} options - Path.
 * @returns {void}
 */
const writeFile = async (
  relativePath: string,
  data: any,
  options: Record<string, any>,
): Promise<void> => {
  await mkdirp.sync(path.dirname(relativePath));

  await fs.writeFile(relativePath, data, options);
};

/**
 *
 * @param fsObject - Description.
 * @param rootPath - Description.
 * @param options - Description.
 */
export const writeFs = async (
  fsObject: Record<string, string>,
  rootPath = './',
  options: Record<string, any> = {},
): Promise<void> => {
  await asyncForEach(Object.keys(fsObject), async (relativePath: string) => {
    const fileContent = fsObject[relativePath];

    await writeFile(path.join(rootPath, relativePath), fileContent, {
      encoding: 'utf8',
      ...options,
    });
  });
};

/**
 *
 * @param filePaths - Description.
 * @param rootPath - Description.
 */
export const readFs = async (
  filePaths: string[],
  rootPath = './',
): Promise<{ [key: string]: string }> => {
  const fsObject: { [key: string]: string } = {};

  await asyncForEach(filePaths, async (relativePath: string) => {
    const fileContent = await fs.readFile(
      path.join(rootPath, relativePath),
      'utf8',
    );

    fsObject[relativePath] = fileContent;
  });

  return fsObject;
};
