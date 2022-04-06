import * as path from 'path';
import { PredefineData } from './predefineData';

export class StaticConfig {
  private static staticData = new PredefineData();
  /**
   * @returns {string} - String.
   */
  static get projectTemplatePath(): string {
    return this.staticData.projectTemplatePath;
  }
  /**
   * @returns {string} - String.
   */
  static get functionTemplatesPath(): string {
    return this.staticData.functionTemplatesPath;
  }
  /**
   * @returns {string} - String.
   */
  static get pluginTemplatePath(): string {
    return this.staticData.pluginTemplatePath;
  }
  /**
   * @returns {string} - String.
   */
  static get mockTemplatePath(): string {
    return this.staticData.mockTemplatePath;
  }
  /**
   * @returns {string} - String.
   */
  static get rootProjectDir(): string {
    return this.staticData.projectDir;
  }
  /**
   * @returns {string} - String.
   */
  static get rootExecutionDir(): string {
    return this.staticData.executionDir;
  }
  /**
   * @returns {string} - String.
   */
  static get commandsDir(): string {
    return this.staticData.commandsPath;
  }
  /**
   * @returns {string} - String.
   */
  static get homePath(): string {
    return process.env.USERPROFILE || process.env.HOME || process.env.HOMEPATH;
  }
  /**
   * @returns {string} - String.
   */
  static get authDomain(): string {
    return this.staticData.authDomain;
  }
  /**
   * @returns {string} - String.
   */
  static get authClientId(): string {
    return this.staticData.authClientId;
  }
  /**
   * @returns {string} - String.
   */
  static get webClientAddress(): string {
    return this.staticData.webClientAddress;
  }
  /**
   * @returns {string} - String.
   */
  static get serviceConfigFileName(): string {
    return path.join(this.staticData.executionDir, '8base.yml');
  }
  /**
   * @returns {string} - String.
   */
  static get packageFileName(): string {
    return 'package.json';
  }

  /**
   * Compiler paths.
   */

  static buildRootFolder = '.build';
  static buildDistFolder = 'dist';
  static modulesFolder = 'node_modules';
  static metaFolder = 'meta';
  static packageFolder = 'package';

  static buildRootDirPath = path.join(
    StaticConfig.rootExecutionDir,
    StaticConfig.buildRootFolder,
  );
  static buildDistPath = path.join(
    StaticConfig.buildRootDirPath,
    StaticConfig.buildDistFolder,
  );
  static metaDir = path.join(
    StaticConfig.buildRootDirPath,
    StaticConfig.metaFolder,
  );
  static packageDir = path.join(
    StaticConfig.buildRootDirPath,
    StaticConfig.packageFolder,
  );

  static FunctionHandlerExt = '.js';

  static supportedCompileExtension = new Set<string>(['.ts', '.js']);
}
