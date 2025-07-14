import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isProduction = process.env.ENABLE_SERVER_STORAGE === 'true' || 
                        process.env.VERCEL_ENV === 'production' || 
                        process.env.NODE_ENV === 'production'
    
    const uploadDir = isProduction
      ? path.join('/home/ewuzoeka', 'consent-forms')
      : path.join(process.cwd(), 'uploads', 'consent-forms')
    
    try {
      const files = await fs.readdir(uploadDir)
      const pdfFiles = files.filter(file => file.endsWith('.pdf'))
      
      const consentForms = await Promise.all(
        pdfFiles.map(async (filename) => {
          const filePath = path.join(uploadDir, filename)
          const stats = await fs.stat(filePath)
          
          // ファイル名から情報を抽出（例: consent-form-userId-timestamp.pdf）
          const parts = filename.replace('.pdf', '').split('-')
          const userId = parts[2] || 'unknown'
          
          // 実際のアプリケーションでは、ここでデータベースからユーザー情報を取得
          // 今回は簡単な実装として、ファイル名から基本情報を取得
          return {
            filename,
            customerName: `User ${userId}`, // 実際はDBから取得
            customerEmail: `user${userId}@example.com`, // 実際はDBから取得
            userId,
            uploadedAt: stats.mtime.toISOString(),
          }
        })
      )

      // 日付でソート（新しい順）
      consentForms.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )

      return NextResponse.json(consentForms)
    } catch (error) {
      // アップロードディレクトリが存在しない場合
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json([])
      }
      throw error
    }

  } catch (error) {
    console.error('Error fetching consent forms:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}