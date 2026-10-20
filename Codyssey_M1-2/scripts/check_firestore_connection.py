"""로컬 Firebase 설정으로 Firestore 연결을 확인한다."""

from __future__ import annotations

from google.api_core.exceptions import GoogleAPICallError

from backend.core.config import SettingsError
from backend.core.firebase import FirebaseInitializationError, get_firestore_client


def main() -> int:
    try:
        client = get_firestore_client()
        list(client.collection("data").limit(1).stream(retry=None, timeout=10))
    except (SettingsError, FirebaseInitializationError) as exc:
        print(f"연결 실패: {exc}")
        return 1
    except GoogleAPICallError:
        print("연결 실패: Firestore 요청에 실패했습니다. 네트워크와 서비스 계정 권한을 확인해 주세요.")
        return 1

    print("Firestore 연결에 성공했습니다.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
