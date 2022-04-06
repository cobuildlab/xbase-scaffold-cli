import { Context } from './context';

export class ProjectConfigurationState {
  /**
   * @param {Context} context - Context.
   * @returns {void}
   */
  public static expectConfigured(context: Context): void {
    if (
      !context.hasWorkspaceConfig() ||
      !context.workspaceConfig.workspaceId ||
      !context.workspaceConfig.environmentName
    ) {
      throw new Error(context.i18n.t('configuration_required'));
    }
  }

  /**
   * @param {Context} context - Context.
   * @returns {void}
   */
  public static expectHasProject(context: Context): void {
    ProjectConfigurationState.expectConfigured(context);
    if (!context.hasProjectConfig()) {
      throw new Error(context.i18n.t('you_are_not_in_project'));
    }
  }
}
