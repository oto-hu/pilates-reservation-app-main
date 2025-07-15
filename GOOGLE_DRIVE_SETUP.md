# Google Drive API 設定手順

## 1. Google Cloud Console でのプロジェクト設定

### 1.1 Google Cloud Console にアクセス
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成、または既存のプロジェクトを選択

### 1.2 Google Drive API を有効化
1. 左側のメニューから「API とサービス」→「ライブラリ」を選択
2. 「Google Drive API」を検索して選択
3. 「有効にする」をクリック

### 1.3 サービスアカウントの作成
1. 左側のメニューから「API とサービス」→「認証情報」を選択
2. 「認証情報を作成」→「サービスアカウント」を選択
3. サービスアカウントの詳細を入力：
   - **サービスアカウント名**: `pilates-drive-service`
   - **サービスアカウントID**: `pilates-drive-service`
   - **説明**: `Pilates app Google Drive access`
4. 「作成して続行」をクリック
5. ロールの選択（スキップ可能）
6. 「完了」をクリック

### 1.4 サービスアカウントキーの作成
1. 作成したサービスアカウントをクリック
2. 「キー」タブを選択
3. 「鍵を追加」→「新しい鍵を作成」を選択
4. 「JSON」を選択して「作成」をクリック
5. ダウンロードされたJSONファイルを安全な場所に保存

## 2. Google Drive でのフォルダ設定

### 2.1 専用フォルダの作成
1. Google Drive にアクセス
2. 新しいフォルダを作成：「同意書」
3. 作成したフォルダを右クリック→「共有」を選択
4. サービスアカウントのメールアドレスを入力して「編集者」権限を付与
   - サービスアカウントのメールアドレスはJSONファイルの `client_email` フィールドに記載
5. フォルダのIDをメモ（URLの最後の部分）
   - 例: `https://drive.google.com/drive/folders/1ABC123xyz` の場合、`1ABC123xyz` がフォルダID

## 3. 環境変数の設定

### 3.1 .env ファイルの更新
ダウンロードしたJSONファイルの情報を使用して、`.env` ファイルに以下を追加：

```env
# Google Drive API Settings
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=1ABC123xyz
```

### 3.2 環境変数の説明
- **GOOGLE_CLIENT_EMAIL**: JSONファイルの `client_email` の値
- **GOOGLE_PRIVATE_KEY**: JSONファイルの `private_key` の値（改行文字 `\n` を含む）
- **GOOGLE_DRIVE_FOLDER_ID**: 作成した「同意書」フォルダのID

## 4. フォルダ構造

Google Drive に以下の構造で自動的にフォルダが作成されます：

```
同意書/
├── 2024年/
│   ├── 01月/
│   │   ├── 同意書_田中太郎_2024-01-15_2024-01-15.pdf
│   │   └── 同意書_佐藤花子_2024-01-20_2024-01-20.pdf
│   └── 02月/
│       └── 同意書_山田次郎_2024-02-05_2024-02-05.pdf
└── 2025年/
    └── 01月/
        └── ...
```

## 5. 動作確認

### 5.1 テスト方法
1. 新規会員登録で同意書を作成
2. Google Drive の「同意書」フォルダを確認
3. 年月別のフォルダに PDF ファイルが保存されていることを確認

### 5.2 トラブルシューティング
- **権限エラー**: サービスアカウントにフォルダの編集者権限が付与されているか確認
- **認証エラー**: 環境変数の値が正しく設定されているか確認
- **フォルダIDエラー**: `GOOGLE_DRIVE_FOLDER_ID` が正しいフォルダIDか確認

## 6. セキュリティ上の注意点

- サービスアカウントのJSONファイルは `.gitignore` に追加し、リポジトリにコミットしない
- 環境変数は本番環境では適切に暗号化して管理する
- 定期的にサービスアカウントキーをローテーションする
- 不要になったサービスアカウントは削除する

## 7. 本番環境での設定

### Vercel での環境変数設定
1. Vercel ダッシュボードの「Settings」→「Environment Variables」
2. 上記の環境変数を追加
3. `GOOGLE_PRIVATE_KEY` の値は改行文字を含むため、ダブルクォートで囲む

### 設定例
```
GOOGLE_CLIENT_EMAIL=pilates-drive-service@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=1ABC123xyz
```