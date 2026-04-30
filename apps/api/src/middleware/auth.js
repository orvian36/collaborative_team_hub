const { verifyAccessToken } = require('../lib/jwt');

const authenticate = (req, res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = verifyAccessToken(accessToken);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // TODO: Check if req.user.role is in roles (requires fetching member role for a workspace)
    // For workspace-specific authorization, this is usually handled in the route
    // by checking WorkspaceMember table since roles are per-workspace.
    next();
  };
};

module.exports = { authenticate, authorize };
