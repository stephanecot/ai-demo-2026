"""`/api/missions` — one file per router (`python-do.md`).

Written before the endpoints, from the acceptance scenarios of
`specs/002-mission-management/spec.md`. Each test names the rule it pins; remove the rule
and the test fails.
"""

from fastapi.testclient import TestClient

from app.models.user import User

VALID_PAYLOAD = {
    "label": "Migration Cloud",
    "client": "Initech",
    "startDate": "2026-01-01",
    "endDate": None,
    "description": "Migration de l'infrastructure.",
}


def _create(api: TestClient, **overrides: object):
    """`api`, not `client`: "client" is also a payload key, and a collision here would
    make `_create(api, client="ACME")` a TypeError instead of a request."""
    return api.post("/api/missions", json={**VALID_PAYLOAD, **overrides})


# --- User Story 1 — create and maintain the catalogue ---------------------------------


def test_create_mission_as_manager_returns_201_and_the_mission(manager_client: TestClient) -> None:
    response = _create(manager_client)

    assert response.status_code == 201
    body = response.json()
    assert body["label"] == "Migration Cloud"
    assert body["client"] == "Initech"
    assert body["startDate"] == "2026-01-01"
    assert body["status"] == "ACTIVE"
    assert body["assignees"] == []
    assert isinstance(body["id"], int)


def test_create_mission_then_list_contains_it(manager_client: TestClient) -> None:
    _create(manager_client)

    labels = [mission["label"] for mission in manager_client.get("/api/missions").json()]

    assert "Migration Cloud" in labels


def test_create_mission_without_end_date_is_accepted_and_runs_indefinitely(
    manager_client: TestClient,
) -> None:
    response = _create(manager_client, endDate=None)

    assert response.status_code == 201
    assert response.json()["endDate"] is None


def test_update_mission_changes_are_persisted(manager_client: TestClient) -> None:
    mission_id = _create(manager_client).json()["id"]

    response = manager_client.put(
        f"/api/missions/{mission_id}",
        json={**VALID_PAYLOAD, "description": "Périmètre étendu.", "endDate": "2026-12-31"},
    )

    assert response.status_code == 200
    reread = manager_client.get(f"/api/missions/{mission_id}").json()
    assert reread["description"] == "Périmètre étendu."
    assert reread["endDate"] == "2026-12-31"


def test_create_mission_with_a_label_already_used_by_the_client_returns_409(
    manager_client: TestClient,
) -> None:
    _create(manager_client)

    response = _create(manager_client)

    assert response.status_code == 409
    assert "existe déjà" in response.json()["detail"]


def test_create_mission_with_the_same_label_for_another_client_is_accepted(
    manager_client: TestClient,
) -> None:
    _create(manager_client)

    response = _create(manager_client, client="ACME")

    assert response.status_code == 201


def test_create_mission_duplicate_ignores_case_and_surrounding_spaces(
    manager_client: TestClient,
) -> None:
    """FR-004: uniqueness is case-insensitive and trimmed, or the demo can create twins."""
    _create(manager_client)

    response = _create(manager_client, label="  migration cloud  ")

    assert response.status_code == 409


def test_create_mission_with_an_end_date_before_the_start_date_returns_409(
    manager_client: TestClient,
) -> None:
    response = _create(manager_client, startDate="2026-06-01", endDate="2026-05-31")

    assert response.status_code == 409
    assert response.json()["detail"] == "La date de fin ne peut pas précéder la date de début."


def test_create_mission_with_a_blank_label_returns_422(manager_client: TestClient) -> None:
    response = _create(manager_client, label="   ")

    assert response.status_code == 422
    assert "libellé" in response.json()["detail"]


def test_create_mission_with_a_missing_client_returns_422(manager_client: TestClient) -> None:
    payload = {key: value for key, value in VALID_PAYLOAD.items() if key != "client"}

    response = manager_client.post("/api/missions", json=payload)

    assert response.status_code == 422
    assert "client" in response.json()["detail"]


def test_get_unknown_mission_returns_404(manager_client: TestClient) -> None:
    response = manager_client.get("/api/missions/4242")

    assert response.status_code == 404
    assert response.json()["detail"] == "Mission introuvable."


# --- Role and identity guards (FR-022 to FR-025, SC-004) ------------------------------


def test_create_mission_as_consultant_returns_403(consultant_client: TestClient) -> None:
    """The guard is server-side: hiding the button in the UI is not an access control."""
    response = _create(consultant_client)

    assert response.status_code == 403
    assert response.json()["detail"] == "Action réservée aux managers."


def test_get_a_mission_the_consultant_is_not_assigned_to_returns_404(
    manager_client: TestClient, consultant_client: TestClient, other_consultant: User
) -> None:
    """A 403 would confirm the mission exists; 404 leaks nothing (FR-025, corrected
    contract note of 2026-08-28)."""
    mission_id = _create(manager_client).json()["id"]
    manager_client.post(
        f"/api/missions/{mission_id}/affectations", json={"userIds": [other_consultant.id]}
    )

    response = consultant_client.get(f"/api/missions/{mission_id}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Mission introuvable."


def test_get_a_mission_the_consultant_is_assigned_to_returns_200(
    manager_client: TestClient, consultant_client: TestClient, consultant: User
) -> None:
    """The scoping must not over-apply: a consultant still reads their own mission."""
    mission_id = _create(manager_client).json()["id"]
    manager_client.post(
        f"/api/missions/{mission_id}/affectations", json={"userIds": [consultant.id]}
    )

    response = consultant_client.get(f"/api/missions/{mission_id}")

    assert response.status_code == 200
    assert response.json()["id"] == mission_id


def test_update_mission_as_consultant_returns_403(
    manager_client: TestClient, consultant_client: TestClient
) -> None:
    mission_id = _create(manager_client).json()["id"]

    response = consultant_client.put(f"/api/missions/{mission_id}", json=VALID_PAYLOAD)

    assert response.status_code == 403


def test_list_missions_without_the_demo_header_returns_401(client: TestClient) -> None:
    response = client.get("/api/missions")

    assert response.status_code == 401
    assert response.json()["detail"] == "Profil de démonstration inconnu."


def test_list_missions_with_an_unknown_demo_user_returns_401(client: TestClient) -> None:
    response = client.get("/api/missions", headers={"X-Demo-User": "4242"})

    assert response.status_code == 401


def test_list_users_is_public_so_the_profile_picker_works_before_login(
    client: TestClient, demo_users: dict[str, User]
) -> None:
    response = client.get("/api/users")

    assert response.status_code == 200
    assert len(response.json()) == len(demo_users)


# --- User Story 2 — assign consultants to a mission ------------------------------------


def test_assign_a_consultant_lists_them_among_the_assignees(
    manager_client: TestClient, consultant: User
) -> None:
    mission_id = _create(manager_client).json()["id"]

    response = manager_client.post(
        f"/api/missions/{mission_id}/affectations", json={"userIds": [consultant.id]}
    )

    assert response.status_code == 200
    assignee_ids = [assignee["id"] for assignee in response.json()["assignees"]]
    assert assignee_ids == [consultant.id]


def test_assign_several_consultants_in_one_action_lists_all_of_them(
    manager_client: TestClient, consultant: User, other_consultant: User
) -> None:
    mission_id = _create(manager_client).json()["id"]

    response = manager_client.post(
        f"/api/missions/{mission_id}/affectations",
        json={"userIds": [consultant.id, other_consultant.id]},
    )

    assert response.status_code == 200
    assignee_ids = {assignee["id"] for assignee in response.json()["assignees"]}
    assert assignee_ids == {consultant.id, other_consultant.id}


def test_assign_an_already_assigned_consultant_again_returns_200_without_a_duplicate(
    manager_client: TestClient, consultant: User
) -> None:
    mission_id = _create(manager_client).json()["id"]
    manager_client.post(
        f"/api/missions/{mission_id}/affectations", json={"userIds": [consultant.id]}
    )

    response = manager_client.post(
        f"/api/missions/{mission_id}/affectations", json={"userIds": [consultant.id]}
    )

    assert response.status_code == 200
    assert [assignee["id"] for assignee in response.json()["assignees"]] == [consultant.id]


def test_detach_an_assigned_consultant_removes_them_from_the_assignees(
    manager_client: TestClient, consultant: User
) -> None:
    mission_id = _create(manager_client).json()["id"]
    manager_client.post(
        f"/api/missions/{mission_id}/affectations", json={"userIds": [consultant.id]}
    )

    response = manager_client.delete(f"/api/missions/{mission_id}/affectations/{consultant.id}")

    assert response.status_code == 204
    reread = manager_client.get(f"/api/missions/{mission_id}").json()
    assert reread["assignees"] == []


def test_detach_a_consultant_never_assigned_returns_204(
    manager_client: TestClient, consultant: User
) -> None:
    """FR-009/D-10: detachment is idempotent, whether or not the assignment existed."""
    mission_id = _create(manager_client).json()["id"]

    response = manager_client.delete(f"/api/missions/{mission_id}/affectations/{consultant.id}")

    assert response.status_code == 204


def test_assign_an_unknown_user_returns_404(manager_client: TestClient) -> None:
    mission_id = _create(manager_client).json()["id"]

    response = manager_client.post(
        f"/api/missions/{mission_id}/affectations", json={"userIds": [4242]}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Utilisateur introuvable."


def test_assign_a_manager_to_a_mission_returns_409(
    manager_client: TestClient, manager: User
) -> None:
    mission_id = _create(manager_client).json()["id"]

    response = manager_client.post(
        f"/api/missions/{mission_id}/affectations", json={"userIds": [manager.id]}
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Seul un consultant peut être affecté à une mission."


def test_assign_consultant_on_an_unknown_mission_returns_404(
    manager_client: TestClient, consultant: User
) -> None:
    response = manager_client.post(
        "/api/missions/4242/affectations", json={"userIds": [consultant.id]}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Mission introuvable."


def test_assign_consultant_as_consultant_returns_403(
    manager_client: TestClient, consultant_client: TestClient, consultant: User
) -> None:
    mission_id = _create(manager_client).json()["id"]

    response = consultant_client.post(
        f"/api/missions/{mission_id}/affectations", json={"userIds": [consultant.id]}
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Action réservée aux managers."


def test_detach_consultant_as_consultant_returns_403(
    manager_client: TestClient, consultant_client: TestClient, consultant: User
) -> None:
    mission_id = _create(manager_client).json()["id"]

    response = consultant_client.delete(f"/api/missions/{mission_id}/affectations/{consultant.id}")

    assert response.status_code == 403


# --- User Story 3 — a consultant only sees the missions they may charge to ------------


# Seed missions (see `app/db/seed.py`) all run from 2025 onward, so every "clean slate"
# scenario below uses 2020 dates: it exercises the rule without depending on, or
# colliding with, the demo dataset that `consultant`/`other_consultant` already carry.


def test_list_available_missions_returns_only_the_running_assigned_mission(
    manager_client: TestClient, consultant_client: TestClient, consultant: User
) -> None:
    running_id = _create(manager_client, startDate="2020-01-01", endDate="2020-12-31").json()["id"]
    not_started_id = _create(
        manager_client, label="Future", startDate="2021-01-01", endDate=None
    ).json()["id"]
    closed_id = _create(
        manager_client, label="Old", startDate="2019-01-01", endDate="2019-12-31"
    ).json()["id"]
    for mission_id in (running_id, not_started_id, closed_id):
        manager_client.post(
            f"/api/missions/{mission_id}/affectations", json={"userIds": [consultant.id]}
        )
    manager_client.post(f"/api/missions/{closed_id}/cloture")

    response = consultant_client.get("/api/missions/disponibles", params={"date": "2020-06-15"})

    assert response.status_code == 200
    assert [mission["id"] for mission in response.json()] == [running_id]


def test_list_available_missions_excludes_a_mission_not_started_yet(
    manager_client: TestClient, consultant_client: TestClient, consultant: User
) -> None:
    mission_id = _create(manager_client, startDate="2021-01-01", endDate=None).json()["id"]
    manager_client.post(
        f"/api/missions/{mission_id}/affectations", json={"userIds": [consultant.id]}
    )

    response = consultant_client.get("/api/missions/disponibles", params={"date": "2020-06-15"})

    assert response.json() == []


def test_list_available_missions_excludes_a_mission_already_ended(
    manager_client: TestClient, consultant_client: TestClient, consultant: User
) -> None:
    mission_id = _create(manager_client, startDate="2019-01-01", endDate="2019-12-31").json()["id"]
    manager_client.post(
        f"/api/missions/{mission_id}/affectations", json={"userIds": [consultant.id]}
    )

    response = consultant_client.get("/api/missions/disponibles", params={"date": "2020-06-15"})

    assert response.json() == []


def test_list_available_missions_includes_an_open_ended_mission_already_started(
    manager_client: TestClient, consultant_client: TestClient, consultant: User
) -> None:
    mission_id = _create(manager_client, startDate="2019-01-01", endDate=None).json()["id"]
    manager_client.post(
        f"/api/missions/{mission_id}/affectations", json={"userIds": [consultant.id]}
    )

    response = consultant_client.get("/api/missions/disponibles", params={"date": "2020-06-15"})

    assert [mission["id"] for mission in response.json()] == [mission_id]


def test_list_available_missions_excludes_a_mission_the_consultant_is_not_assigned_to(
    manager_client: TestClient, consultant_client: TestClient
) -> None:
    _create(manager_client, startDate="2020-01-01", endDate="2020-12-31")

    response = consultant_client.get("/api/missions/disponibles", params={"date": "2020-06-15"})

    assert response.json() == []


def test_list_available_missions_with_no_assignment_at_all_returns_an_empty_list(
    consultant_client: TestClient,
) -> None:
    response = consultant_client.get("/api/missions/disponibles", params={"date": "2020-06-15"})

    assert response.status_code == 200
    assert response.json() == []


def test_list_available_missions_without_a_date_returns_422(consultant_client: TestClient) -> None:
    response = consultant_client.get("/api/missions/disponibles")

    assert response.status_code == 422


def test_list_missions_as_consultant_shows_only_their_own_missions(
    manager_client: TestClient,
    consultant_client: TestClient,
    consultant: User,
    other_consultant: User,
) -> None:
    own_id = _create(manager_client, label="Mienne").json()["id"]
    other_id = _create(manager_client, label="Pas la mienne", client="Globex").json()["id"]
    manager_client.post(f"/api/missions/{own_id}/affectations", json={"userIds": [consultant.id]})
    manager_client.post(
        f"/api/missions/{other_id}/affectations", json={"userIds": [other_consultant.id]}
    )

    response = consultant_client.get("/api/missions")

    mission_ids = [mission["id"] for mission in response.json()]
    assert own_id in mission_ids
    assert other_id not in mission_ids


# --- User Story 4 — close a mission without losing its history ------------------------


def test_close_a_mission_as_manager_returns_200_and_sets_status_closed(
    manager_client: TestClient,
) -> None:
    mission_id = _create(manager_client).json()["id"]

    response = manager_client.post(f"/api/missions/{mission_id}/cloture")

    assert response.status_code == 200
    assert response.json()["status"] == "CLOSED"


def test_close_a_mission_stops_offering_it_for_new_declarations(
    manager_client: TestClient, consultant_client: TestClient, consultant: User
) -> None:
    mission_id = _create(manager_client, startDate="2020-01-01", endDate="2020-12-31").json()["id"]
    manager_client.post(
        f"/api/missions/{mission_id}/affectations", json={"userIds": [consultant.id]}
    )

    manager_client.post(f"/api/missions/{mission_id}/cloture")

    response = consultant_client.get("/api/missions/disponibles", params={"date": "2020-06-15"})
    assert mission_id not in [mission["id"] for mission in response.json()]


def test_close_a_mission_as_consultant_returns_403(
    manager_client: TestClient, consultant_client: TestClient
) -> None:
    mission_id = _create(manager_client).json()["id"]

    response = consultant_client.post(f"/api/missions/{mission_id}/cloture")

    assert response.status_code == 403


def test_close_an_already_closed_mission_returns_200_and_changes_nothing(
    manager_client: TestClient,
) -> None:
    mission_id = _create(manager_client).json()["id"]
    manager_client.post(f"/api/missions/{mission_id}/cloture")

    response = manager_client.post(f"/api/missions/{mission_id}/cloture")

    assert response.status_code == 200
    assert response.json()["status"] == "CLOSED"
    assert response.json()["endDate"] is None


def test_close_an_unknown_mission_returns_404(manager_client: TestClient) -> None:
    response = manager_client.post("/api/missions/4242/cloture")

    assert response.status_code == 404
    assert response.json()["detail"] == "Mission introuvable."


# --- User Story 5 — find a mission in the catalogue ------------------------------------


# Seed clients are "ACME" and "Globex" (`app/db/seed.py`); the filter tests below use
# "Wonka" and "Fabrikam" instead, so a set- or list-equality assertion never has to
# account for the demo dataset.


def test_list_missions_filtered_by_client_returns_only_that_clients_missions(
    manager_client: TestClient,
) -> None:
    _create(manager_client, label="A", client="Wonka")
    _create(manager_client, label="B", client="Fabrikam")

    response = manager_client.get("/api/missions", params={"client": "Wonka"})

    clients = {mission["client"] for mission in response.json()}
    assert clients == {"Wonka"}


def test_list_missions_filtered_by_client_is_case_insensitive(
    manager_client: TestClient,
) -> None:
    _create(manager_client, label="A", client="Wonka")

    response = manager_client.get("/api/missions", params={"client": "wonka"})

    matching = [mission for mission in response.json() if mission["client"] == "Wonka"]
    assert len(matching) == 1


def test_list_missions_filtered_by_status_returns_only_that_status(
    manager_client: TestClient,
) -> None:
    active_id = _create(manager_client, label="Active").json()["id"]
    closed_id = _create(manager_client, label="Closed").json()["id"]
    manager_client.post(f"/api/missions/{closed_id}/cloture")

    response = manager_client.get("/api/missions", params={"status": "CLOSED"})

    mission_ids = [mission["id"] for mission in response.json()]
    assert closed_id in mission_ids
    assert active_id not in mission_ids
    assert all(mission["status"] == "CLOSED" for mission in response.json())


def test_list_missions_filtered_by_user_id_returns_only_their_missions(
    manager_client: TestClient, consultant: User, other_consultant: User
) -> None:
    assigned_id = _create(manager_client, label="A").json()["id"]
    other_id = _create(manager_client, label="B").json()["id"]
    manager_client.post(
        f"/api/missions/{assigned_id}/affectations", json={"userIds": [consultant.id]}
    )
    manager_client.post(
        f"/api/missions/{other_id}/affectations", json={"userIds": [other_consultant.id]}
    )

    response = manager_client.get("/api/missions", params={"userId": consultant.id})

    mission_ids = [mission["id"] for mission in response.json()]
    assert assigned_id in mission_ids
    assert other_id not in mission_ids


def test_list_missions_combines_all_filters_with_and(
    manager_client: TestClient, consultant: User
) -> None:
    matching_id = _create(manager_client, label="Match", client="Wonka").json()["id"]
    wrong_client_id = _create(manager_client, label="Match2", client="Fabrikam").json()["id"]
    manager_client.post(
        f"/api/missions/{matching_id}/affectations", json={"userIds": [consultant.id]}
    )
    manager_client.post(
        f"/api/missions/{wrong_client_id}/affectations", json={"userIds": [consultant.id]}
    )

    response = manager_client.get(
        "/api/missions",
        params={"client": "Wonka", "status": "ACTIVE", "userId": consultant.id},
    )

    assert [mission["id"] for mission in response.json()] == [matching_id]


def test_list_missions_with_a_filter_combination_matching_nothing_returns_an_empty_list(
    manager_client: TestClient,
) -> None:
    _create(manager_client)

    response = manager_client.get("/api/missions", params={"client": "Inexistant"})

    assert response.status_code == 200
    assert response.json() == []
