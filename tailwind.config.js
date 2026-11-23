/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hse: {
          primary: '#DC2626',      // Safety Red
          primaryDark: '#B91C1C',
          primaryLight: '#FEE2E2',
          success: '#16A34A',      // Layak / Closed
          successLight: '#DCFCE7',
          warning: '#D97706',      // In Progress / Near Due
          warningLight: '#FEF3C7',
          info: '#2563EB',         // Pending Review
          infoLight: '#DBEAFE',
          danger: '#E11D48',       // Rusak / Open / Overdue
          dangerLight: '#FFE4E6',
          sidebar: '#0F172A',      // Slate 900
          sidebarHover: '#1E293B', // Slate 800
          canvas: '#F8FAFC',       // Slate 50
          card: '#FFFFFF',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
