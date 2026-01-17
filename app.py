from flask import Flask, request, jsonify
from flask_cors import CORS
from chatbot_core.chatbot import Chatbot
import logging
import os
import time

app = Flask(__name__, static_folder="frontend", static_url_path="")
CORS(app)

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

MAX_MESSAGE_LENGTH = int(os.getenv("MAX_MESSAGE_LENGTH", "1000"))

bot = Chatbot()


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/api/chat", methods=["POST"])
def api_chat():
    start = time.perf_counter()
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()

    if not message:
        return jsonify({"error": "Mensagem vazia."}), 400

    if len(message) > MAX_MESSAGE_LENGTH:
        return jsonify(
            {"error": f"Mensagem muito longa (max {MAX_MESSAGE_LENGTH} caracteres)."}
        ), 400

    try:
        response = bot.chat(message)
    except Exception:
        logging.exception("Erro ao chamar o LLM")
        duration_ms = int((time.perf_counter() - start) * 1000)
        logging.info("chat status=error duration_ms=%s length=%s", duration_ms, len(message))
        return jsonify({"error": "Falha ao gerar resposta."}), 502

    duration_ms = int((time.perf_counter() - start) * 1000)
    logging.info("chat status=ok duration_ms=%s length=%s", duration_ms, len(message))
    return jsonify({"response": response})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
