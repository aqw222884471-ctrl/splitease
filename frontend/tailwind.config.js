/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        primaryHover: '#4F46E5',
        background: '#F8FAFC',
        card: '#FFFFFF',
        text: '#1E293B',
        success: '#10B981',
        warning: '#F59E0B'
      }
    },
  },
  plugins: [],
}