import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  console.log('=== API /consent-forms POST Debug ===');
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File
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
      });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // PDFファイルの内容を取得
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // アップロードディレクトリの作成（環境に応じて切り替え）
    const uploadDir = process.env.NODE_ENV === 'production' 
      ? path.join('/home/ewuzoeka', 'consent-forms')
      : path.join(process.cwd(), 'uploads', 'consent-forms')
    
    try {
      await fs.access(uploadDir)
    } catch {
      await fs.mkdir(uploadDir, { recursive: true })
    }

    // ファイル名を生成（日付とユーザーIDを含む）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `consent-form-${userId}-${timestamp}.pdf`
    const filepath = path.join(uploadDir, filename)

    // ファイルをサーバーに保存
    console.log('💾 Saving file to:', filepath);
    await fs.writeFile(filepath, buffer)
    console.log('✅ File saved successfully');

    // データベースに保存情報を記録
    console.log('💾 Updating user consent in database...');
    await prisma.user.update({
      where: { id: userId },
      data: {
        consentAgreedAt: new Date(),
        // 必要に応じて同意書ファイルパスを保存するフィールドを追加
      },
    })
    console.log('✅ Database updated successfully');

    // 同意書ファイル情報をデータベースに保存（オプション）
    // このためには新しいConsentFormテーブルを作成する必要があります
    /*
    await prisma.consentForm.create({
      data: {
        userId: userId,
        customerName: customerName,
        customerEmail: customerEmail,
        filePath: filepath,
        filename: filename,
        uploadedAt: new Date(),
      },
    })
    */

    console.log('✅ Consent form processing completed:', {
      filename,
      filepath,
      userId,
      customerName
    });

    return NextResponse.json({ 
      success: true, 
      message: '同意書がサーバーに保存されました',
      filename: filename 
    })

  } catch (error) {
    console.error('Error saving consent form:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    const uploadDir = process.env.NODE_ENV === 'production' 
      ? path.join('/home/ewuzoeka', 'consent-forms')
      : path.join(process.cwd(), 'uploads', 'consent-forms')
    const filepath = path.join(uploadDir, filename)

    try {
      const file = await fs.readFile(filepath)
      
      return new NextResponse(file, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } catch (error) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

  } catch (error) {
    console.error('Error retrieving consent form:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}