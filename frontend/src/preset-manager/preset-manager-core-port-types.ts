export type PresetFilesIORealm = "appAssets" | "appData";

export type PresetFilesIO = {
  //pathはアプリが持つデータフォルダのルートからの相対パスを想定
  //read/write/deleteの各処理でファイルが存在しない場合やIOエラーが発生した場合は例外を投げる
  readFile(
    //realm:appAssetsはアプリに同梱されたアセットのフォルダ
    //realm:appDataはアプリ固有のストレージのフォルダ
    realm: PresetFilesIORealm,
    path: string,
    //skipIfNotExistオプションがtrueの場合は、ファイルが存在しないときに例外を投げずに空文字を返す
    options?: { skipIfNotExist?: boolean },
  ): Promise<string>;
  //write/deleteではrealm:appDataのみが対象のため引数には含めない
  writeFile(
    path: string,
    content: string,
    options?: { append?: boolean },
  ): Promise<void>;
  deleteFile(path: string): Promise<void>;
};

export type PresetParametersIO = {
  getParameters(): Record<string, number>;
  setParameters(parameters: Record<string, number>): void;
};
