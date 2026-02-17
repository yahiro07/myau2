// const isDebug = location.search.includes("debug=1");
// const isDebug = true; //debug
// const isDebug = false;

const loggerOptions = {
  console: false,
  localHttp: false,
  sendToApp: false,
};
if (1) {
  Object.assign(loggerOptions, {
    console: true,
    localHttp: true,
    sendToApp: true,
  });
}

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

function sendLogToApp(msg: string) {
  const globalThisTyped = globalThis as unknown as {
    webkit?: {
      messageHandlers: {
        putMessageFromUI: {
          postMessage: (msg: { type: "log"; message: string }) => void;
        };
      };
    };
  };
  globalThisTyped.webkit?.messageHandlers.putMessageFromUI.postMessage({
    type: "log",
    message: msg,
  });
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

    if (loggerOptions.console) {
      console.log(msg);
    }

    const timedMessage = `(@t:${Date.now()}, @k:ui) ${msg}`;
    if (logger) {
      sendLogToApp(timedMessage);
    }
    if (loggerOptions.localHttp) {
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
