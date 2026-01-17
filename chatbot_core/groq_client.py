import os
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


class GroqClientError(Exception):
    pass


def gerar_resposta(
    mensagens,
    temperature=0.7,
    max_tokens=300,
    system_prompt="Você é um assistente útil.",
    timeout=20,
    retries=2,
):
    last_error = None
    for attempt in range(retries + 1):
        try:
            resposta = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "system", "content": system_prompt}] + mensagens,
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=timeout,
            )
            return resposta.choices[0].message.content
        except Exception as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(0.5 * (attempt + 1))
                continue
            raise GroqClientError("Falha ao chamar Groq") from exc

    raise GroqClientError("Falha ao chamar Groq") from last_error
