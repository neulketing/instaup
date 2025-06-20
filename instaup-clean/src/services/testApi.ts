// 🧪 API 연동 테스트 서비스
// Railway 백엔드와의 연결을 테스트하기 위한 유틸리티

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'https://instaup-production.up.railway.app'

export interface TestResult {
  endpoint: string
  status: 'success' | 'error'
  responseTime: number
  data?: any
  error?: string
}

class APITestService {
  private async testEndpoint(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<TestResult> {
    const startTime = Date.now()

    try {
      const url = `${API_BASE_URL}${endpoint}`
      console.log(`🔍 Testing: ${method} ${url}`)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined,
        mode: 'cors'
      })

      const responseTime = Date.now() - startTime
      const data = await response.json().catch(() => ({ text: await response.text() }))

      return {
        endpoint,
        status: response.ok ? 'success' : 'error',
        responseTime,
        data
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        endpoint,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // 백엔드 헬스체크
  async testHealth(): Promise<TestResult> {
    return this.testEndpoint('/health')
  }

  // API 라우트들 테스트
  async testAuthEndpoints(): Promise<TestResult[]> {
    const results: TestResult[] = []

    // GET /api/auth (일반적으로 auth 정보나 상태 확인)
    results.push(await this.testEndpoint('/api/auth'))

    return results
  }

  // 서비스 엔드포인트 테스트
  async testServiceEndpoints(): Promise<TestResult[]> {
    const results: TestResult[] = []

    // GET /api/services (서비스 목록)
    results.push(await this.testEndpoint('/api/services'))

    return results
  }

  // 전체 API 상태 테스트
  async runFullTest(): Promise<{
    baseUrl: string
    totalTests: number
    successCount: number
    results: TestResult[]
  }> {
    console.log('🚀 Starting full API test...')

    const results: TestResult[] = []

    // 기본 엔드포인트들 테스트
    results.push(await this.testHealth())

    // API 엔드포인트들 테스트
    const authResults = await this.testAuthEndpoints()
    const serviceResults = await this.testServiceEndpoints()

    results.push(...authResults, ...serviceResults)

    const successCount = results.filter(r => r.status === 'success').length

    console.log('📊 Test Results:', {
      baseUrl: API_BASE_URL,
      totalTests: results.length,
      successCount,
      results
    })

    return {
      baseUrl: API_BASE_URL,
      totalTests: results.length,
      successCount,
      results
    }
  }

  // 브라우저 콘솔에서 사용할 수 있도록 전역 노출
  exposeToGlobal() {
    (window as any).testAPI = {
      health: () => this.testHealth(),
      auth: () => this.testAuthEndpoints(),
      services: () => this.testServiceEndpoints(),
      full: () => this.runFullTest(),
      custom: (endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) =>
        this.testEndpoint(endpoint, method, body)
    }

    console.log('🔧 API Test utilities exposed to window.testAPI')
    console.log('Usage:')
    console.log('  window.testAPI.health() - Test health endpoint')
    console.log('  window.testAPI.full() - Run full test suite')
    console.log('  window.testAPI.custom("/api/custom") - Test custom endpoint')
  }
}

// 싱글톤 인스턴스
export const apiTestService = new APITestService()

// 브라우저에서 바로 사용할 수 있도록 자동 노출
if (typeof window !== 'undefined') {
  apiTestService.exposeToGlobal()
}

export default apiTestService
