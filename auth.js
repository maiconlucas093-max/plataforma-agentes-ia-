
"use strict";

const SUPABASE_URL = "https://getgbizkrmvyixwgdepj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_7JMYk-VUHyLoXVwLF1Lp8A_ZHr6P0zp";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
window.agentFlowSupabase = supabaseClient;

const authScreen = document.getElementById("authScreen");
const app = document.querySelector(".app");
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authDescription = document.getElementById("authDescription");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmit = document.getElementById("authSubmit");
const authMessage = document.getElementById("authMessage");
const authToggle = document.getElementById("authToggle");

let isSignUp = false;
let authReady = false;

function showMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.style.color = isError ? "#dc2626" : "";
}

function showAuthScreen() {
  authScreen.hidden = false;
  authScreen.style.display = "";
  app.hidden = true;
  app.style.display = "none";
}

function showApp(user) {
  authScreen.hidden = true;
  authScreen.style.display = "none";
  app.hidden = false;
  app.style.display = "";

  const profile = document.querySelector(".profile");

  if (profile) {
    let name = profile.querySelector(".profile-info strong");
    let email = profile.querySelector(".profile-info small");
    let avatar = profile.querySelector(".avatar");
    let logout = document.getElementById("authLogout");

    if (name) name.textContent = "Minha conta";
    if (email) email.textContent = user.email || "Usuário autenticado";
    if (avatar) {
      avatar.textContent = (user.email || "U").charAt(0).toUpperCase();
    }

    if (!logout) {
      logout = document.createElement("button");
      logout.id = "authLogout";
      logout.type = "button";
      logout.className = "text-button";
      logout.textContent = "Sair";
      logout.style.marginTop = "8px";
      logout.addEventListener("click", async () => {
        logout.disabled = true;
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
          showToast("Não foi possível sair da conta.");
          logout.disabled = false;
        }
      });

      if (email) {
        email.insertAdjacentElement("afterend", logout);
      } else {
        profile.appendChild(logout);
      }
    }
  }
}

function setAuthMode(signUp) {
  isSignUp = signUp;
  authTitle.textContent = signUp ? "Criar sua conta" : "Bem-vindo de volta";
  authDescription.textContent = signUp
    ? "Cadastre-se para acessar seu espaço no AgentFlow."
    : "Entre na sua conta para acessar seus agentes.";
  authSubmit.textContent = signUp ? "Criar conta" : "Entrar";
  authToggle.textContent = signUp ? "Entrar na minha conta" : "Criar conta";
  authPassword.autocomplete = signUp ? "new-password" : "current-password";
  showMessage("");
}

authToggle.addEventListener("click", () => {
  setAuthMode(!isSignUp);
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!authReady) {
    showMessage("Aguarde a conexão ser inicializada.", true);
    return;
  }

  const email = authEmail.value.trim();
  const password = authPassword.value;

  authSubmit.disabled = true;
  showMessage(isSignUp ? "Criando sua conta..." : "Verificando acesso...");

  try {
    if (isSignUp) {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      if (data.session) {
        showMessage("Conta criada com sucesso!");
      } else {
        showMessage(
          "Cadastro enviado! Confira seu e-mail para confirmar a conta antes de entrar."
        );
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      showMessage("Login realizado!");
    }
  } catch (error) {
    showMessage(error.message || "Ocorreu um erro de autenticação.", true);
  } finally {
    authSubmit.disabled = false;
  }
});

showAuthScreen();

supabaseClient.auth.onAuthStateChange((event, session) => {
  
if (session?.user) {
  showApp(session.user);

  if (typeof loadRemoteData === "function") {
    loadRemoteData();
  }
}
  
  else if (authReady) {
    showAuthScreen();
  }
});

(async () => {
  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) throw error;

    authReady = true;

    if (data.session?.user) {
      showApp(data.session.user);
    } else {
      showAuthScreen();
    }
  } catch (error) {
    authReady = false;
    showAuthScreen();
    showMessage(
      "Não foi possível conectar ao serviço de login. Verifique a configuração e recarregue a página.",
      true
    );
    console.error("Erro ao iniciar autenticação:", error);
  }
})();
                          
