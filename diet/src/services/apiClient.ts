import type { ApiEnvelope, ApiError } from "../types/api";

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(error: ApiError, status: number) {
    super(error.message);
    this.name = "ApiClientError";
    this.code = error.code;
    this.status = status;
  }
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (!value || typeof value !== "object") return false;
  const envelope = value as Record<string, unknown>;
  return "data" in envelope && "error" in envelope;
}

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    throw new ApiClientError(
      { code: "INVALID_RESPONSE", message: "서버 응답을 읽을 수 없습니다." },
      response.status,
    );
  }

  if (!isApiEnvelope<T>(payload)) {
    throw new ApiClientError(
      { code: "INVALID_RESPONSE", message: "서버 응답 형식이 올바르지 않습니다." },
      response.status,
    );
  }

  if (!response.ok || payload.error) {
    throw new ApiClientError(
      payload.error ?? { code: "REQUEST_FAILED", message: "요청에 실패했습니다." },
      response.status,
    );
  }

  return payload.data as T;
}
