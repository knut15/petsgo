"use client";

import { useState } from "react";
import AreaSearch from "@/components/AreaSearch";
import LocationSearch from "@/components/LocationSearch";
import KeywordSearch from "@/components/KeywordSearch";
import UserMenu from "@/components/UserMenu";

type SearchTab = "area" | "location" | "keyword";

export default function Home() {
  const [activeTab, setActiveTab] = useState<SearchTab>("area");
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🐕</span>
              <span className="text-2xl font-bold text-gray-900">PetTrip</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-gray-700 hover:text-brand transition-colors"
              >
                서비스 소개
              </a>
              <a
                href="#how-it-works"
                className="text-gray-700 hover:text-brand transition-colors"
              >
                이용 방법
              </a>
              <a
                href="#search"
                className="text-gray-700 hover:text-brand transition-colors"
              >
                장소 찾기
              </a>
            </div>
            <div className="flex items-center gap-3">
              <UserMenu />
              <button
                onClick={() => setShowSearch(true)}
                className="bg-brand text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-dark transition-colors"
              >
                지금 검색하기
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-block bg-brand-soft text-brand-dark px-4 py-2 rounded-full text-sm font-medium mb-6">
                🐾 반려동물과 함께하는 여행
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                강아지와 함께
                <br />
                <span className="text-brand">특별한 추억</span>을
                <br />
                만들어보세요
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                전국의 반려동물 동반 가능한 관광지, 숙박, 음식점을 한눈에
                찾아보세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowSearch(true)}
                  className="bg-brand text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-brand-dark transition-all hover:scale-105 shadow-lg"
                >
                  지금 시작하기
                </button>
                <a
                  href="#features"
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold text-lg hover:border-gray-400 transition-colors text-center"
                >
                  더 알아보기
                </a>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="/main_visual.png"
                  alt="Dog Walking"
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-300 rounded-full opacity-50 blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-brand rounded-full opacity-30 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              왜 PetTrip을 선택해야 할까요?
            </h2>
            <p className="text-xl text-gray-600">
              반려동물과 함께하는 여행을 더 편리하게
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-brand-soft rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                간편한 검색
              </h3>
              <p className="text-gray-600 leading-relaxed">
                지역별, 키워드, 내 주변 등 다양한 방법으로 원하는 장소를 쉽게
                찾을 수 있어요.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                검증된 정보
              </h3>
              <p className="text-gray-600 leading-relaxed">
                한국관광공사에서 제공하는 공식 데이터로 신뢰할 수 있는 정보를
                제공합니다.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🐕</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                상세한 안내
              </h3>
              <p className="text-gray-600 leading-relaxed">
                반려동물 크기, 마릿수 제한, 추가 요금 등 필요한 모든 정보를
                확인할 수 있어요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">이용 방법</h2>
            <p className="text-xl text-gray-600">
              3단계로 간편하게 여행지를 찾아보세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-brand text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                검색 방법 선택
              </h3>
              <p className="text-gray-600">
                지역별, 내 주변, 키워드 중 원하는 방법을 선택하세요
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-brand text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                조건 설정
              </h3>
              <p className="text-gray-600">
                지역, 카테고리 등 원하는 조건을 설정하세요
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-brand text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                장소 확인
              </h3>
              <p className="text-gray-600">
                검색 결과를 확인하고 상세 정보를 살펴보세요
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">장소 검색</h2>
              <button
                onClick={() => setShowSearch(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("area")}
                  className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                    activeTab === "area"
                      ? "border-brand text-brand"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  지역별 검색
                </button>
                <button
                  onClick={() => setActiveTab("location")}
                  className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                    activeTab === "location"
                      ? "border-brand text-brand"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  내 주변 검색
                </button>
                <button
                  onClick={() => setActiveTab("keyword")}
                  className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                    activeTab === "keyword"
                      ? "border-brand text-brand"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  키워드 검색
                </button>
              </div>

              <div className="min-h-[400px]">
                {activeTab === "area" && (
                  <AreaSearch onSubmit={() => setShowSearch(false)} />
                )}
                {activeTab === "location" && (
                  <LocationSearch onSubmit={() => setShowSearch(false)} />
                )}
                {activeTab === "keyword" && (
                  <KeywordSearch onSubmit={() => setShowSearch(false)} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand to-brand-dark">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            지금 바로 시작해보세요
          </h2>
          <p className="text-xl text-brand-soft mb-8">
            반려동물과 함께하는 특별한 여행, 지금 계획해보세요
          </p>
          <button
            onClick={() => setShowSearch(true)}
            className="bg-white text-brand px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
          >
            여행지 찾기
          </button>
        </div>
      </section>
    </div>
  );
}
