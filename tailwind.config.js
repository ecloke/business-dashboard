/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ant Design color palette integration
        primary: {
          50: '#e6f7ff',
          100: '#bae7ff',
          200: '#91d5ff',
          300: '#69c0ff',
          400: '#40a9ff',
          500: '#1890ff', // Primary blue from dashboard.html
          600: '#096dd9',
          700: '#0050b3',
          800: '#003a8c',
          900: '#002766',
        },
        success: {
          50: '#f6ffed',
          100: '#d9f7be',
          200: '#b7eb8f',
          300: '#95de64',
          400: '#73d13d',
          500: '#52c41a', // Success green from dashboard.html
          600: '#389e0d',
          700: '#237804',
          800: '#135200',
          900: '#092b00',
        },
        warning: {
          50: '#fffbe6',
          100: '#fff1b8',
          200: '#ffe58f',
          300: '#ffd666',
          400: '#ffc53d',
          500: '#faad14', // Warning orange from dashboard.html
          600: '#d48806',
          700: '#ad6800',
          800: '#874d00',
          900: '#613400',
        },
        // Dashboard specific colors
        background: {
          DEFAULT: '#f5f5f5', // Dashboard background
          paper: '#ffffff',
          disabled: '#fafafa',
        },
        text: {
          primary: '#262626',
          secondary: '#8c8c8c',
          disabled: '#bfbfbf',
        },
        border: {
          DEFAULT: '#f0f0f0',
          hover: '#d9d9d9',
        },
      },
      boxShadow: {
        // Ant Design shadow system
        'ant-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        'ant-md': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'ant-lg': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'ant-xl': '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'ant': '6px', // Ant Design default border radius
        'ant-lg': '8px',
      },
      spacing: {
        // Ant Design spacing system
        'ant-xs': '8px',
        'ant-sm': '12px',
        'ant-md': '16px',
        'ant-lg': '24px',
        'ant-xl': '32px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        'ant-xs': ['12px', '20px'],
        'ant-sm': ['14px', '22px'],
        'ant-base': ['14px', '22px'],
        'ant-lg': ['16px', '24px'],
        'ant-xl': ['20px', '28px'],
        'ant-2xl': ['24px', '32px'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    // Disable Tailwind's preflight to avoid conflicts with Ant Design
    preflight: false,
  },
}