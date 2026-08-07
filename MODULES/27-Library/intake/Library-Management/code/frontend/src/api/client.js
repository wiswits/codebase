import axios from "axios";

const client = axios.create({
  baseURL: "/api",
});

// Dev-only auth: attach the chosen demo user's id on every request.
// This header is what backend/src/middleware/auth.js reads. Once real
// WisWits login is integrated, this becomes a real JWT/session header.
client.interceptors.request.use((config) => {
  const userId = localStorage.getItem("wiswits_demo_user_id");
  if (userId) {
    config.headers["x-user-id"] = userId;
  }
  return config;
});

export default client;
