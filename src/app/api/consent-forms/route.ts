import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { googleDriveService } from '@/lib/google-drive'

export async function POST(request: NextRequest) {
  console.log('=== API /consent-forms POST Debug ===');
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const customerName = formData.get('customerName') as string
    const customerEmail = formData.get('customerEmail') as string

    console.log('📥 Received FormData:', {
      file: file ? `File: ${file.name}, Size: ${file.size}` : 'No file',
      userId,
      customerName,
      customerEmail
    });
    
    if (!file || !userId || !customerName || !customerEmail) {
      console.log('❌ Missing required fields:', {
        file: !!file,
        userId: !!userId,
        customerName: !!customerName,
        customerEmail: !!customerEmail
      })
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // PDFファイルの内容を取得
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ファイル名の生成
    const timestamp = Date.now()
    const filename = `consent-form-${userId}-${timestamp}.pdf`

    // データベースに保存
    const consentForm = await prisma.consentForm.create({
      data: {
        userId,
        customerName,
        customerEmail,
        pdfData: buffer,
        filename
      }
    })
    
    console.log('✅ 同意書PDF保存完了:', {
      id: consentForm.id,
      filename,
      fileSize: buffer.length,
      customerName,
      customerEmail
    });

    // Google Driveにも保存
    let googleDriveFileId: string | null = null;
    try {
      // 環境変数チェック
      if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_DRIVE_FOLDER_ID) {
        console.log('⚠️ Google Drive環境変数が設定されていません。データベース保存のみ実行します。');
      } else {
        // 日付ベースのフォルダを作成/取得
        const currentDate = new Date();
        const targetFolderId = await googleDriveService.createDateBasedFolder(currentDate);
        
        // Google Driveファイル名を生成
        const googleDriveFileName = googleDriveService.generateConsentFileName(customerName, currentDate.toLocaleDateString('ja-JP'));
        
        // Google Driveにアップロード
        googleDriveFileId = await googleDriveService.uploadFile(
          googleDriveFileName,
          buffer,
          'application/pdf'
        );
        
        console.log('✅ Google Drive保存完了:', {
          fileId: googleDriveFileId,
          fileName: googleDriveFileName
        });
      }
    } catch (googleDriveError) {
      console.error('⚠️ Google Drive保存エラー (データベース保存は成功):', googleDriveError);
      // Google Driveの保存に失敗してもデータベース保存は成功しているので、エラーを投げない
    }

    return NextResponse.json({ 
      message: '同意書が正常に保存されました',
      consentFormId: consentForm.id,
      filename: consentForm.filename,
      googleDriveFileId
    })

  } catch (error) {
    console.error('❌ Error saving consent form:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}