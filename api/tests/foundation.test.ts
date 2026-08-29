import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "../src/app";
import { hashPassword } from "../src/password";
import { InMemoryIdentityRepository } from "../src/repository";
const setup = async () => {
  const repository = new InMemoryIdentityRepository([
    {
      id: "manager-1",
      email: "manager@local.test",
      displayName: "مدير مبيعات",
      passwordHash: await hashPassword("Phase0-password!"),
      role: "sales_manager",
      teamId: "team-1",
      active: true,
    },
    {
      id: "rep-1",
      email: "rep@local.test",
      displayName: "مندوب مبيعات",
      passwordHash: await hashPassword("Phase0-password!"),
      role: "sales_representative",
      teamId: "team-1",
      active: true,
    },
  ]);
  return { app: await createApi({ repository }), repository };
};
const sessionCookieHeader = (response: any) => {
  const values = Array.isArray(response.headers["set-cookie"])
    ? response.headers["set-cookie"]
    : [response.headers["set-cookie"]];
  return values[0].split(";")[0];
};
const allCookieHeaders = (response: any) => {
  const values = Array.isArray(response.headers["set-cookie"])
    ? response.headers["set-cookie"]
    : [response.headers["set-cookie"]];
  return values.map((value) => value.split(";")[0]).join("; ");
};
test("health, session rotation/revocation, and audit work", async () => {
  const { app, repository } = await setup();
  assert.equal((await app.inject("/health")).statusCode, 200);
  const login = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "manager@local.test", password: "Phase0-password!" },
  });
  assert.equal(login.statusCode, 200);
  const cookie = allCookieHeaders(login);
  const csrfToken = login.json().csrfToken;
  assert.equal(
    (await app.inject({ url: "/api/auth/me", headers: { cookie } })).statusCode,
    200,
  );
  assert.equal(
    (
      await app.inject({
        url: "/api/foundation/role-check",
        headers: { cookie },
      })
    ).statusCode,
    200,
  );
  assert.equal(
    (
      await app.inject({
        method: "POST",
        url: "/api/auth/logout",
        headers: { cookie, "x-csrf-token": csrfToken },
      })
    ).statusCode,
    204,
  );
  assert.equal(
    (await app.inject({ url: "/api/auth/me", headers: { cookie } })).statusCode,
    401,
  );
  assert.equal((await repository.listAudit()).length, 2);
  await app.close();
});
test("session restoration returns the original CSRF token so writes remain usable after reload", async () => {
  const { app } = await setup();
  const login = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "rep@local.test", password: "Phase0-password!" },
  });
  const setCookies = Array.isArray(login.headers["set-cookie"])
    ? login.headers["set-cookie"]
    : [login.headers["set-cookie"]!];
  const cookie = setCookies.map((value) => value.split(";")[0]).join("; ");
  assert.equal(
    (
      await app.inject({
        url: "/api/auth/me",
        headers: { cookie: sessionCookieHeader(login) },
      })
    ).statusCode,
    401,
  );
  const restored = await app.inject({
    url: "/api/auth/me",
    headers: { cookie },
  });
  assert.equal(restored.statusCode, 200);
  assert.equal(restored.json().csrfToken, login.json().csrfToken);
  const logout = await app.inject({
    method: "POST",
    url: "/api/auth/logout",
    headers: { cookie, "x-csrf-token": restored.json().csrfToken },
  });
  assert.equal(logout.statusCode, 204);
  await app.close();
});
test("backend role and csrf denial are authoritative", async () => {
  const { app } = await setup();
  const login = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "rep@local.test", password: "Phase0-password!" },
  });
  const cookie = sessionCookieHeader(login);
  assert.equal(
    (
      await app.inject({
        url: "/api/foundation/role-check",
        headers: { cookie },
      })
    ).statusCode,
    403,
  );
  assert.equal(
    (
      await app.inject({
        method: "POST",
        url: "/api/auth/logout",
        headers: { cookie },
      })
    ).statusCode,
    403,
  );
  await app.close();
});
test("invalid API payloads return a stable 422 validation response", async () => {
  const { app } = await setup();
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "not-an-email", password: "short" },
  });
  assert.equal(response.statusCode, 422);
  assert.equal(response.json().error, "VALIDATION_ERROR");
  await app.close();
});
test("profile is authenticated, CSRF-protected, persisted, and audited", async () => {
  const { app, repository } = await setup();
  const login = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "rep@local.test", password: "Phase0-password!" },
  });
  const cookie = sessionCookieHeader(login),
    csrfToken = login.json().csrfToken;
  assert.equal(
    (await app.inject({ url: "/api/profile", headers: { cookie } })).json()
      .email,
    "rep@local.test",
  );
  assert.equal(
    (
      await app.inject({
        method: "PATCH",
        url: "/api/profile",
        headers: { cookie },
        payload: {
          displayName: "TEST Profile",
          dateOfBirth: "1994-05-10",
          avatarDataUrl: null,
        },
      })
    ).statusCode,
    403,
  );
  const saved = await app.inject({
    method: "PATCH",
    url: "/api/profile",
    headers: { cookie, "x-csrf-token": csrfToken },
    payload: {
      displayName: "TEST Profile",
      dateOfBirth: "1994-05-10",
      avatarDataUrl: "data:image/png;base64,iVBORw0KGgo=",
    },
  });
  assert.equal(saved.statusCode, 200);
  assert.equal(saved.json().displayName, "TEST Profile");
  assert.equal(
    (await app.inject({ url: "/api/profile", headers: { cookie } })).json()
      .dateOfBirth,
    "1994-05-10",
  );
  assert.ok(
    (await repository.listAudit()).some(
      (event) => event.action === "employee.profile_updated",
    ),
  );
  await app.close();
});
