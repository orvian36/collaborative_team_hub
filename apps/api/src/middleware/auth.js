// TODO: JWT authentication middleware
// - Verify access token from httpOnly cookie
// - Attach user to req.user
// - Return 401 if token is invalid or missing

const authenticate = (req, res, next) => {
  // TODO: Implement
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // TODO: Check if req.user.role is in roles
    next();
  };
};

module.exports = { authenticate, authorize };
