// const isDebug = location.search.includes("debug=1");
// const isDebug = true; //debug
// const isDebug = false;

let postFailed = false;

function loggingViaLocalHttp(msg: string) {
  if (!postFailed) {
    fetch("http://localhost:9003", { method: "POST", body: msg }).then(
      (res) => {
        //最初のログ送信で失敗したらそれ以降はログを送らない
        if (!res.ok) {
          console.log(`failed to post local http log: ${res.status}`);
          postFailed = true;
        }
      },
    );
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
      loggingViaLocalHttp(msg);
    }
  },
  timedLog(msg: string) {
    const now = new Date();
    const time = now.toISOString();
    logger.log(`${time} ${msg}`);
  },
};
