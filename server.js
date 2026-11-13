const express = require("express");

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://absamagroshop2.github.io");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});
const PORT = process.env.PORT || 3000;
const PI_API_URL = process.env.PI_API_URL;
const PI_API_KEY = process.env.PI_API_KEY;

app.get("/", (req, res) => {
  res.json({
    service: "ABSAM AGRO SHOP",
    status: "Pi payment server ready"
  });
});

async function verifyUser(accessToken) {
  const response = await fetch(`${PI_API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error("Authentification Pi invalide");
  }

  return response.json();
}

async function piRequest(path, body) {
  const response = await fetch(`${PI_API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${PI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Erreur API Pi");
  }

  return result;
}

app.post("/api/approve", async (req, res) => {
  try {
    const { paymentId, accessToken } = req.body;

    if (!paymentId || !accessToken) {
      return res.status(400).json({
        error: "Informations manquantes"
      });
    }

    await verifyUser(accessToken);

    const result = await piRequest(
      `/payments/${encodeURIComponent(paymentId)}/approve`,
      {}
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/complete", async (req, res) => {
  try {
    const { paymentId, txid, accessToken } = req.body;

    if (!paymentId || !txid || !accessToken) {
      return res.status(400).json({
        error: "Informations manquantes"
      });
    }

    await verifyUser(accessToken);

    const result = await piRequest(
      `/payments/${encodeURIComponent(paymentId)}/complete`,
      { txid }
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`ABSAM AGRO SHOP server running on port ${PORT}`);
});
