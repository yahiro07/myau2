const isDebug = location.search.includes("debug=1");
const isProto = location.search.includes("proto=1");

const loggerOptions = {
  console: false,
  sendToApp: false,
  localHttp: false,
};
if (isDebug) {
  Object.assign(loggerOptions, {
    console: true,
    sendToApp: true, //app routes app and ui logs to stdout and local log server
    localHttp: isProto, //send to local log server directly
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
    if (
      !loggerOptions.console &&
      !loggerOptions.localHttp &&
      !loggerOptions.sendToApp
    ) {
      return;
    }
    const msg = mapLogArgumentsToString(args);

    if (loggerOptions.console) {
      console.log(msg);
    }

    if (loggerOptions.localHttp) {
      void loggingViaLocalHttp(`(t:${Date.now()}, s:ui, k:${kind}) ${msg}`);
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
