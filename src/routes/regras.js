const express = require("express");
const { randomUUID } = require("node:crypto");
const { readFile, writeFile, mkdir } = require("node:fs/promises");
const path = require("node:path");

const router = express.Router();
const DATA_FILE = path.join(__dirname, "..", "data", "regras.json");

async function readRegras() {
  try {
    const content = await readFile(DATA_FILE, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    await writeRegras([]);
    return [];
  }
}

async function writeRegras(regras) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, `${JSON.stringify(regras, null, 2)}\n`, "utf8");
}

function validateRegra(payload) {
  const errors = [];

  if (!payload.nome || typeof payload.nome !== "string") {
    errors.push("nome e obrigatorio");
  }

  if (!payload.descricao || typeof payload.descricao !== "string") {
    errors.push("descricao e obrigatoria");
  }

  if (!payload.tipo || typeof payload.tipo !== "string") {
    errors.push("tipo e obrigatorio");
  }

  if (typeof payload.ativo !== "boolean") {
    errors.push("ativo deve ser boolean");
  }

  if (
    payload.configuracao === undefined ||
    payload.configuracao === null ||
    typeof payload.configuracao !== "object" ||
    Array.isArray(payload.configuracao)
  ) {
    errors.push("configuracao deve ser um objeto JSON");
  }

  return errors;
}

router.post("/", async (req, res, next) => {
  try {
    const errors = validateRegra(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ erro: "Dados invalidos", detalhes: errors });
    }

    const regras = await readRegras();
    const regra = {
      id: randomUUID(),
      nome: req.body.nome,
      descricao: req.body.descricao,
      tipo: req.body.tipo,
      ativo: req.body.ativo,
      configuracao: req.body.configuracao,
      criadoEm: new Date().toISOString()
    };

    regras.push(regra);
    await writeRegras(regras);

    return res.status(201).json(regra);
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const regras = await readRegras();
    return res.json(regras);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const regras = await readRegras();
    const regra = regras.find((item) => item.id === req.params.id);

    if (!regra) {
      return res.status(404).json({ erro: "Regra nao encontrada" });
    }

    return res.json(regra);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const errors = validateRegra(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ erro: "Dados invalidos", detalhes: errors });
    }

    const regras = await readRegras();
    const index = regras.findIndex((item) => item.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ erro: "Regra nao encontrada" });
    }

    const regraAtualizada = {
      id: req.params.id,
      nome: req.body.nome,
      descricao: req.body.descricao,
      tipo: req.body.tipo,
      ativo: req.body.ativo,
      configuracao: req.body.configuracao,
      criadoEm: regras[index].criadoEm
    };

    regras[index] = regraAtualizada;
    await writeRegras(regras);

    return res.json(regraAtualizada);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const regras = await readRegras();
    const regraExiste = regras.some((item) => item.id === req.params.id);

    if (!regraExiste) {
      return res.status(404).json({ erro: "Regra nao encontrada" });
    }

    const regrasAtualizadas = regras.filter((item) => item.id !== req.params.id);
    await writeRegras(regrasAtualizadas);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
