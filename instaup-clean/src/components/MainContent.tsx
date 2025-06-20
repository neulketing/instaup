import { useState } from 'react'
import { platformsData, serviceStats } from '../data/services'
import type { Platform, ServiceItem } from '../types/services'
import type { UserSession } from '../utils/auth'
import ServiceList from './ServiceList'
import MobileBottomNav from './MobileBottomNav'

interface MainContentProps {
  userSession: UserSession | null
  onServiceSelect: (service: ServiceItem) => void
  onAuth: (mode: 'signin' | 'signup') => void
  onShowRecharge: () => void
}

export default function MainContent({
  userSession,
  onServiceSelect,
  onAuth,
  onShowRecharge
}: MainContentProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('home')

  return (
    <main className="max-w-full mx-auto">
      {/* SNS샵 스타일 대형 플랫폼 선택 섹션 */}
      <div className="bg-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              실제 한국인 SNS 마케팅을 원한다면?
            </h1>
            <p className="text-lg text-gray-600">
              원하는 플랫폼을 선택해주세요.
            </p>
          </div>

          {/* SNS샵과 동일한 18개 플랫폼 카드 그리드 (6x3) */}
          <div className="grid grid-cols-6 gap-4 mb-8">
            {/* 추천서비스 */}
            <button
              onClick={() => setSelectedPlatform('recommend')}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'recommend' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/3447219732.svg"
                  alt="추천서비스"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">추천서비스</div>
                <div className="text-xs text-gray-500">인기상품</div>
              </div>
            </button>

            {/* 인스타그램 */}
            <button
              onClick={() => setSelectedPlatform('instagram')}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all relative ${
                selectedPlatform === 'instagram' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                인기
              </div>
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/4250099384.svg"
                  alt="인스타그램"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">인스타그램</div>
                <div className="text-xs text-gray-500">팔로워, 좋아요</div>
              </div>
            </button>

            {/* 유튜브 */}
            <button
              onClick={() => setSelectedPlatform('youtube')}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all relative ${
                selectedPlatform === 'youtube' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                인기
              </div>
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/356754602.svg"
                  alt="유튜브"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">유튜브</div>
                <div className="text-xs text-gray-500">구독자, 조회수</div>
              </div>
            </button>

            {/* 틱톡 */}
            <button
              onClick={() => setSelectedPlatform('tiktok')}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'tiktok' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/1665783605.svg"
                  alt="틱톡"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">틱톡</div>
                <div className="text-xs text-gray-500">팔로워, 좋아요</div>
              </div>
            </button>

            {/* 페이스북 */}
            <button
              onClick={() => setSelectedPlatform('facebook')}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'facebook' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/3136187068.svg"
                  alt="페이스북"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">페이스북</div>
                <div className="text-xs text-gray-500">좋아요, 팔로워</div>
              </div>
            </button>

            {/* X(트위터) */}
            <button
              onClick={() => setSelectedPlatform('twitter')}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'twitter' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/3621658080.svg"
                  alt="X(트위터)"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">X(트위터)</div>
                <div className="text-xs text-gray-500">팔로워, 리트윗</div>
              </div>
            </button>

            {/* 두 번째 줄 */}
            {/* 패키지 */}
            <button
              onClick={() => setSelectedPlatform('package' as Platform)}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'package' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/47761216.svg"
                  alt="패키지"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">패키지</div>
                <div className="text-xs text-gray-500">맞춤 상품</div>
              </div>
            </button>

            {/* 쓰레드 */}
            <button
              onClick={() => setSelectedPlatform('threads' as Platform)}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'threads' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/3456978307.svg"
                  alt="쓰레드"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">쓰레드</div>
                <div className="text-xs text-gray-500">팔로워, 좋아요</div>
              </div>
            </button>

            {/* 네이버 */}
            <button
              onClick={() => setSelectedPlatform('naver' as Platform)}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'naver' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/2511229715.svg"
                  alt="네이버"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">네이버</div>
                <div className="text-xs text-gray-500">블로그, 카페</div>
              </div>
            </button>

            {/* 카카오 */}
            <button
              onClick={() => setSelectedPlatform('kakao' as Platform)}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'kakao' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/1741352572.svg"
                  alt="카카오"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">카카오</div>
                <div className="text-xs text-gray-500">스토리, 채널</div>
              </div>
            </button>

            {/* 앱 */}
            <button
              onClick={() => setSelectedPlatform('app' as Platform)}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'app' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/2894907241.svg"
                  alt="앱"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">앱</div>
                <div className="text-xs text-gray-500">앱스토어 순위</div>
              </div>
            </button>

            {/* 상위노출 */}
            <button
              onClick={() => setSelectedPlatform('seo' as Platform)}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'seo' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/3004200215.svg"
                  alt="상위노출"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">상위노출</div>
                <div className="text-xs text-gray-500">검색 최적화</div>
              </div>
            </button>

            {/* 세 번째 줄 */}
            {/* 스토어 */}
            <button
              onClick={() => setSelectedPlatform('store' as Platform)}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'store' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/3012968398.svg"
                  alt="스토어"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">스토어</div>
                <div className="text-xs text-gray-500">쇼핑몰 순위</div>
              </div>
            </button>

            {/* 브랜드 */}
            <button
              onClick={() => setSelectedPlatform('brand' as Platform)}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'brand' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/4128952286.svg"
                  alt="브랜드"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">브랜드</div>
                <div className="text-xs text-gray-500">브랜드 마케팅</div>
              </div>
            </button>

            {/* 뉴스 */}
            <button
              onClick={() => setSelectedPlatform('news' as Platform)}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'news' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/4112061695.svg"
                  alt="뉴스"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">뉴스</div>
                <div className="text-xs text-gray-500">언론 보도</div>
              </div>
            </button>

            {/* 이벤트 */}
            <button
              onClick={() => setSelectedPlatform('event' as Platform)}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'event' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/2311100233.svg"
                  alt="이벤트"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">이벤트</div>
                <div className="text-xs text-gray-500">특가 이벤트</div>
              </div>
            </button>

            {/* 처우 */}
            <button
              onClick={() => setSelectedPlatform('chvu' as Platform)}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'chvu' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/2760264836.svg"
                  alt="처우"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">처우</div>
                <div className="text-xs text-gray-500">맞춤 서비스</div>
              </div>
            </button>

            {/* 기타 */}
            <button
              onClick={() => setSelectedPlatform('etc' as Platform)}
              className={`bg-white rounded-lg border-2 p-6 hover:border-[#22426f] transition-all ${
                selectedPlatform === 'etc' ? 'border-[#22426f] bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <img
                  src="https://ext.same-assets.com/3036106235/318903943.svg"
                  alt="기타"
                  className="w-12 h-12 mx-auto mb-3"
                />
                <div className="font-semibold text-gray-900 text-sm mb-1">기타</div>
                <div className="text-xs text-gray-500">기타 서비스</div>
              </div>
            </button>
          </div>

          {/* 주문 안내 텍스트 */}
          <div className="text-center text-gray-600 mb-8">
            <p className="text-sm">
              30일 무료 리필 보장. 지금 주문하고 실제 한국인 마케팅 효과를 체험해보세요.
            </p>
            <p className="text-xs mt-1">
              ※ 타 업체 대비 30% 저렴하며 동일 서비스라도 품질이 다릅니다. ※ 주문 전 반드시 "안내"를 확인하시기 바랍니다.
            </p>
          </div>
        </div>
      </div>

      {/* SNS샵 스타일 서비스 목록 (플랫폼 선택 시) */}
      {selectedPlatform && (
        <div className="bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {platformsData.find(p => p.id === selectedPlatform)?.name || selectedPlatform} 서비스
                </h3>
                <button
                  onClick={() => setSelectedPlatform(null)}
                  className="text-gray-500 hover:text-gray-700 font-medium"
                >
                  닫기 ✕
                </button>
              </div>
              <ServiceList
                selectedPlatform={selectedPlatform}
                onServiceSelect={onServiceSelect}
              />
            </div>
          </div>
        </div>
      )}

      {/* SNS샵 스타일 메인 공지사항 */}
      <div className="bg-blue-50 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg p-6 border border-blue-200">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 bg-blue-500 text-white rounded flex items-center justify-center text-sm font-bold mr-3">
                공지
              </div>
              <h3 className="font-bold text-gray-900">📢 중요 공지사항</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>2024년 하반기 이벤트:</strong> 8월 30일(금)10:30 ~ 8월 31일(토) 18:30(32시간)</p>
              <p>• <strong>서비스 품질 향상:</strong> 실제 한국인 팔로워 품질을 더욱 업그레이드했습니다.</p>
              <p>• <strong>24시간 고객지원:</strong> 카카오톡 채널을 통해 언제든 문의 가능합니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 통계 및 안내 */}
      <div className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">왜 SNS샵을 선택해야 할까요?</h2>
            <p className="text-gray-600">실제 데이터로 증명하는 SNS샵의 신뢰성</p>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#22426f] mb-2">{serviceStats.totalOrders.toLocaleString()}</div>
              <div className="text-sm text-gray-600">총 주문수</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#22426f] mb-2">{serviceStats.totalMembers.toLocaleString()}</div>
              <div className="text-sm text-gray-600">총 회원수</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#22426f] mb-2">{serviceStats.completedOrders.toLocaleString()}</div>
              <div className="text-sm text-gray-600">완료된 주문</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#22426f] mb-2">99.8%</div>
              <div className="text-sm text-gray-600">만족도</div>
            </div>
          </div>

          {/* SNS샵 특징 */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">✨ SNS샵만의 차별점</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span>100% 실제 한국인 계정</li>
                <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span>1-5분 내 즉시 시작</li>
                <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span>60일간 3회 무료 리필</li>
                <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span>24시간 고객 지원</li>
                <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span>타 업체 대비 30% 저렴</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ 주문 전 필독사항</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start"><span className="text-orange-500 mr-2">•</span>계정은 반드시 공개 상태여야 합니다</li>
                <li className="flex items-start"><span className="text-orange-500 mr-2">•</span>주문 후 아이디 변경 및 비공개 전환 금지</li>
                <li className="flex items-start"><span className="text-orange-500 mr-2">•</span>타 업체와 중복 주문 시 처리 불가</li>
                <li className="flex items-start"><span className="text-orange-500 mr-2">•</span>불법/음란 콘텐츠는 서비스 불가</li>
                <li className="flex items-start"><span className="text-orange-500 mr-2">•</span>환불은 작업 시작 전에만 가능</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 하단 네비게이션 */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLoggedIn={!!userSession}
      />
    </main>
  )
}
