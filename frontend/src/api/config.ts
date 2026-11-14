// Override these at build time with a .env file (Vite reads VITE_* variables):
//   VITE_API_BASE=https://your-backend.example.com
export const API_BASE: string = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
export const WS_ENDPOINT: string = `${API_BASE}/ws`;
