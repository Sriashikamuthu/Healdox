
import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: "Authentication token required",
    });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === "string" ||
      typeof decoded.id !== "string"
    ) {
      return res.status(401).json({
        error: "Invalid authentication token",
      });
    }

    req.user = { id: decoded.id };
    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired authentication token",
    });
  }
}
