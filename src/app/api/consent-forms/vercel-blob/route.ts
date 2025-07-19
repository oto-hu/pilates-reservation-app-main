import { NextRequest, NextResponse } from 'next/server';
import { vercelBlobService } from '@/lib/vercel-blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customerName = formData.get('customerName') as string;
    const customerEmail = formData.get('customerEmail') as string;
    const date = formData.get('date') as string;

    if (!file || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: '必要な情報が不足しています' },
        { status: 400 }
      );
    }

    // ファイルをBufferに変換
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Vercel Blobにアップロード
    const blobResult = await vercelBlobService.uploadFile(
      fileBuffer,
      customerName,
      customerEmail,
      date
    );

    return NextResponse.json({
      success: true,
      url: blobResult.url,
      pathname: blobResult.pathname,
      message: 'Vercel Blobに正常に保存されました'
    });

  } catch (error) {
    console.error('Vercel Blob upload error:', error);
    return NextResponse.json(
      { error: 'Vercel Blobへの保存に失敗しました' },
      { status: 500 }
    );
  }
}