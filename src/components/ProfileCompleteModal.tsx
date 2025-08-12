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