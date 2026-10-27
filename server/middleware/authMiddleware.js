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

    if (typeof decoded === "string" || decoded.id === undefined || decoded.id === null) {
      return res.status(401).json({
        error: "Invalid authentication token",
      });
    }

    req.user = {
      id: String(decoded.id),
      role: decoded.role || "patient",
    };
    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired authentication token",
    });
  }
}

export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token || !process.env.JWT_SECRET) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof decoded !== "string" && decoded.id != null) {
      req.user = {
        id: String(decoded.id),
        role: decoded.role || "patient",
      };
    }
  } catch {
    // Ignore invalid optional tokens so public routes still work.
  }

  next();
}
