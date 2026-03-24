// get-printify-shop-id.js
import fetch from "node-fetch";

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;

if (!PRINTIFY_API_KEY) {
  console.error("PRINTIFY_API_KEY não encontrada nas variáveis de ambiente.");
  process.exit(1);
}

async function main() {
  try {
    const res = await fetch("https://api.printify.com/v1/shops.json", {
      headers: {
        Authorization: `Bearer ${PRINTIFY_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Erro ao buscar shops da Printify:", data);
      process.exit(1);
    }

    console.log("Resposta da Printify:");
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error("Erro inesperado:", err);
  }
}

main();
