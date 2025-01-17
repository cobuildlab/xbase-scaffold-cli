/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as _ from 'lodash';
import * as fs from 'fs';
import * as i18next from 'i18next';
import * as Ora from 'ora';
import * as path from 'path';
import * as winston from 'winston';
import * as yaml from 'yaml';
import chalk from 'chalk';
import { Client } from '@8base/api-client';
import { TransformableInfo } from 'logform';

import { UserDataStorage } from './userDataStorage';
import { User } from './user';
import { StaticConfig } from '../config';
import { ProjectDefinition } from '../interfaces/Project';
import { ProjectController } from '../engine/controllers/projectController';
import { StorageParameters } from '../consts/StorageParameters';
import { Translations } from './translations';
import { Colors } from '../consts/Colors';
import {
  EnvironmentInfo,
  RequestOptions,
  SessionInfo,
  Workspace,
} from '../interfaces/Common';
import { GraphqlActions } from '../consts/GraphqlActions';
import {
  DEFAULT_ENVIRONMENT_NAME,
  DEFAULT_REMOTE_ADDRESS,
} from '../consts/Environment';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../package.json');

export type WorkspaceConfig = {
  readonly workspaceId: string;
  readonly environmentName: string;
  readonly apiHost: string;
};

type Plugin = { name: string; path: string };

export type ProjectConfig = {
  functions: Record<string, any>;
  plugins?: Plugin[];
};

const WORKSPACE_CONFIG_FILENAME = '.workspace.json';
const PROJECT_CONFIG_FILENAME = '8base.yml';

export class Context {
  private _project: ProjectDefinition = null;

  version: string;

  logger: winston.Logger;

  i18n: i18next.i18n;

  spinner: any;

  /**
   * @param {any} params - Params.
   * @param {Translations} translations - Translations.
   * @returns {void}
   */
  constructor(params: any, translations: Translations) {
    this.logger = winston.createLogger({
      level: params.d ? 'debug' : 'info',
      format: winston.format.printf((info: TransformableInfo) => {
        if (info.level === 'info') {
          return info.message;
        }
        if (info.level === 'debug') {
          return `${chalk.hex(Colors.blue)(info.level)} [${Date.now()}]: ${
            info.message
          }`;
        }
        return `${chalk.hex(Colors.red)(info.level)}: ${info.message}`;
      }),
      transports: [new winston.transports.Console()],
    });

    this.i18n = translations.i18n;
    this.version = pkg.version;

    this.spinner = Ora({
      color: 'white',
      text: '\n',
    });
  }

  get workspaceConfig(): WorkspaceConfig | null {
    const workspaceConfigPath = this.getWorkspaceConfigPath();

    if (this.hasWorkspaceConfig()) {
      return JSON.parse(String(fs.readFileSync(workspaceConfigPath)));
    }

    return null;
  }

  /**
   * @returns {Promise<EnvironmentInfo[]>} - Environment info.
   */
  async getEnvironments(): Promise<EnvironmentInfo[]> {
    const { system } = await this.request(
      GraphqlActions.environmentsList,
      null,
      {
        customEnvironment: DEFAULT_ENVIRONMENT_NAME,
      },
    );

    const environments = system.environments.items;
    if (_.isEmpty(environments)) {
      throw new Error(this.i18n.t('logout_error'));
    }

    return environments;
  }

  set workspaceConfig(value: WorkspaceConfig) {
    const workspaceConfigPath = this.getWorkspaceConfigPath();
    fs.writeFileSync(workspaceConfigPath, JSON.stringify(value, null, 2));
  }

  /**
   * @param {string} customPath - CustomPath.
   * @returns {string} - Workspace config.
   */
  getWorkspaceConfigPath(customPath?: string): string {
    return path.join(customPath || process.cwd(), WORKSPACE_CONFIG_FILENAME);
  }

  updateWorkspace(value: WorkspaceConfig): void {
    const currentWorkspaceConfig = this.workspaceConfig;
    this.workspaceConfig = _.merge(currentWorkspaceConfig, value);
  }

  updateEnvironmentName(environmentName: string): void {
    const currentWorkspaceConfig = this.workspaceConfig;

    this.workspaceConfig = _.merge(currentWorkspaceConfig, { environmentName });
  }

  createWorkspaceConfig(value: WorkspaceConfig, customPath?: string): void {
    const workspaceConfigPath = this.getWorkspaceConfigPath(customPath);

    fs.writeFileSync(workspaceConfigPath, JSON.stringify(value, null, 2));
  }

  /**
   * @returns {string | null} - WorkspaceId.
   */
  get workspaceId(): string | null {
    return _.get(this.workspaceConfig, 'workspaceId', null);
  }

  /**
   * @returns {string | null} - Workspace.
   */
  get region(): string | null {
    return _.get(this.workspaceConfig, 'region', null);
  }

  /**
   * @returns {string | null} - WorkspaceId.
   */
  get environmentName(): string | null {
    return _.get(this.workspaceConfig, 'environmentName', null);
  }

  /**
   * @returns {string | null} - WorkspaceId.
   */
  get apiHost(): string | null {
    return _.get(this.workspaceConfig, 'apiHost', null);
  }

  /**
   * @param {string} customPath - Custom path.
   * @returns {boolean} - Boolean.
   */
  hasWorkspaceConfig(customPath?: string): boolean {
    const workspaceConfigPath = this.getWorkspaceConfigPath(customPath);

    return fs.existsSync(workspaceConfigPath);
  }

  /**
   * @returns {boolean} - Boolean.
   */
  isProjectDir(): boolean {
    return this.hasWorkspaceConfig();
  }

  get projectConfig(): ProjectConfig {
    const projectConfigPath = this.getProjectConfigPath();

    let projectConfig = { functions: {} };

    if (this.hasProjectConfig()) {
      projectConfig =
        yaml.parse(String(fs.readFileSync(projectConfigPath))) || projectConfig;
    }

    return projectConfig;
  }

  set projectConfig(value: ProjectConfig) {
    const projectConfigPath = this.getProjectConfigPath();

    fs.writeFileSync(projectConfigPath, yaml.stringify(value));
  }

  /**
   * @param {string} customPath - Custom Path.
   * @returns {string} - Config path.
   */
  getProjectConfigPath(customPath?: string): string {
    return path.join(customPath || process.cwd(), PROJECT_CONFIG_FILENAME);
  }

  /**
   * @param {string} customPath - Custom Path.
   * @returns {boolean} - Boolean.
   */
  hasProjectConfig(customPath?: string): boolean {
    const projectConfigPath = this.getProjectConfigPath(customPath);

    return fs.existsSync(projectConfigPath);
  }

  /**
   * @returns {string} - Server address.
   */
  resolveMainServerAddress(): string {
    return (
      this.storage.getValue(StorageParameters.serverAddress) ||
      DEFAULT_REMOTE_ADDRESS
    );
  }

  /**
   * @returns {UserDataStorage} - User data.
   */
  get storage(): typeof UserDataStorage {
    return UserDataStorage;
  }

  /**
   * @returns {User} - User.
   */
  get user(): typeof User {
    return User;
  }

  /**
   * @returns {StaticConfig} - User.
   */
  get config(): typeof StaticConfig {
    return StaticConfig;
  }

  /**
   * @param {SessionInfo} data - Data info.
   */
  setSessionInfo(data: SessionInfo): void {
    if (!data) {
      this.logger.debug('set session info empty data');
      return;
    }

    this.logger.debug('set session info...');
    if (_.isString(data.idToken)) {
      this.logger.debug(`id token ${data.idToken.substr(0, 10)}`);
    }

    if (_.isString(data.refreshToken)) {
      this.logger.debug(`refresh token: ${data.refreshToken.substr(0, 10)}`);
    }

    this.storage.setValues([
      {
        name: StorageParameters.refreshToken,
        value: data.refreshToken,
      },
      {
        name: StorageParameters.idToken,
        value: data.idToken,
      },
    ]);
  }

  /**
   * @returns {Workspace[]} - Workspaces.
   */
  async getWorkspaces(): Promise<Workspace[]> {
    const workspaces = await this.workspaceList();

    if (_.isEmpty(workspaces) || !_.isArray(workspaces)) {
      throw new Error(this.i18n.t('logout_error'));
    }

    return workspaces;
  }

  /**
   * @param {string} workspaceId  - WorkspaceId.
   * @returns {void}
   */
  async checkWorkspace(workspaceId: string): Promise<void> {
    if (!_.some(await this.workspaceList(), { id: workspaceId })) {
      throw new Error(this.i18n.t('inexistent_workspace'));
    }
  }

  /**
   * @returns {Workspace[]} - Workspaces.
   */
  private async workspaceList(): Promise<Workspace[]> {
    const data = await this.request(GraphqlActions.listWorkspaces, null, {
      isLoginRequired: false,
      address: this.resolveMainServerAddress(),
      // custom workspace id is "" to ignore this parameter during requesting
      customWorkspaceId: '',
    });

    return _.get(data, ['workspacesList', 'items'], []);
  }

  /**
   * @param {string} query - Query.
   * @param {any} variables - Variables.
   * @param {RequestOptions} options - Options.
   * @returns {any} - Any.
   */
  async request(
    query: string,
    variables: any = null,
    options?: RequestOptions,
  ): Promise<any> {
    const defaultOptions: RequestOptions = {
      isLoginRequired: true,
      customWorkspaceId: undefined,
      customEnvironment: undefined,
      address: this.apiHost || this.resolveMainServerAddress(),
    };

    const {
      customEnvironment,
      customWorkspaceId,
      isLoginRequired,
      address,
    } = options
      ? {
          ...defaultOptions,
          ...options,
        }
      : defaultOptions;

    this.logger.debug(
      this.i18n.t('debug:remote_address', { remoteAddress: address }),
    );

    if (!address) {
      /*
        address has to be passed as parameter (workspace list query) or resolved from workspace info
        another way it's invalid behaviour
       */
      throw new Error(this.i18n.t('configure_error'));
    }

    const client = new Client(address);

    this.logger.debug(`query: ${query}`);
    this.logger.debug(`variables: ${JSON.stringify(variables)}`);

    const refreshToken = this.storage.getValue(StorageParameters.refreshToken);
    if (refreshToken) {
      this.logger.debug(this.i18n.t('debug:set refresh token'));
      client.setRefreshToken(refreshToken);
    }

    const idToken = this.storage.getValue(StorageParameters.idToken);
    if (idToken) {
      this.logger.debug(this.i18n.t('debug:set_id_token'));
      client.setIdToken(idToken);
    }

    const workspaceId =
      customWorkspaceId !== undefined ? customWorkspaceId : this.workspaceId;

    if (workspaceId) {
      this.logger.debug(this.i18n.t('debug:set_workspace_id', { workspaceId }));
      client.setWorkspaceId(workspaceId);
    }

    const environmentName = _.isNil(customEnvironment)
      ? this.environmentName
      : customEnvironment;
    if (environmentName) {
      this.logger.debug(
        this.i18n.t('debug:set_environment_name', { environmentName }),
      );
      client.gqlc.setHeader('environment', environmentName);
    }

    if (isLoginRequired && !this.user.isAuthorized()) {
      throw new Error(this.i18n.t('logout_error'));
    }

    this.logger.debug(this.i18n.t('debug:start_request'));
    const result = await client.request(query, variables);
    this.logger.debug(this.i18n.t('debug:request_complete'));

    if (client.idToken !== idToken) {
      this.logger.debug(this.i18n.t('debug:reset_id_token'));
      this.storage.setValues([
        {
          name: StorageParameters.idToken,
          value: client.idToken,
        },
      ]);
    }

    if (client.refreshToken !== refreshToken) {
      this.logger.debug(this.i18n.t('debug:reset_refresh_token'));
      this.storage.setValues([
        {
          name: StorageParameters.refreshToken,
          value: client.refreshToken,
        },
      ]);
    }

    return result;
  }

  /**
   * @returns {void}
   */
  initializeProject(): void {
    this.project;
  }

  /**
   * @returns {ProjectDefinition} - Project definition.
   */
  get project(): ProjectDefinition {
    if (_.isNil(this._project)) {
      this._project = ProjectController.initialize(this);
    }
    return this._project;
  }
}
