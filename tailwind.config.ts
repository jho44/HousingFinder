import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'light': { // brandy
          '50': '#fbf8f1',
          '100': '#f5efdf',
          '200': '#ebdcbd',
          '300': '#e1c89d',
          '400': '#d0a367',
          '500': '#c68b49',
          '600': '#b8773e',
          '700': '#995e35',
          '800': '#7b4c31',
          '900': '#64402a',
          '950': '#352015',
        },
        'dark': { // woodsmoke
          '50': '#f5f6f6',
          '100': '#e5e6e8',
          '200': '#ced1d3',
          '300': '#acb1b4',
          '400': '#838a8d',
          '500': '#686f72',
          '600': '#595e61',
          '700': '#4c5052',
          '800': '#434547',
          '900': '#3b3c3e',
          '950': '#18191a',
  
          // tuatara
          // '50': '#f5f6f6',
          // '100': '#e5e6e8',
          // '200': '#ced1d3',
          // '300': '#acb1b4',
          // '400': '#838a8d',
          // '500': '#686f72',
          // '600': '#595e61',
          // '700': '#4c5052',
          // '800': '#434547',
          // '900': '#3e4042',
          // '950': '#252727',
        },
      }
    },
    
  },
  plugins: [],
}
export default config
