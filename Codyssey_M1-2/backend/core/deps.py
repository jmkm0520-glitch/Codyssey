"""라우터가 사용하는 FastAPI 의존성 주입 함수 모음."""

from __future__ import annotations

from fastapi import Depends
from google.cloud.firestore_v1.client import Client

from backend.core.config import Settings, load_settings
from backend.core.firebase import get_firestore_client
from backend.repositories.conversation_repository import ConversationRepository
from backend.repositories.data_repository import DataRepository
from backend.services.ai_client import ChatClient, build_chat_client


def get_db() -> Client:
    return get_firestore_client()


def get_data_repository(db: Client = Depends(get_db)) -> DataRepository:
    return DataRepository(db)


def get_conversation_repository(db: Client = Depends(get_db)) -> ConversationRepository:
    return ConversationRepository(db)


def get_settings() -> Settings:
    return load_settings(require_firebase=False, require_openai=False)


def get_ai_client(settings: Settings = Depends(get_settings)) -> ChatClient:
    return build_chat_client(settings)
