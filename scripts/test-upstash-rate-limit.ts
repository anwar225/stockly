/**
 * Test script for Upstash rate limiting on Vercel Preview
 * 
 * This script tests the rate limiting functionality without creating any accounts
 * or modifying Supabase data. It sends 6 consecutive POST requests with invalid
 * data to verify that the 6th request is rejected with HTTP 429.
 * 
 * Usage:
 *   npx tsx scripts/test-upstash-rate-limit.ts <vercel-preview-url>
 * 
 * Example:
 *   npx tsx scripts/test-upstash-rate-limit.ts https://preview-stockly.vercel.app
 */

interface TestResult {
  attempt: number
  status: number
  error: string | null
  expected: number
  passed: boolean
}

function validateUrl(url: string): void {
  try {
    const parsed = new URL(url)
    
    // Must be HTTPS
    if (parsed.protocol !== 'https:') {
      throw new Error('URL must use HTTPS')
    }
    
    // Must end with .vercel.app
    const hostname = parsed.hostname.toLowerCase()
    if (!hostname.endsWith('.vercel.app')) {
      throw new Error('URL hostname must end with .vercel.app')
    }
    
    // Must not be production domains
    const productionDomains = [
      'stockly.vercel.app',
      'stockly-ruddy-ten.vercel.app',
      'www.stockly.fr',
      'stockly.fr',
    ]
    if (productionDomains.includes(hostname)) {
      throw new Error('Cannot test on production URL. Use Vercel Preview URL only.')
    }
    
    // Must be a base URL without path, parameters, or fragment
    if (parsed.pathname !== '/' && parsed.pathname !== '') {
      throw new Error('URL must be a base URL without path (e.g., https://preview-url.vercel.app)')
    }
    if (parsed.search !== '') {
      throw new Error('URL must not contain query parameters')
    }
    if (parsed.hash !== '') {
      throw new Error('URL must not contain fragment')
    }
    
    // Warning: verify it's actually a Preview deployment
    console.warn('⚠️  IMPORTANT: Please verify in Vercel that this URL corresponds to a Preview deployment')
    console.warn('   A .vercel.app hostname alone does not guarantee it is a Preview deployment\n')
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid URL: ${error.message}`)
    }
    throw new Error('Invalid URL')
  }
}

async function sendRegistrationRequest(
  url: string,
  attempt: number
): Promise<TestResult> {
  const registerUrl = `${url}/api/register`
  
  // Valid JSON syntax, but invalid email according to Zod schema
  const invalidBody = {
    email: 'invalid-email-no-at-sign', // Invalid email format
    name: 'Test User',
    password: 'password123',
    confirmPassword: 'password123',
    organizationName: 'Test Organization',
    storeName: 'Test Store',
  }
  
  try {
    // Use native Node.js 24 fetch
    const response = await fetch(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidBody),
    })
    
    const statusCode = response.status
    let error: string | null = null
    
    // Try to parse response body
    try {
      const body = await response.text()
      const json = JSON.parse(body)
      if (json.error) {
        error = json.error
      }
    } catch {
      // Response body is not JSON, ignore
    }
    
    // Expected behavior:
    // - First 5 requests: HTTP 400 (Zod validation error, rate limiting allows)
    // - 6th request: HTTP 429 (rate limiting blocks before Zod validation)
    const expected = attempt <= 5 ? 400 : 429
    const passed = statusCode === expected
    
    return {
      attempt,
      status: statusCode,
      error,
      expected,
      passed,
    }
  } catch (networkError) {
    return {
      attempt,
      status: 0,
      error: networkError instanceof Error ? networkError.message : 'Network error',
      expected: attempt <= 5 ? 400 : 429,
      passed: false,
    }
  }
}

async function runTest(url: string): Promise<void> {
  console.log('=== UPSTASH RATE LIMITING TEST ===\n')
  console.log(`Target URL: ${url}`)
  console.log(`Endpoint: ${url}/api/register`)
  console.log('\n⚠️  IMPORTANT WARNINGS:')
  console.log('  - This test sends 6 POST requests with invalid data')
  console.log('  - No accounts will be created (data is invalid)')
  console.log('  - No Supabase data will be modified')
  console.log('  - The rate limit counter may already have entries from previous tests')
  console.log('  - Results may differ if the counter is not empty\n')
  
  const results: TestResult[] = []
  
  console.log('Sending 6 consecutive requests...\n')
  
  for (let i = 1; i <= 6; i++) {
    const result = await sendRegistrationRequest(url, i)
    results.push(result)
    
    const statusIcon = result.passed ? '✅' : '❌'
    const statusText = result.status === 0 ? 'NETWORK ERROR' : `HTTP ${result.status}`
    
    console.log(`Request ${i}: ${statusIcon} ${statusText} (expected HTTP ${result.expected})`)
    
    if (result.error) {
      console.log(`  Error message: ${result.error}`)
    }
    
    // Special handling for HTTP 503
    if (result.status === 503) {
      console.log('  ⚠️  HTTP 503 indicates rate limiting service unavailable or misconfigured')
      console.log('  Check that UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in Vercel')
    }
    
    // Small delay between requests
    if (i < 6) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  console.log('\n=== TEST RESULTS ===\n')
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  
  // Analyze results
  const firstFiveAll400 = results.slice(0, 5).every(r => r.status === 400)
  const sixthIs429 = results[5].status === 429
  const early429 = results.slice(0, 5).some(r => r.status === 429)
  const all400 = results.every(r => r.status === 400)
  const serviceUnavailable = results.some(r => r.status === 503)
  const networkErrors = results.some(r => r.status === 0)
  
  console.log(`Passed: ${passed}/6`)
  console.log(`Failed: ${failed}/6\n`)
  
  if (networkErrors) {
    console.log('❌ TEST FAILED: Network errors occurred')
    console.log('   Check that the Preview URL is accessible and the deployment is running')
    process.exit(1)
  }
  
  if (serviceUnavailable) {
    console.log('❌ TEST FAILED: HTTP 503 responses detected')
    console.log('   This indicates the rate limiting service is unavailable or misconfigured')
    console.log('   Verify:')
    console.log('   1. UPSTASH_REDIS_REST_URL is set in Vercel environment variables')
    console.log('   2. UPSTASH_REDIS_REST_TOKEN is set in Vercel environment variables')
    console.log('   3. The Upstash Redis database is accessible from Vercel')
    console.log('   4. NODE_ENV is set to "production" in Vercel Preview')
    process.exit(1)
  }
  
  if (early429) {
    console.log('⚠️  TEST INCONCLUSIVE: HTTP 429 received before the 6th request')
    console.log('   This indicates the rate limit counter may already have entries from previous tests')
    console.log('   The counter resets after 1 hour')
    console.log('   To test with a fresh counter, wait 1 hour or manually clear the Redis key')
    process.exit(1)
  }
  
  if (all400) {
    console.log('❌ TEST FAILED: All requests returned HTTP 400')
    console.log('   No rate limiting was observed at the expected threshold')
    console.log('   This could mean:')
    console.log('   1. The rate limiting is not configured (using in-memory fallback)')
    console.log('   2. NODE_ENV is not set to "production"')
    console.log('   3. Upstash Redis is not properly configured')
    process.exit(1)
  }
  
  if (firstFiveAll400 && sixthIs429) {
    console.log('✅ TEST PASSED: Rate limiting is working correctly')
    console.log('   - Requests 1-5: HTTP 400 (Zod validation, rate limiting allows)')
    console.log('   - Request 6: HTTP 429 (rate limiting blocks)')
    console.log('   Upstash Redis rate limiting is operational')
    process.exit(0)
  } else {
    console.log('❌ TEST FAILED: Unexpected response pattern')
    console.log('   Expected: 5x HTTP 400 followed by 1x HTTP 429')
    console.log('   Received:', results.map(r => `Request ${r.attempt}: HTTP ${r.status}`).join(', '))
    process.exit(1)
  }
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error('Error: Missing Vercel Preview URL')
    console.error('\nUsage:')
    console.error('  npx tsx scripts/test-upstash-rate-limit.ts <vercel-preview-url>')
    console.error('\nExample:')
    console.error('  npx tsx scripts/test-upstash-rate-limit.ts https://preview-stockly.vercel.app')
    process.exit(1)
  }
  
  const url = args[0]
  
  try {
    validateUrl(url)
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Invalid URL'}`)
    process.exit(1)
  }
  
  try {
    await runTest(url)
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    process.exit(1)
  }
}

main()
