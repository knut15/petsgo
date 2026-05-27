export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="로딩 중"
      className="fixed inset-0 z-[60] bg-white/85 backdrop-blur-sm flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-5">
        <svg
          viewBox="0 0 64 64"
          className="w-20 h-20"
          aria-hidden="true"
        >
          {/* Background ring */}
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="#e6f2fb"
            strokeWidth="6"
          />
          {/* Spinning arc */}
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="#40a2e3"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="60 200"
            transform="rotate(-90 32 32)"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="-90 32 32"
              to="270 32 32"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Paw prints — toe beans + pad, pulsing */}
          <g fill="#40a2e3" transform="translate(32 33)">
            <ellipse cx="-7" cy="-3" rx="2.6" ry="3.2">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite" begin="0s" />
            </ellipse>
            <ellipse cx="-2.5" cy="-7" rx="2.6" ry="3.2">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite" begin="0.15s" />
            </ellipse>
            <ellipse cx="2.5" cy="-7" rx="2.6" ry="3.2">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite" begin="0.3s" />
            </ellipse>
            <ellipse cx="7" cy="-3" rx="2.6" ry="3.2">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite" begin="0.45s" />
            </ellipse>
            <ellipse cx="0" cy="3" rx="6" ry="5">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite" begin="0.6s" />
            </ellipse>
          </g>
        </svg>
        <span className="text-sm font-medium text-stone-500">
          잠시만 기다려주세요
        </span>
      </div>
    </div>
  );
}
