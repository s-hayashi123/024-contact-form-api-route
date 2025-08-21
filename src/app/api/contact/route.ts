import { NextResponse } from "next/server";
import { contactSchema } from "../../../../lib/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = contactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          message: "入力内容に誤りがあります。",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    console.log("サーバーで受け取ったデータ:", validation.data);

    return NextResponse.json({
      message: "お問い合わせありがとうございます。正常に送信されました。",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}
