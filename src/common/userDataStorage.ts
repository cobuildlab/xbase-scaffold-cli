/* eslint-disable @typescript-eslint/no-explicit-any */
import { StaticConfig } from '../config';
import { StorageParameters, StorageParametersType } from '../consts/StorageParameters';
import * as path from 'path';
import * as fs from 'fs';

const defaultStorageData = {
  [StorageParameters.authDomain]: StaticConfig.authDomain,
  [StorageParameters.authClientId]: StaticConfig.authClientId,
};

class Storage {
  private static storageFileName = '.8baserc';

  /**
   *  Path to storage file is persistent.
   */
  /**
   * @returns {string} - Boolean.
   */
  private static get pathToStorage(): string {
    return path.join(StaticConfig.homePath, this.storageFileName);
  }

  /**
   * Function check exist and create storage file.
   *
   * @returns {void} Path to instanced repository file.
   */
  private static checkStorageExist(): void {
    const storagePath = this.pathToStorage;
    if (!fs.existsSync(storagePath)) {
      fs.writeFileSync(storagePath, this.toPrettyString(defaultStorageData));
    }
  }

  /**
   * @returns {any} - Any.
   */
  private static parseStorageData(): Array<any> {
    return JSON.parse(fs.readFileSync(this.pathToStorage).toString());
  }

  static getStorage(): any {
    this.checkStorageExist();
    return this.parseStorageData();
  }

  /**
   * @param {any} storage - Storage.
   * @returns {void}
   */
  static saveStorage(storage: any): void {
    fs.writeFileSync(this.pathToStorage, this.toPrettyString(storage));
  }

  /**
   * @param {any} storage - Storage.
   * @returns {string} - String.
   */
  static toPrettyString(storage: any): string {
    return JSON.stringify(storage, null, 2);
  }
}

export class UserDataStorage {
  /**
   * @param data - Data.
   */
  static setValues(data: { name: string; value: any }[]): void {
    const storage = Storage.getStorage();
    data.map((d) => (storage[d.name] = d.value));
    Storage.saveStorage(storage);
  }

  static getValue(name: StorageParametersType): any {
    const storage = Storage.getStorage();
    const storageValue = storage[name];

    if (!storageValue && !!defaultStorageData[name]) {
      this.setValues([
        {
          name,
          value: defaultStorageData[name],
        },
      ]);

      return defaultStorageData[name];
    } else if (!storageValue) {
      return null;
    }

    return storageValue;
  }

  /**
   * @returns {void}
   */
  static clearAll(): void {
    const storage = Storage.getStorage();
    delete storage.auth;
    delete storage.email;
    delete storage.accountId;
    delete storage.remoteCliEndpoint;
    Storage.saveStorage(storage);
  }

  static toString(): string {
    return Storage.toPrettyString(Storage.getStorage());
  }
}
