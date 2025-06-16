# ピラティス予約システム

Next.js で構築されたピラティススタジオのグループレッスン予約システムです。

## 機能

### 一般ユーザー向け
- ログイン不要でレッスン予約
- 1週間カレンダー表示で空き枠確認
- 予約登録・キャンセル（前日まで）
- 支払い方法選択（オンライン決済 or 当日支払い）
- モバイルファーストのレスポンシブ対応

### 管理者向け
- ID・パスワードでログイン
- レッスン枠の追加・編集・削除
- 予約一覧表示（支払いステータス付き）
- カレンダービュー切替（週/月/日）

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **認証**: NextAuth.js
- **決済**: Stripe
- **フォーム**: React Hook Form + Zod
- **カレンダー**: React Big Calendar
- **アイコン**: Lucide React

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env.local` にコピーして必要な値を設定してください:

```bash
cp .env.example .env.local
```

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/pilates_app?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Admin Credentials
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Application Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. データベースのセットアップ

```bash
# Prisma クライアントの生成
npm run db:generate

# データベースにスキーマを反映
npm run db:push
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## デプロイ

### Vercel へのデプロイ

1. Vercel にプロジェクトをインポート
2. 環境変数を設定
3. PostgreSQL データベースを準備（Supabase、Neon など）
4. Stripe の Webhook エンドポイントを設定

## 管理者アカウント

デフォルトの管理者アカウント:
- **メールアドレス**: admin@example.com
- **パスワード**: admin123

## API エンドポイント

### レッスン関連
- `GET /api/lessons` - レッスン一覧取得
- `POST /api/lessons` - 新規レッスン作成（管理者のみ）
- `GET /api/lessons/[id]` - レッスン詳細取得
- `PUT /api/lessons/[id]` - レッスン更新（管理者のみ）
- `DELETE /api/lessons/[id]` - レッスン削除（管理者のみ）

### 予約関連
- `POST /api/reservations` - 新規予約作成
- `GET /api/reservations/[id]` - 予約詳細取得

### 決済関連
- `GET /api/stripe/success` - Stripe 決済成功処理

### 認証関連
- `POST /api/auth/[...nextauth]` - NextAuth.js エンドポイント

## プロジェクト構造

```
src/
├── app/                    # App Router ページ
│   ├── (public)/          # 一般ユーザー向けページ
│   ├── admin/             # 管理者向けページ
│   └── api/               # API ルート
├── components/            # 共通コンポーネント
├── lib/                   # ユーティリティ・設定
└── types/                 # TypeScript 型定義
```

## ライセンス

MIT License
