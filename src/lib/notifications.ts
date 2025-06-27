// メール通知機能（実装例）
// 実際の本番環境では、SendGrid、Nodemailer、AWS SESなどを使用してください

export interface NotificationData {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(data: NotificationData): Promise<boolean> {
  try {
    // 本番環境では実際のメール送信サービスを使用
    console.log('📧 メール送信:', {
      to: data.to,
      subject: data.subject,
      html: data.html.substring(0, 100) + '...'
    })
    // 開発環境では成功として扱う
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
  reservationType: string,
  paymentInfo: string
): NotificationData {
  const subject = `【予約完了】${lessonTitle}のご予約ありがとうございます`
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
        <p><strong>予約タイプ:</strong> ${reservationType}</p>
        <p><strong>お支払い:</strong> ${paymentInfo}</p>
      </div>
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4 style="color: #856404; margin-top: 0;">注意事項</h4>
        <ul style="color: #856404; margin: 0;">
          <li>レッスン開始15分前までにお越しください</li>
          <li>動きやすい服装でお越しください</li>
          <li>タオル、お水をご持参ください</li>
          <li>前日21:00までのキャンセルは無料です</li>
        </ul>
      </div>
      <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
      <p style="margin-top: 30px;">
        ピラティススタジオ<br>
        お問い合わせ: studio@example.com
      </p>
    </div>
  `
  const text = `
${customerName}様

この度は、ピラティスレッスンのご予約をいただき、ありがとうございます。

【予約詳細】
レッスン名: ${lessonTitle}
日時: ${lessonDate}
予約タイプ: ${reservationType}
お支払い: ${paymentInfo}

【注意事項】
・レッスン開始15分前までにお越しください
・動きやすい服装でお越しください
・タオル、お水をご持参ください
・前日21:00までのキャンセルは無料です

ご不明な点がございましたら、お気軽にお問い合わせください。

ピラティススタジオ
お問い合わせ: studio@example.com
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
  ticketReturned: boolean
): NotificationData {
  const subject = `【キャンセル完了】${lessonTitle}のキャンセルが完了しました`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
        キャンセル完了のお知らせ
      </h2>
      <p>${customerName}様</p>
      <p>以下の予約のキャンセルが完了いたしました。</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">キャンセル詳細</h3>
        <p><strong>レッスン名:</strong> ${lessonTitle}</p>
        <p><strong>日時:</strong> ${lessonDate}</p>
        ${ticketReturned ? '<p style="color: #28a745;"><strong>チケット:</strong> 返還されました</p>' : '<p style="color: #dc3545;"><strong>チケット:</strong> 期限後キャンセルのため消費されました</p>'}
      </div>
      <p>またのご利用をお待ちしております。</p>
      <p style="margin-top: 30px;">
        ピラティススタジオ<br>
        お問い合わせ: studio@example.com
      </p>
    </div>
  `
  const text = `
${customerName}様

以下の予約のキャンセルが完了いたしました。

【キャンセル詳細】
レッスン名: ${lessonTitle}
日時: ${lessonDate}
${ticketReturned ? 'チケット: 返還されました' : 'チケット: 期限後キャンセルのため消費されました'}

またのご利用をお待ちしております。

ピラティススタジオ
お問い合わせ: studio@example.com
  `
  return {
    to: '',
    subject,
    html,
    text
  }
}

// リマインダー通知メール
export function generateReminderEmail(
  customerName: string,
  lessonTitle: string,
  lessonDate: string
): NotificationData {
  const subject = `【リマインダー】明日のピラティスレッスンについて`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">
        レッスンリマインダー
      </h2>
      <p>${customerName}様</p>
      <p>明日のピラティスレッスンのリマインダーです。</p>
      <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #856404; margin-top: 0;">レッスン詳細</h3>
        <p><strong>レッスン名:</strong> ${lessonTitle}</p>
        <p><strong>日時:</strong> ${lessonDate}</p>
      </div>
      <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4 style="color: #155724; margin-top: 0;">持ち物・準備</h4>
        <ul style="color: #155724; margin: 0;">
          <li>動きやすい服装</li>
          <li>タオル</li>
          <li>お水</li>
          <li>レッスン開始15分前にお越しください</li>
        </ul>
      </div>
      <p>お会いできることを楽しみにしております。</p>
      <p style="margin-top: 30px;">
        ピラティススタジオ<br>
        お問い合わせ: studio@example.com
      </p>
    </div>
  `
  const text = `
${customerName}様

明日のピラティスレッスンのリマインダーです。

【レッスン詳細】
レッスン名: ${lessonTitle}
日時: ${lessonDate}

【持ち物・準備】
・動きやすい服装
・タオル
・お水
・レッスン開始15分前にお越しください

お会いできることを楽しみにしております。

ピラティススタジオ
お問い合わせ: studio@example.com
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
  lessonDate: string
): NotificationData {
  const subject = `【予約確定】キャンセル待ちから予約が確定しました`
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
          <li>レッスン開始15分前までにお越しください</li>
          <li>動きやすい服装でお越しください</li>
          <li>タオル、お水をご持参ください</li>
          <li>前日21:00までのキャンセルは無料です</li>
        </ul>
      </div>
      <p>お会いできることを楽しみにしております。</p>
      <p style="margin-top: 30px;">
        ピラティススタジオ<br>
        お問い合わせ: studio@example.com
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
・レッスン開始15分前までにお越しください
・動きやすい服装でお越しください
・タオル、お水をご持参ください
・前日21:00までのキャンセルは無料です

お会いできることを楽しみにしております。

ピラティススタジオ
お問い合わせ: studio@example.com
  `
  return {
    to: '',
    subject,
    html,
    text
  }
}

const reservationTypeName = {
  TRIAL: '体験レッスン',
  DROP_IN: '単回利用',
  TICKET: 'チケット利用'
} as const;

const typeName = reservationTypeName[reservationType as keyof typeof reservationTypeName];