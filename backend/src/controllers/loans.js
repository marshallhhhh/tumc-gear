import * as loanService from "../services/loans.js";

export async function create(req, res, next) {
  try {
    const loan = await loanService.createLoan(req.user.id, req.body);
    res.status(201).json(loan);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const result = await loanService.listLoans(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function overdue(req, res, next) {
  try {
    const loans = await loanService.listOverdueLoans(req.query);
    res.json(loans);
  } catch (err) {
    next(err);
  }
}

export async function myLoans(req, res, next) {
  try {
    const result = await loanService.getMyLoans(req.user.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function returnLoan(req, res, next) {
  try {
    const loan = await loanService.returnLoan(
      req.params.id,
      req.user.id,
      req.body,
    );
    res.json(loan);
  } catch (err) {
    next(err);
  }
}

export async function cancel(req, res, next) {
  try {
    const loan = await loanService.cancelLoan(req.params.id, req.user.id);
    res.json(loan);
  } catch (err) {
    next(err);
  }
}

export async function extend(req, res, next) {
  try {
    const isAdmin = req.user?.role === "ADMIN";
    const loan = await loanService.extendLoan(
      req.params.id,
      req.user.id,
      req.body,
      isAdmin,
    );
    res.json(loan);
  } catch (err) {
    next(err);
  }
}
