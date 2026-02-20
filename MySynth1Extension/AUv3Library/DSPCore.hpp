#pragma once

class DSPCore {
public:
  // SwiftでDSPCoreの派生クラスから派生元のDSPCoreとしてのポインタを得るためのメソッド
  DSPCore *asDSPCorePointer() { return this; };

  virtual ~DSPCore() = default;

  // パラメタセットのバージョン
  // パラメタ定義を変えた際に、処理を振り分けて古いプリセットの音色を維持したいときに使う
  virtual void setParametersVersion(int version) = 0;

  // 初期化時に全パラメタに対してsetParameterを呼ぶときのparamKeyが取得される
  // デフォルトではaddressをそのまま返す
  // オーバーライドすることで、文字列のidentifierのハッシュ値でパラメタを識別する方式にもできる
  // virtual uint64_t mapParameterKey(uint64_t address, const char *identifier)
  // {
  //   return address;
  // }

  virtual uint64_t mapParameterKey(const char *identifier) = 0;

  virtual void setParameter(uint64_t paramKey, float value) = 0;

  virtual void prepare(float sampleRate, size_t maxFrameLength) = 0;
  // バッファ区間途中でのノートオン/オフの処理はフレームワーク側で対応しており、
  // ここではノートオン/ノートオフ境界に整合したタイミングでprocess()が呼ばれる
  // そのためprocessのframesは呼び出しごとに毎回変わる想定での対応が必要
  virtual void noteOn(int noteNumber, float velocity) = 0;
  virtual void noteOff(int noteNumber) = 0;
  virtual void process(float *leftBuffer, float *rightBuffer,
                       size_t frames) = 0;
};
