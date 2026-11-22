import { test, expect } from "@playwright/test";

test.describe("Foundation smoke", () => {
  test("@smoke health endpoint reports ok", async ({ request }) => {
    const res = await request.get("/health");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  test("@smoke anonymous callers are rejected with 401", async ({
    request,
  }) => {
    const res = await request.get("/api/me");
    expect(res.status()).toBe(401);
  });

  test("@smoke seeded token resolves to its tenant and role", async ({
    request,
  }) => {
    const res = await request.get("/api/me", {
      headers: { Authorization: "Bearer token-employee-a" },
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({
      orgId: "org-a",
      role: "employee",
    });
  });
});
