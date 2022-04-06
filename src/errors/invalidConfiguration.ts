export class InvalidConfiguration extends Error {
  /**
   * @param {string} name - Name.
   * @param {string} description - Description.
   * @returns {void} - Void.
   */
  constructor(name: string, description: string) {
    super();
    this.message =
      'Invalid configuration file "' + name + '". Description: ' + description;
  }
}
