import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables.")
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-flash-lite-latest')
        self.chat = self.model.start_chat(history=[])

    def send_message(self, message: str) -> str:
        response = self.chat.send_message(message)
        return response.text

    def list_models(self):
        print("Available Gemini Models:")
        for m in genai.list_models():
            print(f"- {m.name} (Supports generateContent: {'generateContent' in m.supported_generation_methods})")
