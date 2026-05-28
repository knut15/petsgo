import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🐕</span>
              <span className="text-2xl font-bold text-white">PetTrip</span>
            </div>
            <p className="text-gray-400">반려동물과 함께하는 행복한 여행</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">서비스</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/#features"
                  className="hover:text-white transition-colors"
                >
                  서비스 소개
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="hover:text-white transition-colors"
                >
                  이용 방법
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">문의 / 정보</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:curve.ball.hiro@gmail.com"
                  className="hover:text-white transition-colors"
                >
                  curve.ball.hiro@gmail.com
                </a>
              </li>
              <li className="text-gray-400 pt-2">
                데이터 제공: 한국관광공사
                <br />
                KorPetTourService API
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          © 2026 PetTrip. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
