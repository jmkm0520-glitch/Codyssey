"use strict";

/** 14단계: 매출 요약 카드를 서버 값으로 채운다. */
(function () {
  const TREND_LABELS = {
    increase: "증가",
    decrease: "감소",
    stable: "유지",
    insufficient_data: "판단할 자료 부족",
  };

  function formatCurrency(value) {
    if (value === null || value === undefined) {
      return "-";
    }
    return `${value.toLocaleString("ko-KR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} GBP`;
  }

  function trendText(summary) {
    const label = TREND_LABELS[summary.trend] || summary.trend;
    if (summary.change_rate === null || summary.change_rate === undefined) {
      return label;
    }
    const sign = summary.change_rate > 0 ? "+" : "";
    return `${label} (최근 7일 대비 이전 7일 ${sign}${summary.change_rate}%)`;
  }

  function renderCard(label, value) {
    return `
      <div class="stat-card">
        <p class="stat-label">${window.escapeHtml(label)}</p>
        <p class="stat-value">${window.escapeHtml(value)}</p>
      </div>`;
  }

  function renderSummary(summary) {
    const container = document.getElementById("summary-content");

    if (summary.record_count === 0) {
      container.innerHTML = '<p class="placeholder">아직 저장된 매출 데이터가 없습니다.</p>';
      return;
    }

    container.innerHTML = [
      renderCard("데이터 기간", `${summary.period_start} ~ ${summary.period_end}`),
      renderCard("데이터 건수", `${summary.record_count.toLocaleString("ko-KR")}건`),
      renderCard("총매출", formatCurrency(summary.total_sales)),
      renderCard("평균 매출", formatCurrency(summary.average_sales)),
      renderCard("최대 매출", `${formatCurrency(summary.max_sales)} (${summary.max_sales_date})`),
      renderCard("최소 매출", `${formatCurrency(summary.min_sales)} (${summary.min_sales_date})`),
      renderCard("최근 추세", trendText(summary)),
    ].join("");
  }

  async function loadSummary() {
    const container = document.getElementById("summary-content");
    try {
      const summary = await window.apiRequest("/api/data/summary");
      renderSummary(summary);
    } catch (error) {
      container.innerHTML = `<p class="placeholder">${window.escapeHtml(error.message)}</p>`;
    }
  }

  window.SummaryModule = { loadSummary };
})();
