import os
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

class HuggingFaceService:
    def __init__(self):
        self.api_key = os.getenv("HUGGING_FACE_API_KEY")
        if not self.api_key:
            raise ValueError("HUGGING_FACE_API_KEY not found in environment variables.")
        self.client = InferenceClient(token=self.api_key)
        self.model = "google/gemma-2-2b-it"
        self.history = []

    def send_message(self, message: str) -> str:
        self.history.append({"role": "user", "content": message})
        response = self.client.chat_completion(
            model=self.model,
            messages=self.history,
            max_tokens=100,
            temperature=0.7
        )
        assistant_response = response.choices[0].message.content
        self.history.append({"role": "assistant", "content": assistant_response})
        return assistant_response
