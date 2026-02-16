import { PresetFilesIO } from "@/preset-manager/preset-manager-core-port-types";

//data is stored in app data folder as a single JSON file.
type SharedKvsAdapter = {
  initialize(): Promise<void>;
  read(key: string): string | undefined;
  write(key: string, value: string): void;
  delete(key: string): void;
};

export function createSharedKvsAdapter(
  presetFileIO: PresetFilesIO,
): SharedKvsAdapter {
  const localCache: Record<string, string> = {};
  const filePath = "shared_kvs.json";

  //debounce writes to avoid excessive file IO when multiple writes happen in a short time.
  let timerId: number | undefined;
  function scheduleWriteToFile() {
    if (timerId) return;
    timerId = window.setTimeout(() => {
      const dataText = JSON.stringify(localCache);
      void presetFileIO.writeFile(filePath, dataText);
      timerId = undefined;
    }, 1000);
  }
  return {
    async initialize() {
      const dataText = await presetFileIO.readFile(filePath, {
        skipIfNotExist: true,
      });
      if (dataText) {
        try {
          const obj = JSON.parse(dataText) as Record<string, string>;
          Object.assign(localCache, obj);
        } catch (e) {
          console.error(e);
        }
      }
    },
    read(key) {
      return localCache[key];
    },
    write(key, value) {
      localCache[key] = value;
      scheduleWriteToFile();
    },
    delete(key) {
      delete localCache[key];
      scheduleWriteToFile();
    },
  };
}
