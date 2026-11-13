# Rate Limiting Implementation - Stockly

## Overview

Rate limiting has been implemented to protect the registration endpoint against automated abuse attempts using Upstash Redis for distributed rate limiting in production.

## Current Implementation

### Architecture

The implementation uses **Upstash Redis** for distributed rate limiting in production, with a secure fallback that rejects requests if Redis is unavailable. In development, it uses an in-memory fallback.

### Files Created/Modified

1. **`lib/rate-limit.ts`** (created/modified)
   - Upstash Redis-based rate limiting implementation
   - Graceful handling of missing dependencies
   - Production-safe error handling (rejects requests if rate limiting fails)
   - Client IP detection from Vercel headers
   - Development fallback for local testing

2. **`app/api/register/route.ts`** (modified)
   - Added rate limiting check before registration
   - Secure error handling for rate limiting failures
   - 5 attempts per IP per hour
   - Returns HTTP 429 when limit exceeded
   - Returns HTTP 503 if rate limiting service is unavailable in production

3. **`docs/RATE_LIMITING.md`** (created)
   - Complete documentation of the implementation

### Rate Limiting Policy

- **Endpoint:** `POST /api/register`
- **Limit:** 5 registration attempts per IP
- **Window:** 1 hour (3600000ms) - sliding window
- **Response:** HTTP 429 with error message when limit exceeded
- **Response:** HTTP 503 if rate limiting service unavailable in production

### Security Features

- ✅ IP detection from Vercel headers (`x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`)
- ✅ Production requires Upstash Redis configuration
- ✅ Rejects requests if rate limiting is unavailable in production (secure by default)
- ✅ Does not trust client-controlled headers
- ✅ Does not expose sensitive information in error messages
- ✅ Rate-limited requests do not create accounts
- ✅ Existing Zod and bcrypt validations preserved

### Production Safety

- ✅ In production, requires Upstash Redis to be configured
- ✅ If Redis is unavailable, rejects requests with HTTP 503 (fail-secure)
- ✅ Does not silently fall back to in-memory in production
- ✅ Logs errors without exposing sensitive data

### Development Fallback

- ⚠️ In development, uses in-memory fallback if Upstash dependencies are not installed
- ⚠️ In-memory storage does not work across multiple Vercel instances
- ⚠️ Development fallback is intentional for local testing only

---

## Dependencies

### Required for Production

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Note:** The installation failed in the current session due to an npm internal error. The code is ready to use Upstash once dependencies are installed.

### Installation Troubleshooting

If `npm install @upstash/ratelimit @upstash/redis` fails:

1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

2. **Retry installation:**
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

3. **Alternative: Use npm legacy mode:**
   ```bash
   npm install @upstash/ratelimit @upstash/redis --legacy-peer-deps
   ```

4. **Alternative: Use yarn:**
   ```bash
   yarn add @upstash/ratelimit @upstash/redis
   ```

---

## Environment Variables

### Required for Production

Add the following to your `.env` file:

```env
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_redis_token"
```

**Important:** These values must be obtained from the Upstash dashboard after creating a Redis database. Do not invent these values.

### Vercel Configuration

Add the same variables to your Vercel project settings:
1. Go to project settings > Environment Variables
2. Add `UPSTASH_REDIS_REST_URL`
3. Add `UPSTASH_REDIS_REST_TOKEN`
4. Redeploy the application

---

## Upstash Configuration

### Step 1: Create Upstash Account

1. Go to https://upstash.com
2. Sign up or log in

### Step 2: Create Redis Database

1. Click "Create Database"
2. Choose a region (closest to your Vercel deployment)
3. Select the free tier for development or appropriate tier for production
4. Click "Create"

### Step 3: Get Connection Details

1. Navigate to your database
2. Copy the REST URL
3. Copy the REST Token
4. Add them to your environment variables

### Step 4: Configure Vercel

1. Go to your Vercel project settings
2. Add `UPSTASH_REDIS_REST_URL` with the URL copied
3. Add `UPSTASH_REDIS_REST_TOKEN` with the token copied
4. Save the changes
5. Redeploy the application

---

## Current Implementation Details

### lib/rate-limit.ts

The implementation:

1. **Tries to load Upstash dependencies** at runtime
2. **Initializes Redis client** if environment variables are present
3. **Uses Upstash Ratelimit** in production (NODE_ENV=production)
4. **Rejects requests** if Upstash is unavailable in production (HTTP 503)
5. **Uses in-memory fallback** in development if Upstash is not configured

### Error Handling Strategy

**In Production:**
- If Upstash dependencies are not installed → HTTP 503
- If Redis is not configured → HTTP 503
- If Redis connection fails → HTTP 503
- All failures are logged without exposing sensitive data

**In Development:**
- If Upstash is not available → Uses in-memory fallback
- Allows local testing without Upstash setup

### IP Detection

The implementation uses multiple headers for reliability:

1. **`x-forwarded-for`** (Vercel)
   - Vercel sets this header reliably
   - Takes the first IP in the chain (client IP in Vercel's architecture)

2. **`x-real-ip`** (Vercel fallback)
   - Also set by Vercel
   - Used as fallback

3. **`cf-connecting-ip`** (Cloudflare)
   - Used if the app is behind Cloudflare
   - Additional fallback

4. **`unknown`** (last resort)
   - Should not happen in Vercel production
   - Indicates proxy configuration issue

---

## Testing

### Status of Tests

**Tests requiring Upstash Redis configuration:**
- Distributed rate limiting across multiple instances ⚠️ Cannot test without real Upstash setup
- Redis connection error handling ⚠️ Cannot test without real Upstash setup
- Production rejection behavior ⚠️ Cannot test without production environment

**Tests that can be performed now:**
- ✅ TypeScript compilation
- ✅ Production build
- ✅ Development fallback behavior (in-memory)
- ✅ Rate limit exceeded behavior (HTTP 429)
- ✅ Normal registration under limit

### Manual Testing (Development Mode)

1. **Test rate limit exceeded:**
   ```bash
   # Make 6 registration attempts from the same IP
   for i in {1..6}; do
     curl -X POST http://localhost:3000/api/register \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"TestPassword123","organizationName":"Test Org","storeName":"Test Store","confirmPassword":"TestPassword123"}'
   done
   ```

2. **Expected behavior:**
   - First 5 requests: Should proceed (will fail on duplicate email validation)
   - 6th request: Should return HTTP 429 with error message

3. **Test normal registration:**
   ```bash
   curl -X POST http://localhost:3000/api/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test2@example.com","password":"TestPassword123","organizationName":"Test Org","storeName":"Test Store","confirmPassword":"TestPassword123"}'
   ```

4. **Expected behavior:**
   - Should proceed normally (if rate limit not exceeded)

### Production Testing (After Upstash Setup)

Once Upstash is configured:

1. **Test with real Redis:**
   - Deploy to staging environment
   - Make multiple registration attempts
   - Verify rate limiting works across instances
   - Check Upstash dashboard for analytics

2. **Test Redis failure:**
   - Temporarily disable Redis connection
   - Verify requests are rejected with HTTP 503
   - Verify error is logged

3. **Test distributed behavior:**
   - Make requests from different IPs
   - Verify each IP has independent rate limits
   - Verify limits are shared across Vercel instances

---

## Deployment Checklist

### Before Production Deployment

- [ ] Install Upstash dependencies: `npm install @upstash/ratelimit @upstash/redis`
- [ ] Create Upstash Redis database
- [ ] Add environment variables to local `.env` for testing
- [ ] Test rate limiting locally with Upstash
- [ ] Verify TypeScript check passes
- [ ] Verify production build passes

### Production Deployment

- [ ] Add `UPSTASH_REDIS_REST_URL` to Vercel environment variables
- [ ] Add `UPSTASH_REDIS_REST_TOKEN` to Vercel environment variables
- [ ] Deploy to staging environment
- [ ] Test rate limiting in staging
- [ ] Monitor Upstash dashboard
- [ ] Deploy to production
- [ ] Monitor rate limiting effectiveness
- [ ] Set up alerts for Redis connection errors

---

## Monitoring

### Upstash Analytics

Enable analytics in the rate limiter configuration (already enabled in code):

```typescript
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true, // Enabled
})
```

View analytics in the Upstash dashboard to monitor:
- Request rate
- Blocked requests
- Geographic distribution
- Peak usage times

### Error Logging

The implementation logs rate limiting errors without exposing sensitive data:

```typescript
console.error('Rate limiting error:', error.message)
```

Consider adding structured logging for production monitoring.

---

## Troubleshooting

### Issue: npm install fails

**Symptom:** `npm error Cannot read properties of null (reading 'matches')`

**Solutions:**
1. Clear npm cache: `npm cache clean --force`
2. Retry installation
3. Use legacy mode: `npm install @upstash/ratelimit @upstash/redis --legacy-peer-deps`
4. Use yarn: `yarn add @upstash/ratelimit @upstash/redis`

### Issue: Build warnings about missing modules

**Symptom:** "Module not found: Can't resolve '@upstash/ratelimit'"

**Cause:** Dependencies not installed yet

**Solution:** Install the dependencies. The code handles missing dependencies gracefully in development.

### Issue: Rate limiting not working in production

**Cause:** Upstash Redis not configured

**Solution:**
1. Verify environment variables are set in Vercel
2. Check Upstash database status
3. Verify Redis credentials are correct
4. Check logs for connection errors

### Issue: All requests rejected with HTTP 503

**Cause:** Redis unavailable in production

**Solution:**
1. Check Upstash database status
2. Verify environment variables
3. Check network connectivity
4. Review error logs

### Issue: Legitimate users blocked

**Cause:** Rate limit too strict or shared IP (office, VPN)

**Solution:**
1. Increase limit if necessary (modify `Ratelimit.slidingWindow`)
2. Implement per-user rate limiting after authentication
3. Monitor for patterns and adjust accordingly

---

## Security Considerations

### IP Detection

- ✅ Uses Vercel's `x-forwarded-for` header (set by Vercel, not client-controllable)
- ✅ Uses multiple fallback headers for reliability
- ✅ Does not trust arbitrary client headers
- ⚠️ Shared IPs (office, VPN) may be rate-limited together (acceptable trade-off)

### Information Disclosure

- ✅ Error messages do not reveal rate limit parameters
- ✅ Reset time is not exposed to clients
- ✅ Personal data is not logged with rate limit attempts
- ✅ Redis credentials are never exposed to browser

### Fail-Secure Behavior

- ✅ Production rejects requests if rate limiting is unavailable
- ✅ Does not silently fall back to in-memory in production
- ✅ Errors are logged without exposing sensitive data
- ✅ Provides clear HTTP status codes (429, 503)

### Denial of Service

- ✅ Upstash Redis provides distributed storage
- ✅ No single point of failure in memory
- ✅ Sliding window prevents burst attacks

---

## Production Status

### Current State

**⚠️ NOT YET READY FOR PRODUCTION**

The code is ready to use Upstash Redis, but:

1. **Dependencies not installed:** `@upstash/ratelimit` and `@upstash/redis` must be installed
2. **Upstash database not created:** A Redis database must be created in Upstash
3. **Environment variables not configured:** `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` must be set
4. **Production testing not performed:** The system must be tested with real Upstash Redis

### Development State

**✅ READY FOR DEVELOPMENT**

The implementation works in development with the in-memory fallback, allowing local testing without Upstash setup.

---

## References

- [Upstash Rate Limiting Documentation](https://upstash.com/docs/ratelimit)
- [Upstash Redis Documentation](https://upstash.com/docs/redis)
- [Next.js Rate Limiting Best Practices](https://vercel.com/docs/concepts/functions/edge-functions/rate-limiting)
- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#rate-limiting)
- [Vercel Request Headers](https://vercel.com/docs/edge-network/headers)
