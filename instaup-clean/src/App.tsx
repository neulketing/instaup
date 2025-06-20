import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/Header'
import MainContent from './components/MainContent'
import MobileMenu from './components/MobileMenu'
import AuthModal from './components/AuthModal'
import StepOrderModal from './components/StepOrderModal'
import RechargeModal from './components/RechargeModal'
import OrderHistoryModal from './components/OrderHistoryModal'
import AdminDashboard from './components/AdminDashboard'
import AIRecommendationPanel from './components/AIRecommendationPanel'
import ToastNotification, { useToast } from './components/ToastNotification'
import CustomerSupportChat from './components/CustomerSupportChat'
import ServerStatusMonitor from './components/ServerStatusMonitor'
import APITestPanel from './components/APITestPanel'
import RealtimeNotifications from './components/RealtimeNotifications'

// API 테스트 서비스 (개발용)
import './services/testApi'

// 페이지 컴포넌트들
import OrdersPage from './pages/OrdersPage'
import AddFundsPage from './pages/AddFundsPage'
import AccountPage from './pages/AccountPage'
import AdminPage from './pages/AdminPage'
import FaqPage from './pages/FaqPage'
import GuidePage from './pages/GuidePage'

import { type ServiceItem, ServiceCategory } from './types/services'
import { authManager, type UserSession } from './utils/auth'
import { orderService } from './services/orderService'

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [userSession, setUserSession] = useState<UserSession | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false)
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)
  const [showCustomerChat, setShowCustomerChat] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // 토스트 알림 시스템
  const toast = useToast()

  // 홈페이지인지 확인
  const isHomePage = location.pathname === '/'

  // 컴포넌트 마운트 시 세션 복원
  useEffect(() => {
    const session = authManager.getCurrentSession()
    if (session) {
      setUserSession(session)
    }
  }, [])

  // 세션 상태 변경 감지 (잔액 업데이트 등)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentSession = authManager.getCurrentSession()
      if (currentSession && userSession) {
        // 세션이 변경되었으면 상태 업데이트
        if (currentSession.balance !== userSession.balance ||
            currentSession.lastActivity !== userSession.lastActivity) {
          setUserSession(currentSession)
        }
      } else if (!currentSession && userSession) {
        // 세션이 만료되었으면 로그아웃 처리
        setUserSession(null)
      }
    }, 1000) // 1초마다 체크

    return () => clearInterval(interval)
  }, [userSession])

  const handleAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setAuthError(null)
    setShowAuthModal(true)
  }

  const handleAuthSubmit = async (authData: any) => {
    setAuthLoading(true)
    setAuthError(null)

    try {
      let session: UserSession

      if (authMode === 'signin') {
        session = await authManager.login({
          email: authData.email,
          password: authData.password,
          rememberMe: authData.rememberMe
        })
      } else {
        session = await authManager.signup({
          email: authData.email,
          password: authData.password,
          confirmPassword: authData.confirmPassword,
          referralCode: authData.referralCode
        })
      }

      setUserSession(session)
      setShowAuthModal(false)

      // 토스트 알림으로 변경
      toast.success(
        authMode === 'signin' ? '로그인 성공!' : '회원가입 완료!',
        authMode === 'signin'
          ? `환영합니다, ${session.name}님! 현재 잔액: ${session.balance.toLocaleString()}원`
          : `환영합니다, ${session.name}님! 가입 축하 잔액: ${session.balance.toLocaleString()}원`,
        { duration: 6000 }
      )

    } catch (error: any) {
      setAuthError(error.message || '인증 처리 중 오류가 발생했습니다.')
      toast.error('인증 실패', error.message || '인증 처리 중 오류가 발생했습니다.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('정말로 로그아웃하시겠습니까?')) {
      await authManager.logout()
      setUserSession(null)
      // 페이지 새로고침은 authManager.logout()에서 처리됨
    }
  }

  const handleServiceSelect = (service: ServiceItem | string) => {
    if (typeof service === 'string') {
      // AI 추천에서 서비스 ID로 호출된 경우
      const mockService: ServiceItem = {
        id: service,
        platform: 'instagram' as any,
        name: `AI 추천 서비스: ${service}`,
        description: 'AI가 추천한 서비스입니다.',
        price: 180,
        minOrder: 10,
        maxOrder: 10000,
        deliveryTime: '1-5분',
        quality: 'premium',
        features: ['즉시 시작', '무료 리필'],
        category: ServiceCategory.FOLLOWERS,
        isPopular: true
      }
      setSelectedService(mockService)
    } else {
      setSelectedService(service)
    }
    setShowOrderModal(true)
  }

  const handleOrder = (orderData: any) => {
    if (!userSession) return

    console.log('주문 데이터:', orderData)

    // 잔액 확인
    if (userSession.balance < orderData.totalAmount) {
      toast.error(
        '잔액 부족',
        `잔액이 부족합니다. 현재 잔액: ${userSession.balance.toLocaleString()}원`,
        { duration: 5000 }
      )
      setShowOrderModal(false)
      setShowRechargeModal(true)
      return
    }

    // 주문 처리
    const processOrder = async () => {
      try {
        const result = await orderService.processOrder({
          service: selectedService!,
          targetUrl: orderData.targetUrl,
          quantity: orderData.quantity,
          totalAmount: orderData.totalAmount,
          user: userSession
        })

        if (result.success) {
          // 잔액 업데이트
          const newBalance = userSession.balance - orderData.totalAmount
          authManager.updateBalance(newBalance)
          setUserSession({ ...userSession, balance: newBalance })

          setShowOrderModal(false)
          toast.success(
            '주문 완료!',
            `주문이 성공적으로 처리되었습니다. 주문번호: ${result.orderId}`,
            { duration: 8000 }
          )

          // 주문 완료 후 주문 내역 페이지로 이동하는 옵션 제공
          setTimeout(() => {
            if (confirm('주문 내역을 확인하시겠습니까?')) {
              navigate('/orders')
            }
          }, 1000)
        } else {
          toast.error('주문 실패', result.message || '주문 처리 중 오류가 발생했습니다.')
        }
      } catch (error: any) {
        console.error('Order processing error:', error)
        toast.error('주문 실패', error.message || '주문 처리 중 오류가 발생했습니다.')
      }
    }

    processOrder()
  }

  const handleRechargeComplete = (amount: number) => {
    if (userSession) {
      const newBalance = userSession.balance + amount
      authManager.updateBalance(newBalance)
      setUserSession({ ...userSession, balance: newBalance })

      toast.success(
        '충전 완료!',
        `${amount.toLocaleString()}원이 충전되었습니다. 현재 잔액: ${newBalance.toLocaleString()}원`,
        { duration: 5000 }
      )

      // 충전 후 재주문 가능 UX 흐름: 주문 모달로 복귀
      setShowRechargeModal(false)
      setTimeout(() => {
        if (selectedService) {
          if (confirm('충전이 완료되었습니다. 주문을 계속하시겠습니까?')) {
            setShowOrderModal(true)
          }
        }
      }, 500)
    }
  }

  const handleShowRecharge = () => {
    if (!userSession) {
      handleAuth('signin')
      return
    }
    navigate('/addfunds')
  }

  const handleShowOrders = () => {
    if (!userSession) {
      handleAuth('signin')
      return
    }
    navigate('/orders')
  }

  const handleShowAccount = () => {
    if (!userSession) {
      handleAuth('signin')
      return
    }
    navigate('/account')
  }

  const handleShowAdmin = () => {
    if (!userSession || !userSession.isAdmin) {
      toast.error('접근 권한 없음', '관리자 권한이 필요합니다.')
      return
    }
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <ToastNotification messages={toast.messages} onRemove={toast.removeToast} />
      <ServerStatusMonitor />

      {/* 헤더는 모든 페이지에서 공통으로 표시 */}
      <Header
        userSession={userSession}
        onAuth={handleAuth}
        onLogout={handleLogout}
        onShowRecharge={handleShowRecharge}
        onShowOrders={handleShowOrders}
        onShowAccount={handleShowAccount}
        onShowAdmin={handleShowAdmin}
        onShowNotifications={() => setShowNotifications(true)}
        onToggleMobileMenu={() => setShowMobileMenu(!showMobileMenu)}
      />

      {/* 메인 콘텐츠 영역 */}
      <Routes>
        {/* 홈페이지 */}
        <Route
          path="/"
          element={
            <>
              <MainContent
                userSession={userSession}
                onServiceSelect={handleServiceSelect}
                onAuth={handleAuth}
                onShowRecharge={handleShowRecharge}
              />

              {/* API 테스트 패널 (임시로 항상 표시) */}
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
                <APITestPanel />
              </div>

              {/* AI 추천 패널 (홈페이지에만 표시) */}
              {userSession && (
                <AIRecommendationPanel
                  onServiceRecommend={handleServiceSelect}
                  userPreferences={{
                    platform: 'instagram',
                    budget: userSession.balance,
                    goals: ['engagement', 'growth']
                  }}
                />
              )}
            </>
          }
        />

        {/* 개별 페이지들 */}
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/addfunds" element={<AddFundsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/guide" element={<GuidePage />} />

        {/* 404 페이지 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h2>
                <p className="text-gray-600 mb-6">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-[#22426f] text-white rounded-lg hover:bg-[#1e3b61] transition-colors"
                >
                  홈으로 돌아가기
                </button>
              </div>
            </div>
          }
        />
      </Routes>

      {/* 모바일 메뉴 */}
      {showMobileMenu && (
        <MobileMenu
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          userSession={userSession}
          onAuth={handleAuth}
          onLogout={handleLogout}
          onShowRecharge={handleShowRecharge}
          onShowOrders={handleShowOrders}
          onShowAccount={handleShowAccount}
          onShowAdmin={handleShowAdmin}
        />
      )}

      {/* 모달들 (전역에서 사용) */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSubmit={handleAuthSubmit}
          loading={authLoading}
          error={authError}
        />
      )}

      {showOrderModal && selectedService && (
        <StepOrderModal
          isOpen={showOrderModal}
          service={selectedService}
          userSession={userSession}
          onClose={() => setShowOrderModal(false)}
          onOrder={handleOrder}
          onAuthRequired={() => {
            setShowOrderModal(false)
            handleAuth('signin')
          }}
        />
      )}

      {showRechargeModal && (
        <RechargeModal
          isOpen={showRechargeModal}
          onClose={() => setShowRechargeModal(false)}
          currentBalance={userSession?.balance || 0}
          onRechargeComplete={handleRechargeComplete}
        />
      )}

      {showOrderHistoryModal && (
        <OrderHistoryModal
          isOpen={showOrderHistoryModal}
          onClose={() => setShowOrderHistoryModal(false)}
          userSession={userSession}
        />
      )}

      {showAdminDashboard && (
        <AdminDashboard
          isOpen={showAdminDashboard}
          onClose={() => setShowAdminDashboard(false)}
          userSession={userSession}
        />
      )}

      {/* 실시간 알림 */}
      <RealtimeNotifications
        userId={userSession?.userId || null}
        isVisible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* 고객 지원 채팅 */}
      {showCustomerChat && (
        <CustomerSupportChat
          isOpen={showCustomerChat}
          onClose={() => setShowCustomerChat(false)}
          userSession={userSession}
        />
      )}

      {/* 고객 지원 채팅 버튼 (홈페이지에만 표시) */}
      {isHomePage && (
        <button
          onClick={() => setShowCustomerChat(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors z-40 flex items-center justify-center"
          title="고객센터 문의"
        >
          💬
        </button>
      )}
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
