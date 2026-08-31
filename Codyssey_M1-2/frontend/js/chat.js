"use strict";

/** 15단계: AI 채팅과 이전 대화 목록. */
(function () {
  let currentConversationId = null;
  let isSending = false;

  function chatLogEl() {
    return document.getElementById("chat-log");
  }

  function clearPlaceholder() {
    const placeholder = chatLogEl().querySelector(".placeholder");
    if (placeholder) {
      placeholder.remove();
    }
  }

  function renderMessage(role, content) {
    clearPlaceholder();
    const log = chatLogEl();
    const bubble = document.createElement("p");
    bubble.className = `chat-message chat-message--${role}`;
    bubble.textContent = content;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function renderErrorNote(message) {
    const log = chatLogEl();
    const note = document.createElement("p");
    note.className = "chat-error-note";
    note.setAttribute("role", "alert");
    note.textContent = `${message} 같은 질문을 다시 보내 보세요.`;
    log.appendChild(note);
    log.scrollTop = log.scrollHeight;
  }

  function showLoadingIndicator() {
    const log = chatLogEl();
    const indicator = document.createElement("p");
    indicator.id = "chat-loading-indicator";
    indicator.className = "chat-loading";
    indicator.setAttribute("role", "status");
    indicator.textContent = "AI가 답변을 작성하는 중입니다...";
    log.appendChild(indicator);
    log.scrollTop = log.scrollHeight;
  }

  function hideLoadingIndicator() {
    const indicator = document.getElementById("chat-loading-indicator");
    if (indicator) {
      indicator.remove();
    }
  }

  function resetChatLog() {
    chatLogEl().innerHTML =
      '<p class="placeholder">아직 나눈 대화가 없습니다. 아래에 질문을 입력해 보세요.</p>';
  }

  function setSendingState(sending) {
    isSending = sending;
    document.getElementById("chat-submit-button").disabled = sending;
    document.getElementById("chat-input").disabled = sending;
  }

  function renderConversationList(conversations) {
    const list = document.getElementById("conversation-list");

    if (conversations.length === 0) {
      list.innerHTML = '<li class="placeholder">아직 저장된 대화가 없습니다.</li>';
      return;
    }

    list.innerHTML = conversations
      .map((conversation) => {
        const isActive = conversation.id === currentConversationId;
        return `
          <li class="conversation-item-row">
            <button
              type="button"
              class="conversation-item${isActive ? " conversation-item--active" : ""}"
              data-id="${window.escapeHtml(conversation.id)}"
            >${window.escapeHtml(conversation.title)}</button>
            <button
              type="button"
              class="conversation-delete secondary-button secondary-button--danger"
              data-id="${window.escapeHtml(conversation.id)}"
              aria-label="'${window.escapeHtml(conversation.title)}' 대화 삭제"
            >삭제</button>
          </li>`;
      })
      .join("");

    list.querySelectorAll(".conversation-item").forEach((button) => {
      button.addEventListener("click", () => openConversation(button.dataset.id));
    });
    list.querySelectorAll(".conversation-delete").forEach((button) => {
      button.addEventListener("click", () => deleteConversation(button.dataset.id));
    });
  }

  async function loadConversationList() {
    const list = document.getElementById("conversation-list");
    try {
      const conversations = await window.apiRequest("/api/conversations");
      renderConversationList(conversations);
    } catch (error) {
      list.innerHTML = `<li class="placeholder">${window.escapeHtml(error.message)}</li>`;
    }
  }

  async function openConversation(id) {
    try {
      const conversation = await window.apiRequest(`/api/conversations/${encodeURIComponent(id)}`);
      currentConversationId = conversation.id;
      resetChatLog();
      chatLogEl().innerHTML = "";
      conversation.messages.forEach((message) => renderMessage(message.role, message.content));
      await loadConversationList();
    } catch (error) {
      window.AppStatus.show(error.message, { isError: true });
    }
  }

  function startNewConversation() {
    currentConversationId = null;
    resetChatLog();
    loadConversationList();
  }

  async function deleteConversation(id) {
    const confirmed = window.confirm("이 대화를 정말 삭제할까요?");
    if (!confirmed) {
      return;
    }

    try {
      await window.apiRequest(`/api/conversations/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      window.AppStatus.show("대화를 삭제했습니다.");
      if (currentConversationId === id) {
        startNewConversation();
      } else {
        await loadConversationList();
      }
    } catch (error) {
      window.AppStatus.show(error.message, { isError: true });
    }
  }

  async function sendMessage(message) {
    if (isSending) {
      return;
    }

    setSendingState(true);
    renderMessage("user", message);
    showLoadingIndicator();

    try {
      const response = await window.apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message,
          conversation_id: currentConversationId,
        }),
      });
      hideLoadingIndicator();
      renderMessage("assistant", response.answer);
      currentConversationId = response.conversation_id;
      await loadConversationList();
    } catch (error) {
      hideLoadingIndicator();
      renderErrorNote(error.message);
      window.AppStatus.show(error.message, { isError: true });
    } finally {
      setSendingState(false);
    }
  }

  function setupForm() {
    const form = document.getElementById("chat-form");
    const input = document.getElementById("chat-input");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = input.value.trim();
      if (!message || isSending) {
        return;
      }
      input.value = "";
      sendMessage(message);
    });

    // Enter로 전송, Shift+Enter는 줄바꿈.
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });
  }

  function setupNewConversationButton() {
    document.getElementById("new-conversation-button").addEventListener("click", () => {
      startNewConversation();
    });
  }

  function init() {
    setupForm();
    setupNewConversationButton();
    loadConversationList();
  }

  window.ChatModule = { init };
})();
