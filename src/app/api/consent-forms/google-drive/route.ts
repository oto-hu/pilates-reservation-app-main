import { NextRequest, NextResponse } from 'next/server';
import { googleDriveService } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customerName = formData.get('customerName') as string;
    const date = formData.get('date') as string;

    if (!file || !customerName || !date) {
      return NextResponse.json(
        { error: '必要な情報が不足しています' },
        { status: 400 }
      );
    }

    // ファイルをBufferに変換
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // ファイル名を生成
    const fileName = googleDriveService.generateConsentFileName(customerName, date);

    // 日付ベースのフォルダを作成/取得
    const currentDate = new Date();
    const targetFolderId = await googleDriveService.createDateBasedFolder(currentDate);

    // Google Driveにアップロード
    const fileId = await googleDriveService.uploadFile(
      fileName,
      fileBuffer,
      'application/pdf'
    );

    return NextResponse.json({
      success: true,
      fileId,
      fileName,
      message: 'Google Driveに正常に保存されました'
    });

  } catch (error) {
    console.error('Google Drive upload error:', error);
    return NextResponse.json(
      { error: 'Google Driveへの保存に失敗しました' },
      { status: 500 }
    );
  }
}