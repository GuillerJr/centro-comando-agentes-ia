export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#0f172a',
        surface: '#111827',
        accent: '#38bdf8',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      boxShadow: {
        panel: '0 20px 45px rgba(15, 23, 42, 0.35)',
      },
    },
  },
  plugins: [],
};
