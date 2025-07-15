import { put, del, list } from '@vercel/blob'

export class VercelBlobService {
  /**
   * PDFファイルをVercel Blobにアップロード
   */
  async uploadFile(
    file: Buffer,
    customerName: string,
    customerEmail: string,
    date?: string
  ): Promise<{ url: string; pathname: string }> {
    try {
      const fileName = this.generateConsentFileName(customerName, date)
      const pathname = `consent-forms/${fileName}`
      
      console.log('=== Vercel Blob Upload ===')
      console.log('Customer Name:', customerName)
      console.log('Customer Email:', customerEmail)
      console.log('File Name:', fileName)
      console.log('Pathname:', pathname)
      console.log('File Size:', file.length)
      
      const blob = await put(pathname, file, {
        access: 'public',
        contentType: 'application/pdf',
      })
      
      console.log('✅ Vercel Blob upload successful')
      console.log('URL:', blob.url)
      console.log('Pathname:', blob.pathname)
      
      return {
        url: blob.url,
        pathname: blob.pathname
      }
    } catch (error) {
      console.error('❌ Vercel Blob upload error:', error)
      throw new Error(`Vercel Blob upload failed: ${error}`)
    }
  }
  
  /**
   * 同意書のファイル名を生成
   */
  private generateConsentFileName(customerName: string, date?: string): string {
    const currentDate = date || new Date().toISOString().split('T')[0]
    const timestamp = Date.now()
    const sanitizedName = customerName.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_')
    return `同意書_${sanitizedName}_${currentDate}_${timestamp}.pdf`
  }
  
  /**
   * ファイルを削除
   */
  async deleteFile(pathname: string): Promise<void> {
    try {
      await del(pathname)
      console.log('✅ File deleted from Vercel Blob:', pathname)
    } catch (error) {
      console.error('❌ Vercel Blob delete error:', error)
      throw new Error(`Failed to delete file: ${error}`)
    }
  }
  
  /**
   * ファイル一覧を取得
   */
  async listFiles(prefix?: string): Promise<any[]> {
    try {
      const { blobs } = await list({
        prefix: prefix || 'consent-forms/',
      })
      return blobs
    } catch (error) {
      console.error('❌ Vercel Blob list error:', error)
      throw new Error(`Failed to list files: ${error}`)
    }
  }
}

export const vercelBlobService = new VercelBlobService()