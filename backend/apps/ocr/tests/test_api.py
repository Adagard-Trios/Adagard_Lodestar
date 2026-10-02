import base64

from .conftest import text_image


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_health(api):
    r = api.get("/health")
    assert r.status_code == 200
    assert r.json()["ready"] is True


def test_needs_a_token(api):
    r = api.post("/read", json={"image": text_image(["12"]), "kind": "text"})
    assert r.status_code == 401


def test_rejects_a_bad_token(api, make_token):
    r = api.post("/read", json={"image": text_image(["12"]), "kind": "text"}, headers=auth(make_token(iss="http://evil")))
    assert r.status_code == 401


def test_only_field_roles(api, make_token):
    r = api.post("/read", json={"image": text_image(["12"]), "kind": "text"}, headers=auth(make_token(roles=("store_manager",))))
    assert r.status_code == 403


def test_reads_a_temperature(api, make_token):
    r = api.post("/read", json={"image": text_image(["REEFER", "3.5°C"]), "kind": "temperature"}, headers=auth(make_token(roles=("loader",))))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["value"] == "3.5"
    assert 0 < body["confidence"] <= 1
    assert any("3.5" in line["text"] for line in body["lines"])
    assert body["ms"] >= 0


def test_reads_a_seal_from_png_data_url(api, make_token):
    image = "data:image/png;base64," + text_image(["SEAL", "SL-004512"], fmt="PNG")
    r = api.post("/read", json={"image": image, "kind": "seal"}, headers=auth(make_token()))
    assert r.status_code == 200, r.text
    assert r.json()["value"] == "SL-004512"


def test_blank_photo_reads_nothing(api, make_token):
    r = api.post("/read", json={"image": text_image([]), "kind": "code"}, headers=auth(make_token(roles=("dispatcher",))))
    assert r.status_code == 200
    assert r.json()["value"] is None


def test_rejects_non_images_and_unknown_kinds(api, make_token):
    h = auth(make_token())
    assert api.post("/read", json={"image": base64.b64encode(b"GIF89a not a photo").decode(), "kind": "text"}, headers=h).status_code == 415
    assert api.post("/read", json={"image": text_image(["1"]), "kind": "weight"}, headers=h).status_code == 422


def test_rejects_large_images(api, make_token):
    big = base64.b64encode(b"\xff" * (2 * 1024 * 1024 + 10)).decode()
    r = api.post("/read", json={"image": big, "kind": "text"}, headers=auth(make_token()))
    assert r.status_code in (413, 422)
