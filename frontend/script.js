const AUTH_API_URL = `http://${window.location.hostname}:8080/api/auth`;
const TOKEN_KEY = "chatbot_access_token";
const authView = document.getElementById("authView");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const authMessage = document.getElementById("authMessage");
const logoutBtn = document.getElementById("logoutBtn");
const input = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const fileInput = document.getElementById("fileInput");
const messagesDiv = document.getElementById("messages");
let conversationId = 0;

function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
}

function authenticatedHeaders(headers = {}) {
    const token = getToken();
    return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

function setAuthenticated(isAuthenticated) {
    authView.classList.toggle("hidden", isAuthenticated);
    document.querySelector(".chat-container").classList.toggle("hidden", !isAuthenticated);
}

function showAuthMessage(message, isError = true) {
    authMessage.textContent = message;
    authMessage.classList.toggle("error", isError);
    authMessage.classList.toggle("success", !isError);
}

async function parseResponse(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || "Não foi possível concluir a operação.");
    }
    return data;
}

async function login(event) {
    event.preventDefault();
    showAuthMessage("Entrando...", false);

    try {
        const response = await fetch(`${AUTH_API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: document.getElementById("loginEmail").value,
                password: document.getElementById("loginPassword").value
            })
        });
        const data = await parseResponse(response);
        sessionStorage.setItem(TOKEN_KEY, data.accessToken);
        setAuthenticated(true);
        addSystemMessage("Login realizado. Pode começar a conversar.");
        input.focus();
    } catch (error) {
        showAuthMessage(error.message);
    }
}

async function register(event) {
    event.preventDefault();
    showAuthMessage("Cadastrando...", false);

    try {
        const response = await fetch(`${AUTH_API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: document.getElementById("registerEmail").value,
                password: document.getElementById("registerPassword").value
            })
        });
        await parseResponse(response);
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        showRegisterBtn.classList.remove("hidden");
        showAuthMessage("Cadastro realizado. Agora faça login.", false);
        document.getElementById("loginEmail").value = document.getElementById("registerEmail").value;
    } catch (error) {
        showAuthMessage(error.message);
    }
}

function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthenticated(false);
    messagesDiv.innerHTML = "";
    showAuthMessage("Você saiu da conta.", false);
}

function addMessage(text, sender) {
    const div = document.createElement("div");
    div.classList.add("msg", sender);
    div.textContent = text;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function setLoading(isLoading) {
    sendBtn.disabled = isLoading;
    input.disabled = isLoading;
    if (isLoading) {
        sendBtn.textContent = "Enviando...";
    } else {
        sendBtn.textContent = "Enviar";
    }
}

function addSystemMessage(text) {
    addMessage(text, "system");
}

function resetConversation() {
    conversationId += 1;
    messagesDiv.innerHTML = "";
    input.value = "";
    addSystemMessage("Nova conversa iniciada. Pode começar a digitar.");
    input.focus();
    setLoading(false);
}

async function uploadDocument() {
    const file = fileInput.files[0];
    if (!file) {
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("/api/upload", {
            method: "POST",
            headers: authenticatedHeaders(),
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            addSystemMessage(data.error || "Falha ao enviar o arquivo.");
        } else {
            addSystemMessage(`Documento carregado: ${data.filename}. Agora você pode perguntar sobre ele.`);
        }
    } catch (error) {
        addSystemMessage("Erro ao enviar o arquivo. Tente novamente.");
    } finally {
        fileInput.value = "";
    }
}

async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    const currentConversationId = conversationId;
    addMessage(msg, "user");
    input.value = "";
    setLoading(true);

    let response;
    try {
        response = await fetch("/api/chat", {
            method: "POST",
            headers: authenticatedHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ message: msg })
        });
    } catch (error) {
        if (currentConversationId !== conversationId) return;
        setLoading(false);
        addSystemMessage("Erro de rede. Tente novamente.");
        return;
    }

    let data;
    try {
        data = await response.json();
    } catch (error) {
        if (currentConversationId !== conversationId) return;
        setLoading(false);
        addSystemMessage("Resposta invalida do servidor.");
        return;
    }

    if (currentConversationId !== conversationId) return;

    if (!response.ok) {
        setLoading(false);
        addSystemMessage(data.error || "Falha ao gerar resposta.");
        return;
    }

    addMessage(data.response, "bot");
    setLoading(false);
}

sendBtn.addEventListener("click", sendMessage);
clearBtn.addEventListener("click", resetConversation);
fileInput.addEventListener("change", uploadDocument);
loginForm.addEventListener("submit", login);
registerForm.addEventListener("submit", register);
showRegisterBtn.addEventListener("click", () => {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    showRegisterBtn.classList.add("hidden");
    showAuthMessage("");
});
logoutBtn.addEventListener("click", logout);

input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

setAuthenticated(Boolean(getToken()));
