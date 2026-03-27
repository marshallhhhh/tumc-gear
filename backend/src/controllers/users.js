import * as userService from "../services/users.js";

export async function getMe(req, res, next) {
  try {
    const user = await userService.getMe(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const user = await userService.updateMe(req.user.id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const result = await userService.listUsers(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    await userService.deleteUser(req.params.id, req.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
