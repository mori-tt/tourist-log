import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // multipart/form-data を受け取る
  const formData = await req.formData();
  const file = formData.get("file");

  // file が File 型でない場合はエラーレスポンスを返す
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No valid file provided" },
      { status: 400 }
    );
  }

  // File オブジェクトから ArrayBuffer を取得して Buffer に変換
  const buffer = Buffer.from(await file.arrayBuffer());
  // base64 エンコード（ImgBB API ではプレフィックス不要）
  const base64 = buffer.toString("base64");

  try {
    // IMGBB の API キーを環境変数から取得
    const API_KEY = process.env.IMGBB_API_KEY;
    if (!API_KEY) {
      throw new Error("IMGBB API Key is not set.");
    }

    // URLSearchParams を使用してパラメータを作成
    const params = new URLSearchParams();
    params.append("image", base64);
    // 任意で元のファイル名も送信可能
    params.append("name", file.name);

    // ImgBB のアップロードエンドポイントにリクエスト
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (data.success) {
      // アップロード成功時は data.data.url に画像 URL が格納される
      return NextResponse.json({ url: data.data.url });
    } else {
      console.error("ImgBB upload failed:", data);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
