// const isDebug = location.search.includes("debug=1");
// const isDebug = true; //debug
// const isDebug = false;

let postFailed = false;

async function loggingViaLocalHttp(msg: string) {
  if (!postFailed) {
    try {
      await fetch("http://localhost:9003", {
        method: "POST",
        body: msg,
      });
    } catch (_) {
      //初回のログ送信で失敗したらそれ以降はログを送らない
      console.log(`failed to post local http log`);
      postFailed = true;
    }
  }
}

export const logger = {
  log(
    ...parts: (
      | string
      | number
      | boolean
      | object
      | Array<string | number | boolean | object>
    )[]
  ) {
    const msg = parts
      .map((part) => {
        if (typeof part === "object" || Array.isArray(part)) {
          return JSON.stringify(part);
        }
        return part.toString();
      })
      .join(" ");
    console.log(msg);
    if (1) {
      const timedMessage = `(@t:${Date.now()}, @k:ui) ${msg}`;
      void loggingViaLocalHttp(timedMessage);
    }
  },
  logError(e: Error | unknown, note?: string) {
    console.error(e);
    const msg = e instanceof Error ? (e.stack ?? e.message) : String(e);
    logger.log(note ?? "", msg);
  },
  timedLog(msg: string) {
    const now = new Date();
    const time = now.toISOString();
    logger.log(`${time} ${msg}`);
  },
};
