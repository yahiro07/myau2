type FileIO = {
  //pathはアプリが持つデータフォルダのルートからの相対パスを想定
  readFile(path: string): Promise<string>;
  writeFile(
    path: string,
    content: string,
    options?: { append?: boolean },
  ): Promise<void>;
};

type ParametersIO = {
  getParameters(): Record<string, number>;
  setParameters(parameters: Record<string, number>): void;
};

type PresetData = {
  presetKey: string;
  presetName: string;
  parametersVersion: number;
  parameters: Record<string, number>;
};

type PresetListItem = {
  presetKey: string;
  presetName: string;
  createAt: number;
};

type PresetManagerCore = {
  //現在のシンセ本体実装のパラメタバージョンを設定, 1,2,3,...のような値を想定
  setLatestParametersVersion(version: number): void;
  //presetKeyはユニークなキーで、ファイル名として使用される
  //例
  //{presetKey:"bass1"} 名前でプリセットを識別し、同じ名前のプリセットを許容しない場合 (presetKeyはファイル名として使われるので、ファイル名として使用可能な文字セットに制限する)
  //{presetKey:"EAF2B1FC-6B32-40E0-AE5D-2A39F27B0B79", presetName: "bass 1"} GUIDでプリセットを識別,同じ名前のプリセットの存在を許容する場合
  //{presetKey:"bank1_slot1", presetName: "bass 1"} 固定数バンク/固定数スロットで任意のバンク/スロットに名前をつけたプリセットを保存する場合
  //{presetKey:"bank1_slot1"} 固定数バンク/固定数スロットで名前をつけず管理する場合
  savePreset(presetKey: string, presetName?: string): Promise<void>;
  loadPreset(presetKey: string): Promise<void>;
  listPresetItems(): Promise<PresetListItem[]>;
};

function mapPresetKeyToRelativeFilePath(presetKey: string): string {
  return `user_presets/${presetKey}.json`;
}

type PresetListStorage = {
  listItems(): Promise<PresetListItem[]>;
  addItem(item: PresetListItem): Promise<void>;
  deleteItem(presetKey: string): Promise<void>;
  reorderItem(
    presetKey: string,
    destPresetKey: string,
    placeAt: "before" | "after",
  ): Promise<void>;
};

type PresetListEvent =
  | { type: "add"; presetKey: string; presetName: string; createAt: number }
  | { type: "delete"; presetKey: string }
  | {
      type: "reorder";
      presetKey: string;
      destPresetKey: string;
      placeAt: "before" | "after";
    };

function removeArrayItem<T>(items: T[], item: T) {
  const index = items.indexOf(item);
  if (index !== -1) {
    items.splice(index, 1);
  }
}

function digestPresetListEvents(events: PresetListEvent[]): PresetListItem[] {
  const items: PresetListItem[] = [];
  for (const event of events) {
    if (event.type === "add") {
      items.push({
        presetKey: event.presetKey,
        presetName: event.presetName,
        createAt: event.createAt,
      });
    } else if (event.type === "delete") {
      const item = items.find((item) => item.presetKey === event.presetKey);
      if (item) {
        removeArrayItem(items, item);
      }
    } else if (event.type === "reorder") {
      const sourceItem = items.find(
        (item) => item.presetKey === event.presetKey,
      );
      const destItemIndex = items.findIndex(
        (item) => item.presetKey === event.destPresetKey,
      );
      if (sourceItem && destItemIndex !== -1) {
        if (event.placeAt === "before") {
          items.splice(destItemIndex, 0, sourceItem);
        } else {
          items.splice(destItemIndex + 1, 0, sourceItem);
        }
        removeArrayItem(items, sourceItem);
      }
    }
  }
  return items;
}

function createPresetListStorage(fileIO: FileIO): PresetListStorage {
  const eventsFilePath = "user_presets/events.ndjson";

  const internal = {
    async loadEvents(): Promise<PresetListEvent[]> {
      const content = await fileIO.readFile(eventsFilePath);
      const lines = content.split("\n");
      return lines.map((line) => JSON.parse(line) as PresetListEvent);
    },
    async pushEvent(event: PresetListEvent) {
      const ndJsonLine = `${JSON.stringify(event)}\n`;
      const writeOptions = { append: true };
      await fileIO.writeFile(eventsFilePath, ndJsonLine, writeOptions);
    },
  };

  return {
    async listItems() {
      const events = await internal.loadEvents();
      return digestPresetListEvents(events);
    },
    async addItem(item) {
      await internal.pushEvent({ type: "add", ...item });
    },
    async deleteItem(presetKey) {
      await internal.pushEvent({ type: "delete", presetKey });
    },
    async reorderItem(presetKey, destPresetKey, placeAt) {
      await internal.pushEvent({
        type: "reorder",
        presetKey,
        destPresetKey,
        placeAt,
      });
    },
  };
}

export function createPresetManagerCore(
  fileIO: FileIO,
  parametersIO: ParametersIO,
): PresetManagerCore {
  let latestParametersVersion = 0;

  const presetListStorage = createPresetListStorage(fileIO);
  return {
    setLatestParametersVersion(version) {
      latestParametersVersion = version;
    },
    async savePreset(presetKey, presetName) {
      const relativeFilePath = mapPresetKeyToRelativeFilePath(presetKey);
      const presetData: PresetData = {
        presetKey,
        presetName: presetName ?? "",
        parametersVersion: latestParametersVersion,
        parameters: parametersIO.getParameters(),
      };
      return fileIO.writeFile(relativeFilePath, JSON.stringify(presetData));
    },
    async loadPreset(presetKey) {
      const relativeFilePath = mapPresetKeyToRelativeFilePath(presetKey);
      const content = await fileIO.readFile(relativeFilePath);
      const presetData = JSON.parse(content) as PresetData;
      if (presetData.parametersVersion !== latestParametersVersion) {
        //apply parameters migration if needed
      }
      parametersIO.setParameters(presetData.parameters);
    },
    async listPresetItems() {
      return presetListStorage.listItems();
    },
  };
}
