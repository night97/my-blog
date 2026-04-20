'use client'

import { cn } from '@/lib/utils'
import TextareaAutosize, { TextareaAutosizeProps } from 'react-textarea-autosize'
import { forwardRef } from 'react'

interface TextareaProps extends TextareaAutosizeProps {
  minRows?: number
  maxRows?: number
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, minRows = 3, maxRows = 20, ...props }, ref) => {
    return (
      <TextareaAutosize
        ref={ref}
        minRows={minRows}
        maxRows={maxRows}
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500',
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
