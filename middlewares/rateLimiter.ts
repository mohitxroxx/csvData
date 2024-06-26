import setRateLimit from 'express-rate-limit'

const rateLimitMiddleware = setRateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: "Rate limit exceeded",
  headers: true,
});

export default rateLimitMiddleware