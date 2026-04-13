import express from "express";
import puppeteer from "puppeteer";

const app = express();

// ✅ Use Render's dynamic port
const PORT = process.env.PORT || 3000;

// ✅ Simple in-memory cache (improves speed + reduces load)
const cache = new Map();

// ✅ Bot-friendly prerender endpoint
app.get("/render", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).send("Missing URL");
  }

  // ✅ Return cached version if available
  if (cache.has(url)) {
    console.log("Serving from cache:", url);
    return res.send(cache.get(url));
  }

  let browser;

  try {
    console.log("Rendering:", url);

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process"
      ],
    });

    const page = await browser.newPage();

    // Optional: set user agent (helps avoid bot blocking)
    await page.setUserAgent(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    );

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const html = await page.content();

    // ✅ Cache result for 1 hour
    cache.set(url, html);
    setTimeout(() => cache.delete(url), 1000 * 60 * 60);

    res.setHeader("Content-Type", "text/html");
    res.send(html);

  } catch (err) {
    console.error("Render error:", err);
    res.status(500).send("Error rendering page");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// ✅ Health check route (important for debugging)
app.get("/", (req, res) => {
  res.send("Prerender server is running ✅");
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
