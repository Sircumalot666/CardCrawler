import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Token Cache
let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken() {
  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

  console.log("Checking Blizzard credentials...");
  if (!clientId) console.log("BLIZZARD_CLIENT_ID is missing");
  if (!clientSecret) console.log("BLIZZARD_CLIENT_SECRET is missing");

  if (!clientId || !clientSecret) {
    throw new Error("BLIZZARD_CLIENT_ID or BLIZZARD_CLIENT_SECRET is not set in .env");
  }

  // Check if token is still valid (with 60s buffer)
  if (accessToken && Date.now() < tokenExpiry - 60000) {
    return accessToken;
  }

  const region = process.env.BLIZZARD_REGION || "eu";
  const oauthUrl = region.toLowerCase() === "cn" 
    ? "https://www.battlenet.com.cn/oauth/token" 
    : "https://oauth.battle.net/token";

  console.log(`Fetching new Blizzard Access Token for region: ${region}...`);
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  
  try {
    const response = await axios.post(
      oauthUrl,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000;
    return accessToken;
  } catch (error: any) {
    console.error("Error fetching Blizzard token:", error.response?.data || error.message);
    throw new Error("Failed to authenticate with Blizzard API");
  }
}

// API Routes
app.get("/api/cards", async (req, res) => {
  try {
    const token = await getAccessToken();
    const region = process.env.BLIZZARD_REGION || "eu";
    const { page = 1, locale = "de_DE" } = req.query;

    console.log(`Fetching cards: region=${region}, page=${page}, locale=${locale}`);

    const response = await axios.get(
      `https://${region}.api.blizzard.com/hearthstone/cards`,
      {
        params: {
          locale,
          page,
          pageSize: 500,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error("Error in /api/cards:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data,
    });
  }
});

// Route to fetch ALL cards (handles pagination on server)
app.get("/api/cards/all", async (req, res) => {
  try {
    const token = await getAccessToken();
    const region = process.env.BLIZZARD_REGION || "eu";
    const locale = req.query.locale || "de_DE";
    
    let allCards: any[] = [];
    let currentPage = 1;
    let totalPages = 1;

    console.log("Starting full card fetch...");

    do {
      console.log(`Fetching page ${currentPage}...`);
      const response = await axios.get(
        `https://${region}.api.blizzard.com/hearthstone/cards`,
        {
          params: {
            locale,
            page: currentPage,
            pageSize: 500,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      allCards = allCards.concat(response.data.cards);
      totalPages = response.data.pageCount;
      currentPage++;

      if (currentPage > 100) break; 
    } while (currentPage <= totalPages);

    res.json({ cards: allCards, count: allCards.length });
  } catch (error: any) {
    console.error("Error in /api/cards/all:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: error.message, details: error.response?.data });
  }
});

// Metadata route
app.get("/api/metadata", async (req, res) => {
  try {
    const token = await getAccessToken();
    const region = process.env.BLIZZARD_REGION || "eu";
    const locale = req.query.locale || "de_DE";

    console.log(`Fetching metadata: region=${region}, locale=${locale}`);

    const response = await axios.get(
      `https://${region}.api.blizzard.com/hearthstone/metadata`,
      {
        params: {
          locale,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error("Error in /api/metadata:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: error.message, details: error.response?.data });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
