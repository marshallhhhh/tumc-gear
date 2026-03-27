import * as categoryService from "../services/categories.js";

export async function create(req, res, next) {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const categories = await categoryService.listCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body,
    );
    res.json(category);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
