import { google } from 'googleapis';
import { Readable } from 'stream';

export class GoogleDriveService {
  private drive: any;

  constructor() {
    // 環境変数の確認
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Google Drive credentials are not configured');
    }

    // private_keyの処理を改善
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    // 改行文字の正規化（複数のパターンに対応）
    privateKey = privateKey
      .replace(/\\n/g, '\n')
      .replace(/\\\\/g, '\\')
      .trim();

    // Base64エンコードされている場合のデコード処理
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      try {
        privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
      } catch (error) {
        console.error('Private key decode error:', error);
      }
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string = 'application/pdf'
  ): Promise<string> {
    try {
      const fileMetadata = {
        name: fileName,
        parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : undefined,
      };

      const media = {
        mimeType,
        body: Readable.from(fileBuffer),
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id',
      });

      return response.data.id;
    } catch (error) {
      console.error('Google Drive upload error:', error);
      throw new Error('Google Drive upload failed');
    }
  }

  async createFolder(folderName: string, parentFolderId?: string): Promise<string> {
    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined,
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id',
      });

      return response.data.id;
    } catch (error) {
      console.error('Google Drive folder creation error:', error);
      throw new Error('Google Drive folder creation failed');
    }
  }

  async listFiles(folderId?: string): Promise<any[]> {
    try {
      const query = folderId ? `'${folderId}' in parents` : undefined;
      
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, createdTime, size)',
        orderBy: 'createdTime desc',
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Google Drive list files error:', error);
      throw new Error('Google Drive list files failed');
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({ fileId });
    } catch (error) {
      console.error('Google Drive delete error:', error);
      throw new Error('Google Drive delete failed');
    }
  }

  // 同意書専用のファイル名生成
  generateConsentFileName(customerName: string, date: string): string {
    const formattedDate = date.replace(/\//g, '-');
    const timestamp = new Date().toISOString().split('T')[0];
    return `同意書_${customerName}_${formattedDate}_${timestamp}.pdf`;
  }

  // 日付ベースのフォルダ構造を作成（簡略化版）
  async createDateBasedFolder(date: Date): Promise<string> {
    const baseFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!baseFolderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set');
    }

    // 複雑なフォルダ構造作成でエラーが発生する場合は、ベースフォルダに直接保存
    console.log('Using base folder for file storage:', baseFolderId);
    return baseFolderId;
  }
}

export const googleDriveService = new GoogleDriveService();