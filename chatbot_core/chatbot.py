from .groq_client import gerar_resposta


class Chatbot:
    def __init__(self, system_prompt=None):
        self.system_prompt = system_prompt or "Você é um assistente útil."
        self.knowledge_base = None

    def set_knowledge_base(self, knowledge_base):
        self.knowledge_base = knowledge_base

    def chat(self, message, knowledge_base=None):
        context = ""
        selected_knowledge_base = knowledge_base or self.knowledge_base
        if selected_knowledge_base is not None:
            context = selected_knowledge_base.get_context(message)

        system_prompt = self.system_prompt
        if context:
            system_prompt = (
                f"{self.system_prompt}\n\n"
                "Use o contexto abaixo para responder. Se a informação não estiver no contexto, diga que não encontrou a resposta no documento.\n\n"
                f"Contexto do documento:\n{context}"
            )

        mensagens = [{"role": "user", "content": message}]
        return gerar_resposta(mensagens, system_prompt=system_prompt)
