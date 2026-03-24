import express from "express";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor no ar");
});

app.post("/webhook", (req, res) => {
  console.log("Recebi algo em /webhook");
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});
