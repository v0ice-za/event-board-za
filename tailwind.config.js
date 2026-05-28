/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
    './constants/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background:         '#0F0C09',
        surface:            '#1C1814',
        'text-primary':     '#F5F0E8',
        'text-secondary':   '#8A7E70',
        accent:             '#FF6B35',
        border:             '#2A2420',
        error:              '#FF4D4D',
        success:            '#4CAF50',
      },
      fontFamily: {
        'inter':          ['Inter_400Regular'],
        'inter-medium':   ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold':     ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
