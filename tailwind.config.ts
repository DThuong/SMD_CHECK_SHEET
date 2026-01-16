import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Custom font sizes cho iOS-safe inputs
      fontSize: {
        'input': '16px',        // iOS-safe minimum
        'input-sm': '14px',     // Nhỏ hơn nhưng không dùng cho input
        'input-label': '12px',  // Cho labels
      },
    },
  },
  plugins: [],
}

export default config

