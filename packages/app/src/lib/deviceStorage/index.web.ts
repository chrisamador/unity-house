import { DeviceStorageInterface } from "./types";

export const deviceStorage: DeviceStorageInterface = {
  async get(key) {
    return localStorage.getItem(key);
  },
  async delete(key) {
    localStorage.removeItem(key);
    return true;
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return true;
  },
};
