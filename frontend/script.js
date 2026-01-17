const input = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const messagesDiv = document.getElementById("messages");

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

async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    addMessage(msg, "user");
    input.value = "";
    setLoading(true);

    let response;
    try {
        response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: msg })
        });
    } catch (error) {
        setLoading(false);
        addSystemMessage("Erro de rede. Tente novamente.");
        return;
    }

    let data;
    try {
        data = await response.json();
    } catch (error) {
        setLoading(false);
        addSystemMessage("Resposta invalida do servidor.");
        return;
    }

    if (!response.ok) {
        setLoading(false);
        addSystemMessage(data.error || "Falha ao gerar resposta.");
        return;
    }

    addMessage(data.response, "bot");
    setLoading(false);
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});
