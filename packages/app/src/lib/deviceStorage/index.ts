import { DeviceStorageInterface } from "./types";

export const deviceStorage: DeviceStorageInterface = {
  async get(key) {
    return key;
  },
  async delete() {
    return false;
  },
  async set() {
    return false;
  },
};

throw new Error("Unsupported Platform for localStorage");
