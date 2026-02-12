'use client'

import { useState } from 'react'
import {
  Badge,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from 'ui'
import { ChevronDown, ThumbsUp, ThumbsDown, MessageSquarePlus } from 'lucide-react'
import type {
  SimilarSolvedThread,
  SimilarThreadFeedbackReaction,
  ThreadSource,
} from '~/types/contribute'
import { submitSimilarThreadFeedback, updateSimilarThreadFeedback } from '~/data/contribute'
import { ChannelIcon } from './Icons'

/**
 * Mock mode: skip real API calls, fake success for frontend design.
 * Set to false when backend RLS is fixed.
 */
const MOCK_FEEDBACK = true

/** When MOCK_FEEDBACK is true, use this to jump to a state for design. */
type MockState = 'idle' | 'thanks' | 'dialog'

function getChannelFromUrl(url: string): ThreadSource {
  const u = url.toLowerCase()
  if (u.includes('discord')) return 'discord'
  if (u.includes('reddit')) return 'reddit'
  if (u.includes('github')) return 'github'
  return 'github'
}

interface SimilarSolvedThreadsProps {
  threads: SimilarSolvedThread[]
  parentThreadId: string
}

const SimilarThreadCard = ({
  thread,
  className,
}: {
  thread: SimilarSolvedThread
  className?: string
}) => {
  const channel = getChannelFromUrl(thread.external_activity_url || '')
  const filteredStack = thread.stack?.filter((s) => s !== 'Other') ?? []
  const hasStack = filteredStack.length > 0

  const url = thread.external_activity_url || null
  const linkClassName = cn(
    'border-b border-border px-6 py-4 flex items-center gap-3 overflow-hidden hover:bg-surface-200 transition-colors',
    className
  )
  const content = (
    <>
      <div className="flex items-center justify-center bg-surface-200 h-10 w-10 rounded-md shrink-0">
        <ChannelIcon channel={channel} />
      </div>
      <div className="min-w-0 flex-1 flex flex-col">
        <h4 className="text-base text-foreground truncate block">
          {thread.subject}
        </h4>
        {thread.problem_description ? (
          <p className="text-sm text-foreground-lighter leading-relaxed line-clamp-2">
            {thread.problem_description}
          </p>
        ) : null}
        {hasStack ? (
          <div className="flex flex-wrap gap-x-1.5 gap-y-1 overflow-hidden pt-1">
            {filteredStack.map((tech) => (
              <Badge key={tech} variant="default">
                {tech}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </>
  )

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        aria-label={`View thread: ${thread.subject}`}
      >
        {content}
      </a>
    )
  }

  return <div className={linkClassName}>{content}</div>
}

export const SimilarSolvedThreads = ({ threads, parentThreadId }: SimilarSolvedThreadsProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [submittedReaction, setSubmittedReaction] = useState<SimilarThreadFeedbackReaction | null>(
    null
  )
  const [feedbackId, setFeedbackId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogReaction, setDialogReaction] = useState<SimilarThreadFeedbackReaction>('positive')
  const [dialogFeedback, setDialogFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleThumbClick = async (reaction: SimilarThreadFeedbackReaction) => {
    if (submittedReaction) return
    setIsSubmitting(true)
    const result = MOCK_FEEDBACK
      ? await (async () => {
        await new Promise((r) => setTimeout(r, 400))
        return { success: true as const, id: 'mock-feedback-id' }
      })()
      : await submitSimilarThreadFeedback({
        parentThreadId,
        reaction,
        similarThreadKey: null,
      })
    setIsSubmitting(false)
    if (result.success) {
      setSubmittedReaction(reaction)
      setFeedbackId(result.id ?? null)
      setDialogReaction(reaction)
      setDialogFeedback('')
    }
  }

  const handleTellUsMoreSubmit = async () => {
    if (!feedbackId) return
    setIsSubmitting(true)
    const result = MOCK_FEEDBACK
      ? await (async () => {
        await new Promise((r) => setTimeout(r, 400))
        return { success: true as const }
      })()
      : await updateSimilarThreadFeedback(
        feedbackId,
        dialogReaction,
        dialogFeedback.trim() || null
      )
    setIsSubmitting(false)
    if (result.success) {
      setSubmittedReaction(dialogReaction)
      setDialogOpen(false)
    }
  }

  const setMockState = (state: MockState) => {
    if (!MOCK_FEEDBACK) return
    if (state === 'idle') {
      setSubmittedReaction(null)
      setFeedbackId(null)
      setDialogOpen(false)
    } else if (state === 'thanks') {
      setSubmittedReaction('positive')
      setFeedbackId('mock-feedback-id')
      setDialogOpen(false)
    } else {
      setSubmittedReaction('positive')
      setFeedbackId('mock-feedback-id')
      setDialogOpen(true)
    }
  }

  return (
    <Card className={cn('relative')}>
      {MOCK_FEEDBACK && (
        <div className="px-[var(--card-padding-x)] py-2 border-b border-dashed border-amber-500/50 bg-amber-500/5 text-xs font-mono">
          <span className="text-foreground-muted">Mock:</span>{' '}
          {(['idle', 'thanks', 'dialog'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setMockState(s)}
              className={cn(
                'ml-2 px-2 py-0.5 rounded',
                (s === 'idle' && !submittedReaction) ||
                  (s === 'thanks' && submittedReaction && !dialogOpen) ||
                  (s === 'dialog' && dialogOpen)
                  ? 'bg-amber-500/20 text-foreground'
                  : 'hover:bg-amber-500/10 text-foreground-lighter'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <CardHeader className={cn('p-0', !isExpanded && 'border-b-0')}>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-center gap-1.5 px-[var(--card-padding-x)] py-4 text-left text-xs font-mono uppercase text-card-foreground"
        >
          Related solved threads
          <span className="text-foreground-muted tabular-nums font-normal">({threads.length})</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-foreground-lighter transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'
              }`}
          />
        </button>
      </CardHeader>
      {isExpanded && (
        <>
          <CardContent className="p-0">
            {threads.map((thread, idx) => (
              <SimilarThreadCard
                key={thread.thread_key || idx}
                thread={thread}
                className={idx === threads.length - 1 ? 'border-b-0' : undefined}
              />
            ))}
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            {submittedReaction ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-lighter">Thanks!</span>
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="text-sm text-foreground-light hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  Tell us more?
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleThumbClick('positive')}
                  disabled={isSubmitting}
                  className="p-1 rounded hover:bg-surface-200 transition-colors disabled:opacity-50"
                  aria-label="Helpful"
                >
                  <ThumbsUp className="h-4 w-4 text-foreground-muted" />
                </button>
                <button
                  type="button"
                  onClick={() => handleThumbClick('negative')}
                  disabled={isSubmitting}
                  className="p-1 rounded hover:bg-surface-200 transition-colors disabled:opacity-50"
                  aria-label="Not helpful"
                >
                  <ThumbsDown className="h-4 w-4 text-foreground-muted" />
                </button>
              </div>
            )}
          </CardFooter>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tell us more</DialogTitle>
            <DialogDescription>
              Change your rating or add optional feedback to help us improve.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground-lighter">Were these helpful?</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDialogReaction('positive')}
                  className={cn(
                    'p-2 rounded transition-colors',
                    dialogReaction === 'positive'
                      ? 'bg-surface-300 text-foreground'
                      : 'hover:bg-surface-200 text-foreground-lighter'
                  )}
                  aria-label="Helpful"
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDialogReaction('negative')}
                  className={cn(
                    'p-2 rounded transition-colors',
                    dialogReaction === 'negative'
                      ? 'bg-surface-300 text-foreground'
                      : 'hover:bg-surface-200 text-foreground-lighter'
                  )}
                  aria-label="Not helpful"
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="feedback" className="block text-sm text-foreground-lighter mb-2">
                Additional feedback (optional)
              </label>
              <Textarea
                id="feedback"
                placeholder="Anything else you'd like to share?"
                value={dialogFeedback}
                onChange={(e) => setDialogFeedback(e.target.value)}
                rows={3}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={handleTellUsMoreSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? 'Saving…' : 'Submit'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
