# ピラティス予約システム

Next.js で構築されたピラティススタジオのグループレッスン予約システムです。

## 機能

### 会員システム
- **会員登録・ログイン**: 氏名、フリガナ、年齢、性別、メールアドレス等で会員登録
- **会員ダッシュボード**: チケット残数、有効期限、予約状況を一覧表示
- **同意書システム**: 初回予約時に同意書への同意が必要

### チケットシステム
- **チケット管理**: レッスン種別ごとのチケット（少人数制・わいわいピラティス）
- **有効期限管理**: 購入から3ヶ月の自動有効期限設定
- **チケット付与**: 管理者が会員に手動でチケットを付与
- **残数管理**: チケット利用時の自動減算とリアルタイム残数表示

### 予約システム
- **3つの予約タイプ**:
  - 体験レッスン（初回限定・1,000円）
  - 単回利用/ドロップイン（3,000-3,500円）
  - チケット利用（保有チケット1枚消費）
- **同意書連携**: 未同意会員は予約時に同意が必要
- **自動バリデーション**: 体験レッスン制限、チケット有効性確認

### キャンセル機能
- **期限管理**: 前日21:00まで無料キャンセル
- **チケット返還**: 期限内キャンセルはチケット返還、期限後は消費
- **確認ダイアログ**: 期限後キャンセル時の確認機能

### 管理者機能
- **会員管理**: 会員情報・同意状況・チケット残数の確認
- **チケット付与**: 会員へのチケット付与（枚数・種別指定）
- **予約管理**: 予約種別の明確な識別と支払い情報表示
- **レッスン管理**: レッスン枠の追加・編集・削除

### 一般ユーザー向け（非会員）
- ログイン不要でレッスン予約（単回利用のみ）
- 1週間カレンダー表示で空き枠確認
- モバイルファーストのレスポンシブ対応

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **認証**: NextAuth.js + bcryptjs
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

## 主要機能の使い方

### 1. 会員登録から予約まで
1. `/auth/register` で会員登録
2. `/auth/login` でログイン  
3. 管理者からチケットを付与してもらう
4. `/reserve` でレッスンを選択
5. 予約タイプ（体験・単回・チケット）を選択して予約

### 2. 管理者操作
1. `/admin/login` で管理者ログイン
2. `/admin/tickets` で会員にチケット付与
3. `/admin/dashboard` で予約状況確認

### 3. キャンセルポリシー
- **前日21:00まで**: 無料キャンセル（チケット返還）
- **前日21:00以降**: キャンセル料発生（チケット消費）

## デプロイ

### Vercel へのデプロイ

1. Vercel にプロジェクトをインポート
2. 環境変数を設定
3. PostgreSQL データベースを準備（Supabase、Neon など）
4. Stripe の Webhook エンドポイントを設定

## アカウント情報

### 管理者アカウント
デフォルトの管理者アカウント:
- **メールアドレス**: admin@example.com
- **パスワード**: admin123
- **アクセス**: `/admin/login` からログイン

### 会員アカウント
- **登録**: `/auth/register` から新規会員登録
- **ログイン**: `/auth/login` からログイン
- **ダッシュボード**: `/member/dashboard` でチケット・予約状況確認

## API エンドポイント

### レッスン関連
- `GET /api/lessons` - レッスン一覧取得
- `POST /api/lessons` - 新規レッスン作成（管理者のみ）
- `GET /api/lessons/[id]` - レッスン詳細取得
- `PUT /api/lessons/[id]` - レッスン更新（管理者のみ）
- `DELETE /api/lessons/[id]` - レッスン削除（管理者のみ）

### 予約関連
- `POST /api/reservations` - 新規予約作成（体験・単回・チケット対応）
- `GET /api/reservations/[id]` - 予約詳細取得

### 認証・会員関連
- `POST /api/auth/register` - 会員登録
- `POST /api/auth/[...nextauth]` - NextAuth.js エンドポイント
- `GET /api/member/dashboard` - 会員ダッシュボード情報
- `GET /api/member/tickets` - 会員チケット情報
- `GET /api/member/reservation-history` - 予約履歴確認
- `GET /api/member/consent-status` - 同意書状況確認

### 管理者機能
- `GET /api/admin/members` - 会員一覧取得
- `POST /api/admin/tickets` - チケット付与

### 決済関連
- `GET /api/stripe/success` - Stripe 決済成功処理

## プロジェクト構造

```
src/
├── app/
│   ├── admin/             # 管理者向けページ
│   │   ├── dashboard/     # 管理者ダッシュボード
│   │   ├── tickets/       # チケット管理
│   │   └── login/         # 管理者ログイン
│   ├── auth/              # 認証関連ページ
│   │   ├── login/         # 会員ログイン
│   │   └── register/      # 会員登録
│   ├── member/            # 会員向けページ
│   │   └── dashboard/     # 会員ダッシュボード
│   ├── consent-form/      # 同意書ページ
│   ├── reserve/           # 予約ページ
│   └── api/               # API ルート
│       ├── auth/          # 認証API
│       ├── member/        # 会員API
│       ├── admin/         # 管理者API
│       ├── lessons/       # レッスンAPI
│       └── reservations/  # 予約API
├── components/            # 共通コンポーネント
├── lib/                   # ユーティリティ・設定
└── types/                 # TypeScript 型定義
```

## ライセンス

MIT License
