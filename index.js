import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const PAYHIP_SECRET = process.env.PAYHIP_SECRET;

const processedOrders = new Set();

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-payhip-signature"];
  const rawBody = JSON.stringify(req.body);

  const expected = crypto
    .createHmac("sha256", PAYHIP_SECRET)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) {
    console.log("Invalid signature, ignoring.");
    return res.status(401).send("Invalid signature");
  }

  if (req.body.event !== "paid") {
    console.log("Event ignored:", req.body.event);
    return res.sendStatus(200);
  }

  const saleId = req.body.sale_id;

  if (processedOrders.has(saleId)) {
    console.log("Duplicate order, ignoring:", saleId);
    return res.sendStatus(200);
  }

  processedOrders.add(saleId);

  console.log("New order received:", JSON.stringify(req.body, null, 2));

  const items = req.body.products.map((product) => ({
    product_id: product.product_id,
    variant_id: product.sku,
    quantity: product.quantity
  }));

  try {
    const response = await fetch("https://api.printify.com/v1/orders.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PRINTIFY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        external_id: saleId,
        line_items: items,
        shipping_method: 1,
        send_shipping_notification: true,
        address_to: {
          first_name: req.body.customer.first_name,
          last_name: req.body.customer.last_name,
          email: req.body.customer.email,
          address1: req.body.customer.address_line_1,
          city: req.body.customer.city,
          country: req.body.customer.country,
          zip: req.body.customer.zip
        }
      })
    });

    const data = await response.json();
    console.log("Printify response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Printify error:", data);
      return res.status(500).send("Error creating order");
    }

  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).send("Internal error");
  }

  res.sendStatus(200);
});

// Rota temporaria para descobrir SHOP_ID - APAGAR DEPOIS
app.get("/get-shop-id", async (req, res) => {
  try {
    const response = await fetch("https://api.printify.com/v1/shops.json", {
      headers: {
        Authorization: `Bearer ${PRINTIFY_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Webhook ativo na porta ${PORT}`);
});
