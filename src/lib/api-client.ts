import { AxiosRequestConfig, AxiosResponse } from "axios";
import api from "./axios";

type ApiResponse<T> = { data: T };
type ApiEnvelope<T> = ApiResponse<T> & Record<string, unknown>;

function extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const inner = response.data;
  return (inner && "data" in inner ? inner.data : inner) as T;
}

export const apiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await api.get<ApiResponse<T>>(url, config);
    return extractData<T>(res);
  },

  // Keeps response metadata that sits beside `data`, such as examData.
  getEnvelope: async <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiEnvelope<T>> => {
    const res = await api.get<ApiEnvelope<T>>(url, config);
    return res.data;
  },

  post: async <T, B = unknown>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const res = await api.post<ApiResponse<T>>(url, body, config);
    return extractData<T>(res);
  },

  put: async <T, B = unknown>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const res = await api.put<ApiResponse<T>>(url, body, config);
    return extractData<T>(res);
  },

  patch: async <T, B = unknown>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const res = await api.patch<ApiResponse<T>>(url, body, config);
    return extractData<T>(res);
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await api.delete<ApiResponse<T>>(url, config);
    return extractData<T>(res);
  },
};
