import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, { message: "名前は2文字以上で入力してください。" }),
  email: z
    .string()
    .email({ message: "有効なメールアドレスを入力してください。" }),
  message: z
    .string()
    .min(10, { message: "メッセージは10文字以上で入力してください。" })
    .max(500, { message: "メッセージは500文字以内で入力してください。" }),
});

export type ContactFormInput = z.infer<typeof contactSchema>;
