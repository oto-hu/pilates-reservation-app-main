'use client'

import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default function TextConsentForm() {
  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);
  const sigPad1 = useRef<any>(null);
  const sigPad2 = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // ページ読み込み時にスクロールを上部に固定
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // 署名済みPDFを作成してダウンロード
  const handleDownload = async () => {
    if (!agreed1 || !agreed2) {
      return setError('同意書と会員会則の両方に同意していただく必要があります');
    }
    // 署名チェック（より安全な方法）
    if (!sigPad1.current || !sigPad2.current) {
      return setError('署名パッドが初期化されていません');
    }
    
    // 空の署名をチェック
    const canvas1 = sigPad1.current.getCanvas();
    const canvas2 = sigPad2.current.getCanvas();
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');
    
    const isCanvas1Empty = !ctx1.getImageData(0, 0, canvas1.width, canvas1.height).data.some((channel: number) => channel !== 0);
    const isCanvas2Empty = !ctx2.getImageData(0, 0, canvas2.width, canvas2.height).data.some((channel: number) => channel !== 0);
    
    if (isCanvas1Empty || isCanvas2Empty) {
      return setError('両方の署名が必要です');
    }
    if (!date1 || !date2) {
      return setError('両方の日付が必要です');
    }
    if (!name1 || !name2) {
      return setError('両方のお名前が必要です');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('PDF作成開始...');
      
      // 新しいPDFドキュメントを作成
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // 日本語テキストを画像として作成する関数
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
        '●内科疾患(高血圧・てんかん)、循環器疾患(心臓病・ぺースメーカー)など運動に対しリスク管理が必要と判断される疾患や事項(現病歴・既往歴・手術歴・妊娠など)がある場合は、必ず申し出ます。',
        '●その他通院中の疾患や報告が必要な事項がある場合は必ず医師から許可を得た上で参加します。',
        '●レッスン中に体調不良や身体の違和感が生じた場合、速やかに報告します',
        '●状況に応じてインストラクターがレッスン中止の判断をした場合、必ず指示に従います。',
        '●インストラクターが必要と判断した場合、お身体に触れる場合がある事を承諾します。',
        '●自己所有物の破損・紛失・盗難や事故・ケガに関しサロン・インストラクター及び開催場所管理者など運営者及び指導者に対するいかなる訴求・訴訟・その他一切の責任を追及しません。',
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

      const signImg1 = createTextImage('私は、貴サロンのグループレッスン受講に際し上記事項に同意した為、', 10, 'bold');
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

      // 署名エリア1
      const dateImg1 = createTextImage(`日付: ${date1}`, 12);
      if (dateImg1) {
        const datePng1 = await pdfDoc.embedPng(dateImg1);
        page1.drawImage(datePng1, { x: margin, y: yPosition - 12, width: 200, height: 12 });
      }
      yPosition -= 25;

      const nameImg1 = createTextImage(`氏名: ${name1}`, 12);
      if (nameImg1) {
        const namePng1 = await pdfDoc.embedPng(nameImg1);
        page1.drawImage(namePng1, { x: margin, y: yPosition - 12, width: 250, height: 12 });
      }

      const signatureLabel1 = createTextImage('署名:', 12);
      if (signatureLabel1) {
        const signatureLabelPng1 = await pdfDoc.embedPng(signatureLabel1);
        page1.drawImage(signatureLabelPng1, { x: 350, y: yPosition + 8, width: 60, height: 12 });
      }

      // 署名画像1を埋め込み
      const sigImg1 = sigPad1.current.getCanvas().toDataURL('image/png');
      const pngImage1 = await pdfDoc.embedPng(sigImg1);
      page1.drawImage(pngImage1, { x: 350, y: yPosition - 30, width: 150, height: 50 });

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
        '医師等により運動を禁じられている　・妊娠中　・暴力団関係者　・感染症および感染性のある皮膚病がある　・現在18歳未満(保護者から同意が得られる場合は入会可)',
        '同意書・会員会則に記載の内容に同意できない',
        '虚偽申告が発覚又は会則及びコンプライアンスに違反した際に退会処分にされる事を了承できない',
        '',
        '●レッスンに関して',
        'チケット残数は会員ログイン後に名ページにてご確認をお願い致します。　',
        '万が一お客様の会員情報が消失した場合、チケット情報に関しては当サロンの記録情報に準じます。',
        'チケットが残っている状態のみレッスンを受講する事ができます。',
        'キャンセルはレッスン予約日の前日21時00分までにキャンセル処理をお願い致します。',
        'いかなる理由においても上記時間を過ぎてのキャンセルは100％チャージ(1回分消化)となります。',
        '当日キャンセルも同様に、いかなる理由においても100％チャージ(1回分消化)となります。',
        'レッスン当日に事前連絡なく開始時間を過ぎた場合も自動キャンセル扱い（1回分消化）となります。',
        '入室はレッスン開始時間の10分前から可能です。それより前からの入室はできません。',
        '※体験時のみ開始時間の15分前に集合となります。',
        '翌月分の予約受付は毎月10日9:00から開始となります。',
        '1日最大1レッスンまでとなります。',
        '当日にスタジオならびインストラクター都合により急遽休講する場合やレッスン内容や定員数など',
        'レッスンに関する事項を変更する場合がございます。',
        'レッスンスケジュールは月によりレッスン時間、レッスンレベル、レッスンの種類、レッスンの量が',
        '変動する場合がございます。',
        '',
        '●プランについて',
        'いかなる理由においても購入後の払い戻しは一切致しかねます。',
        'チケット最終消化日から6か月以上プランを更新されない場合は自動退会となります。',
        '再入会の際は別途入会金5,000円が発生します。',
        '',
        '●休会に関して',
        '休会を希望する月の前月15日までの申請にて適応となります。(例)8/1から休会希望→7/15までに申請会場にて、会員ご本人様による書面でのお手続きが必要となります。',
        '休会期間は最長6か月となります。休会期間の日数分が有効期限から延長されます。',
        '',
        '●損害賠償責任免責',
        '会員が当サロンが運営するスタジオ・提携するスタジオでのレッスン中、又は左記スタジオ周辺で',
        '受けた損害に対して当サロン・インストラクター及び開催場所管理者は損害に関する一切の責任を',
        '負いません。',
        '自己所有物の破損、紛失、盗難や事故、怪我に対する請求、訴訟その他一切の責任を追及できません。',
        '●同意',
        '虚偽申告が発覚又は会則及びコンプライアンスに違反した際に退会処分とさせて頂く場合がございます。',
        'サロンの判断により、事前予告なく会則の内容を変更・追加・削除(以下「変更内容」)される事があります。その際、変更内容や適用開始時期をスタジオ所定の方法で告知するものとします。会員は変更内容に',
        '同意したものとみなされます。',
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
      const agreeImg1 = createTextImage('私は会則に同意し規則を厳守致します。', 10, 'bold');
      if (agreeImg1) {
        const agreePng1 = await pdfDoc.embedPng(agreeImg1);
        page2.drawImage(agreePng1, { x: margin, y: yPosition - 12, width: 350, height: 12 });
      }
      yPosition -= 16;

      const agreeImg2 = createTextImage('私は未成年者である会員の親権者として会則に同意します。', 10, 'bold');
      if (agreeImg2) {
        const agreePng2 = await pdfDoc.embedPng(agreeImg2);
        page2.drawImage(agreePng2, { x: margin, y: yPosition - 12, width: 450, height: 12 });
      }
      yPosition -= 40;

      // 署名エリア2
      const dateImg2 = createTextImage(`日付: ${date2}`, 12);
      if (dateImg2) {
        const datePng2 = await pdfDoc.embedPng(dateImg2);
        page2.drawImage(datePng2, { x: margin, y: yPosition - 12, width: 200, height: 12 });
      }
      yPosition -= 25;

      const nameImg2 = createTextImage(`氏名: ${name2}`, 12);
      if (nameImg2) {
        const namePng2 = await pdfDoc.embedPng(nameImg2);
        page2.drawImage(namePng2, { x: margin, y: yPosition - 12, width: 250, height: 12 });
      }

      const signatureLabel2 = createTextImage('署名:', 12);
      if (signatureLabel2) {
        const signatureLabelPng2 = await pdfDoc.embedPng(signatureLabel2);
        page2.drawImage(signatureLabelPng2, { x: 350, y: yPosition + 8, width: 60, height: 12 });
      }

      // 署名画像2を埋め込み
      const sigImg2 = sigPad2.current.getCanvas().toDataURL('image/png');
      const pngImage2 = await pdfDoc.embedPng(sigImg2);
      page2.drawImage(pngImage2, { x: 350, y: yPosition - 30, width: 150, height: 50 });

      // PDF保存とダウンロード
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '署名済み_グループレッスン同意書.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLoading(false);
      setError(null);
      alert('PDFのダウンロードが完了しました！');
    } catch (err) {
      console.error('PDF処理エラー:', err);
      setError('PDFの処理中にエラーが発生しました: ' + (err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">グループレッスン同意書</h1>
      
      {/* 同意書の内容 */}
      <div className="mb-8 p-6 border border-gray-300 rounded-lg bg-gray-50">
        <h2 className="text-xl font-bold mb-4">ピラティスサロンPreal(プリール) グループレッスン</h2>
        
        <h3 className="text-lg font-bold mb-4">【同意書(入会後も適応)】</h3>
        <div className="text-sm space-y-2 mb-6">
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

      {/* 同意書署名セクション */}
      <div className="mb-8 p-4 border border-gray-200 rounded">
        <h3 className="font-semibold mb-4 text-lg">同意書への署名</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">日付</label>
            <input
              type="text"
              placeholder="例: 2025.07.08"
              value={date1}
              onChange={e => setDate1(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">お名前</label>
            <input
              type="text"
              placeholder="例: 山田太郎"
              value={name1}
              onChange={e => setName1(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">署名</label>
          <SignatureCanvas
            ref={sigPad1}
            penColor="black"
            canvasProps={{
              width: 400, 
              height: 100, 
              className: 'border border-gray-300 rounded w-full'
            }}
          />
          <button 
            onClick={() => sigPad1.current?.clear()} 
            className="mt-2 text-sm text-blue-500 hover:text-blue-700"
          >
            クリア
          </button>
        </div>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={agreed1}
            onChange={e => setAgreed1(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm">上記同意書の内容に同意します</span>
        </label>
      </div>

      {/* 会員会則の内容 */}
      <div className="mb-8 p-6 border border-gray-300 rounded-lg bg-gray-50">
        <h3 className="text-lg font-bold mb-4">【会員会則】</h3>
        <p className="font-bold mb-4">ピラティスサロンPrealが運営するスタジオ・提携するスタジオでのグループレッスン関する規約になります。</p>
        
        <div className="text-sm space-y-2 mb-6">
          <p className="font-semibold">●入会資格について　下記項目に該当する場合、原則としてご入会できません。</p>
          <p className="ml-4">・医師等により運動を禁じられている　・妊娠中　・暴力団関係者</p>
          <p className="ml-4">・感染症および感染性のある皮膚病がある　・現在18歳未満(保護者から同意が得られる場合は入会可)</p>
          <p className="ml-4">・同意書・会員会則に記載の内容に同意できない</p>
          <p className="ml-4">・虚偽申告が発覚又は会則及びコンプライアンスに違反した際に退会処分にされる事を了承できない</p>
          
          <p className="font-semibold mt-4">●レッスンに関して</p>
          <p className="ml-4">・チケット残数は会員ログイン後に名ページにてご確認をお願い致します。万が一お客様の会員情報が消失した場合、チケット情報に関しては当サロンの記録情報に準じます。</p>
          <p className="ml-4">・チケットが残っている状態のみレッスンを受講する事ができます。</p>
          <p className="ml-4">・キャンセルはレッスン予約日の前日21時00分までにキャンセル処理をお願い致します。</p>
          <p className="ml-4">・いかなる理由においても上記時間を過ぎてのキャンセルは100％チャージ(1回分消化)となります。</p>
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
          <p className="font-bold">私は会則に同意し規則を厳守致します。</p>
          <p className="font-bold">私は未成年者である会員の親権者として会則に同意します。</p>
        </div>
      </div>

      {/* 会員会則署名セクション */}
      <div className="mb-8 p-4 border border-gray-200 rounded">
        <h3 className="font-semibold mb-4 text-lg">会員会則への署名</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">日付</label>
            <input
              type="text"
              placeholder="例: 2025/07/08"
              value={date2}
              onChange={e => setDate2(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">お名前</label>
            <input
              type="text"
              placeholder="例: 山田太郎"
              value={name2}
              onChange={e => setName2(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">署名</label>
          <SignatureCanvas
            ref={sigPad2}
            penColor="black"
            canvasProps={{
              width: 400, 
              height: 100, 
              className: 'border border-gray-300 rounded w-full'
            }}
          />
          <button 
            onClick={() => sigPad2.current?.clear()} 
            className="mt-2 text-sm text-blue-500 hover:text-blue-700"
          >
            クリア
          </button>
        </div>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={agreed2}
            onChange={e => setAgreed2(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm">上記会員会則の内容に同意します</span>
        </label>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* ダウンロードボタン */}
      <div className="text-center">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-medium"
        >
          {loading ? '処理中...' : '署名済みPDFをダウンロード'}
        </button>
      </div>
    </div>
  );
}