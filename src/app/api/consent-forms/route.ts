import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { vercelBlobService } from '@/lib/vercel-blob'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // データベースから同意書を検索
    const consentForm = await prisma.consentForm.findFirst({
      where: { filename }
    })

    if (!consentForm) {
      return NextResponse.json({ error: 'Consent form not found' }, { status: 404 })
    }

    // Vercel Blobからファイルをダウンロード
    if (consentForm.blobUrl) {
      try {
        const response = await fetch(consentForm.blobUrl)
        if (response.ok) {
          const blob = await response.blob()
          const arrayBuffer = await blob.arrayBuffer()
          
          return new NextResponse(arrayBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          })
        }
      } catch (error) {
        console.error('Vercel Blob download error:', error)
      }
    }

    // Vercel Blobから取得できない場合はデータベースから取得
    if (consentForm.pdfData) {
      return new NextResponse(new Uint8Array(consentForm.pdfData), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    return NextResponse.json({ error: 'PDF data not found' }, { status: 404 })

  } catch (error) {
    console.error('Error downloading consent form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // データベースに保存（Vercel Blob情報も含む）
    const consentForm = await prisma.consentForm.create({
      data: {
        userId,
        customerName,
        customerEmail,
        pdfData: buffer,
        filename,
        blobUrl: null, // 後で更新
        blobPathname: null // 後で更新
      }
    })
    
    console.log('✅ 同意書PDF保存完了:', {
      id: consentForm.id,
      filename,
      fileSize: buffer.length,
      customerName,
      customerEmail
    });

    // Vercel Blobにも保存
    let vercelBlobUrl: string | null = null;
    let vercelBlobPathname: string | null = null;
    try {
      // 環境変数チェック
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.log('⚠️ Vercel Blob環境変数が設定されていません。データベース保存のみ実行します。');
      } else {
        // Vercel Blobにアップロード
        const blobResult = await vercelBlobService.uploadFile(
          buffer,
          customerName,
          customerEmail
        );
        
        vercelBlobUrl = blobResult.url;
        vercelBlobPathname = blobResult.pathname;
        
        console.log('✅ Vercel Blob保存完了:', {
          url: vercelBlobUrl,
          pathname: vercelBlobPathname
        });
        
        // データベースにBlobの情報を更新
        await prisma.consentForm.update({
          where: { id: consentForm.id },
          data: {
            blobUrl: vercelBlobUrl,
            blobPathname: vercelBlobPathname
          }
        });
        
        console.log('✅ データベースにBlob情報更新完了');
      }
    } catch (vercelBlobError) {
      console.error('⚠️ Vercel Blob保存エラー (データベース保存は成功):', vercelBlobError);
      // Vercel Blobの保存に失敗してもデータベース保存は成功しているので、エラーを投げない
    }

    return NextResponse.json({ 
      message: '同意書が正常に保存されました',
      consentFormId: consentForm.id,
      filename: consentForm.filename,
      vercelBlobUrl,
      vercelBlobPathname
    })

  } catch (error) {
    console.error('❌ Error saving consent form:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}