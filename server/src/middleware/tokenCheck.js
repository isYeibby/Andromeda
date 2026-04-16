/**
 * Token Check Middleware
 * Validates that requests to /api/* include a Bearer token
 */
export function tokenCheck(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'MISSING_TOKEN',
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token || token.length < 10) {
    return res.status(401).json({
      error: 'Invalid access token',
      code: 'INVALID_TOKEN',
    });
  }

  next();
}
