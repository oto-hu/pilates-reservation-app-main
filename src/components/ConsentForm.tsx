'use client'

import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface ConsentFormProps {
  onConsentComplete: (pdfBlob: Blob) => void;
}

export default function ConsentForm({ onConsentComplete }: ConsentFormProps) {
  // 統一された署名フォーム用の状態
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  
  // 未成年者用の追加状態
  const [minorName, setMinorName] = useState('');
  const [minorDate, setMinorDate] = useState('');
  const sigPadMinor = useRef<any>(null);
  const sigPad = useRef<any>(null); // 一つの署名欄
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [pdfDownloaded, setPdfDownloaded] = useState<boolean>(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // ページ読み込み時にスクロールを上部に固定とモバイル検出
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // モバイルデバイス判定
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
  }, []);

  // 署名パッドの設定を最適化
  useEffect(() => {
    const optimizeSignaturePad = (sigPadRef: any) => {
      if (sigPadRef.current) {
        const canvas = sigPadRef.current.getCanvas();
        const context = canvas.getContext('2d');
        
        // 高DPIディスプレイ対応
        const devicePixelRatio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        
        context.scale(devicePixelRatio, devicePixelRatio);
        
        // 描画品質を向上
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.imageSmoothingEnabled = true;
        
        // タッチイベントの最適化
        canvas.style.touchAction = 'none';
        canvas.style.msTouchAction = 'none';
      }
    };

    // 少し遅延させてDOMが完全に読み込まれてから実行
    const timer = setTimeout(() => {
      optimizeSignaturePad(sigPad);
      optimizeSignaturePad(sigPadMinor);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 署名済みPDFを作成してダウンロード
  const handleDownload = async () => {
    if (!agreed1 || !agreed2) {
      return setError('同意書と会員会則の両方に同意していただく必要があります');
    }
    // 署名チェック（より安全な方法）
    if (!sigPad.current) {
      return setError('署名パッドが初期化されていません');
    }
    
    // 未成年者の場合、本人の署名もチェック
    if (isMinor && !sigPadMinor.current) {
      return setError('未成年者の署名パッドが初期化されていません');
    }
    
    // 空の署名をチェック
    const canvas = sigPad.current.getCanvas();
    const ctx = canvas.getContext('2d');
    
    const isCanvasEmpty = !ctx.getImageData(0, 0, canvas.width, canvas.height).data.some((channel: number) => channel !== 0);
    
    if (isCanvasEmpty) {
      return setError('署名が必要です');
    }
    
    // 未成年者の場合、本人の署名もチェック
    if (isMinor) {
      const canvasMinor = sigPadMinor.current.getCanvas();
      const ctxMinor = canvasMinor.getContext('2d');
      const isCanvasMinorEmpty = !ctxMinor.getImageData(0, 0, canvasMinor.width, canvasMinor.height).data.some((channel: number) => channel !== 0);
      
      if (isCanvasMinorEmpty) {
        return setError('未成年者の署名が必要です');
      }
    }
    
    if (!date) {
      return setError('日付が必要です');
    }
    if (!name) {
      return setError('お名前が必要です');
    }
    
    // 未成年者の場合、本人の情報もチェック
    if (isMinor && (!minorDate || !minorName)) {
      return setError('未成年者の日付とお名前が必要です');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('PDF作成開始...');
      
      // 新しいPDFドキュメントを作成
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // 日本語テキストを画像化して描画する関数
      const createTextImage = (text: string, fontSize = 20, fontWeight = 'normal') => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        
        canvas.width = 600;
        canvas.height = fontSize + 10;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'black';
        ctx.font = `${fontWeight} ${fontSize}px 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 5, canvas.height / 2);
        
        return canvas.toDataURL('image/png');
      };
      
      // 1ページ目：同意書
      const page1 = pdfDoc.addPage([595, 842]);
      let yPosition = 800;
      const margin = 50;

      // タイトル
      const titleImg1 = createTextImage('ピラティスサロンPreal(プリール)', 16, 'bold');
      if (titleImg1) {
        const titlePng1 = await pdfDoc.embedPng(titleImg1);
        page1.drawImage(titlePng1, { x: margin, y: yPosition - 20, width: 300, height: 20 });
      }
      yPosition -= 30;

      const titleImg2 = createTextImage('グループレッスン', 14, 'bold');
      if (titleImg2) {
        const titlePng2 = await pdfDoc.embedPng(titleImg2);
        page1.drawImage(titlePng2, { x: margin, y: yPosition - 20, width: 200, height: 20 });
      }
      yPosition -= 50;

      const titleImg3 = createTextImage('【同意書(入会後も適応)】', 14, 'bold');
      if (titleImg3) {
        const titlePng3 = await pdfDoc.embedPng(titleImg3);
        page1.drawImage(titlePng3, { x: margin, y: yPosition - 20, width: 250, height: 20 });
      }
      yPosition -= 40;

      // 同意書の内容
      const consentItems = [
        '●自己の体調・けがに万全の注意を払います。',
        '●内科疾患(高血圧・てんかん)、循環器疾患(心臓病・ぺースメーカー)など',
        '運動に対しリスク管理が必要と判断される疾患や事項がある場合は、必ず申し出ます。',
        '●その他通院中の疾患や報告が必要な事項がある場合は必ず医師から許可を得た上で参加します。',
        '●レッスン中に体調不良や身体の違和感が生じた場合、速やかに報告します',
        '●状況に応じてインストラクターがレッスン中止の判断をした場合、必ず指示に従います。',
        '●インストラクターが必要と判断した場合、お身体に触れる場合がある事を承諾します。',
        '●自己所有物の破損・紛失・盗難や事故・ケガに関しサロン・インストラクター',
        '及び開催場所管理者など運営者及び指導者に対するいかなる訴求・訴訟・',
        'その他一切の責任を追及しません。',
        '●施設内や周辺で勧誘行為(チラシ配りや他お客様へのお声がけなど)はしない事を承諾します。',
      ];

      for (const item of consentItems) {
        const itemImg = createTextImage(item, 10);
        if (itemImg) {
          const itemPng = await pdfDoc.embedPng(itemImg);
          page1.drawImage(itemPng, { x: margin, y: yPosition - 12, width: 400, height: 12 });
        }
        yPosition -= 16;
      }

      yPosition -= 20;
      const endImg = createTextImage('以上', 10);
      if (endImg) {
        const endPng = await pdfDoc.embedPng(endImg);
        page1.drawImage(endPng, { x: margin, y: yPosition - 12, width: 50, height: 12 });
      }
      yPosition -= 30;

      const signText1 = isMinor 
        ? '私は未成年者の親権者として、貴サロンのグループレッスン受講に際し上記事項に同意した為、'
        : '私は、貴サロンのグループレッスン受講に際し上記事項に同意した為、';
      const signImg1 = createTextImage(signText1, 10, 'bold');
      if (signImg1) {
        const signPng1 = await pdfDoc.embedPng(signImg1);
        page1.drawImage(signPng1, { x: margin, y: yPosition - 12, width: 350, height: 12 });
      }
      yPosition -= 16;

      const signImg2 = createTextImage('本書に署名致します。', 10, 'bold');
      if (signImg2) {
        const signPng2 = await pdfDoc.embedPng(signImg2);
        page1.drawImage(signPng2, { x: margin, y: yPosition - 12, width: 200, height: 12 });
      }
      yPosition -= 40;

      // 署名エリア（統一）
      const dateImg = createTextImage(`日付: ${date}`, 12);
      if (dateImg) {
        const datePng = await pdfDoc.embedPng(dateImg);
        page1.drawImage(datePng, { x: margin, y: yPosition - 12, width: 200, height: 12 });
      }
      yPosition -= 25;

      const nameImg = createTextImage(`氏名: ${name}`, 12);
      if (nameImg) {
        const namePng = await pdfDoc.embedPng(nameImg);
        page1.drawImage(namePng, { x: margin, y: yPosition - 12, width: 250, height: 12 });
      }

      const signatureLabel = createTextImage('署名:', 12);
      if (signatureLabel) {
        const signatureLabelPng = await pdfDoc.embedPng(signatureLabel);
        page1.drawImage(signatureLabelPng, { x: 350, y: yPosition + 8, width: 60, height: 12 });
      }

      // 署名画像を埋め込み
      const sigImg = sigPad.current.getCanvas().toDataURL('image/png');
      const pngImage = await pdfDoc.embedPng(sigImg);
      page1.drawImage(pngImage, { x: 300, y: yPosition - 50, width: 240, height: 80 });

      // 未成年者の場合、本人の署名も追加
      if (isMinor) {
        yPosition -= 60;
        
        const minorDateImg1 = createTextImage(`未成年者日付: ${minorDate}`, 12);
        if (minorDateImg1) {
          const minorDatePng1 = await pdfDoc.embedPng(minorDateImg1);
          page1.drawImage(minorDatePng1, { x: margin, y: yPosition - 12, width: 200, height: 12 });
        }
        yPosition -= 25;

        const minorNameImg1 = createTextImage(`未成年者氏名: ${minorName}`, 12);
        if (minorNameImg1) {
          const minorNamePng1 = await pdfDoc.embedPng(minorNameImg1);
          page1.drawImage(minorNamePng1, { x: margin, y: yPosition - 12, width: 250, height: 12 });
        }
        
        const minorSignatureLabel1 = createTextImage('未成年者署名:', 12);
        if (minorSignatureLabel1) {
          const minorSignatureLabelPng1 = await pdfDoc.embedPng(minorSignatureLabel1);
          page1.drawImage(minorSignatureLabelPng1, { x: 350, y: yPosition + 8, width: 100, height: 12 });
        }

        // 未成年者の署名画像を埋め込み
        const sigImgMinor = sigPadMinor.current.getCanvas().toDataURL('image/png');
        const pngImageMinor = await pdfDoc.embedPng(sigImgMinor);
        page1.drawImage(pngImageMinor, { x: 300, y: yPosition - 50, width: 240, height: 80 });
      }

      // 2ページ目：会員会則
      const page2 = pdfDoc.addPage([595, 842]);
      yPosition = 800;

      const rulesTitle = createTextImage('【会員会則】', 14, 'bold');
      if (rulesTitle) {
        const rulesTitlePng = await pdfDoc.embedPng(rulesTitle);
        page2.drawImage(rulesTitlePng, { x: margin, y: yPosition - 20, width: 150, height: 20 });
      }
      yPosition -= 40;

      const rulesSubtitle = createTextImage('ピラティスサロンPrealが運営するスタジオでのグループレッスン規約', 12, 'bold');
      if (rulesSubtitle) {
        const rulesSubtitlePng = await pdfDoc.embedPng(rulesSubtitle);
        page2.drawImage(rulesSubtitlePng, { x: margin, y: yPosition - 15, width: 400, height: 15 });
      }
      yPosition -= 40;

      // 会員会則の内容
      const rulesItems = [
        '●入会資格について',
        '医師等により運動を禁じられている・妊娠中・暴力団関係者',
        '感染症および感染性のある皮膚病がある・現在18歳未満',
        '同意書・会員会則に記載の内容に同意できない',
        '',
        '●レッスンに関して',
        'チケット残数は会員ログイン後にご確認をお願い致します。',
        'チケットが残っている状態のみレッスンを受講する事ができます。',
        'キャンセルはレッスン予約日の前日21時00分までにお願い致します。',
        '上記時間を過ぎてのキャンセルは100％チャージ(1回分消化)となります。',
        '当日キャンセルも同様に100％チャージ(1回分消化)となります。',
        '入室はレッスン開始時間の10分前から可能です。',
        '翌月分の予約受付は毎月10日9:00から開始となります。',
        '1日最大1レッスンまでとなります。',
        '',
        '●プランについて',
        'いかなる理由においても購入後の払い戻しは一切致しかねます。',
        'チケット最終消化日から6か月以上プランを更新されない場合は自動退会となります。',
        '再入会の際は別途入会金5,000円が発生します。',
        '',
        '●損害賠償責任免責',
        '会員がレッスン中又はスタジオ周辺で受けた損害に対して',
        '当サロン・インストラクター及び開催場所管理者は一切の責任を負いません。',
        '',
        '●同意',
        '虚偽申告が発覚又は会則違反の際に退会処分とする場合がございます。',
        '会則の内容は事前予告なく変更される場合があります。',
      ];

      for (const item of rulesItems) {
        if (item === '') {
          yPosition -= 8;
        } else {
          const itemImg = createTextImage(item, 10);
          if (itemImg) {
            const itemPng = await pdfDoc.embedPng(itemImg);
            page2.drawImage(itemPng, { x: margin, y: yPosition - 12, width: 400, height: 12 });
          }
          yPosition -= 14;
        }
      }

      yPosition -= 20;
      const agreeText1 = isMinor 
        ? '私は未成年者の親権者として会則に同意し規則を厳守致します。'
        : '私は会則に同意し規則を厳守致します。';
      const agreeImg1 = createTextImage(agreeText1, 10, 'bold');
      if (agreeImg1) {
        const agreePng1 = await pdfDoc.embedPng(agreeImg1);
        page2.drawImage(agreePng1, { x: margin, y: yPosition - 12, width: 350, height: 12 });
      }
      yPosition -= 16;

      // 未成年者の場合のみ2行目を表示
      if (isMinor) {
        const agreeImg2 = createTextImage('私は未成年者である会員の親権者として会則に同意します。', 10, 'bold');
        if (agreeImg2) {
          const agreePng2 = await pdfDoc.embedPng(agreeImg2);
          page2.drawImage(agreePng2, { x: margin, y: yPosition - 12, width: 450, height: 12 });
        }
        yPosition -= 16;
      }
      yPosition -= 24;

      // 署名エリア2（同じ署名データを使用）
      const dateImg2 = createTextImage(`日付: ${date}`, 12);
      if (dateImg2) {
        const datePng2 = await pdfDoc.embedPng(dateImg2);
        page2.drawImage(datePng2, { x: margin, y: yPosition - 12, width: 200, height: 12 });
      }
      yPosition -= 25;

      const nameImg2 = createTextImage(`氏名: ${name}`, 12);
      if (nameImg2) {
        const namePng2 = await pdfDoc.embedPng(nameImg2);
        page2.drawImage(namePng2, { x: margin, y: yPosition - 12, width: 250, height: 12 });
      }
      
      const signatureLabel2 = createTextImage('署名:', 12);
      if (signatureLabel2) {
        const signatureLabelPng2 = await pdfDoc.embedPng(signatureLabel2);
        page2.drawImage(signatureLabelPng2, { x: 350, y: yPosition + 8, width: 60, height: 12 });
      }

      // 署名画像2を埋め込み（同じ署名データを使用）
      const sigImg2 = sigPad.current.getCanvas().toDataURL('image/png');
      const pngImage2 = await pdfDoc.embedPng(sigImg2);
      page2.drawImage(pngImage2, { x: 300, y: yPosition - 50, width: 240, height: 80 });

      // 未成年者の場合、本人の署名も追加
      if (isMinor) {
        yPosition -= 60;
        
        const minorDateImg2 = createTextImage(`未成年者日付: ${minorDate}`, 12);
        if (minorDateImg2) {
          const minorDatePng2 = await pdfDoc.embedPng(minorDateImg2);
          page2.drawImage(minorDatePng2, { x: margin, y: yPosition - 12, width: 200, height: 12 });
        }
        yPosition -= 25;

        const minorNameImg2 = createTextImage(`未成年者氏名: ${minorName}`, 12);
        if (minorNameImg2) {
          const minorNamePng2 = await pdfDoc.embedPng(minorNameImg2);
          page2.drawImage(minorNamePng2, { x: margin, y: yPosition - 12, width: 250, height: 12 });
        }
        
        const minorSignatureLabel2 = createTextImage('未成年者署名:', 12);
        if (minorSignatureLabel2) {
          const minorSignatureLabelPng2 = await pdfDoc.embedPng(minorSignatureLabel2);
          page2.drawImage(minorSignatureLabelPng2, { x: 350, y: yPosition + 8, width: 100, height: 12 });
        }

        // 未成年者の署名画像を埋め込み
        const sigImgMinor2 = sigPadMinor.current.getCanvas().toDataURL('image/png');
        const pngImageMinor2 = await pdfDoc.embedPng(sigImgMinor2);
        page2.drawImage(pngImageMinor2, { x: 300, y: yPosition - 50, width: 240, height: 80 });
      }

      // PDF保存とダウンロード
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
      
      // デバイス判定
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // スマホの場合：ダウンロード処理をスキップしてすぐに次のステップへ
        console.log('📱 モバイルデバイス：PDFダウンロードをスキップ');
        
        // PDFはサーバー保存のみで、ダウンロード処理は行わない
        // ユーザーには「PDFはメールで送信されます」と伝える
        alert('✅ 署名完了しました！\n\n📧  レッスン予約を完了しています...');
        
      } else {
        // PCの場合：従来通りダウンロード
        console.log('🖥️ デスクトップ：PDFダウンロード実行');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '署名済み_グループレッスン同意書.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // 成功メッセージを表示
        const successMessage = `
✅ 署名済みPDFのダウンロードが完了しました！

📧 確認メールを送信しています...
🔄 会員登録とレッスン予約を処理中です...

しばらくお待ちください。
        `;
        alert(successMessage);
      }

      console.log('✅ PDF作成完了 - 親コンポーネントに渡します');

      setLoading(false);
      setError(null);
      setPdfDownloaded(true);
      setPdfBlob(blob);
      
      // デバイス別の遷移処理
      if (isMobile) {
        // スマホ：即座にレッスン予約完了ページに遷移
        console.log('📱 スマホ - 即座にレッスン予約完了ページに遷移');
        setTimeout(() => {
          onConsentComplete(blob);
        }, 500); // 0.5秒遅延
        
      } else {
        // PC：従来通りの遅延
        console.log('🖥️ PC - 従来通りの遅延でレッスン予約完了ページに遷移');
        setTimeout(() => {
          onConsentComplete(blob);
        }, 1000); // 1秒遅延
      }
    } catch (err) {
      console.error('PDF処理エラー:', err);
      setError('PDFの処理中にエラーが発生しました: ' + (err as Error).message);
      setLoading(false);
    }
  };

  // 手動でレッスン完了に進む関数
  const handleManualComplete = () => {
    if (pdfBlob) {
      console.log('🔄 手動でレッスン完了に進む');
      onConsentComplete(pdfBlob);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <h1 className="text-2xl font-bold mb-6 text-center">グループレッスン同意書</h1>
      <div className="text-sm space-y-3 mb-6"></div>
      <p className="text-center">お手数ですが、ご一読下さい。</p>
      
      {/* 同意書の内容 */}
      <div className="mb-8 p-8 border border-gray-300 rounded-lg bg-gray-50">
        <h2 className="text-xl font-bold mb-4">ピラティスサロンPreal(プリール) グループレッスン</h2>
        
        <h3 className="text-lg font-bold mb-4">【同意書(入会後も適応)】</h3>
        <div className="text-sm space-y-3 mb-6">
          <p>●自己の体調・けがに万全の注意を払います。</p>
          <p>●内科疾患(高血圧・てんかん)、循環器疾患(心臓病・ぺースメーカー)など運動に対しリスク管理が必要と判断される疾患や事項(現病歴・既往歴・手術歴・妊娠など)がある場合は、必ず申し出ます。</p>
          <p>●その他通院中の疾患や報告が必要な事項がある場合は必ず医師から許可を得た上で参加します。</p>
          <p>●レッスン中に体調不良や身体の違和感が生じた場合、速やかに報告します。</p>
          <p>●状況に応じてインストラクターがレッスン中止の判断をした場合、必ず指示に従います。</p>
          <p>●インストラクターが必要だと判断した場合に、お身体に触れる場合がある事を承諾します。</p>
          <p>●自己所有物の破損・紛失・盗難や事故・ケガに関しサロン・インストラクター及び開催場所管理者など運営者及び指導者に対するいかなる訴求・訴訟・その他一切の責任を追及しません。</p>
          <p>●施設内や周辺で勧誘行為(チラシ配りや他お客様へのお声がけなど)はしない事を承諾します。</p>
        </div>
        
        <p className="font-bold text-center">私は、貴サロンのグループレッスン受講に際し上記事項に同意した為、本書に署名致します。</p>
      </div>
      <p className="font-bold mb-4">※【会員会則】はご入会される方へ向けて当日現地にて再度お伝え致します。</p>

      {/* 会員会則の内容 */}
      <div className="mb-8 p-8 border border-gray-300 rounded-lg bg-gray-50">
        <h3 className="text-lg font-bold mb-4">【会員会則】</h3>
        <p className="font-bold mb-4">ピラティスサロンPrealが運営するスタジオ・提携するスタジオでのグループレッスン関する規約になります。</p>
        
        <div className="text-sm space-y-3 mb-6">
          <p className="font-semibold">●入会資格について　下記項目に該当する場合、原則としてご入会できません。</p>
          <p className="ml-4">・医師等により運動を禁じられている</p>
          <p className="ml-4">・妊娠中</p>
          <p className="ml-4">・暴力団関係者</p>
          <p className="ml-4">・感染症および感染性のある皮膚病がある</p>
          <p className="ml-4">・現在18歳未満(保護者から同意が得られる場合は入会可)</p>
          <p className="ml-4">・同意書・会員会則に記載の内容に同意できない</p>
          <p className="ml-4">・虚偽申告が発覚又は会則及びコンプライアンスに違反した際に退会処分にされる事を了承できない</p>
          
          <p className="font-semibold mt-4">●レッスンに関して</p>
          <p className="ml-4">・チケット残数は会員ログイン後に名ページにてご確認をお願い致します。万が一お客様の会員情報が消失した場合、チケット情報に関しては当サロンの記録情報に準じます。</p>
          <p className="ml-4">・チケットが残っている状態のみレッスンを受講する事ができます。</p>
          <p className="ml-4">・キャンセルはレッスン予約日の前日21時00分までにキャンセル処理をお願い致します。いかなる理由においても上記時間を過ぎてのキャンセルは100％チャージ(1回分消化)となります。</p>
          <p className="ml-4">・当日キャンセルも同様に、いかなる理由においても100％チャージ(1回分消化)となります。</p>
          <p className="ml-4">・レッスン当日に事前連絡なく開始時間を過ぎた場合も自動キャンセル扱い（1回分消化）となります。</p>
          <p className="ml-4">・入室はレッスン開始時間の10分前から可能です。それより前からの入室はできません。</p>
          <p className="ml-4">・※体験時のみ開始時間の15分前に集合となります。</p>
          <p className="ml-4">・翌月分の予約受付は毎月10日9:00から開始となります。</p>
          <p className="ml-4">・1日最大1レッスンまでとなります。</p>
          <p className="ml-4">・当日にスタジオならびインストラクター都合により急遽休講する場合やレッスン内容や定員数などレッスンに関する事項を変更する場合がございます。</p>
          <p className="ml-4">・レッスンスケジュールは月によりレッスン時間、レッスンレベル、レッスンの種類、レッスンの量が変動する場合がございます。</p>
          
          <p className="font-semibold mt-4">●プランについて</p>
          <p className="ml-4">・いかなる理由においても購入後の払い戻しは一切致しかねます。</p>
          <p className="ml-4">・チケット最終消化日から6か月以上プランを更新されない場合は自動退会となります。</p>
          <p className="ml-4">・再入会の際は別途入会金5,000円が発生します。</p>

          <p className="font-semibold mt-4">●休会に関して</p>
          <p className="ml-4">・休会を希望する月の前月15日までの申請にて適応となります。(例)8/1から休会希望→7/15までに申請会場にて、会員ご本人様による書面でのお手続きが必要となります。</p>
          <p className="ml-4">・休会期間は最長6か月となります。休会期間の日数分が有効期限から延長されます。</p>
          
          <p className="font-semibold mt-4">●損害賠償責任免責</p>
          <p className="ml-4">・会員が当サロンが運営するスタジオ・提携するスタジオでのレッスン中、又は左記スタジオ周辺で受けた損害に対して当サロン・インストラクター及び開催場所管理者は損害に関する一切の責任を負いません。</p>
          <p className="ml-4">・自己所有物の破損、紛失、盗難や事故、怪我に対する請求、訴訟その他一切の責任を追及できません。</p>

          <p className="font-semibold mt-4">●同意</p>
          <p className="ml-4">・虚偽申告が発覚又は会則及びコンプライアンスに違反した際に退会処分とさせて頂く場合がございます。</p>
          <p className="ml-4">・サロンの判断により、事前予告なく会則の内容を変更・追加・削除(以下「変更内容」)される事があります。その際、変更内容や適用開始時期をスタジオ所定の方法で告知するものとします。会員は変更内容に同意したものとみなされます。</p>
        </div>
        
        <div className="space-y-2">
          <p className="font-bold">
            {isMinor ? '私は未成年者の親権者として会則に同意し規則を厳守致します。' : '私は会則に同意し規則を厳守致します。'}
          </p>
          {isMinor && (
            <p className="font-bold">私は未成年者である会員の親権者として会則に同意します。</p>
          )}
        </div>
      </div>

      {/* 署名セクション（希望の順序） */}
      <div className="mb-8 p-6 border border-gray-200 rounded">
        <h3 className="font-semibold mb-4 text-lg">署名</h3>
        
        {/* 1. 同意書チェック */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={agreed1}
              onChange={e => setAgreed1(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">
              上記同意書の内容に同意します
            </span>
          </label>
        </div>

        {/* 2. 会員会則チェック */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={agreed2}
              onChange={e => setAgreed2(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">
              会員会則の内容に同意します
            </span>
          </label>
        </div>

        {/* 3. 日付 */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">日付</label>
          <input
            type="text"
            placeholder="例: 2025.07.08"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded w-full"
          />
        </div>

        {/* 4. 名前 */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">お名前</label>
          <input
            type="text"
            placeholder="例: 山田太郎"
            value={name}
            onChange={e => setName(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded w-full"
          />
        </div>

        {/* 5. 直筆署名 */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">直筆署名</label>
          <div className="relative">
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
              <SignatureCanvas
                ref={sigPad}
                penColor="black"
                minWidth={1}
                maxWidth={3}
                velocityFilterWeight={0.7}
                throttle={16}
                canvasProps={{
                  width: 800, 
                  height: isMobile ? 800 : 200, 
                  className: 'w-full h-full touch-none',
                  style: {
                    width: '100%',
                    height: isMobile ? '800px' : '200px',
                    display: 'block',
                    touchAction: 'none'
                  }
                }}
              />
            </div>
            <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">
              ここに署名してください
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <button 
              onClick={() => sigPad.current?.clear()} 
              className="text-sm text-blue-500 hover:text-blue-700 px-2 py-1 rounded border border-blue-300 hover:bg-blue-50"
            >
              クリア
            </button>
          </div>
        </div>

        {/* 6. 18歳未満チェック */}
        <div className="mb-6 p-6 border border-orange-200 rounded bg-orange-50">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isMinor}
              onChange={e => setIsMinor(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium text-orange-800">
              私は18歳未満です（親権者の同意が必要です）
            </span>
          </label>
        </div>
      </div>

      {/* 未成年者の署名セクション */}
      {isMinor && (
        <div className="mb-8 p-6 border border-blue-200 rounded bg-blue-50">
          <h3 className="font-semibold mb-4 text-lg text-blue-800">未成年者（本人）による署名</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">日付</label>
              <input
                type="text"
                placeholder="例: 2025/07/08"
                value={minorDate}
                onChange={e => setMinorDate(e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">お名前（未成年者）</label>
              <input
                type="text"
                placeholder="例: 山田花子"
                value={minorName}
                onChange={e => setMinorName(e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded w-full"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">署名（未成年者）</label>
            <div className="relative">
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                <SignatureCanvas
                  ref={sigPadMinor}
                  penColor="black"
                  minWidth={1}
                  maxWidth={3}
                  velocityFilterWeight={0.7}
                  throttle={16}
                  canvasProps={{
                    width: 800, 
                    height: isMobile ? 800 : 200, 
                    className: 'w-full h-full touch-none',
                    style: {
                      width: '100%',
                      height: isMobile ? '800px' : '200px',
                      display: 'block',
                      touchAction: 'none'
                    }
                  }}
                />
              </div>
              <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">
                ここに署名してください
              </div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <button 
                onClick={() => sigPadMinor.current?.clear()} 
                className="text-sm text-blue-500 hover:text-blue-700 px-2 py-1 rounded border border-blue-300 hover:bg-blue-50"
              >
                クリア
              </button>
            </div>
          </div>
        </div>
      )}



      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* ダウンロードボタン */}
      <div className="text-center">
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-lg font-semibold text-blue-800 mb-2">次のステップ</h4>
          <p className="text-blue-700 text-sm">
            1. 下記ボタンをクリックして署名済みPDFをダウンロード<br/>
            ※スマホの場合はダウンロードされません。<br/>
            2. 下記ボタンをクリック後、自動的に会員登録とレッスン予約が完了します<br/>
            3. 予約完了メールがご登録アドレス宛に送信されます<br/>
          </p>
        </div>
        
        <button
          onClick={handleDownload}
          disabled={loading || pdfDownloaded}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-medium"
        >
          {loading ? '処理中...' : pdfDownloaded ? 'PDF ダウンロード完了' : '予約を完了する'}
        </button>
        
        {/* PDFダウンロード完了後の手動ボタン */}
        {pdfDownloaded && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-green-800 mb-2">会員登録とレッスン予約完了</h4>
              <p className="text-green-700 text-sm mb-4">
                会員登録とレッスン予約が完了しました。自動的にレッスン予約完了ページに進みます。<br/>
                <span className="text-orange-600 font-medium">※自動で進まない場合は、下記ボタンをクリックしてください</span>
              </p>
              <button
                onClick={handleManualComplete}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-md font-medium"
              >
                レッスン予約を完了する
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
