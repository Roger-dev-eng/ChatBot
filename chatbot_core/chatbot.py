from .groq_client import gerar_resposta


class Chatbot:
    def __init__(self, system_prompt=None):
        self.system_prompt = system_prompt or "Você é um assistente útil."

    def chat(self, message):
        mensagens = [{"role": "user", "content": message}]
        return gerar_resposta(mensagens, system_prompt=self.system_prompt)
