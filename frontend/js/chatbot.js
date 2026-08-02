/* ============================================================
   Civic Assist — floating chatbot widget
   Injects a toggle button + chat panel into the bottom-right
   corner of any page that includes this script.
   ============================================================ */

(function () {
  const SUGGESTIONS = ["How do I report an issue?", "Track my complaint", "How does upvoting work?"];

  function buildWidget() {
    const toggle = document.createElement("button");
    toggle.id = "civic-chat-toggle";
    toggle.setAttribute("aria-label", "Open Civic Assist chatbot");
    toggle.innerHTML = "💬";
    document.body.appendChild(toggle);

    const panel = document.createElement("div");
    panel.id = "civic-chat-panel";
    panel.innerHTML = `
      <div class="cc-header">
        <div class="dot"></div>
        <div class="info">
          <b>Civic Assist</b>
          <span>Here to help, 24/7</span>
        </div>
        <button class="cc-close" aria-label="Close chat">✕</button>
      </div>
      <div class="cc-body" id="cc-body"></div>
      <div class="cc-suggestions" id="cc-suggestions"></div>
      <div class="cc-input-row">
        <input type="text" id="cc-input" placeholder="Type your question..." autocomplete="off" />
        <button id="cc-send" aria-label="Send message">➤</button>
      </div>
    `;
    document.body.appendChild(panel);

    const body = panel.querySelector("#cc-body");
    const suggestionsWrap = panel.querySelector("#cc-suggestions");
    const input = panel.querySelector("#cc-input");
    const sendBtn = panel.querySelector("#cc-send");
    const closeBtn = panel.querySelector(".cc-close");

    function addMessage(text, who) {
      const div = document.createElement("div");
      div.className = "cc-msg " + who;
      div.textContent = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }

    function showTyping() {
      const div = document.createElement("div");
      div.className = "cc-msg bot";
      div.id = "cc-typing-indicator";
      div.innerHTML = '<div class="cc-typing"><span></span><span></span><span></span></div>';
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }
    function removeTyping() {
      const el = document.getElementById("cc-typing-indicator");
      if (el) el.remove();
    }

    function renderSuggestions() {
      suggestionsWrap.innerHTML = "";
      SUGGESTIONS.forEach((s) => {
        const chip = document.createElement("button");
        chip.className = "cc-chip";
        chip.type = "button";
        chip.textContent = s;
        chip.addEventListener("click", () => sendMessage(s));
        suggestionsWrap.appendChild(chip);
      });
    }

    async function sendMessage(text) {
      const msg = (text || input.value).trim();
      if (!msg) return;
      addMessage(msg, "user");
      input.value = "";
      showTyping();

      try {
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg }),
        });
        const data = await res.json();
        removeTyping();
        addMessage(data.reply || "Sorry, I couldn't process that.", "bot");
      } catch (e) {
        removeTyping();
        addMessage("I couldn't reach the server. Please check your connection.", "bot");
      }
    }

    toggle.addEventListener("click", () => {
      panel.classList.toggle("open");
      if (panel.classList.contains("open") && body.children.length === 0) {
        addMessage("Hi! I'm Civic Assist 👋 Ask me anything about reporting or tracking civic issues.", "bot");
        renderSuggestions();
        input.focus();
      }
    });
    closeBtn.addEventListener("click", () => panel.classList.remove("open"));
    sendBtn.addEventListener("click", () => sendMessage());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildWidget);
  } else {
    buildWidget();
  }
})();
