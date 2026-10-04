import { z } from "zod";

export const genres = {
  FICTION: "Ficção",
  FANTASY: "Fantasia",
  SCIENCE: "Ciência",
  HISTORY: "História",
  POETRY: "Poesia",
  TECHNOLOGY: "Tecnologia",
};

export const bookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Informe o título.")
    .max(200, "Use até 200 caracteres."),
  author: z
    .string()
    .trim()
    .min(1, "Informe o autor.")
    .max(120, "Use até 120 caracteres."),
  isbn: z
    .string()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .refine((value) => {
      if (!/^97[89]\d{10}$/.test(value)) return false;
      return (
        [...value].reduce(
          (sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1),
          0,
        ) %
          10 ===
        0
      );
    }, "Informe um ISBN-13 válido, incluindo o dígito verificador."),
  publicationYear: z.coerce
    .number()
    .int("Informe um ano inteiro.")
    .min(1, "Informe um ano válido.")
    .max(new Date().getFullYear(), "O ano não pode estar no futuro."),
  genre: z.enum(Object.keys(genres), { error: "Escolha um gênero." }),
  available: z.boolean(),
});
