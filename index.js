import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const PAYHIP_SECRET = process.env.PAYHIP_SECRET;

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-payhip-signature"];
  const body = JSON.stringify(req.body);

  const hash = crypto
    .createHmac("sha256", PAYHIP_SECRET)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return res.status(401).send("Invalid signature");
  }

  console.log("Pagamento recebido:", req.body);

  await fetch("https://api.printify.com/v1/orders.json", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PRINTIFY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      external_id: req.body.sale_id,
      line_items: [
        {
          product_id: "COLOCAR_PRODUCT_ID",
          variant_id: "COLOCAR_VARIANT_ID",
          quantity: 1
        }
      ],
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

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
