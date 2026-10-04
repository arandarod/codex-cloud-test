import { afterEach, expect, it, vi } from "vitest";
import { request } from "./api";

afterEach(() => vi.unstubAllGlobals());

it("preserves Problem Details field errors and status", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          detail: "Dados inválidos",
          errors: { title: "Obrigatório" },
        }),
      }),
  );
  await expect(request("/books")).rejects.toMatchObject({
    message: "Dados inválidos",
    status: 400,
    fields: { title: "Obrigatório" },
  });
});

it("handles deletion without attempting to parse an empty response", async () => {
  const json = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, status: 204, json }),
  );
  expect(await request("/books/1", { method: "DELETE" })).toBeNull();
  expect(json).not.toHaveBeenCalled();
});

it("gives a useful connection error and preserves request cancellation", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockRejectedValueOnce(new DOMException("cancelled", "AbortError")),
  );
  await expect(request("/books")).rejects.toThrow("Não foi possível conectar");
  await expect(request("/books")).rejects.toMatchObject({ name: "AbortError" });
});
