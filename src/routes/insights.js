const express = require("express");
const { randomUUID } = require("node:crypto");
const { readFile, writeFile, mkdir } = require("node:fs/promises");
const path = require("node:path");

const router = express.Router();
const DATA_FILE = path.join(__dirname, "..", "data", "insights.json");
const VALID_STATUS = new Set(["aberto", "resolvido"]);

async function readInsights() {
  try {
    const content = await readFile(DATA_FILE, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    await writeInsights([]);
    return [];
  }
}

async function writeInsights(insights) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, `${JSON.stringify(insights, null, 2)}\n`, "utf8");
}

function validateInsight(payload) {
  const errors = [];

  if (!payload.regraId || typeof payload.regraId !== "string") {
    errors.push("regraId e obrigatorio");
  }

  if (!payload.titulo || typeof payload.titulo !== "string") {
    errors.push("titulo e obrigatorio");
  }

  if (!payload.descricao || typeof payload.descricao !== "string") {
    errors.push("descricao e obrigatoria");
  }

  if (!payload.contatoId || typeof payload.contatoId !== "string") {
    errors.push("contatoId e obrigatorio");
  }

  if (!VALID_STATUS.has(payload.status)) {
    errors.push("status deve ser aberto ou resolvido");
  }

  return errors;
}

router.post("/", async (req, res, next) => {
  try {
    const errors = validateInsight(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ erro: "Dados invalidos", detalhes: errors });
    }

    const insights = await readInsights();
    const insight = {
      id: randomUUID(),
      regraId: req.body.regraId,
      titulo: req.body.titulo,
      descricao: req.body.descricao,
      contatoId: req.body.contatoId,
      status: req.body.status,
      criadoEm: new Date().toISOString()
    };

    insights.push(insight);
    await writeInsights(insights);

    return res.status(201).json(insight);
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const insights = await readInsights();
    return res.json(insights);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const insights = await readInsights();
    const insight = insights.find((item) => item.id === req.params.id);

    if (!insight) {
      return res.status(404).json({ erro: "Insight nao encontrado" });
    }

    return res.json(insight);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const errors = validateInsight(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ erro: "Dados invalidos", detalhes: errors });
    }

    const insights = await readInsights();
    const index = insights.findIndex((item) => item.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ erro: "Insight nao encontrado" });
    }

    const insightAtualizado = {
      id: req.params.id,
      regraId: req.body.regraId,
      titulo: req.body.titulo,
      descricao: req.body.descricao,
      contatoId: req.body.contatoId,
      status: req.body.status,
      criadoEm: insights[index].criadoEm
    };

    insights[index] = insightAtualizado;
    await writeInsights(insights);

    return res.json(insightAtualizado);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const insights = await readInsights();
    const insightExiste = insights.some((item) => item.id === req.params.id);

    if (!insightExiste) {
      return res.status(404).json({ erro: "Insight nao encontrado" });
    }

    const insightsAtualizados = insights.filter((item) => item.id !== req.params.id);
    await writeInsights(insightsAtualizados);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
