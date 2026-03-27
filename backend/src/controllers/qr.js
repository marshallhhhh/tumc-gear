import * as qrService from "../services/qr.js";

export async function resolve(req, res, next) {
  try {
    const item = await qrService.resolveQr(req.body.nanoid);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const qrTag = await qrService.createQrTag(req.body.nanoid);
    res.status(201).json(qrTag);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const result = await qrService.listQrTags(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function assign(req, res, next) {
  try {
    const qrTag = await qrService.assignQrTag(req.body.nanoid, req.body.itemId);
    res.json(qrTag);
  } catch (err) {
    next(err);
  }
}

export async function unassign(req, res, next) {
  try {
    const qrTag = await qrService.unassignQrTag(req.params.id);
    res.json(qrTag);
  } catch (err) {
    next(err);
  }
}
