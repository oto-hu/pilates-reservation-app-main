'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProfileSaveSuccessModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileSaveSuccessModal({ isOpen, onClose }: ProfileSaveSuccessModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // 3秒後に自動的に閉じる
      const timer = setTimeout(() => {
        handleClose()
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300) // アニメーション時間を考慮
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-auto">
        <div className="text-center py-6">
          {/* 成功アイコン */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          
          {/* メッセージ */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            プロフィールを保存しました
          </h2>
          <p className="text-gray-600 mb-6">
            プロフィール情報が正常に更新されました
          </p>
          
          {/* 閉じるボタン */}
          <Button
            onClick={handleClose}
            className="bg-green-600 hover:bg-green-700 text-white px-6"
          >
            OK
          </Button>
        </div>
        
        {/* 右上の×ボタン */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">閉じる</span>
        </button>
      </DialogContent>
    </Dialog>
  )
}
