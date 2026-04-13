import express from "express";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const app = express();
const PORT = process.env.PORT || 3000;

const cache = new Map();

app.get("/render", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).send("Missing URL");
  }

  // Serve from cache
  if (cache.has(url)) {
    console.log("Serving from cache:", url);
    return res.send(cache.get(url));
  }

  let browser;

  try {
    console.log("Rendering:", url);

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    );

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const html = await page.content();

    // Cache for 1 hour
    cache.set(url, html);
    setTimeout(() => cache.delete(url), 1000 * 60 * 60);

    res.setHeader("Content-Type", "text/html");
    res.send(html);

  } catch (err) {
    console.error("Render error:", err);
    res.status(500).send("Error rendering page");
  } finally {
    if (browser) await browser.close();
  }
});

app.get("/", (req, res) => {
  res.send("Prerender server is running ✅");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
