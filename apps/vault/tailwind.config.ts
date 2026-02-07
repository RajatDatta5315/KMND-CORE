import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: { colors: { cyan: { 400: '#00f3ff', 500: '#00d8ff' } } } },
  plugins: [],
};
export default config;
