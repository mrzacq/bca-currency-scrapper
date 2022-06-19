const cron = require("node-cron");
const express = require("express");
const { default: axios } = require("axios");

const cheerio = require("cheerio");
const fs = require("fs");

const URL = "https://www.klikbca.com";

const app = express();
const port = 3000;

const fetchSite = async () => {
  try {
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data);

    const kurs = $("td.kurs");

    let result = [];

    kurs.each((i, el) => {
      if (i > 0) {
        let data = el.children[0].data.trim();
        result.push(data);
      }
    });

    function transform(array) {
      const result = [];

      for (let index = 0; index < array.length; index += 3) {
        const currency = array[index];
        const buy = array[index + 1];
        const sell = array[index + 2];

        result.push({ currency, buy, sell });
      }

      return result;
    }

    result = transform(result);
    result = [
      { time: new Date().getTime(), created: new Date(), kurs: result },
    ];

    let currentKurs = [];
    if (fs.existsSync("./kurs.json")) {
      currentKurs = fs.readFileSync("./kurs.json");

      currentKurs = JSON.parse(currentKurs);
    }

    result = [...currentKurs, ...result];
    console.log(result);
    fs.writeFile("kurs.json", JSON.stringify(result, null, 2), (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("Successfully written data to file");
    });
  } catch (error) {
    console.log(error.response.data);
  }
};

const startCron = () => {
  cron.schedule("*/15 * * * * *", async function () {
    console.log(`now is ${new Date().getSeconds()}`);
    await fetchSite();
  });
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  startCron();
  console.log(`Example app listening on port ${port}`);
});
