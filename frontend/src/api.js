const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${baseUrl}/api${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (cause) {
    if (cause.name === "AbortError") throw cause;
    throw new Error(
      "Não foi possível conectar ao catálogo. Verifique sua conexão e tente novamente.",
      { cause },
    );
  }
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    const error = new Error(
      problem.detail ||
        `Não foi possível concluir a operação (${response.status}).`,
    );
    error.status = response.status;
    error.fields = problem.errors || {};
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  list: (params, signal) => request(`/books?${params}`, { signal }),
  get: (id, signal) => request(`/books/${id}`, { signal }),
  create: (book) =>
    request("/books", { method: "POST", body: JSON.stringify(book) }),
  update: (id, book) =>
    request(`/books/${id}`, { method: "PUT", body: JSON.stringify(book) }),
  delete: (id) => request(`/books/${id}`, { method: "DELETE" }),
};
