const moment = require("moment");
// CREDENTIALS
const CONFIG = require("./config.json");

// NOTION SDK CONFIG
const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: CONFIG.NOTION_TOKEN,
});

const databaseId = CONFIG.NOTION_DB_ID;

let trades = [];

///////////////////////////////
//  COMPUTE + POST TO NOTION //
///////////////////////////////

async function addItem(id, symbol, volume, pnl, time) {
  try {
    // Trade alredy sent?
    const dup = await notion.databases.query({
      database_id: databaseId,
      filter: {
        or: [
          {
            property: "Trade ID",
            number: {
              equals: id,
            },
          },
        ],
      },
    });
    // If dup promise returns empty result, post trade.
    if (dup.results < 1) {
      const response = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: symbol,
                },
              },
            ],
          },
          Date: {
            date: {
              start: time,
            },
          },
          Qty: {
            number: Number(volume),
          },
          PnL: {
            number: Number(pnl),
          },
          "Trade ID": {
            number: Number(id),
          },
          "Tradervue": {
            url: "https://tradervue.com/trades/" + id
          }
        },
      });
    }

    
    //console.log(response);
    //console.log("Success! Entry added.");
  } catch (error) {
    console.error(error.body);
  }
}

/////////////////////////
//      GET FILLS      //
/////////////////////////
//    1 Day History    //
/////////////////////////
const fetch = require("node-fetch");
const today = moment().format("MM%2FDD%2FYY");
let url = "https://www.tradervue.com/api/v1/trades?startdate=" + today;

let options = {
  method: "GET",
  headers: {
    Accept: "application/json",
    "User-Agent": CONFIG.TRADERVUE_USERNAME,
    Authorization:
      "Basic " +
      Buffer.from(
        CONFIG.TRADERVUE_USERNAME + ":" + CONFIG.TRADERVUE_PASSWORD
      ).toString("base64"),
  },
};

fetch(url, options)
  .then((res) => res.json())
  .then((data) => {
    // Iterate trades and
    for (i = 0; i < Object.values(data.trades).length; i++) {
      /*trades.push({
        id: data.trades[i].id,
        symbol: data.trades[i].symbol,
        volume: data.trades[i].volume,
        pnl: data.trades[i].native_pl,
        time: data.trades[i].end_datetime,
      })*/
      addItem(
        data.trades[i].id,
        data.trades[i].symbol,
        data.trades[i].volume,
        data.trades[i].native_pl,
        data.trades[i].end_datetime
      );
    }
  })
  .catch((err) => console.error("error:" + err));

//addItem(symbol,datetime,maxhigh,maxlow,qty,id)
