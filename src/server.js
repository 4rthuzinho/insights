const express = require("express");
const regrasRoutes = require("./routes/regras");
const insightsRoutes = require("./routes/insights");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/regras", regrasRoutes);
app.use("/insights", insightsRoutes);

app.use((req, res) => {
  res.status(404).json({ erro: "Rota nao encontrada" });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ erro: "JSON invalido" });
  }

  console.error(err);
  return res.status(500).json({ erro: "Erro interno do servidor" });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API do motor de insights rodando na porta ${PORT}`);
});
