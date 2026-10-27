
"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const STORAGE_AGENTS = "agentflow_agents_v1";
const STORAGE_TASKS = "agentflow_tasks_v1";
const STORAGE_HISTORY = "agentflow_history_v1";
const STORAGE_NAME = "agentflow_name_v1";

let agents = loadData(STORAGE_AGENTS, []);
let tasks = loadData(STORAGE_TASKS, []);
let historyItems = loadData(STORAGE_HISTORY, []);
let toastTimeout;

const pageNames = {
  inicio: "Visão geral",
  agentes: "Meus agentes",
  tarefas: "Tarefas",
  conversas: "Conversas",
  historico: "Histórico",
  configuracoes: "Configurações"
};

function loadData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;

    const parsed = JSON.parse(value);
    return Array.isArray(fallback) && Array.isArray(parsed)
      ? parsed
      : (Array.isArray(fallback) ? fallback : parsed);
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    showToast("Não foi possível guardar os dados neste navegador.");
    return false;
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function addHistory(event, detail) {
  historyItems.unshift({
    id: Date.now(),
    event,
    detail,
    date: new Date().toLocaleString("pt-BR")
  });

  historyItems = historyItems.slice(0, 50);
  saveData(STORAGE_HISTORY, historyItems);
  renderHistory();
}

function navigate(page) {
  if (!pageNames[page]) return;

  $$(".page").forEach((section) => {
    section.classList.toggle("active", section.id === `page-${page}`);
  });

  $$(".nav-link").forEach((button) => {
    const active = button.dataset.page === page;
    button.classList.toggle("active", active);

    if (active) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  $("#breadcrumbPage").textContent = pageNames[page];
  $("#sidebar").classList.remove("open");
  $("#menuButton").setAttribute("aria-expanded", "false");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$("[data-page]").forEach((button) => {
  button.addEventListener("click", () => {
    navigate(button.dataset.page);
  });
});

$$("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    navigate(button.dataset.go);
  });
});

$("#menuButton").addEventListener("click", () => {
  const sidebar = $("#sidebar");
  const isOpen = sidebar.classList.toggle("open");
  $("#menuButton").setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("click", (event) => {
  const sidebar = $("#sidebar");
  const menuButton = $("#menuButton");

  if (
    window.innerWidth <= 800 &&
    sidebar.classList.contains("open") &&
    !sidebar.contains(event.target) &&
    !menuButton.contains(event.target)
  ) {
    sidebar.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }
});

$("#dismissNotice").addEventListener("click", () => {
  $(".notice").hidden = true;
});

$("#helpButton").addEventListener("click", () => {
  showToast("Este painel é uma demonstração local. As integrações serão configuradas nas próximas etapas.");
});

$("#exploreButton").addEventListener("click", () => {
  navigate("agentes");
});

// Modal de cadastro de agentes

const modal = $("#agentModal");
const agentForm = $("#agentForm");

function openModal() {
  agentForm.reset();
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  $("#agentName").focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
}

$("#newAgentButton").addEventListener("click", openModal);
$$('[data-go="agentes"]').forEach(() => {});

document.querySelectorAll('[data-go="agentes"]').forEach((button) => {
  // A navegação é controlada pelo listener geral acima.
});

$$(".primary-button").forEach((button) => {
  if (button.textContent.includes("Novo agente")) {
    button.addEventListener("click", openModal);
  }
});

$("#closeModal").addEventListener("click", closeModal);
$("#cancelModal").addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});

const agentIcons = {
  "Assistente geral": "✳",
  "Pesquisa e análise": "⌕",
  "Organização de tarefas": "◷",
  "Atendimento": "◉",
  "Programação": "</>"
};

const iconClasses = [
  "",
  "blue-symbol",
  "green-symbol",
  "orange-symbol"
];

function createAgentCard(agent) {
  const icon = agentIcons[agent.role] || "✳";
  const iconClass = iconClasses[
    Math.abs(Number(agent.id) % iconClasses.length)
  ];

  return `
    <article class="agent-card">
      <div class="agent-card-top">
        <div class="agent-symbol ${iconClass}">${escapeHTML(icon)}</div>
        <span class="pill">Cadastro local</span>
      </div>
      <h3>${escapeHTML(agent.name)}</h3>
      <p>${escapeHTML(agent.description || agent.role)}</p>
      <div class="agent-card-bottom">
        <small>${escapeHTML(agent.role)}</small>
        <button class="small-action" data-agent-info="${escapeHTML(agent.id)}">
          Detalhes →
        </button>
      </div>
    </article>
  `;
}

function renderAgentList(target, list) {
  const container = $(target);

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✳</div>
        <h2>Nenhum agente cadastrado</h2>
        <p>Crie seu primeiro agente para começar a organizar sua plataforma.</p>
        <button class="secondary-button" data-create-agent>
          ＋ Criar primeiro agente
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(createAgentCard).join("");
}

function renderAgents() {
  $("#agentCount").textContent = agents.length;

  renderAgentList("#homeAgents", agents.slice(0, 3));

  const query = $("#agentSearch").value.trim().toLowerCase();
  const filtered = agents.filter((agent) =>
    `${agent.name} ${agent.role} ${agent.description}`
      .toLowerCase()
      .includes(query)
  );

  renderAgentList("#allAgents", filtered);
}

$("#agentSearch").addEventListener("input", renderAgents);

document.addEventListener("click", (event) => {
  const createButton = event.target.closest("[data-create-agent]");

  if (createButton) {
    openModal();
    return;
  }

  const detailButton = event.target.closest("[data-agent-info]");

  if (detailButton) {
    const agent = agents.find(
      (item) => String(item.id) === detailButton.dataset.agentInfo
    );

    if (agent) {
      showToast(`${agent.name} — ${agent.role}. Ainda não conectado à IA.`);
    }
  }
});

agentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = $("#agentName").value.trim();
  const role = $("#agentRole").value;
  const description = $("#agentDescription").value.trim();

  if (!name) {
    showToast("Digite o nome do agente.");
    return;
  }

  if (agents.some((agent) =>
    agent.name.toLowerCase() === name.toLowerCase()
  )) {
    showToast("Já existe um agente com esse nome.");
    return;
  }

  const agent = {
    id: Date.now(),
    name,
    role,
    description,
    createdAt: new Date().toISOString()
  };

  agents.unshift(agent);

  if (!saveData(STORAGE_AGENTS, agents)) {
    agents.shift();
    return;
  }

  addHistory("Agente cadastrado", name);
  renderAgents();
  closeModal();
  navigate("agentes");
  showToast("Agente cadastrado neste navegador!");
});

// Tarefas demonstrativas

function renderTaskRow(task) {
  return `
    <div class="table-row">
      <span>${escapeHTML(task.title)}</span>
      <span><span class="pill pending">Não executada</span></span>
      <span>${escapeHTML(task.type)}</span>
    </div>
  `;
}

function renderTasks() {
  $("#taskCount").textContent = tasks.length;

  $("#homeTasks").innerHTML = tasks.length
    ? tasks.slice(0, 4).map(renderTaskRow).join("")
    : `<div class="row-empty">Nenhuma tarefa cadastrada.</div>`;

  $("#allTasks").innerHTML = tasks.length
    ? tasks.map((task) => `
      <article class="task-card">
        <div class="task-check">◷</div>
        <div class="task-info">
          <strong>${escapeHTML(task.title)}</strong>
          <p>${escapeHTML(task.description || task.type)}</p>
        </div>
        <span class="pill pending">Pendente</span>
      </article>
    `).join("")
    : `
      <div class="empty-state">
        <div class="empty-icon">◷</div>
        <h2>Nenhuma tarefa cadastrada</h2>
        <p>Adicione uma tarefa para organizar suas próximas automações.</p>
      </div>
    `;
}

$("#newTaskButton").addEventListener("click", () => {
  const title = window.prompt("Qual é o nome da tarefa?");
  if (title === null) return;

  const cleanTitle = title.trim();

  if (!cleanTitle) {
    showToast("Digite um nome para a tarefa.");
    return;
  }

  const task = {
    id: Date.now(),
    title: cleanTitle,
    type: "Manual",
    description: "Tarefa cadastrada localmente."
  };

  tasks.unshift(task);

  if (!saveData(STORAGE_TASKS, tasks)) {
    tasks.shift();
    return;
  }

  addHistory("Tarefa cadastrada", cleanTitle);
  renderTasks();
  showToast("Tarefa adicionada. Ainda não foi executada.");
});

// Histórico local

function renderHistory() {
  const container = $("#historyList");

  container.innerHTML = historyItems.length
    ? historyItems.map((item) => `
      <div class="table-row">
        <span>${escapeHTML(item.event)}</span>
        <span><span class="pill">Registrado</span></span>
        <span>${escapeHTML(item.detail)}</span>
      </div>
    `).join("")
    : `<div class="row-empty">Nenhum evento registrado ainda.</div>`;
}

// Nome da plataforma

function loadPlatformName() {
  let name = "AgentFlow";

  try {
    name = localStorage.getItem(STORAGE_NAME) || name;
  } catch {}

  $("#platformName").value = name;
  document.title = `${name} — Painel de IA`;
  $(".brand > span:last-child").innerHTML =
    `${escapeHTML(name)}`;
}

$("#saveSettings").addEventListener("click", () => {
  const name = $("#platformName").value.trim();

  if (!name) {
    showToast("Digite um nome para a plataforma.");
    return;
  }

  try {
    localStorage.setItem(STORAGE_NAME, name);
  } catch {
    showToast("Não foi possível guardar o nome.");
    return;
  }

  loadPlatformName();
  addHistory("Configuração alterada", `Nome: ${name}`);
  showToast("Nome atualizado neste navegador.");
});

// Inicialização

renderAgents();
renderTasks();
renderHistory();
loadPlatformName();
navigate("inicio");
