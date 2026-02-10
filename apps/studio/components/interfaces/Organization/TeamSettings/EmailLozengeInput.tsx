'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from 'ui'
import { X } from 'lucide-react'

const INPUT_STYLES =
  'flex min-h-10 w-full flex-wrap items-center gap-x-1 gap-y-1.5 rounded-md border border-control bg-foreground/[.026] px-3 py-2 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-background-control focus-within:ring-offset-2 focus-within:ring-offset-foreground-muted disabled:cursor-not-allowed disabled:opacity-50'

const commitInput = (input: string): string | null => {
  const trimmed = input.trim()
  return trimmed ? trimmed : null
}

interface EmailLozengeInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  placeholder?: string
  autoFocus?: boolean
  id?: string
}

export const EmailLozengeInput = React.forwardRef<HTMLInputElement, EmailLozengeInputProps>(
  ({ value, onChange, onBlur, disabled, placeholder, autoFocus, id }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)

    const parseValue = useCallback((val: string): { lozenges: string[]; inputValue: string } => {
      if (!val.trim()) return { lozenges: [], inputValue: '' }
      const parts = val.split(',').map((e) => e.trim())
      if (parts.length === 1) {
        return { lozenges: [], inputValue: parts[0] ?? '' }
      }
      const lozenges = parts.slice(0, -1).filter(Boolean)
      const lastPart = parts[parts.length - 1] ?? ''
      return { lozenges, inputValue: lastPart }
    }, [])

    const [lozenges, setLozenges] = useState<string[]>(() => parseValue(value).lozenges)
    const [inputValue, setInputValue] = useState(() => parseValue(value).inputValue)

    useEffect(() => {
      const { lozenges: parsedLozenges, inputValue: parsedInput } = parseValue(value)
      setLozenges(parsedLozenges)
      setInputValue(parsedInput)
    }, [value, parseValue])

    const syncToForm = useCallback(
      (newLozenges: string[], newInput: string) => {
        if (newLozenges.length === 0) {
          onChange(newInput)
        } else {
          onChange(newLozenges.join(', ') + ', ' + newInput)
        }
      },
      [onChange]
    )

    const addLozenge = useCallback(
      (email: string) => {
        const trimmed = email.trim()
        if (!trimmed) return
        const updated = [...lozenges, trimmed]
        setLozenges(updated)
        setInputValue('')
        syncToForm(updated, '')
      },
      [lozenges, syncToForm]
    )

    const removeLozenge = useCallback(
      (index: number) => {
        const updated = lozenges.filter((_, i) => i !== index)
        setLozenges(updated)
        syncToForm(updated, inputValue)
      },
      [lozenges, inputValue, syncToForm]
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === ',') {
        e.preventDefault()
        const toAdd = commitInput(inputValue)
        if (toAdd) {
          addLozenge(toAdd)
        }
        return
      }
      if (e.key === 'Tab') {
        const toAdd = commitInput(inputValue)
        if (toAdd) {
          addLozenge(toAdd)
        }
        return
      }
      if (e.key === 'Backspace' && !inputValue && lozenges.length > 0) {
        e.preventDefault()
        removeLozenge(lozenges.length - 1)
        return
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (val.includes(',')) {
        const parts = val.split(',')
        const toAdd = parts.slice(0, -1).map((p) => p.trim()).filter(Boolean)
        const remaining = parts[parts.length - 1]?.trimStart() ?? ''
        if (toAdd.length > 0) {
          const updated = [...lozenges, ...toAdd]
          setLozenges(updated)
          setInputValue(remaining)
          syncToForm(updated, remaining)
        } else {
          setInputValue(val)
          syncToForm(lozenges, val)
        }
      } else {
        setInputValue(val)
        syncToForm(lozenges, val)
      }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
      const pasted = e.clipboardData.getData('text')
      if (pasted.includes(',')) {
        e.preventDefault()
        const parts = pasted.split(',').map((p) => p.trim()).filter(Boolean)
        const updated = [...lozenges, ...parts]
        setLozenges(updated)
        setInputValue('')
        syncToForm(updated, '')
      }
    }

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    return (
      <div
        className={cn(INPUT_STYLES)}
        onClick={() => inputRef.current?.focus()}
      >
        {lozenges.map((email, index) => (
          <span
            key={`${email}-${index}`}
            className="inline-flex h-6 items-center gap-1 shrink-0 rounded-md border border-strong bg-surface-75 pl-1.5 pr-1 py-0.5 text-xs font-normal text-foreground-light"
          >
            {email}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeLozenge(index)
              }}
              className="rounded p-0.5 hover:bg-foreground-muted/20 transition-colors"
              tabIndex={-1}
              aria-label={`Remove ${email}`}
            >
              <X size={12} className="text-foreground-muted" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={lozenges.length === 0 ? placeholder : ''}
          autoComplete="off"
          autoFocus={autoFocus}
          className="min-w-[80px] flex-1 bg-transparent border-none p-0 text-sm placeholder:text-foreground-muted outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
        />
      </div>
    )
  }
)

EmailLozengeInput.displayName = 'EmailLozengeInput'
