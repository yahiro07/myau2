import { PresetData, PresetListItem } from "@/preset-manager/preset-data-types";
import { PresetFilesIO } from "@/preset-manager/preset-manager-core-port-types";

type PresetManagerCore = {
  listPresetItems(): Promise<PresetListItem[]>;
  //presetKeyはユニークなキーで、ファイル名として使用される
  //例
  //{presetKey:"bass1"} 名前でプリセットを識別し、同じ名前のプリセットを許容しない場合 (presetKeyはファイル名として使われるので、ファイル名として使用可能な文字セットに制限する)
  //{presetKey:"EAF2B1FC-6B32-40E0-AE5D-2A39F27B0B79", presetName: "bass 1"} GUIDでプリセットを識別,同じ名前のプリセットの存在を許容する場合
  //{presetKey:"bank1_slot1", presetName: "bass 1"} 固定数バンク/固定数スロットで任意のバンク/スロットに名前をつけたプリセットを保存する場合
  //{presetKey:"bank1_slot1"} 固定数バンク/固定数スロットで名前をつけず管理する場合
  savePreset(
    presetKey: string,
    presetData: PresetData,
  ): Promise<PresetListItem>;
  loadPreset(presetKey: string): Promise<PresetData>;
  deletePreset(presetKey: string): Promise<void>;
};

function mapPresetKeyToRelativeFilePath(presetKey: string): string {
  return `user_presets/${presetKey}.json`;
}

function checkPresetKeyValid(presetKey: string): boolean {
  //raise error if presetKey contains characters that are not allowed in file names
  if (/[\/\\:\*\?"<>\|]/.test(presetKey)) {
    return false;
  }
  return true;
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
      // 既存のアイテムがあれば削除（上書き扱い）
      const existingIndex = items.findIndex(
        (item) => item.presetKey === event.presetKey,
      );
      if (existingIndex !== -1) {
        items.splice(existingIndex, 1);
      }
      items.push({
        presetKey: event.presetKey,
        presetName: event.presetName,
        createAt: event.createAt,
        presetKind: "user",
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
      if (sourceItem) {
        removeArrayItem(items, sourceItem);
        const destItemIndex = items.findIndex(
          (item) => item.presetKey === event.destPresetKey,
        );
        if (destItemIndex !== -1) {
          const insertIndex =
            event.placeAt === "before" ? destItemIndex : destItemIndex + 1;
          items.splice(insertIndex, 0, sourceItem);
        }
      }
    }
  }
  return items;
}

function createCompactedEvents(items: PresetListItem[]): PresetListEvent[] {
  return items.map((item) => ({
    type: "add",
    presetKey: item.presetKey,
    presetName: item.presetName,
    createAt: item.createAt,
  }));
}

function createPresetListStorage(
  presetFilesIO: PresetFilesIO,
): PresetListStorage {
  const eventsFilePath = "user_presets/events.ndjson";

  const internal = {
    async loadEvents(): Promise<PresetListEvent[]> {
      const content = await presetFilesIO.readFile(eventsFilePath, {
        skipIfNotExist: true,
      });
      if (content === "") {
        //初回起動でファイルがない場合
        return [];
      }
      const lines = content.split("\n").filter((line) => line.trim());
      return lines.map((line) => JSON.parse(line) as PresetListEvent);
    },
    async saveCompactedEvents(events: PresetListEvent[]) {
      const ndJsonContent = events
        .map((event) => `${JSON.stringify(event)}\n`)
        .join("");
      await presetFilesIO.writeFile(eventsFilePath, ndJsonContent);
    },
    async pushEvent(event: PresetListEvent) {
      const ndJsonLine = `${JSON.stringify(event)}\n`;
      const writeOptions = { append: true };
      await presetFilesIO.writeFile(eventsFilePath, ndJsonLine, writeOptions);
    },
  };

  return {
    async listItems() {
      const events = await internal.loadEvents();
      const items = digestPresetListEvents(events);
      //変更操作のイベントが一定数を超えていたら、変更処理を消化して保存し直す
      const numModificationEvents = events.filter(
        (ev) => ev.type !== "add",
      ).length;
      if (numModificationEvents > 40) {
        const compactedEvents = createCompactedEvents(items);
        await internal.saveCompactedEvents(compactedEvents);
      }
      return items;
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
  presetFilesIO: PresetFilesIO,
): PresetManagerCore {
  const presetListStorage = createPresetListStorage(presetFilesIO);
  return {
    async listPresetItems() {
      return await presetListStorage.listItems();
    },
    async savePreset(presetKey, presetData) {
      const presetKeyValid = checkPresetKeyValid(presetKey);
      if (!presetKeyValid) {
        throw new Error(
          `Invalid presetKey: ${presetKey}. presetKey cannot contain characters that are not allowed in file names.`,
        );
      }
      const relativeFilePath = mapPresetKeyToRelativeFilePath(presetKey);
      const presetListItem: PresetListItem = {
        presetKey,
        presetName: presetData.presetName,
        //既存のプリセットと同じキーで保存する場合、古い作成日時は無視して新しい日時で書き込む
        createAt: Date.now(),
        presetKind: "user",
      };
      await presetListStorage.addItem(presetListItem);
      await presetFilesIO.writeFile(
        relativeFilePath,
        JSON.stringify(presetData),
      );
      return presetListItem;
    },
    async loadPreset(presetKey) {
      const relativeFilePath = mapPresetKeyToRelativeFilePath(presetKey);
      const content = await presetFilesIO.readFile(relativeFilePath);
      return JSON.parse(content) as PresetData;
    },
    async deletePreset(presetKey) {
      const relativeFilePath = mapPresetKeyToRelativeFilePath(presetKey);
      await presetListStorage.deleteItem(presetKey);
      await presetFilesIO.deleteFile(relativeFilePath);
    },
  };
}
