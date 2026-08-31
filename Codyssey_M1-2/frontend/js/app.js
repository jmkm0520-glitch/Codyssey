"use strict";

/**
 * 화면 초기화: 서버 연결 확인 + 재시도, 공통 상태 배너, 각 화면 모듈 기동.
 */
(function () {
  const statusBanner = document.getElementById("status-banner");

  function show(message, { isError = false } = {}) {
    statusBanner.textContent = message;
    statusBanner.hidden = false;
    statusBanner.classList.toggle("status-banner--error", isError);
  }

  function hide() {
    statusBanner.hidden = true;
    statusBanner.textContent = "";
    statusBanner.classList.remove("status-banner--error");
  }

  // data.js, chat.js 등 다른 화면 모듈이 공통으로 쓰는 상태 안내 함수.
  window.AppStatus = { show, hide };

  function showRetryButton(onRetry) {
    if (document.getElementById("retry-button")) {
      return;
    }
    const button = document.createElement("button");
    button.id = "retry-button";
    button.type = "button";
    button.textContent = "다시 시도";
    button.addEventListener("click", () => {
      button.remove();
      onRetry();
    });
    statusBanner.appendChild(button);
  }

  function loadAllSections() {
    window.DataModule.init();
    window.ChatModule.init();
  }

  async function checkServerConnection() {
    show("서버에 연결하는 중입니다...");
    try {
      await window.apiRequest("/health");
      hide();
      loadAllSections();
    } catch (error) {
      show(error.message, { isError: true });
      showRetryButton(checkServerConnection);
    }
  }

  document.addEventListener("DOMContentLoaded", checkServerConnection);
})();
