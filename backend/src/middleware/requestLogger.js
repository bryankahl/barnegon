import { nanoid } from "nanoid";
import { logger } from "../utils/logger.js"; 

export default function requestLogger() {
  return function (req, res, next) {
    const id = req.headers["x-request-id"] || nanoid(12);
    req.requestId = id;
    res.setHeader("x-request-id", id);

    const start = process.hrtime.bigint();

    res.on("finish", () => {
      const end = process.hrtime.bigint();
      const ms = Number(end - start) / 1e6;

      logger.info("http_request", {
        requestId: id,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        ms: Math.round(ms),
        ip: req.ip,
        ua: req.headers["user-agent"],
      });
    });

    next();
  };
}