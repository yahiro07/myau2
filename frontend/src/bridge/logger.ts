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
    // localHttp: true,
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

type LogItem = {
  timeStamp: number;
  kind: string;
  message: string;
};

function sendLogItemToApp(logItem: LogItem) {
  const globalThisTyped = globalThis as unknown as {
    webkit?: {
      messageHandlers: {
        putMessageFromUI: {
          postMessage: (msg: {
            type: "putLogItem";
            timeStamp: number;
            kind: string;
            message: string;
          }) => void;
        };
      };
    };
  };
  globalThisTyped.webkit?.messageHandlers.putMessageFromUI.postMessage({
    type: "putLogItem",
    timeStamp: logItem.timeStamp,
    kind: logItem.kind,
    message: logItem.message,
  });
}

type LogArguments = (
  | string
  | number
  | boolean
  | object
  | Array<string | number | boolean | object>
  | unknown
)[];

function mapLogArgumentsToString(args: LogArguments) {
  return args
    .map((arg) => {
      if (typeof arg === "object") {
        return JSON.stringify(arg);
      }
      return String(arg);
    })
    .join(" ");
}

function createLoggerEntry() {
  function pushLog(kind: string, args: LogArguments) {
    const msg = mapLogArgumentsToString(args);

    if (loggerOptions.console) {
      console.log(msg);
    }

    if (loggerOptions.localHttp) {
      void loggingViaLocalHttp(`(@t:${Date.now()}, @k:${kind}) ${msg}`);
    }

    if (loggerOptions.sendToApp) {
      sendLogItemToApp({
        timeStamp: Date.now(),
        kind: kind,
        message: msg,
      });
    }
  }

  return {
    log(...args: LogArguments) {
      pushLog("log", args);
    },
    mark(...args: LogArguments) {
      pushLog("mark", args);
    },
    warn(...args: LogArguments) {
      pushLog("warn", args);
    },
    error(...args: LogArguments) {
      pushLog("error", args);
    },
  };
}

export const logger = createLoggerEntry();

// export const logger = {
//   log(
//     ...parts: (
//       | string
//       | number
//       | boolean
//       | object
//       | Array<string | number | boolean | object>
//     )[]
//   ) {
//     const msg = parts
//       .map((part) => {
//         if (typeof part === "object" || Array.isArray(part)) {
//           return JSON.stringify(part);
//         }
//         return part.toString();
//       })
//       .join(" ");

//     if (loggerOptions.console) {
//       console.log(msg);
//     }

//     const timedMessage = `(@t:${Date.now()}, @k:ui) ${msg}`;
//     if (logger) {
//       // sendLogToApp(timedMessage);
//       sendLogToApp(timedMessage, "log");
//     }
//     if (loggerOptions.localHttp) {
//       void loggingViaLocalHttp(timedMessage);
//     }
//   },
//   logError(e: Error | unknown, note?: string) {
//     console.error(e);
//     const msg = e instanceof Error ? (e.stack ?? e.message) : String(e);
//     logger.log(note ?? "", msg);
//   },
//   timedLog(msg: string) {
//     const now = new Date();
//     const time = now.toISOString();
//     logger.log(`${time} ${msg}`);
//   },
// };
