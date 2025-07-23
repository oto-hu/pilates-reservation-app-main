// メール通知機能（実装例）
// 実際の本番環境では、SendGrid、Nodemailer、AWS SESなどを使用してください

import nodemailer from 'nodemailer'

export interface NotificationData {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(data: NotificationData): Promise<boolean> {
  try {
    // Gmail SMTP設定
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })

    // メール送信オプション
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text
    }

    // メール送信
    const info = await transporter.sendMail(mailOptions)
    
    console.log('📧 メール送信完了:', {
      messageId: info.messageId,
      to: data.to,
      subject: data.subject
    })
    
    return true
  } catch (error) {
    console.error('メール送信エラー:', error)
    return false
  }
}

// 予約完了通知メール
export function generateReservationConfirmationEmail(
  customerName: string,
  lessonTitle: string,
  lessonDate: string,
  lessonLocation: string,
  reservationType: string,
  paymentInfo: string,
  isTrialLesson: boolean = false
): NotificationData {
  const arrivalTime = isTrialLesson ? 'レッスン開始15分前までにお越しください' : 'レッスン開始10分前までにお越しください'
  
  // 注意事項を予約タイプに応じて分ける
  const getNoticeItems = () => {
    const commonItems = [
      '更衣室はございません。動きやすい服装でお越しいただく、もしくはお手洗い等でのお着替えをお願い致します。',
      '滑り止め靴下、タオル、お飲み物をご持参下さい。'
    ];
    
    if (isTrialLesson) {
      return [
        '体験時はレッスン開始15分前にお越しください。',
        ...commonItems
      ];
    } else {
      return [
        '開始10分前からご入室可能です。',
        ...commonItems,
        '前日21:00以降のキャンセルは1回分消化扱いとなります。ご注意ください。'
      ];
    }
  };

  const noticeItems = getNoticeItems();

  const subject = `【Preal(プリール)予約完了】${lessonTitle}のご予約ありがとうございます`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
        予約完了のお知らせ
      </h2>
      <p>${customerName}様</p>
      <p>この度は、ピラティスレッスンのご予約をいただき、ありがとうございます。</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">予約詳細</h3>
        <p><strong>レッスン名:</strong> ${lessonTitle}</p>
        <p><strong>日時:</strong> ${lessonDate}</p>
        <p><strong>会場:</strong> ${lessonLocation}</p>
        <p><strong>予約タイプ:</strong> ${reservationType}</p>
      </div>
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4 style="color: #856404; margin-top: 0;">注意事項</h4>
        <ul style="color: #856404; margin: 0;">
          ${noticeItems.map(item => `<li>${item}</li>`).join('')}
          <li><strong>一度キャンセルされますと、同じレッスンのご予約が出来なくなります。ご注意ください。</strong></li>
        </ul>
      </div>
      <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
      <p>グループに関するお問い合わせはこちらから。</p>
      <p><a href="https://lin.ee/faHGlyM">https://lin.ee/faHGlyM</a></p>
      <p>Prealグループレッスン予約サイト：<a href="https://pilates-reservation-app-main.vercel.app/">https://pilates-reservation-app-main.vercel.app/</a></p>
      <p style="margin-top: 30px;">
        Preal(プリール)<br>
        お問い合わせ: preal.pilates@gmail.com
      </p>
    </div>
  `
  const text = `
${customerName}様

この度は、Preal(プリール)のご予約をいただき、ありがとうございます。

【予約詳細】
レッスン名: ${lessonTitle}
日時: ${lessonDate}
会場: ${lessonLocation}
予約タイプ: ${reservationType}

【注意事項】
${noticeItems.map(item => `・${item}`).join('\n')}
・一度キャンセルされますと、同じレッスンのご予約が出来なくなります。ご注意ください。

ご不明な点がございましたら、お気軽にお問い合わせください。

グループに関するお問い合わせはこちらから
https://lin.ee/faHGlyM

Prealグループレッスン予約サイト：https://pilates-reservation-app-main.vercel.app/

Preal(プリール)
お問い合わせ: preal.pilates@gmail.com
  `
  return {
    to: '',
    subject,
    html,
    text
  }
}

// キャンセル完了通知メール
export function generateCancellationConfirmationEmail(
  customerName: string,
  lessonTitle: string,
  lessonDate: string,
  lessonLocation: string,
  reservationType: string,
  ticketReturned: boolean,
  isTrialLesson: boolean = false
): NotificationData {
  const getTicketMessage = () => {
    if (isTrialLesson) {
      return '<p style="color: #0056b3;"><strong>お支払い:</strong> 体験レッスンのため、料金は発生いたしません</p>';
    } else if (ticketReturned) {
      return '<p style="color: #28a745;"><strong>チケット:</strong> 返還されました</p>';
    } else {
      return '<p style="color: #dc3545;"><strong>チケット:</strong> 期限後キャンセルのため1回分消化されました</p>';
    }
  };

  const getTicketMessageText = () => {
    if (isTrialLesson) {
      return 'お支払い: 体験レッスンのため、料金は発生いたしません';
    } else if (ticketReturned) {
      return 'チケット: 返還されました';
    } else {
      return 'チケット: 期限後キャンセルのため1回分消化されました';
    }
  };

  const subject = `【Preal(プリール)キャンセル完了】${lessonTitle}のキャンセルが完了しました`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
        キャンセル完了のお知らせ
      </h2>
      <p>${customerName}様</p>
      <p>平素よりPreal（プリール）をご愛顧いただき、誠にありがとうございます。</p>
      <p>以下の予約のキャンセルが完了いたしました。</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">キャンセル詳細</h3>
        <p><strong>レッスン名:</strong> ${lessonTitle}</p>
        <p><strong>日時:</strong> ${lessonDate}</p>
        <p><strong>会場:</strong> ${lessonLocation}</p>
        <p><strong>予約タイプ:</strong> ${reservationType}</p>
        ${getTicketMessage()}
      </div>
      <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4 style="color: #0056b3; margin-top: 0;">今後のご予約について</h4>
        <p style="color: #0056b3; margin: 5px 0;">• 新しいレッスンのご予約は、いつでもマイページから承っております</p>
        <p style="color: #0056b3; margin: 5px 0;">• ご不明な点がございましたら、お気軽にお問い合わせください</p>
        <p style="color: #0056b3; margin: 5px 0;">• またのご利用を心よりお待ちしております</p>
      </div>
      <p>引き続きPreal(プリール)をよろしくお願いいたします。</p>
      <p>グループに関するお問い合わせはこちらから。</p>
      <p><a href="https://lin.ee/faHGlyM">https://lin.ee/faHGlyM</a></p>
      <p>Prealグループレッスン予約サイト：<a href="https://pilates-reservation-app-main.vercel.app/">https://pilates-reservation-app-main.vercel.app/</a></p>
      <p style="margin-top: 30px;">
        Preal(プリール)<br>
        お問い合わせ: preal.pilates@gmail.com
      </p>
    </div>
  `
  const text = `
${customerName}様

平素よりPreal（プリール）をご愛顧いただき、誠にありがとうございます。

以下の予約のキャンセルが完了いたしました。

【キャンセル詳細】
レッスン名: ${lessonTitle}
日時: ${lessonDate}
会場: ${lessonLocation}
予約タイプ: ${reservationType}
${getTicketMessageText()}

【今後のご予約について】
• 新しいレッスンのご予約は、いつでもマイページから承っております
• ご不明な点がございましたら、お気軽にお問い合わせください
• またのご利用を心よりお待ちしております

引き続きPreal(プリール)をよろしくお願いいたします。

グループに関するお問い合わせはこちらから
https://lin.ee/faHGlyM

Prealグループレッスン予約サイト：https://pilates-reservation-app-main.vercel.app/

Preal(プリール)
お問い合わせ: preal.pilates@gmail.com
  `
  return {
    to: '',
    subject,
    html,
    text
  }
}


// キャンセル待ちからの自動予約確定通知メール
export function generateWaitingListConfirmationEmail(
  customerName: string,
  lessonTitle: string,
  lessonDate: string,
  isTrialLesson: boolean = false
): NotificationData {
  const arrivalTime = isTrialLesson ? 'レッスン開始15分前までにお越しください' : 'レッスン開始10分前までにお越しください'
  
  const subject = `【Preal(プリール)予約確定】キャンセル待ちから予約が確定しました`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px;">
        キャンセル待ちから予約確定
      </h2>
      <p>${customerName}様</p>
      <p>キャンセルが発生したため、キャンセル待ちから以下のレッスンが自動的に予約確定されました。</p>
      <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #155724; margin-top: 0;">確定予約詳細</h3>
        <p><strong>レッスン名:</strong> ${lessonTitle}</p>
        <p><strong>日時:</strong> ${lessonDate}</p>
        <p><strong>お支払い:</strong> チケット1枚（自動消費済み）</p>
      </div>
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4 style="color: #856404; margin-top: 0;">注意事項</h4>
        <ul style="color: #856404; margin: 0;">
          <li>${arrivalTime}</li>
          <li>動きやすい服装でお越しください</li>
          <li>タオル、お水をご持参ください</li>
          <li>前日21:00までのキャンセルは無料です</li>
        </ul>
      </div>
      <p>お会いできることを楽しみにしております。</p>
      <p>グループに関するお問い合わせはこちらから。</p>
      <p><a href="https://lin.ee/faHGlyM">https://lin.ee/faHGlyM</a></p>
      <p>Prealグループレッスン予約サイト：<a href="https://pilates-reservation-app-main.vercel.app/">https://pilates-reservation-app-main.vercel.app/</a></p>
      <p style="margin-top: 30px;">
        Preal(プリール)<br>
        お問い合わせ: preal.pilates@gmail.com
      </p>
    </div>
  `
  const text = `
${customerName}様

キャンセルが発生したため、キャンセル待ちから以下のレッスンが自動的に予約確定されました。

【確定予約詳細】
レッスン名: ${lessonTitle}
日時: ${lessonDate}
お支払い: チケット1枚（自動消費済み）

【注意事項】
・${arrivalTime}
・動きやすい服装でお越しください
・タオル、お水をご持参ください
・前日21:00までのキャンセルは無料です

お会いできることを楽しみにしております。

グループに関するお問い合わせはこちらから
https://lin.ee/faHGlyM

Prealグループレッスン予約サイト：https://pilates-reservation-app-main.vercel.app/

Preal(プリール)
お問い合わせ: preal.pilates@gmail.com
  `
  return {
    to: '',
    subject,
    html,
    text
  }
}
