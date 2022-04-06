import * as fs from 'fs-extra';
import * as path from 'path';
import ignore from 'ignore';
import { Readable } from 'stream';
import * as recursiveReadDir from 'recursive-readdir';

import { ProjectController } from './projectController';
import { getCompiler } from '../compilers';
import { Context } from '../../common/context';
import { archiveToMemory } from '../../common/utils';

const IGNORE_FILE_PATH = './.8baseignore';

/*
  paths:
    /project_dir
      - user's files / folders
      - node_modules
      - .build
        - dist (use for local compile when invoke-local command is invoked
        - meta (use for build meta for project)
        - package (use for package command)
 */

export class BuildController {
  /**
   * @param {Context} context - Context.
   * @returns {void}
   */
  public static clearBuild(context: Context): void {
    fs.removeSync(context.config.buildRootDirPath);
  }

  /*
    Function workflow
      1. Clean up directory
      2. Create Metadata file
      3. Create Schema file and save it
      4. Archive build and summary
  */

  /**
   * @param {Context} context - Context.
   * @returns {void}
   */
  static async package(
    context: Context,
  ): Promise<{ build: Readable; meta: Readable }> {
    BuildController.prepare(context);

    return {
      build: await BuildController.packageSources(context),
      meta: await BuildController.packageMetadata(context),
    };
  }

  // compile use only for invoke-local command
  /**
   * @param {Context} context - Context.
   * @returns {{ compiledFiles: string[] }} - Compiled files.
   */
  static async compile(context: Context): Promise<{ compiledFiles: string[] }> {
    BuildController.prepare(context);

    const files = ProjectController.getFunctionSourceCode(context);

    context.logger.debug('resolve compilers');
    const compiler = getCompiler(files, context);

    const compiledFiles = await compiler.compile(context.config.buildDistPath);
    context.logger.debug('compiled files = ' + compiledFiles);

    return {
      compiledFiles,
    };
  }

  /**
   * Private functions.
   */

  /**
   * @param {Context} context - Context.
   * @returns {Readable} - Readable.
   */
  private static async packageSources(context: Context): Promise<Readable> {
    const excludedDirectories = ['.git', '.idea'];

    const excludedRoots = [
      context.config.buildRootFolder,
      context.config.buildDistFolder,
      context.config.modulesFolder,
      context.config.metaFolder,
      context.config.packageFolder,
    ];

    // have to add '/' at the beginning to ignore only root folder. avoid recursive
    const ignoreFilter = ignore().add(excludedRoots.map((item) => '/' + item));

    if (fs.existsSync(IGNORE_FILE_PATH)) {
      ignoreFilter.add(fs.readFileSync(IGNORE_FILE_PATH).toString());
    }

    const files = await recursiveReadDir(
      context.config.rootExecutionDir,
      excludedDirectories,
    );

    const sourceToArchive = files
      .map((file) => path.relative(process.cwd(), file))
      .filter((file) => !ignoreFilter.ignores(file))
      .map((file) => ({ dist: file, source: file }));

    return archiveToMemory(sourceToArchive, context);
  }
  /**
   * @param {Context} context - Context.
   * @returns {Readable} - Readable.
   */
  private static packageMetadata(context: Context): Promise<Readable> {
    const metaDir = context.config.metaDir;

    ProjectController.saveMetaDataFile(context.project, metaDir);
    ProjectController.saveSchema(context.project, metaDir);
    ProjectController.saveProject(context.project, metaDir);

    return archiveToMemory([{ source: metaDir }], context);
  }
  /**
   * @param {Context} context - Context.
   */
  private static prepare(context: Context): void {
    fs.removeSync(context.config.buildRootDirPath);

    fs.mkdirpSync(context.config.buildDistPath);
    fs.mkdirpSync(context.config.metaDir);
    fs.mkdirpSync(context.config.packageDir);
  }
}
