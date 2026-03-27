import * as itemService from "../services/items.js";

export async function create(req, res, next) {
  try {
    const item = await itemService.createItem(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function get(req, res, next) {
  try {
    const isAdmin = req.user?.role === "ADMIN";
    const item = await itemService.getItem(req.params.id, {
      isAdmin,
      userId: req.user?.id,
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const item = await itemService.updateItem(req.params.id, req.body);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await itemService.deleteItem(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const result = await itemService.listItems(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
