'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserCheck, X } from 'lucide-react'

interface ProfileCompleteModalProps {
  isOpen: boolean
  onClose: () => void
  onSkip: () => void
}

export default function ProfileCompleteModal({ isOpen, onClose, onSkip }: ProfileCompleteModalProps) {
  const router = useRouter()
  const [isClosing, setIsClosing] = useState(false)

  const handleComplete = () => {
    router.push('/member/profile')
    onClose()
  }

  const handleSkip = () => {
    setIsClosing(true)
    onSkip()
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <UserCheck className="h-6 w-6 mr-2 text-blue-600" />
            プロフィールを完成させましょう
          </DialogTitle>
          <DialogDescription>
            より良いレッスン体験を提供するため、追加情報の入力をお願いします
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">入力いただく情報</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• ピラティス経験レベル</li>
              <li>• 来店のきっかけ</li>
              <li>• 健康状態・疾患履歴</li>
              <li>• ピラティスで達成したい目標</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">入力のメリット</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• あなたに最適なレッスンをご提案</li>
              <li>• インストラクターからの個別アドバイス</li>
              <li>• 安全で効果的なレッスン体験</li>
              <li>• 目標達成に向けたサポート</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleComplete}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              今すぐ入力する
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1"
              disabled={isClosing}
            >
              <X className="h-4 w-4 mr-2" />
              後で入力する
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            プロフィールはいつでもマイページから更新できます
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}