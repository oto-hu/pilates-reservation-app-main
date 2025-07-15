import { google } from 'googleapis';
import { Readable } from 'stream';

export class GoogleDriveService {
  private drive: any;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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

  // 日付ベースのフォルダ構造を作成
  async createDateBasedFolder(date: Date): Promise<string> {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const baseFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!baseFolderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set');
    }

    try {
      // 年フォルダの確認/作成
      const yearFolderName = `${year}年`;
      let yearFolderId: string;
      
      const yearFiles = await this.listFiles(baseFolderId);
      const existingYearFolder = yearFiles.find(file => file.name === yearFolderName);
      
      if (existingYearFolder) {
        yearFolderId = existingYearFolder.id;
      } else {
        yearFolderId = await this.createFolder(yearFolderName, baseFolderId);
      }

      // 月フォルダの確認/作成
      const monthFolderName = `${month}月`;
      let monthFolderId: string;
      
      const monthFiles = await this.listFiles(yearFolderId);
      const existingMonthFolder = monthFiles.find(file => file.name === monthFolderName);
      
      if (existingMonthFolder) {
        monthFolderId = existingMonthFolder.id;
      } else {
        monthFolderId = await this.createFolder(monthFolderName, yearFolderId);
      }

      return monthFolderId;
    } catch (error) {
      console.error('Date-based folder creation error:', error);
      throw new Error('Date-based folder creation failed');
    }
  }
}

export const googleDriveService = new GoogleDriveService();