import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background Colors (Gunmetal Scale)
        'deep-space': '#0a0a0f',
        'charcoal': '#141418',
        'gunmetal': '#1e1e24',
        'steel-dark': '#2a2a32',
        'steel-mid': '#3a3a44',
        'steel-light': '#4a4a56',
        
        // Accent Colors
        'cyan-glow': '#00c8e8',
        'cyan-teal': '#00a8b8',
        
        // Text Colors
        'text-primary': '#e0e0e8',
        'text-secondary': '#9090a0',
        'text-muted': '#606070',
        
        // Semantic Colors
        'success': '#00e88c',
        'warning': '#e8a800',
        'error': '#e84040',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'jetbrains': ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.4)',
        'glow-sm': '0 0 15px rgba(0, 200, 232, 0.12)',
        'glow-md': '0 0 20px rgba(0, 200, 232, 0.25)',
        'glow-lg': '0 0 30px rgba(0, 200, 232, 0.4)',
      },
      animation: {
        'glow-pulse': 'glowPulse 1.5s ease-in-out infinite',
        'typing': 'typing 1.4s ease-in-out infinite',
        'voice-wave': 'voiceWave 0.5s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 200, 232, 0.25)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 200, 232, 0.5)' },
        },
        typing: {
          '0%, 60%, 100%': { opacity: '0.3' },
          '30%': { opacity: '1' },
        },
        voiceWave: {
          '0%, 100%': { height: '8px' },
          '50%': { height: '24px' },
        },
      },
      backgroundImage: {
        'metallic': 'linear-gradient(180deg, #f0f0f5 0%, #c8c8d0 20%, #8a8a96 40%, #5a5a66 60%, #8a8a96 80%, #c8c8d0 100%)',
        'card-gradient': 'linear-gradient(135deg, #1e1e24 0%, #141418 50%, #0a0a0f 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
