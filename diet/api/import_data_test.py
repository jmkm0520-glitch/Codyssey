from unittest.mock import Mock

from api.import_data import import_rows
from api.models.import_data import ImportRequest


def test_import_rows_bulk_upserts_both_tables() -> None:
    client = Mock()
    weights = Mock()
    meals = Mock()
    client.table.side_effect = lambda name: weights if name == "weights" else meals
    request = ImportRequest.model_validate(
        {
            "rows": [
                {
                    "date": "2026-08-12",
                    "weight": 54.2,
                    "meals": [{"meal": "breakfast", "food": "계란", "type": "clean"}],
                }
            ]
        }
    )
    assert import_rows(client, request, "member-1") == {
        "days": 1,
        "weights": 1,
        "meals": 1,
    }
    client.table.assert_any_call("weights")
    client.table.assert_any_call("meals")
    weights.upsert.assert_called_with(
        [{"date": "2026-08-12", "weight": 54.2, "member_id": "member-1"}],
        on_conflict="member_id,date",
    )
