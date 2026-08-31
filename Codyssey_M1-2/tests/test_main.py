"""FastAPI 기본 앱 검증."""

from fastapi.testclient import TestClient

from backend.main import APP_DESCRIPTION, APP_TITLE, APP_VERSION, app


client = TestClient(app)


def test_health_check() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "message": "서버가 정상적으로 동작 중입니다.",
    }


def test_api_prefix_entrypoint() -> None:
    response = client.get("/api")

    assert response.status_code == 200
    assert response.json()["version"] == APP_VERSION


def test_unknown_path_uses_common_korean_error() -> None:
    response = client.get("/없는-주소")

    assert response.status_code == 404
    assert response.json() == {
        "error": {"code": "HTTP_404", "message": "요청한 주소를 찾을 수 없습니다."}
    }


def test_local_frontend_is_allowed_by_cors() -> None:
    response = client.options(
        "/api",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_swagger_ui_and_openapi_schemas() -> None:
    docs_response = client.get("/docs")
    schema_response = client.get("/openapi.json")
    schema = schema_response.json()

    assert docs_response.status_code == 200
    assert "text/html" in docs_response.headers["content-type"]
    assert schema_response.status_code == 200
    assert schema["info"] == {
        "title": APP_TITLE,
        "description": APP_DESCRIPTION,
        "version": APP_VERSION,
    }
    assert "/health" in schema["paths"]
    assert "/api" in schema["paths"]
    assert "HealthResponse" in schema["components"]["schemas"]
    assert "ApiInfoResponse" in schema["components"]["schemas"]
    assert "ErrorResponse" in schema["components"]["schemas"]
    assert "DataCreate" in schema["components"]["schemas"]
    assert "SummaryResponse" in schema["components"]["schemas"]
    assert "ConversationResponse" in schema["components"]["schemas"]
    assert "ChatRequest" in schema["components"]["schemas"]

    data_schema = schema["components"]["schemas"]["DataCreate"]
    assert data_schema["properties"]["date"]["format"] == "date"
    assert data_schema["properties"]["value"]["minimum"] == 0
    assert data_schema["properties"]["memo"]["maxLength"] == 500

    chat_schema = schema["components"]["schemas"]["ChatRequest"]
    assert chat_schema["properties"]["message"]["minLength"] == 1
    assert chat_schema["properties"]["message"]["maxLength"] == 1000
