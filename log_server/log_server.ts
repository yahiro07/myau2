const configs = {
  udpPortForApp: 9001,
  udpPortForDsp: 9002,
  httpPortForUi: 9003,
};

// type _LogKind = "log" | "mark" | "warn" | "error" | "mute" | "unmute";

//log format example, t is timestamp, s is subSystem,  k is logKind
//messages are shown with a little delay and sorted by timestamp
//since http messages from UI are received asynchronously, their order might not be strictly chronological

//basic message
//(t:1771144458.8012319, s:app, k:log) hello world

//mute/unmute all logs
//(t:1771144458.8012319, k:mute)
//(t:1771144458.8012319, k:unmute)

type LogItem = {
  timestamp: number;
  subSystem?: string;
  logKind?: string;
  message?: string;
  subOrdering: number;
};

const subSystemIcons: Record<string, string> = {
  host: "🟣",
  ext: "🔸",
  ui: "🔹",
  dsp: "🔺",
};

const logKindIcons: Record<string, string> = {
  log: "",
  mark: "🔽",
  warn: "⚠️",
  error: "📛",
};

let subOrderingCounter = 0;

function parseLogText(msg: string): LogItem {
  const headPart = msg.match(/\((.*?)\)\s/)?.[0];
  if (headPart) {
    const msgBody = msg.replace(headPart, "").trim();
    const kvs = Object.fromEntries(
      headPart
        .slice(1, -2)
        .split(",")
        .map((part) => part.trim().split(":"))
        .map(([k, v]) => [k, v]),
    );
    const timestamp = parseFloat(kvs.t) ?? Date.now();
    const subSystem = kvs.s;
    const logKind = kvs.k;
    return {
      timestamp,
      subSystem,
      logKind,
      message: msgBody,
      subOrdering: subOrderingCounter++,
    };
  } else {
    const timestamp = Date.now();
    return { timestamp, message: msg, subOrdering: subOrderingCounter++ };
  }
}

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
  //00:00:00.000
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function createLoggerCore() {
  const logItems: LogItem[] = [];
  let timerId: number | undefined;
  let isMuted = false;

  function consumeLogItem(logItem: LogItem) {
    if (logItem.logKind === "mute") {
      isMuted = true;
    } else if (logItem.logKind === "unmute") {
      isMuted = false;
    } else if (logItem.message) {
      if (!isMuted) {
        const ssIcon = subSystemIcons[logItem.subSystem ?? ""] ?? "";
        const kindIcon = logKindIcons[logItem.logKind ?? ""] ?? "";
        const ts = formatTimestamp(logItem.timestamp);
        console.log(
          `${ts} [${ssIcon}${logItem.subSystem}] ${kindIcon} ${logItem.message}`,
        );
      }
    }
  }

  function consumeLogItems() {
    logItems.sort(
      (a, b) => a.timestamp - b.timestamp || a.subOrdering - b.subOrdering,
    );
    const curr = Date.now();
    while (logItems.length > 0) {
      const item = logItems[0];
      if (item.timestamp <= curr) {
        logItems.shift();
        consumeLogItem(item);
      } else {
        break;
      }
    }
  }

  function pushLogItem(logItem: LogItem) {
    logItems.push(logItem);
    if (timerId) {
      clearTimeout(timerId);
    }
    setTimeout(consumeLogItems, 100);
  }

  return {
    log(msg: string) {
      const logItem = parseLogText(msg);
      pushLogItem(logItem);
    },
  };
}
const loggerCore = createLoggerCore();

async function setupUdpServerForApp() {
  const udp = Deno.listenDatagram({
    port: configs.udpPortForApp,
    // hostname: "127.0.0.1",
    transport: "udp",
  });
  for await (const [data, _addr] of udp) {
    // console.log(data);
    const msg = new TextDecoder().decode(data);
    loggerCore.log(msg);
  }
}

async function setupUdpServerForDsp() {
  const udp = Deno.listenDatagram({
    port: configs.udpPortForDsp,
    // hostname: "127.0.0.1",
    transport: "udp",
  });
  for await (const [data, _addr] of udp) {
    const msg = new TextDecoder().decode(data);
    loggerCore.log(msg);
  }
}

function setupHttpServerForUi() {
  Deno.serve({ port: configs.httpPortForUi }, async (req) => {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (req.method === "POST") {
      const body = await req.text();
      const msg = body.toString();
      loggerCore.log(msg);
      return new Response("ok", { headers });
    }
    return new Response("log server", { headers });
  });
}

function start() {
  console.log("log server 2030");
  void setupUdpServerForApp();
  void setupUdpServerForDsp();
  setupHttpServerForUi();
  console.log(
    `Log server running:
    UDP_PORT_FOR_APP : ${configs.udpPortForApp}
    UDP_PORT_FOR_DSP : ${configs.udpPortForDsp}
    HTTP_PORT_FOR_UI : ${configs.httpPortForUi}
  `,
  );
}

start();
