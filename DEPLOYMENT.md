# デプロイメント手順

## データベースセットアップ

### 新しいテーブルを追加する場合

1. `prisma/schema.prisma`を更新
2. ローカルでデータベースを同期:
   ```bash
   npx prisma db push
   ```
3. Prismaクライアントを再生成:
   ```bash
   npx prisma generate
   ```

### 本番環境でのデータベース更新

Vercel環境では、環境変数が更新されている場合、デプロイ時に自動的にデータベースが同期されます。

### 手動でデータベースを更新する場合

本番環境で手動でデータベースを更新する必要がある場合：

```bash
# 本番環境のDATABASE_URLを使用
DATABASE_URL="your-production-database-url" npx prisma db push
```

## ConsentFormテーブルについて

ConsentFormテーブルは以下のフィールドを持ちます：

- `id`: 主キー
- `userId`: ユーザーID（外部キー）
- `customerName`: 顧客名
- `customerEmail`: 顧客メールアドレス
- `pdfData`: PDFファイルのバイナリデータ
- `filename`: ファイル名
- `createdAt`: 作成日時

このテーブルは新規会員登録時の同意書PDF保存に使用されます。