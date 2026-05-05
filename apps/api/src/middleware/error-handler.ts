import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      status: "error",
      message: "Validation failed",
      details: error.flatten()
    });
    return;
  }

  const statusCode = typeof error.statusCode === "number" ? error.statusCode : 500;

  res.status(statusCode).json({
    status: "error",
    message: statusCode === 500 ? "Internal server error" : error.message
  });
};
