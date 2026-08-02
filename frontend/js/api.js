/* ============================================================
   Shared frontend helpers: API calls, auth/session, toast
   ============================================================ */

const API_BASE = "/api";

const Auth = {
  saveSession(token, user) {
    localStorage.setItem("civic_token", token);
    localStorage.setItem("civic_user", JSON.stringify(user));
  },
  getToken() {
    return localStorage.getItem("civic_token");
  },
  getUser() {
    const raw = localStorage.getItem("civic_user");
    return raw ? JSON.parse(raw) : null;
  },
  clear() {
    localStorage.removeItem("civic_token");
    localStorage.removeItem("civic_user");
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  isAdmin() {
    const u = this.getUser();
    return u && u.role === "admin";
  },
  logout(redirect = "index.html") {
    this.clear();
    window.location.href = redirect;
  },
  // Redirects away if the required role isn't present
  requireRole(role, loginPage) {
    const u = this.getUser();
    if (!this.isLoggedIn() || !u || u.role !== role) {
      window.location.href = loginPage;
    }
  },
};

async function apiRequest(path, { method = "GET", body, isForm = false, auth = true } = {}) {
  const headers = {};
  if (auth && Auth.getToken()) headers["Authorization"] = `Bearer ${Auth.getToken()}`;
  if (!isForm && body) headers["Content-Type"] = "application/json";

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    /* no body */
  }

  if (!res.ok) {
    const err = new Error(data.message || "Something went wrong.");
    err.status = res.status;
    throw err;
  }
  return data;
}

function showToast(message, type = "") {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = "";
  if (type) el.classList.add(type);
  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3200);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function statusBadge(status) {
  const map = {
    Reported: "badge-reported",
    "In Progress": "badge-inprogress",
    Resolved: "badge-resolved",
  };
  const cls = map[status] || "badge-reported";
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${status}</span>`;
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
