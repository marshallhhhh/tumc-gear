import * as foundReportService from "../services/foundReports.js";

export async function create(req, res, next) {
  try {
    const report = await foundReportService.createFoundReport(
      req.body,
      req.user?.id,
    );
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const result = await foundReportService.listFoundReports(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function get(req, res, next) {
  try {
    const report = await foundReportService.getFoundReport(req.params.id);
    res.json(report);
  } catch (err) {
    next(err);
  }
}

export async function close(req, res, next) {
  try {
    const report = await foundReportService.closeFoundReport(
      req.params.id,
      req.user.id,
    );
    res.json(report);
  } catch (err) {
    next(err);
  }
}
