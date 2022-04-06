import * as i18next from 'i18next';
// eslint-disable-next-line import/named
import { i18n } from 'i18next';

import locales from '../locales';

/**
 * @param {i18n} i18next - I18next.
 * @returns {void}
 */
const initTranslations = async (i18next: i18n): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    i18next.init(
      {
        fallbackLng: 'en',
        debug: false,
        defaultNS: 'default',
        resources: locales,
      },
      (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      },
    );
  });
};

export class Translations {
  i18n: i18next.i18n;
  /**
   * @returns {void}
   */
  async init(): Promise<Translations> {
    await initTranslations(i18next);
    this.i18n = i18next.cloneInstance();
    return this;
  }
}

const translations = new Translations();
export { translations };
