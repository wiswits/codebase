import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import toast from "react-hot-toast";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * ============================================================
 * Axios Instance
 * ============================================================
 */

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * ============================================================
 * Request Interceptor
 * Adds Authorization header (future-ready)
 * ============================================================
 */

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * ============================================================
 * Snake Case → Camel Case Converter
 * ============================================================
 */

const ACRONYMS = [
  "id",
  "api",
  "url",
  "sms",
  "erp",
  "hr",
  "ctc",
  "dob",
];

const toCamelCase = (text: string): string => {
  const camel = text.replace(/_([a-z])/g, (_, letter) =>
    letter.toUpperCase()
  );

  return ACRONYMS.reduce((value, acronym) => {
    const regex = new RegExp(
      `${acronym.charAt(0).toUpperCase()}${acronym.slice(1)}$`
    );

    return regex.test(value)
      ? value.replace(regex, acronym.toUpperCase())
      : value;
  }, camel);
};

const camelizeKeys = <T>(data: T): T => {
  if (Array.isArray(data)) {
    return data.map((item) => camelizeKeys(item)) as T;
  }

  if (
    data !== null &&
    typeof data === "object" &&
    !(data instanceof Date)
  ) {
    return Object.entries(data as Record<string, unknown>).reduce(
      (result, [key, value]) => {
        result[toCamelCase(key)] = camelizeKeys(value);
        return result;
      },
      {} as Record<string, unknown>
    ) as T;
  }

  return data;
};

/**
 * ============================================================
 * Response Interceptor
 * Converts Backend snake_case into Frontend camelCase
 * ============================================================
 */

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Skip file downloads
    if (response.config.responseType === "blob") {
      return response;
    }

    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      response.data = {
        ...response.data,
        data: camelizeKeys(response.data.data),
      };
    }

    return response;
  },

  (error: AxiosError<any>) => {
    const status = error.response?.status;

    const message =
      error.response?.data?.message ??
      error.message ??
      "Something went wrong.";

    // Don't toast 401 because auth middleware handles it
    if (status !== 401) {
      toast.error(message);
    }

    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", error.response?.data || error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;