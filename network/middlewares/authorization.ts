import { NextFunction, Request, Response } from "express";

export function authorization(req: Request, res: Response, next: NextFunction) {
  if (req.headers.authorization != process.env.AUTHORIZATION)
    return res.status(401).send({
      status: 401,
      statusText: "Unauthorized",
    });

  return next();
}
