import api from "@/lib/axios";
import { ApiError } from "@/lib/errors";
import { handleUnauthorized } from "@/lib/session";

/** Request fields. Empty values are omitted, never sent as the string "undefined". */
export type LiveParams = Record<string, string | number | null | undefined>;

/** Every reply from the live Leaders Tutors API carries these; the payload sits beside them. */
export interface LiveReply {
  success: boolean;
  message: string;
  /** A code below 100 means the access key was rejected. */
  response?: number;
}

export type LiveResult<T extends Record<string, unknown> = Record<string, unknown>> = LiveReply & T;

const FORM_HEADERS = { "Content-Type": "application/x-www-form-urlencoded" };

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

const sentence = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return "";
  // The API shouts its headings ("INVALID EMAIL ADDRESS"); read them as sentences.
  const calm = trimmed === trimmed.toUpperCase() ? trimmed.toLowerCase() : trimmed;
  return calm.charAt(0).toUpperCase() + calm.slice(1);
};

/**
 * "TITLE! Detail" is the API's two-part message. Join the halves into plain
 * sentences so one string reads well in a toast or form error.
 */
export const readableMessage = (message: unknown): string => {
  if (typeof message !== "string" || !message.trim()) return FALLBACK_MESSAGE;
  const [title, ...rest] = message.split("!");
  const parts = [title, rest.join("!")].map(sentence).filter(Boolean);
  return parts.map((part) => (/[.?]$/.test(part) ? part : `${part}.`)).join(" ");
};

/**
 * Calls a live endpoint the way the existing Leaders Tutors site does: a
 * form-encoded POST with the `apiKey` header (added by the shared client) and,
 * for signed-in routes, the student's access key as a bearer token.
 *
 * The API answers 200 even for failures, so `success: false` is raised as an
 * ApiError carrying the API's own message, and a rejected access key ends the
 * session exactly like a 401 does.
 */
export const liveCall = async <T extends Record<string, unknown> = Record<string, unknown>>(
  path: string,
  params: LiveParams = {},
  options: { token?: string } = {},
): Promise<LiveResult<T>> => {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) body.append(key, String(value));
  }

  const headers: Record<string, string> = { ...FORM_HEADERS };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const { data } = await api.post<LiveResult<T>>(path, body, { headers });
  if (!data || typeof data !== "object") {
    throw new ApiError("The learning service returned an unreadable response.", 502);
  }

  if (typeof data.response === "number" && data.response < 100) {
    handleUnauthorized(path);
    throw new ApiError(readableMessage(data.message), 401);
  }
  if (data.success !== true) throw new ApiError(readableMessage(data.message), 400);
  return data;
};
