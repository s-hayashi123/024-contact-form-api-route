# 【React & TypeScript】Next.js API Routesで作る！お問い合わせフォーム開発チュートリアル (024)

![完成形デモ](https://storage.googleapis.com/gemini-prod/images/2024/05/15/contact_form_demo.gif)

## 🚀 はじめに (The "Why")

こんにちは！Web開発の世界へようこそ！

このチュートリアルでは、モダンなWebアプリケーション開発で非常に人気の高いフレームワーク、**Next.js**を使って、動的な「お問い合わせフォーム」を作成します。

**「でも、ただのフォームでしょ？」** と思ったあなた、鋭いですね。この課題の核心は、単にフォームを作ることではありません。フロントエンド（ユーザーが見る画面）とバックエンド（サーバー側の処理）が**どのように連携するのか**を、Next.jsのパワフルな機能「**API Routes**」を通して学ぶことにあります。

### ✨ このチュートリアルで得られること

1.  **フルスタック開発の第一歩:** フロントエンド(React)からバックエンド(API)へデータを送信し、サーバーで処理する一連の流れを体験できます。
2.  **堅牢なバリデーション:** `zod`を使い、クライアントサイドとサーバーサイドの両方でデータ検証を行う「二重のチェック」を実装します。これにより、予期せぬデータからアプリケーションを保護する重要性を理解できます。
3.  **モダンなフォーム実装:** `react-hook-form`を使い、宣言的でパフォーマンスの高いフォームを構築する方法を学びます。

このチュートリアルを終える頃には、あなたは単なるUIコンポーネントだけでなく、その裏側で動くAPIまで含めた、より完全な機能を一人で開発できるスキルを手にしているはずです。さあ、未来のフルスタックエンジニアを目指して、一緒に開発を始めましょう！

---

## 🛠 環境構築

このプロジェクトでは、以下の技術を使用します。最高の学習体験を得るために、それぞれの公式サイトで最新の情報を確認しながら環境をセットアップすることをお勧めします。「公式ドキュメントを読む」ことは、優れたエンジニアになるための必須スキルです。

1.  **Node.js:** [公式サイト](https://nodejs.org/)からLTS版をインストールしてください。
2.  **Next.js (App Router):** 以下のコマンドでプロジェクトを作成します。
    ```bash
    npx create-next-app@latest --typescript --tailwind --eslint
    ```
3.  **ライブラリのインストール:** プロジェクトディレクトリに移動し、フォーム管理とバリデーションに必要なライブラリをインストールします。
    ```bash
    npm install react-hook-form zod @hookform/resolvers
    ```

---

## 👨‍💻【最重要】超詳細なステップバイステップ開発手順

ここからが本番です！一つ一つのステップを「なぜそうするのか？」を理解しながら進めていきましょう。

### Step 1: クライアントとサーバーで共有する「型」を定義する

**🎯 このステップのゴール:**
フォームで扱うデータ（名前、メール、メッセージ）の「型」と「バリデーションルール」を`zod`で定義します。この定義をクライアントとサーバーの両方で再利用することで、コードの重複を防ぎ、一貫性を保ちます。

**💡 The How: 具体的なコード**

1.  プロジェクトのルートに`lib`フォルダを作成し、その中に`schema.ts`というファイルを作成します。
2.  以下のコードを`lib/schema.ts`に記述してください。

```typescript:lib/schema.ts
import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, { message: '名前は2文字以上で入力してください。' }),
  email: z.string().email({ message: '有効なメールアドレスを入力してください。' }),
  message: z
    .string()
    .min(10, { message: 'メッセージは10文字以上で入力してください。' })
    .max(500, { message: 'メッセージは500文字以内で入力してください。' }),
});

// フォームの入力値の型を定義
export type ContactFormInput = z.infer<typeof contactSchema>;
```

**🤔 The Why: なぜ、それが必要なのか？**

-   **`zod`とは？:** TypeScriptファーストなスキーマ宣言・検証ライブラリです。`z.string().min(2)`のように、直感的なチェーンメソッドでデータの型やルール（「2文字以上」など）を定義できます。
-   **`export const contactSchema`:** これがバリデーションルールの本体です。`z.object({...})`でオブジェクトの形状を定義しています。
-   **`export type ContactFormInput`:** `z.infer<...>`を使うと、`zod`スキーマから自動的にTypeScriptの型を生成できます。これにより、フォームのデータが常に正しい型を持つことを保証でき、エディタの補完も効くようになります。
-   **`lib`フォルダ:** Next.jsでは、`lib`や`utils`といったフォルダに、アプリケーション全体で共有するコード（ヘルパー関数、スキーマ定義など）を置くのが一般的です。

---

### Step 2: データを受け取るAPIエンドポイントを作成する

**🎯 このステップのゴール:**
フロントエンドから送信されたフォームデータを受け取り、検証し、結果を返すためのサーバーサイドの窓口（API Route）を作成します。

**💡 The How: 具体的なコード**

1.  `app`ディレクトリの中に`api`フォルダ、さらにその中に`contact`フォルダを作成します。
2.  `app/api/contact/`の中に`route.ts`という名前でファイルを作成します。 **（ファイル名は必ず`route.ts`にする必要があります）**
3.  以下のコードを`app/api/contact/route.ts`に記述してください。

```typescript:app/api/contact/route.ts
import { NextResponse } from 'next/server';
import { contactSchema } from '@/lib/schema'; // Step 1で作成したスキーマをインポート

export async function POST(req: Request) {
  try {
    // 1. リクエストボディを取得
    const body = await req.json();

    // 2. Zodスキーマでデータを検証
    const validation = contactSchema.safeParse(body);

    // 3. バリデーション失敗時の処理
    if (!validation.success) {
      return NextResponse.json(
        {
          message: '入力内容に誤りがあります。',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 4. バリデーション成功時の処理 (本来はここでDB保存やメール送信)
    console.log('サーバーで受け取ったデータ:', validation.data);

    // 5. 成功レスポンスを返す
    return NextResponse.json({
      message: 'お問い合わせありがとうございます。正常に送信されました。',
    });

  } catch (error) {
    // 6. 予期せぬエラーの処理
    console.error(error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました。' },
      { status: 500 }
    );
  }
}
```

**🤔 The Why: なぜ、それが必要なのか？**

-   **`app/api/.../route.ts`:** Next.jsのApp Routerでは、この規約でファイルを作成すると、そのパスがAPIエンドポイントになります。今回は`/api/contact`というURLでこのAPIにアクセスできます。
-   **`export async function POST(req: Request)`:** `POST`メソッドでこのAPIにリクエストが来たときに、この関数が実行されます。`req`オブジェクトにリクエスト情報が含まれています。
-   **`await req.json()`:** `fetch`で送信されたJSON形式のボディをJavaScriptオブジェクトに変換します。
-   **`.safeParse()`:** `parse`と違い、検証に失敗してもエラーをスローしません。代わりに`{ success: boolean, ... }`という形のオブジェクトを返すため、安全にエラーハンドリングができます。
-   **`NextResponse.json(...)`:** クライアントにJSON形式でレスポンスを返すためのNext.jsのヘルパー関数です。ステータスコードも一緒に指定できます（例: `status: 400`は「Bad Request」）。
-   **`try...catch`:** ネットワーク通信や外部APIとの連携では、予期せぬエラーが常に起こり得ます。`try...catch`で囲むことで、アプリケーションがクラッシュするのを防ぎ、エラーレスポンスを返すことができます。

---

### Step 3: ユーザーが入力するフォームUIを作成する

**🎯 このステップのゴール:**
`react-hook-form`を使い、ユーザーが名前、メール、メッセージを入力できるUIを構築します。

**💡 The How: 具体的なコード**

1.  `app`ディレクトリに`contact`フォルダを作成し、その中に`page.tsx`を作成します。
2.  以下のコードを`app/contact/page.tsx`に記述してください。

```tsx:app/contact/page.tsx
'use client'; // このコンポーネントはクライアントで動作することを明示

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, ContactFormInput } from '@/lib/schema'; // Step 1で作成したものをインポート
import { useState } from 'react';

export default function ContactPage() {
  // react-hook-formのセットアップ
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactSchema), // Zodスキーマをバリデーションリゾルバとして使用
  });

  // 送信処理（次のステップで実装）
  const onSubmit: SubmitHandler<ContactFormInput> = (data) => {
    console.log('フォームデータ:', data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">お問い合わせ</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              お名前
            </label>
            <input
              id="name"
              type="text"
              {...register('name')} // ここでフォームの状態とフィールドを接続
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              メッセージ
            </label>
            <textarea
              id="message"
              rows={4}
              {...register('message')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              送信
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**🤔 The Why: なぜ、それが必要なのか？**

-   **`'use client'`:** `useState`や`useEffect`などのReactフックを使うコンポーネントは、クライアントコンポーネントである必要があります。ファイルの先頭にこの一文を追加します。
-   **`useForm<ContactFormInput>`:** `react-hook-form`の中心となるフックです。ジェネリクスに`ContactFormInput`型を指定することで、フォームデータの型安全性を確保します。
-   **`resolver: zodResolver(contactSchema)`:** `react-hook-form`と`zod`を繋ぐためのアダプターです。これにより、`zod`で定義したルールに基づいてフォームのバリデーションが自動的に行われます。
-   **`{...register('name')}`:** この魔法のような記述で、`input`要素を`react-hook-form`の管理下に置きます。`onChange`, `onBlur`, `value`, `ref`などを自動的に設定してくれます。
-   **`handleSubmit(onSubmit)`:** `form`の`onSubmit`にこの関数を渡すことで、フォーム送信時にまず`zod`によるバリデーションが実行されます。バリデーションが通った場合のみ、引数で渡した自作の`onSubmit`関数が、検証済みのデータ（`data`）を引数に呼び出されます。
-   **`errors.name?.message`:** バリデーションエラーがあると、`errors`オブジェクトにエラー情報が格納されます。`zod`スキーマで定義したエラーメッセージをここに表示できます。

**動作確認:**
この時点で`npm run dev`で開発サーバーを起動し、`http://localhost:3000/contact`にアクセスしてみてください。フォームが表示され、何も入力せずに送信ボタンを押すと、エラーメッセージが表示されるはずです。

---

### Step 4: フロントエンドとAPIを繋ぎ、データを送信する

**🎯 このステップのゴール:**
ユーザーがフォームを送信したときに、入力されたデータを`fetch` APIを使って、Step 2で作成したバックエンドAPIに送信します。

**💡 The How: 具体的なコード**

`app/contact/page.tsx`を以下のように修正します。`useState`を追加し、`onSubmit`関数を非同期処理に書き換えます。

```tsx:app/contact/page.tsx
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, ContactFormInput } from '@/lib/schema';
import { useState } from 'react'; // useStateをインポート

export default function ContactPage() {
  // --- useFormフック（変更なし） ---
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }, // isSubmittingを追加
    reset,
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactSchema),
  });

  // --- 送信状態と結果メッセージを管理するstate ---
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // --- 送信処理を実装 ---
  const onSubmit: SubmitHandler<ContactFormInput> = async (data) => {
    setSubmitStatus(null); // 前回の結果をリセット
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // サーバーからのエラーレスポンス
        throw new Error(result.message || 'サーバーでエラーが発生しました。');
      }

      // 成功した場合
      setSubmitStatus({ success: true, message: result.message });
      reset(); // フォームをリセット
    } catch (error: any) {
      // ネットワークエラーやサーバーエラー
      setSubmitStatus({ success: false, message: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">お問い合わせ</h1>
        
        {/* --- 送信結果メッセージの表示エリア --- */}
        {submitStatus && (
          <div
            className={`p-4 mb-4 rounded-md text-sm ${
              submitStatus.success
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {submitStatus.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* --- フォームフィールド（変更なし） --- */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">お名前</label>
            <input id="name" type="text" {...register('name')} className="..." />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input id="email" type="email" {...register('email')} className="..." />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">メッセージ</label>
            <textarea id="message" rows={4} {...register('message')} className="..." />
            {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting} // 送信中はボタンを無効化
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {isSubmitting ? '送信中...' : '送信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**🤔 The Why: なぜ、それが必要なのか？**

-   **`async/await`:** `fetch`は非同期処理（結果が返ってくるまで待つ必要がある処理）なので、`onSubmit`関数を`async`にし、`fetch`の呼び出しに`await`をつけます。
-   **`fetch('/api/contact', ...)`:** 第1引数にリクエスト先のURL（Step 2で作成したAPIエンドポイント）、第2引数にオプションのオブジェクトを渡します。
-   **`method: 'POST'`:** データを送信するので`POST`メソッドを指定します。
-   **`headers: { 'Content-Type': 'application/json' }`:** 送信するデータの種類をサーバーに伝えます。「これからJSON形式のデータを送りますよ」という合図です。
-   **`body: JSON.stringify(data)`:** JavaScriptオブジェクトである`data`を、JSON形式の文字列に変換して`body`に設定します。
-   **`const result = await response.json()`:** サーバーからのレスポンスもJSON形式なので、`json()`メソッドでJavaScriptオブジェクトに変換します。
-   **`if (!response.ok)`:** `fetch`はネットワークエラー以外ではエラーをスローしません。4xxや5xx系のエラーステータスコードが返ってきた場合でも成功と見なしてしまうため、`response.ok`プロパティ（ステータスコードが200-299の範囲なら`true`）をチェックして、手動でエラーを`throw`する必要があります。
-   **`isSubmitting`:** `react-hook-form`が提供する状態です。フォームの送信処理が実行中の間`true`になります。これを使ってボタンを無効化（`disabled`）したり、表示テキストを変更したりすることで、ユーザーが何度もボタンをクリックしてしまうのを防ぎます。

**動作確認:**
もう一度フォームを開き、今度は有効なデータを入力して送信してみてください。成功すれば「お問い合わせありがとうございます...」というメッセージが表示され、VS Codeのターミナル（開発サーバーを実行している場所）に、入力したデータが`console.log`で出力されるはずです！

---

## 💎 深掘りコラム (Deep Dive)

### なぜサーバーサイドバリデーションが絶対に不可欠なのか？

このチュートリアルでは、クライアント（ブラウザ）とサーバーの両方でバリデーションを行いました。「二度手間では？」と感じたかもしれません。しかし、これは極めて重要なことです。

-   **クライアントサイドバリデーションの役割:**
    -   **目的:** ユーザー体験 (UX) の向上。
    -   **機能:** ユーザーが間違ったデータを入力したら、サーバーに送信する「前」に即座にフィードバックを返す。これにより、無駄な通信を減らし、ユーザーにストレスを与えません。
    -   **弱点:** **簡単に迂回できてしまう。** 悪意のあるユーザーは、ブラウザの開発者ツールを使ったり、`curl`のようなコマンドラインツールを使ったりして、JavaScriptのバリデーションを無視し、不正なデータを直接APIに送りつけることができます。

-   **サーバーサイドバリデーションの役割:**
    -   **目的:** データの整合性とセキュリティの確保。
    -   **機能:** アプリケーションの「最後の砦」です。どんなリクエストが来ようとも、データを受け入れる前に必ず正当性をチェックします。
    -   **重要性:** ここで検証を怠ると、データベースに不正なデータが保存されたり、予期せぬバグやセキュリティ脆弱性の原因となったりします。

**結論:** クライアントサイドバリデーションは「親切なガイド」、サーバーサイドバリデーションは「厳格な警備員」です。両方が揃って初めて、安全で使いやすいアプリケーションが実現できるのです。

---

## 🎯 挑戦課題 (Challenges)

このチュートリアルで学んだことを応用して、さらにスキルアップしましょう！

-   **Easy: 成功メッセージを自動で消す**
    -   `setTimeout`を使い、フォーム送信成功のメッセージが5秒後に自動的に消えるように実装してみましょう。
-   **Medium: APIの応答を遅延させてみる**
    -   API Route (`route.ts`) の中で、レスポンスを返す前に2秒間待機する処理を追加してみましょう（ヒント: `new Promise(resolve => setTimeout(resolve, 2000))`）。これにより、`isSubmitting`の状態がUIに正しく反映されているかを視覚的に確認できます。
-   **Hard (エラー修正課題):**
    -   意図的にバグを仕込んでみましょう。`onSubmit`関数内の`JSON.stringify(data)`を、単に`data`としてみてください。どのようなエラーがブラウザのコンソールとサーバーのターミナルに出るか確認し、なぜそのエラーが起きるのか、どうすれば修正できるか説明してみてください。

---

## 📝 メモ (Memo)

このセクションは、あなたが学習中に気づいたこと、疑問に思ったこと、試してみたいアイデアなどを自由に書き留めるためのスペースです。

-   （例）`react-hook-form`の`watch`を使うと、特定の入力フィールドの値をリアルタイムで監視できるらしい。パスワード確認フィールドとかで使えそう。
-   （例）API Routeから外部のAPI（例えば天気情報API）を叩いて、その結果をフロントに返すこともできるのかな？

---

## 🎉 結論

お疲れ様でした！このチュートリアルを完走したあなたは、以下の重要なスキルを習得しました。

-   Next.js API Routesを使い、サーバーレスなバックエンドAPIを構築する力
-   `react-hook-form`と`zod`を連携させ、型安全で堅牢なフォームを実装する力
-   `fetch`を使い、クライアントとサーバー間で非同期にデータをやり取りする力
-   クライアントとサーバーの両方でバリデーションを行う重要性の理解

これは、単なるWebページ制作から、**Webアプリケーション開発**へとステップアップするための大きな一歩です。

**次のステップとしては、以下のようなことに挑戦するのも良いでしょう。**

-   **データベース連携:** API Routeの中で、受け取ったデータをVercel PostgresやSupabaseなどのデータベースに保存する。
-   **メール送信:** お問い合わせがあったことを、管理者やユーザーにメールで通知する（ResendやSendGridなどのサービスと連携）。
-   **Vercelへのデプロイ:** 作成したアプリケーションを世界に公開する！

これからも学び続け、素晴らしいWebアプリケーションを世界に送り出してください。応援しています！
