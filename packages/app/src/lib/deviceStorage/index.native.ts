import * as SecureStore from "expo-secure-store";

import { DeviceStorageInterface } from "./types";

export const deviceStorage: DeviceStorageInterface = {
  async get(key) {
    return await SecureStore.getItemAsync(key);
  },
  async delete(key) {
    await SecureStore.deleteItemAsync(key);
    return true;
  },
  async set(key, value) {
    await SecureStore.setItemAsync(key, value);
    return true;
  },
};
