"use strict";

/** 14단계: 매출 목록 조회, 추가, 삭제. */
(function () {
  const PAGE_SIZE = 20;
  let allRecords = [];
  let visibleCount = PAGE_SIZE;

  function formatValue(value) {
    return value.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderRows() {
    const container = document.getElementById("data-list");
    const loadMoreButton = document.getElementById("data-load-more-button");

    if (allRecords.length === 0) {
      container.innerHTML = '<p class="placeholder">저장된 매출 데이터가 없습니다.</p>';
      loadMoreButton.hidden = true;
      return;
    }

    const sorted = [...allRecords].sort((a, b) => (a.date < b.date ? 1 : -1));
    const visible = sorted.slice(0, visibleCount);

    container.innerHTML = visible
      .map(
        (record) => `
        <div class="data-row" data-id="${window.escapeHtml(record.id)}">
          <div class="data-row-main">
            <span class="data-row-date">${window.escapeHtml(record.date)}</span>
            <span class="data-row-value">${formatValue(record.value)} GBP</span>
            <span class="data-row-memo">${window.escapeHtml(record.memo)}</span>
          </div>
          <button
            type="button"
            class="data-row-delete secondary-button secondary-button--danger"
            data-id="${window.escapeHtml(record.id)}"
            aria-label="${window.escapeHtml(record.date)} 매출 삭제"
          >삭제</button>
        </div>`
      )
      .join("");

    loadMoreButton.hidden = visibleCount >= sorted.length;

    container.querySelectorAll(".data-row-delete").forEach((button) => {
      button.addEventListener("click", () =>
        handleDelete(button.dataset.id, button.closest(".data-row"))
      );
    });
  }

  async function loadData() {
    const container = document.getElementById("data-list");
    try {
      allRecords = await window.apiRequest("/api/data");
      renderRows();
    } catch (error) {
      container.innerHTML = `<p class="placeholder">${window.escapeHtml(error.message)}</p>`;
    }
  }

  async function refreshAll() {
    await Promise.all([loadData(), window.SummaryModule.loadSummary()]);
  }

  async function handleDelete(id, rowElement) {
    const dateLabel = rowElement
      ? rowElement.querySelector(".data-row-date").textContent
      : id;
    const confirmed = window.confirm(`${dateLabel} 매출 데이터를 정말 삭제할까요?`);
    if (!confirmed) {
      return;
    }

    try {
      await window.apiRequest(`/api/data/${encodeURIComponent(id)}`, { method: "DELETE" });
      window.AppStatus.show("매출 데이터를 삭제했습니다.");
      await refreshAll();
    } catch (error) {
      window.AppStatus.show(error.message, { isError: true });
    }
  }

  function setupForm() {
    const form = document.getElementById("data-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = {
        date: formData.get("date"),
        value: Number(formData.get("value")),
        memo: formData.get("memo"),
      };

      const submitButton = form.querySelector("button[type=submit]");
      submitButton.disabled = true;
      try {
        await window.apiRequest("/api/data", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        form.reset();
        window.AppStatus.show("매출 데이터를 추가했습니다.");
        visibleCount = PAGE_SIZE;
        await refreshAll();
      } catch (error) {
        window.AppStatus.show(error.message, { isError: true });
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  function setupLoadMore() {
    document.getElementById("data-load-more-button").addEventListener("click", () => {
      visibleCount += PAGE_SIZE;
      renderRows();
    });
  }

  function init() {
    setupForm();
    setupLoadMore();
    refreshAll();
  }

  window.DataModule = { init, loadData, refreshAll };
})();
