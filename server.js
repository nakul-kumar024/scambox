const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const path = require("path");
const fetch = require("node-fetch");

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/ask", async (req, res) => {
  const { message } = req.body;
  const query = encodeURIComponent(message);

  try {
    
    const serpRes = await fetch(`https://serpapi.com/search.json?q=${query}&api_key=${process.env.SERPAPI_KEY}`);
    const serpData = await serpRes.json();

    let reply = "";

    if (serpData.answer_box?.answer) {
      reply = serpData.answer_box.answer;
    } else if (serpData.answer_box?.snippet) {
      reply = serpData.answer_box.snippet;
    } else if (serpData.answer_box?.highlighted_words) {
      reply = serpData.answer_box.highlighted_words.join(", ");
    } else if (serpData.organic_results?.[0]?.snippet) {
      reply = serpData.organic_results[0].snippet;
    }

    
    if (!reply || reply.trim() === "") {
      const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${query}`);
      const wikiData = await wikiRes.json();

      if (wikiData.extract) {
        reply = wikiData.extract;
      } else {
        reply = "Sorry, I couldn’t find anything useful right now. Try rephrasing?";
      }
    }

    res.json({ reply });
  } catch (err) {
    console.error("❌ Error:", err);


    try {
      const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${query}`);
      const wikiData = await wikiRes.json();

      if (wikiData.extract) {
        return res.json({ reply: wikiData.extract });
      }
    } catch (e) {
      console.error("❌ Wikipedia fallback also failed:", e);
    }

    res.status(500).json({ reply: "Something went wrong. Please try again later!" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
