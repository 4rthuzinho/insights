const express = require("express");
const { randomUUID } = require("node:crypto");
const db = require("../database");

const router = express.Router();
const VALID_STATUS = new Set(["aberto", "resolvido"]);

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
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

    const insight = {
      id: randomUUID(),
      regraId: req.body.regraId,
      titulo: req.body.titulo,
      descricao: req.body.descricao,
      contatoId: req.body.contatoId,
      status: req.body.status,
      criadoEm: new Date().toISOString()
    };

    await dbRun(
      `
        INSERT INTO insights (
          id,
          regraId,
          titulo,
          descricao,
          contatoId,
          status,
          criadoEm
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        insight.id,
        insight.regraId,
        insight.titulo,
        insight.descricao,
        insight.contatoId,
        insight.status,
        insight.criadoEm
      ]
    );

    return res.status(201).json(insight);
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const insights = await dbAll(
      `
        SELECT
          id,
          regraId,
          titulo,
          descricao,
          contatoId,
          status,
          criadoEm
        FROM insights
        ORDER BY criadoEm DESC
      `
    );

    return res.json(insights);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const insight = await dbGet(
      `
        SELECT
          id,
          regraId,
          titulo,
          descricao,
          contatoId,
          status,
          criadoEm
        FROM insights
        WHERE id = ?
      `,
      [req.params.id]
    );

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

    const insightExistente = await dbGet(
      "SELECT criadoEm FROM insights WHERE id = ?",
      [req.params.id]
    );

    if (!insightExistente) {
      return res.status(404).json({ erro: "Insight nao encontrado" });
    }

    const insightAtualizado = {
      id: req.params.id,
      regraId: req.body.regraId,
      titulo: req.body.titulo,
      descricao: req.body.descricao,
      contatoId: req.body.contatoId,
      status: req.body.status,
      criadoEm: insightExistente.criadoEm
    };

    await dbRun(
      `
        UPDATE insights
        SET
          regraId = ?,
          titulo = ?,
          descricao = ?,
          contatoId = ?,
          status = ?
        WHERE id = ?
      `,
      [
        insightAtualizado.regraId,
        insightAtualizado.titulo,
        insightAtualizado.descricao,
        insightAtualizado.contatoId,
        insightAtualizado.status,
        insightAtualizado.id
      ]
    );

    return res.json(insightAtualizado);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await dbRun("DELETE FROM insights WHERE id = ?", [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ erro: "Insight nao encontrado" });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
