# Security Recommendations for Airavat Backend

## 🔒 Current Security Measures (Implemented)

### ✅ Authentication & Authorization
- JWT token-based authentication
- 7-day token expiry
- Role-based access control (business_owner, admin)
- Business-level permission checking
- Socket.io authentication middleware

### ✅ Input Validation
- Email validation
- Password strength requirements (min 8 chars, uppercase, lowercase, number)
- Phone number validation
- Message length limits (5000 chars)
- ID parameter validation
- Pagination limits (max 100 per page)

### ✅ Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Chat/Messaging: 30 messages per minute
- File Uploads: 20 uploads per hour

### ✅ Data Protection
- Password hashing with bcrypt (10 salt rounds)
- BigInt to String conversion for JSON safety
- CORS configuration
- Request size limits (10mb)

---

## 🛡️ Additional Security Recommendations

### 1. **HTTPS/SSL (CRITICAL)**
**Priority: HIGH**

Always use HTTPS in production. Never transmit sensitive data over HTTP.

```bash
# Use a reverse proxy like Nginx with SSL
# Or use a service like Cloudflare
```

**Implementation:**
- Use Let's Encrypt for free SSL certificates
- Configure Nginx as reverse proxy
- Force HTTPS redirects
- Use HSTS headers

---

### 2. **Environment Variables Security**
**Priority: HIGH**

Never commit secrets to version control.

```env
# .env file (add to .gitignore)
DATABASE_URL="postgresql://..."
JWT_SECRET="use-a-very-long-random-string-here-min-32-chars"
FRONTEND_URL="https://yourdomain.com"
NODE_ENV="production"
```

**Best Practices:**
- Use different secrets for development and production
- Rotate secrets periodically
- Use secret management services (AWS Secrets Manager, HashiCorp Vault)
- Never log secrets

---

### 3. **JWT Token Security**
**Priority: HIGH**

**Current Implementation:**
- ✅ 7-day expiry
- ✅ Includes userId, role, email

**Recommendations:**
- Add refresh tokens (short-lived access tokens + long-lived refresh tokens)
- Implement token blacklisting for logout
- Use secure cookie storage for refresh tokens
- Add token rotation

**Example Refresh Token Implementation:**
```typescript
// Generate refresh token (30 days)
const refreshToken = sign(
  { userId: user.user_id.toString(), type: 'refresh' },
  process.env.JWT_REFRESH_SECRET || 'refresh_secret',
  { expiresIn: '30d' }
);

// Store refresh token in database
await prisma.refresh_tokens.create({
  data: {
    user_id: user.user_id,
    token: refreshToken,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
});
```

---

### 4. **SQL Injection Protection**
**Priority: HIGH**

**Current Status:** ✅ Protected (Prisma handles this)

Prisma uses parameterized queries, preventing SQL injection. However:

**Best Practices:**
- Never use raw SQL queries with user input
- Always use Prisma's query builder
- Validate all inputs before database operations
- Use Prisma's type-safe queries

---

### 5. **XSS (Cross-Site Scripting) Protection**
**Priority: HIGH**

**Recommendations:**
- Sanitize all user inputs
- Use Content Security Policy (CSP) headers
- Escape HTML in user-generated content
- Use libraries like `DOMPurify` on frontend
- Validate and sanitize message content

**Implementation:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize message content
const sanitizedContent = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: [], // No HTML tags allowed
  ALLOWED_ATTR: [],
});
```

---

### 6. **CSRF (Cross-Site Request Forgery) Protection**
**Priority: MEDIUM**

**Recommendations:**
- Use CSRF tokens for state-changing operations
- Implement SameSite cookie attribute
- Use double-submit cookie pattern
- Validate Origin/Referer headers

**Implementation:**
```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

// Apply to state-changing routes
app.post('/api/v1/orders', csrfProtection, createOrder);
```

---

### 7. **File Upload Security**
**Priority: HIGH**

**Recommendations:**
- Validate file types (whitelist, not blacklist)
- Limit file sizes
- Scan files for malware
- Store files outside web root
- Use unique filenames
- Validate file content, not just extension
- Use cloud storage (S3, Cloudinary) instead of local storage

**Implementation:**
```typescript
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});
```

---

### 8. **API Security Headers**
**Priority: MEDIUM**

**Recommendations:**
Add security headers middleware:

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

**Headers to Add:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy`

---

### 9. **Logging & Monitoring**
**Priority: MEDIUM**

**Recommendations:**
- Log all authentication attempts
- Log failed login attempts
- Log sensitive operations (order creation, payment)
- Use structured logging (Winston, Pino)
- Monitor error rates
- Set up alerts for suspicious activity

**Implementation:**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Log security events
logger.warn('Failed login attempt', {
  email: req.body.email,
  ip: req.ip,
  timestamp: new Date(),
});
```

---

### 10. **Database Security**
**Priority: HIGH**

**Recommendations:**
- Use connection pooling (Prisma handles this)
- Use read replicas for heavy read operations
- Regular database backups
- Encrypt sensitive data at rest
- Use database-level constraints
- Regular security updates
- Limit database user permissions

**PostgreSQL Security:**
```sql
-- Create read-only user for reporting
CREATE USER readonly_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE airavat TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
```

---

### 11. **Password Security**
**Priority: HIGH**

**Current Implementation:**
- ✅ Bcrypt hashing (10 salt rounds)

**Recommendations:**
- Increase salt rounds to 12-14 for production
- Implement password reset with secure tokens
- Add password history (prevent reuse)
- Implement account lockout after failed attempts
- Add two-factor authentication (2FA)

**Implementation:**
```typescript
// Account lockout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Track failed attempts
await prisma.users.update({
  where: { user_id: userId },
  data: {
    failed_login_attempts: { increment: 1 },
    locked_until: failedAttempts >= MAX_LOGIN_ATTEMPTS 
      ? new Date(Date.now() + LOCKOUT_DURATION)
      : null,
  },
});
```

---

### 12. **API Rate Limiting Enhancements**
**Priority: MEDIUM**

**Current Implementation:**
- ✅ Basic rate limiting per IP

**Recommendations:**
- Implement per-user rate limiting
- Use Redis for distributed rate limiting
- Different limits for authenticated vs anonymous users
- Implement sliding window rate limiting

**Redis-based Rate Limiting:**
```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async function rateLimit(userId: string, limit: number, window: number) {
  const key = `rate_limit:${userId}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window);
  }
  
  return current <= limit;
}
```

---

### 13. **Data Validation Enhancements**
**Priority: MEDIUM**

**Recommendations:**
- Validate all inputs at API boundary
- Use schema validation (Zod, Joi)
- Sanitize outputs
- Validate file uploads thoroughly
- Validate business logic constraints

**Zod Schema Example:**
```typescript
import { z } from 'zod';

const productSchema = z.object({
  product_name: z.string().min(2).max(255),
  category_id: z.string().regex(/^\d+$/).transform(Number),
  base_price: z.number().positive(),
  quantity: z.number().int().positive(),
});

// Validate request
const validated = productSchema.parse(req.body);
```

---

### 14. **Session Management**
**Priority: MEDIUM**

**Recommendations:**
- Implement refresh token rotation
- Add device tracking
- Implement "logout from all devices"
- Add session timeout
- Track active sessions

---

### 15. **Error Handling Security**
**Priority: MEDIUM**

**Current Implementation:**
- ✅ Basic error handling

**Recommendations:**
- Don't expose internal errors to clients
- Log detailed errors server-side
- Use error tracking (Sentry)
- Don't leak sensitive information in errors
- Use generic error messages for users

**Implementation:**
```typescript
// Production error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Log full error
  logger.error('Error:', {
    error: err,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Send generic error to client
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An error occurred. Please try again later.'
      : err.message,
  });
});
```

---

### 16. **Business Logic Security**
**Priority: HIGH**

**Recommendations:**
- Verify business ownership before operations
- Validate business roles (can_buy, can_sell)
- Check order ownership before updates
- Validate conversation participants
- Prevent unauthorized data access

**Example:**
```typescript
// Always verify ownership
const order = await prisma.orders.findUnique({
  where: { order_id: BigInt(orderId) },
});

if (order.buyer_business_id.toString() !== req.user.businessId &&
    order.seller_business_id.toString() !== req.user.businessId) {
  return res.status(403).json({ error: 'Access denied' });
}
```

---

### 17. **Real-time Security (Socket.io)**
**Priority: HIGH**

**Current Implementation:**
- ✅ Authentication middleware
- ✅ Business ID validation

**Recommendations:**
- Validate all Socket.io events
- Rate limit Socket.io events
- Sanitize message content
- Monitor for abuse
- Implement connection limits per user

---

### 18. **API Documentation Security**
**Priority: LOW**

**Recommendations:**
- Don't expose sensitive endpoints in public docs
- Use API keys for documentation access
- Version your API
- Document rate limits
- Document authentication requirements

---

### 19. **Dependency Security**
**Priority: MEDIUM**

**Recommendations:**
- Regularly update dependencies
- Use `npm audit` to check for vulnerabilities
- Use Dependabot or similar
- Review dependency licenses
- Minimize dependencies

**Commands:**
```bash
npm audit
npm audit fix
npx npm-check-updates -u
```

---

### 20. **Backup & Recovery**
**Priority: HIGH**

**Recommendations:**
- Regular automated backups
- Test backup restoration
- Store backups off-site
- Encrypt backups
- Document recovery procedures

---

## 🚨 Security Checklist

### Before Production:

- [ ] Enable HTTPS/SSL
- [ ] Set strong JWT_SECRET (min 32 chars, random)
- [ ] Set NODE_ENV=production
- [ ] Review and update all environment variables
- [ ] Enable security headers (Helmet)
- [ ] Implement file upload validation
- [ ] Set up logging and monitoring
- [ ] Configure database backups
- [ ] Review all API endpoints for authorization
- [ ] Test rate limiting
- [ ] Test input validation
- [ ] Review error messages (no sensitive data)
- [ ] Set up error tracking (Sentry)
- [ ] Review CORS configuration
- [ ] Test authentication flow
- [ ] Review Socket.io security
- [ ] Update all dependencies
- [ ] Review database permissions
- [ ] Set up monitoring alerts
- [ ] Document security procedures
- [ ] Conduct security audit

---

## 📋 Security Best Practices Summary

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Users only get minimum required access
3. **Fail Securely** - Default to deny, not allow
4. **Input Validation** - Validate and sanitize all inputs
5. **Output Encoding** - Encode all outputs
6. **Error Handling** - Don't leak information
7. **Logging** - Log security events
8. **Monitoring** - Monitor for suspicious activity
9. **Updates** - Keep dependencies updated
10. **Testing** - Regular security testing

---

## 🔍 Security Testing

### Recommended Tools:

1. **OWASP ZAP** - Web application security scanner
2. **Burp Suite** - Web vulnerability scanner
3. **npm audit** - Dependency vulnerability scanner
4. **Snyk** - Security scanning
5. **SonarQube** - Code quality and security

### Testing Checklist:

- [ ] SQL injection testing
- [ ] XSS testing
- [ ] CSRF testing
- [ ] Authentication bypass testing
- [ ] Authorization testing
- [ ] Rate limiting testing
- [ ] Input validation testing
- [ ] File upload testing
- [ ] API endpoint security testing

---

## 📞 Security Incident Response

### If Security Breach Occurs:

1. **Contain** - Isolate affected systems
2. **Assess** - Determine scope of breach
3. **Notify** - Inform affected users
4. **Fix** - Patch vulnerabilities
5. **Monitor** - Watch for further issues
6. **Document** - Record incident details
7. **Review** - Post-incident review

---

**Remember:** Security is an ongoing process, not a one-time setup. Regularly review and update your security measures.

