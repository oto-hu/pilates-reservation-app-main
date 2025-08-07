import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // データベースから同意書一覧を取得
    const consentForms = await prisma.consentForm.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedConsentForms = consentForms.map(form => ({
      id: form.id,
      filename: form.filename,
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      userId: form.userId,
      uploadedAt: form.createdAt.toISOString(),
      fileSizeKB: Math.round(form.pdfData.length / 1024)
    }))

    return NextResponse.json(formattedConsentForms)

  } catch (error) {
    console.error('Error fetching consent forms:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// 個別の同意書ダウンロード
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { consentFormId } = await request.json()
    
    if (!consentFormId) {
      return NextResponse.json({ error: 'Consent form ID is required' }, { status: 400 })
    }

    const consentForm = await prisma.consentForm.findUnique({
      where: { id: consentFormId }
    })

    if (!consentForm) {
      return NextResponse.json({ error: 'Consent form not found' }, { status: 404 })
    }

    // PDFファイルをレスポンスとして返す
    return new NextResponse(new Uint8Array(consentForm.pdfData), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${consentForm.filename}"`,
        'Content-Length': consentForm.pdfData.length.toString()
      }
    })

  } catch (error) {
    console.error('Error downloading consent form:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}