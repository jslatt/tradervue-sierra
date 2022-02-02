const moment = require("moment");
// CREDENTIALS
const CONFIG = require("./config.json");
const request = require("request");

// Post fills for TV to process
async function postFills(fill_data) {
  let tradeData = JSON.parse(fill_data);

  // Proces Data (datetime iso, symbol, qty,price,comission, transfee,
  let processedData = {};
  processedData["allow_duplicates"] = "false";
  processedData["overlay_comissions"] = "true";
  processedData["tags"] = ["obliquity"];
  let key = "executions";
  processedData[key] = [];

  for (i = 0; i < Object.keys(tradeData).length; i++) {
    let qty = 0;
    if (tradeData[i].JSON.BuySell > 1) {
      qty = -1 * tradeData[i].JSON.OrderFilledQuantity;
    } else {
      qty = tradeData[i].JSON.OrderFilledQuantity;
    }

    let dt = new Date(tradeData[i].JSON.DataDateTime / 1000);

    dt.setHours(dt.getHours() - 4);

    let symbol = "ERR";

    //MES
    if (tradeData[i].JSON.Symbol.toString().includes("MES")) {
      symbol = tradeData[i].JSON.Symbol.toString().substring(0, 4) + "1";
    }
    //ES
    if (
      tradeData[i].JSON.Symbol.toString().includes("ES") &&
      !tradeData[i].JSON.Symbol.toString().includes("MES")
    ) {
      symbol = tradeData[i].JSON.Symbol.toString().substring(0, 3) + "1";
    }
    //CL
    if (tradeData[i].JSON.Symbol.toString().includes("CL")) {
      symbol = tradeData[i].JSON.Symbol.toString().substring(0, 3) + "1";
    }
    //RTY
    if (tradeData[i].JSON.Symbol.toString().includes("RTY")) {
      symbol = tradeData[i].JSON.Symbol.toString().substring(0, 4) + "1";
    }
    //M2K
    if (tradeData[i].JSON.Symbol.toString().includes("M2K")) {
      symbol = tradeData[i].JSON.Symbol.toString().substring(0, 4) + "1";
    }
    // MNQ
    if (tradeData[i].JSON.Symbol.toString().includes("MNQ")) {
      symbol = tradeData[i].JSON.Symbol.toString().substring(0, 4) + "1";
    }
    // MNQ
    if (
      tradeData[i].JSON.Symbol.toString().includes("NQ") &&
      !tradeData[i].JSON.Symbol.toString().includes("MNQ")
    ) {
      symbol = tradeData[i].JSON.Symbol.toString().substring(0, 3) + "1";
    }
    // ZNM21_FUT_CBOT
    if (tradeData[i].JSON.Symbol.toString().includes("ZN")) {
      symbol = tradeData[i].JSON.Symbol.toString().substring(0, 3) + "1";
    }
    // 6EM21_FUT_CME
    if (tradeData[i].JSON.Symbol.toString().includes("6E")) {
      symbol = tradeData[i].JSON.Symbol.toString().substring(0, 3) + "1";
    }
    //MBTK21_FUT_CME
    if (tradeData[i].JSON.Symbol.toString().includes("MBT")) {
      symbol = tradeData[i].JSON.Symbol.toString().substring(0, 4) + "1";
    }
    //ZSN21_FUT_CBOT
    if (tradeData[i].JSON.Symbol.toString().includes("ZS")) {
      symbol = tradeData[i].JSON.Symbol.toString().substring(0, 3) + "1";
    }
    // YMU21_FUT_CBOT
    if (tradeData[i].JSON.Symbol.toString().includes("YM")) {
      symbol = tradeData[i].JSON.Symbol.toString().substring(0, 3) + "1";
    }

    let execution = {
      datetime: dt,
      symbol: symbol,
      quantity: qty.toString(),
      price: (tradeData[i].JSON.FillPrice / 100).toString(),
      option: "",
      commission: "0.00",
      transfee: "0.00",
      ecnfee: "0.00",
    };

    processedData[key].push(execution);
  }

  const options = {
    method: "POST",
    url: "https://www.tradervue.com/api/v1/imports",
    headers: {
      Accept: "application/json",
      "User-Agent": CONFIG.TRADERVUE_USERNAME,
      "Content-type": "application/json",
      Authorization:
        "Basic " +
        Buffer.from(
          CONFIG.TRADERVUE_USERNAME + ":" + CONFIG.TRADERVUE_PASSWORD
        ).toString("base64"),
    },
    body: processedData,
    json: true,
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
  });
}

//////////////////////
// GET SIERRA FILLS //
//////////////////////

const options = {
  method: "POST",
  url: "https://www.sierrachart.com/API.php",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  form: {
    AdminUsername: CONFIG.SIERRA_FILL_USERNAME,
    AdminPassword: CONFIG.SIERRA_FILL_PASSWORD,
    UserSCUsername: CONFIG.SIERRA_MAIN_USERNAME,
    Service: "GetTradeOrderFills",
    StartDateTimeInMicroSecondsUTC:
      moment().subtract(1, "days").unix() * 1000000,
  },
};

request(options, function (error, response, body) {
  if (error) throw new Error(error);
  postFills(body);
});
