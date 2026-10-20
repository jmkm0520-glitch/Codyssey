"""Firebase Admin SDK 초기화와 Firestore 클라이언트 생성."""

from __future__ import annotations

import json

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.client import Client

from backend.core.config import Settings, SettingsError, load_settings


class FirebaseInitializationError(RuntimeError):
    """Firebase 연결을 안전한 한국어 메시지로 전달한다."""


def _build_credential(settings: Settings) -> credentials.Certificate:
    if settings.firebase_service_account_path:
        return credentials.Certificate(str(settings.firebase_service_account_path))

    try:
        account_info = json.loads(settings.firebase_service_account_json or "")
    except json.JSONDecodeError as exc:
        raise FirebaseInitializationError(
            "Firebase 서비스 계정 JSON 형식이 올바르지 않습니다."
        ) from exc

    return credentials.Certificate(account_info)


def get_firestore_client(settings: Settings | None = None) -> Client:
    """Firebase 앱을 한 번만 초기화하고 Firestore 클라이언트를 반환한다."""

    try:
        current_settings = settings or load_settings(require_firebase=True)

        try:
            app = firebase_admin.get_app()
        except ValueError:
            app = firebase_admin.initialize_app(_build_credential(current_settings))

        return firestore.client(app=app)
    except SettingsError:
        raise
    except FirebaseInitializationError:
        raise
    except (ValueError, OSError) as exc:
        raise FirebaseInitializationError(
            "Firebase 서비스 계정 파일을 읽거나 인증 정보를 해석하지 못했습니다."
        ) from exc
    except Exception as exc:
        raise FirebaseInitializationError(
            "Firebase 초기화에 실패했습니다. 서비스 계정과 네트워크 상태를 확인해 주세요."
        ) from exc
