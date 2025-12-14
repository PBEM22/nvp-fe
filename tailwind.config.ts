import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main Navy - 버튼, 헤더, 로고, 주요 텍스트
        navy: {
          DEFAULT: "#1A2B4C",
          50: "#E8EBF0",
          100: "#D1D7E1",
          200: "#A3AFC3",
          300: "#7587A5",
          400: "#475F87",
          500: "#1A2B4C", // Main
          600: "#15223D",
          700: "#101A2E",
          800: "#0B111F",
          900: "#050910",
        },
        // Light Blue - 포지션 텍스트, 액센트
        blue: {
          light: "#E0F2F7",
          DEFAULT: "#3498DB",
          dark: "#2980B9",
        },
        // Sub Gray - 배경, 버튼
        gray: {
          bg: "#F5F5F5", // 입력 필드 배경, 필터 버튼 배경
          text: "#666666", // 보조 텍스트, 플레이스홀더
          border: "#E5E5E5", // 경계선
          dark: "#333333", // 주요 텍스트
        },
      },
      borderRadius: {
        // 둥근 모서리 - 버튼, 입력 필드, 카드
        DEFAULT: "12px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        full: "9999px",
      },
      boxShadow: {
        // 카드 그림자
        card: "0 2px 8px rgba(0, 0, 0, 0.08)",
        "card-lg": "0 4px 12px rgba(0, 0, 0, 0.1)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;


