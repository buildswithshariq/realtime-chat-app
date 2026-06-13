const envUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const API_URL = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;