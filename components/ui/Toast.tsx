'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType) => {
    const id = String(++toastId)
    setToasts((prev) => [...prev, { id, message, type }])
    // 自动移除
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />
      case 'info':
        return <Info size={20} className="text-blue-500" />
    }
  }

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
    }
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[280px] animate-slide-in',
              getBgColor(t.type)
            )}
          >
            {getIcon(t.type)}
            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
              {t.message}
            </span>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // 降级到 alert
    return {
      toast: (message: string, type: ToastType) => alert(message),
      success: (message: string) => alert(message),
      error: (message: string) => alert(message),
      info: (message: string) => alert(message),
    }
  }
  return {
    toast: context.toast,
    success: (message: string) => context.toast(message, 'success'),
    error: (message: string) => context.toast(message, 'error'),
    info: (message: string) => context.toast(message, 'info'),
  }
}
