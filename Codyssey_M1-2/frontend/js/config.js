"use strict";

/**
 * 내 컴퓨터와 배포 환경에서 서로 다른 서버 주소를 쓸 수 있게 한다.
 * 우선순위: localStorage 저장값 > 접속 호스트 기준 자동 판단.
 */
(function () {
  // 18단계에서 Render에 배포한 뒤 실제 백엔드 주소로 바꿔 주세요.
  const PRODUCTION_API_BASE_URL = "https://codyssey-m1-2-api.onrender.com";
  const LOCAL_API_BASE_URL = "http://localhost:8000";
  const STORAGE_KEY = "apiBaseUrl";

  function readStoredOverride() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function resolveApiBaseUrl() {
    const override = readStoredOverride();
    if (override) {
      return override.replace(/\/$/, "");
    }

    const isLocalHost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    return isLocalHost ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL;
  }

  window.APP_CONFIG = {
    apiBaseUrl: resolveApiBaseUrl(),
  };
})();
