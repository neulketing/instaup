import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { backendApi, type Order, type User, type Service } from '../services/backendApi'
import { authManager } from '../utils/auth'

interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  todayOrders: number
  todayRevenue: number
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'users' | 'services'>('dashboard')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    todayOrders: 0,
    todayRevenue: 0
  })

  // 주문 관리 상태
  const [orders, setOrders] = useState<Order[]>([])
  const [orderFilters, setOrderFilters] = useState({
    status: 'all',
    search: '',
    page: 1
  })

  // 사용자 관리 상태
  const [users, setUsers] = useState<User[]>([])
  const [userFilters, setUserFilters] = useState({
    search: '',
    page: 1
  })

  // 서비스 관리 상태
  const [services, setServices] = useState<Service[]>([])
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [showServiceModal, setShowServiceModal] = useState(false)

  const userSession = authManager.getCurrentSession()

  useEffect(() => {
    if (!userSession || !userSession.isAdmin) {
      navigate('/')
      return
    }
    fetchDashboardData()
  }, [userSession])

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders()
    } else if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'services') {
      fetchServices()
    }
  }, [activeTab, orderFilters.status, orderFilters.page, userFilters.page])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await backendApi.getAdminDashboard()

      if (response.success && response.data) {
        setStats(response.data)
      } else {
        // 임시 데이터
        setStats({
          totalUsers: 157,
          totalOrders: 432,
          totalRevenue: 12450000,
          pendingOrders: 8,
          todayOrders: 23,
          todayRevenue: 680000
        })
      }
    } catch (error) {
      console.error('대시보드 데이터 조회 실패:', error)
      // 임시 데이터 사용
      setStats({
        totalUsers: 157,
        totalOrders: 432,
        totalRevenue: 12450000,
        pendingOrders: 8,
        todayOrders: 23,
        todayRevenue: 680000
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await backendApi.getAllOrders({
        status: orderFilters.status === 'all' ? undefined : orderFilters.status,
        page: orderFilters.page,
        limit: 20
      })

      if (response.success && response.data) {
        setOrders(response.data.orders)
      }
    } catch (error) {
      console.error('주문 목록 조회 실패:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await backendApi.getAllUsers(userFilters.page, 20)

      if (response.success && response.data) {
        setUsers(response.data.users)
      }
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await backendApi.getServices()

      if (response.success && response.data) {
        setServices(response.data)
      }
    } catch (error) {
      console.error('서비스 목록 조회 실패:', error)
    }
  }

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await backendApi.updateOrderStatus(orderId, newStatus)

      if (response.success) {
        setOrders(prev => prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus as any } : order
        ))
        alert('주문 상태가 업데이트되었습니다.')
      } else {
        alert('주문 상태 업데이트에 실패했습니다.')
      }
    } catch (error) {
      console.error('주문 상태 업데이트 실패:', error)
      alert('주문 상태 업데이트에 실패했습니다.')
    }
  }

  const handleServiceSave = async (serviceData: Partial<Service>) => {
    try {
      if (editingService) {
        // 수정
        const response = await backendApi.updateService(editingService.id, serviceData)
        if (response.success) {
          await fetchServices()
          setShowServiceModal(false)
          setEditingService(null)
          alert('서비스가 수정되었습니다.')
        }
      } else {
        // 생성
        const response = await backendApi.createService(serviceData as Omit<Service, 'id'>)
        if (response.success) {
          await fetchServices()
          setShowServiceModal(false)
          alert('서비스가 생성되었습니다.')
        }
      }
    } catch (error) {
      console.error('서비스 저장 실패:', error)
      alert('서비스 저장에 실패했습니다.')
    }
  }

  const handleServiceDelete = async (serviceId: string) => {
    if (!confirm('정말로 이 서비스를 삭제하시겠습니까?')) return

    try {
      const response = await backendApi.deleteService(serviceId)
      if (response.success) {
        await fetchServices()
        alert('서비스가 삭제되었습니다.')
      }
    } catch (error) {
      console.error('서비스 삭제 실패:', error)
      alert('서비스 삭제에 실패했습니다.')
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '대기중',
      processing: '진행중',
      completed: '완료',
      failed: '실패',
      refunded: '환불됨'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  if (!userSession || !userSession.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600 mb-4">관리자 권한이 필요합니다.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#22426f] text-white rounded-lg hover:bg-[#1e3b61]"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100"
              >
                <span className="text-xl">←</span>
              </button>
              <h1 className="text-xl font-bold text-gray-900">🛠️ 관리자 대시보드</h1>
            </div>
            <div className="text-sm text-gray-600">
              관리자: {userSession.name}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'dashboard', label: '📊 대시보드', icon: '📊' },
                { id: 'orders', label: '📦 주문 관리', icon: '📦' },
                { id: 'users', label: '👥 사용자 관리', icon: '👥' },
                { id: 'services', label: '🛍️ 서비스 관리', icon: '🛍️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#22426f] text-[#22426f]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 대시보드 */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">👥</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">총 사용자</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📦</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">총 주문</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">💰</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()}원</div>
                    <div className="text-sm text-gray-600">총 매출</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⏳</div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">대기중 주문</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📅</div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.todayOrders.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">오늘 주문</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">💵</div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.todayRevenue.toLocaleString()}원</div>
                    <div className="text-sm text-gray-600">오늘 매출</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">새로운 주문이 접수되었습니다</span>
                  </div>
                  <span className="text-xs text-gray-500">5분 전</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">사용자가 충전을 완료했습니다</span>
                  </div>
                  <span className="text-xs text-gray-500">12분 전</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">주문이 처리 중입니다</span>
                  </div>
                  <span className="text-xs text-gray-500">30분 전</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 주문 관리 */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* 필터 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex gap-4">
                <select
                  value={orderFilters.status}
                  onChange={(e) => setOrderFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체 상태</option>
                  <option value="pending">대기중</option>
                  <option value="processing">진행중</option>
                  <option value="completed">완료</option>
                  <option value="failed">실패</option>
                  <option value="refunded">환불됨</option>
                </select>

                <input
                  type="text"
                  placeholder="주문 ID 또는 사용자 검색"
                  value={orderFilters.search}
                  onChange={(e) => setOrderFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 주문 목록 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        주문 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        금액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        생성일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">#{order.id}</div>
                          <div className="text-xs text-gray-500">{order.service?.name || order.serviceId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.userId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.amount.toLocaleString()}원</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="pending">대기중</option>
                            <option value="processing">진행중</option>
                            <option value="completed">완료</option>
                            <option value="failed">실패</option>
                            <option value="refunded">환불됨</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 사용자 관리 */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">사용자 목록</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        잔액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        총 사용액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        가입일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.nickname}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.balance.toLocaleString()}원</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.totalSpent?.toLocaleString() || 0}원</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-2">
                            수정
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            비활성화
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 서비스 관리 */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">서비스 관리</h2>
              <button
                onClick={() => {
                  setEditingService(null)
                  setShowServiceModal(true)
                }}
                className="px-4 py-2 bg-[#22426f] text-white rounded-lg hover:bg-[#1e3b61]"
              >
                + 새 서비스 추가
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        서비스 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        플랫폼
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        가격
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {services.map((service) => (
                      <tr key={service.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                          <div className="text-xs text-gray-500">{service.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{service.platform}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{service.price.toLocaleString()}원</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {service.isActive ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setEditingService(service)
                              setShowServiceModal(true)
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-2"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleServiceDelete(service.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 서비스 모달 */}
      {showServiceModal && (
        <ServiceModal
          service={editingService}
          onSave={handleServiceSave}
          onClose={() => {
            setShowServiceModal(false)
            setEditingService(null)
          }}
        />
      )}
    </div>
  )
}

// 서비스 편집 모달 컴포넌트
interface ServiceModalProps {
  service: Service | null
  onSave: (serviceData: Partial<Service>) => void
  onClose: () => void
}

function ServiceModal({ service, onSave, onClose }: ServiceModalProps) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    platform: service?.platform || '',
    category: service?.category || '',
    price: service?.price || 0,
    minQuantity: service?.minQuantity || 1,
    maxQuantity: service?.maxQuantity || 10000,
    description: service?.description || '',
    isActive: service?.isActive ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      <div className="relative bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {service ? '서비스 수정' : '서비스 추가'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                서비스명
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                플랫폼
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">플랫폼 선택</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                가격 (원)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최소 수량
                </label>
                <input
                  type="number"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최대 수량
                </label>
                <input
                  type="number"
                  value={formData.maxQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxQuantity: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                서비스 활성화
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-[#22426f] text-white rounded-lg hover:bg-[#1e3b61]"
              >
                저장
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
