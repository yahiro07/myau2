const configs = {
  udpPortForApp: 9001,
  udpPortForDsp: 9002,
  httpPortForUi: 9003,
};

function createLoggerCore() {
  let isMuted = false;

  function handleMetaOp(msg: string) {
    if (msg.startsWith("@mute")) {
      isMuted = true;
    } else if (msg.startsWith("@unmute")) {
      isMuted = false;
    }
  }

  return {
    log(prefix: string, msg: string) {
      if (msg.startsWith("@")) {
        handleMetaOp(msg);
        return;
      }
      if (isMuted) return;
      console.log(`${prefix ?? prefix + " "}${msg}`);
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
  for await (const [data, addr] of udp) {
    const msg = new TextDecoder().decode(data);
    loggerCore.log("[app]", msg);
  }
}

async function setupUdpServerForDsp() {
  const udp = Deno.listenDatagram({
    port: configs.udpPortForDsp,
    // hostname: "127.0.0.1",
    transport: "udp",
  });
  for await (const [data, addr] of udp) {
    const msg = new TextDecoder().decode(data);
    loggerCore.log("[dsp]", msg);
  }
}

function setupHttpServerForUi() {
  Deno.serve({ port: configs.httpPortForUi }, async (req) => {
    if (req.method === "POST") {
      const body = await req.text();
      const msg = body.toString();
      loggerCore.log("[ui]", msg);
      return new Response("ok");
    }
    return new Response("log server");
  });
}

function start() {
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
