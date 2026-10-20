"use strict";

/**
 * 서버에 요청을 보내고 오류를 한국어로 정리하는 공통 함수.
 * 모든 화면 코드는 fetch를 직접 쓰지 않고 이 함수를 통해서만 서버와 통신한다.
 */
(function () {
  const DEFAULT_TIMEOUT_MS = 15000;

  class ApiError extends Error {
    constructor(message, { status, code } = {}) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.code = code;
    }
  }

  async function parseJsonSafely(response) {
    const text = await response.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  }

  async function apiRequest(path, options = {}) {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...fetchOptions } = options;
    const url = `${window.APP_CONFIG.apiBaseUrl}${path}`;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetch(url, {
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (error.name === "AbortError") {
        throw new ApiError("서버 응답이 너무 늦어 요청을 중단했습니다. 잠시 후 다시 시도해 주세요.");
      }
      throw new ApiError("서버에 연결하지 못했습니다. 인터넷 연결과 서버 상태를 확인해 주세요.");
    } finally {
      window.clearTimeout(timeoutId);
    }

    const body = await parseJsonSafely(response);

    if (!response.ok) {
      const message =
        (body && body.error && body.error.message) ||
        "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      throw new ApiError(message, {
        status: response.status,
        code: body && body.error && body.error.code,
      });
    }

    return body;
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
  }

  window.ApiError = ApiError;
  window.apiRequest = apiRequest;
  window.escapeHtml = escapeHtml;
})();
