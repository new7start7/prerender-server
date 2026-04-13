import express from "express";
import puppeteer from "puppeteer";

const app = express();

app.get("/render", async (req, res) => {
  const url = req.query.url;

  if (!url) return res.status(400).send("Missing URL");

  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  const html = await page.content();

  await browser.close();

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

app.listen(3000, () => {
  console.log("Prerender server running");
});
