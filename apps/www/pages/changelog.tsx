import dayjs from 'dayjs'
import { GitCommit } from 'lucide-react'
import { GetServerSideProps } from 'next'
import { MDXRemote } from 'next-mdx-remote'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useState } from 'react'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import { fetchChangelogPage, recursiveDecodeURI, type Entry } from '~/lib/changelog.server'
import mdxComponents from '~/lib/mdx/mdxComponents'

/**
 * [Terry]
 * this page powers supabase.com/changelog
 * this page used to just be a feed of the releases endpoint
 * (https://api.github.com/repos/supabase/supabase/releases) (rest api)
 * but is now a blend of that legacy relases and the new Changelog category of the Discussions
 * https://github.com/orgs/supabase/discussions/categories/changelog (graphql api)
 * We should use the Changelog Discussions category for all future changelog entries and stop using releases
 */

export const getServerSideProps: GetServerSideProps = async ({ res, query }) => {
  // refresh every 15 minutes
  res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=900')
  const encodedNext = (query.next ?? null) as string | null
  // in some cases the next cursor is encoded twice or more times due to the user pasting the url, so we need to decode it multiple times.
  const next = recursiveDecodeURI(encodedNext)
  const restPage = query.restPage ? Number(query.restPage) : 1
  const data = await fetchChangelogPage({ next, restPage })

  return {
    props: {
      changelog: data.changelog,
      pageInfo: data.pageInfo,
      restPage: data.restPage,
    },
  }
}

interface ChangelogPageProps {
  changelog: Entry[]
  pageInfo: any
  restPage: number
}

function ChangelogPage({ changelog, pageInfo, restPage }: ChangelogPageProps) {
  const [entries, setEntries] = useState<Entry[]>(changelog)
  const [currentPageInfo, setCurrentPageInfo] = useState(pageInfo)
  const [currentRestPage, setCurrentRestPage] = useState(restPage)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const { endCursor: end, hasNextPage } = currentPageInfo ?? {}

  const handleLoadMore = async () => {
    if (!hasNextPage || isLoadingMore) {
      return
    }

    setIsLoadingMore(true)
    try {
      const params = new URLSearchParams()
      if (end) {
        params.set('next', end)
      }
      // Cap restPage at 10 to avoid unnecessary API calls after all oldReleases are exhausted
      const nextRestPage = Math.min(currentRestPage + 1, 10)
      params.set('restPage', String(nextRestPage))

      const response = await fetch(`/api/changelog?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load more changelog entries')
      }

      const data = await response.json()
      setEntries((prev) => prev.concat(data.changelog ?? []))
      setCurrentPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null })
      setCurrentRestPage(data.restPage ?? nextRestPage)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const TITLE = 'Changelog'
  const DESCRIPTION = 'New updates and improvements to Supabase'
  return (
    <>
      <NextSeo
        title={TITLE}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: `https://supabase.com/changelog`,
          type: 'article',
        }}
      />
      <DefaultLayout>
        <div
          className="
            container mx-auto flex flex-col
            gap-20
            px-4 py-10 sm:px-16
            xl:px-20
          "
        >
          <div className="py-10">
            <h1 className="h1">Changelog</h1>
            <p className="text-foreground-lighter text-lg">New updates and product improvements</p>
          </div>

          {/* Content */}
          <div className="grid gap-12 lg:gap-36">
            {entries.length > 0 &&
              entries
                .filter((entry: Entry) => !entry.title.includes('[d]'))
                .map((entry: Entry, i: number) => {
                  return (
                    <div key={i} className="border-muted grid border-l lg:grid-cols-12 lg:gap-8">
                      <div
                        className="col-span-12 mb-8 self-start lg:sticky lg:top-0 lg:col-span-4 lg:-mt-32 lg:pt-32
                "
                      >
                        <div className="flex w-full items-baseline gap-6">
                          <div className="bg-border border-muted text-foreground-lighter -ml-2.5 flex h-5 w-5 items-center justify-center rounded border drop-shadow-sm">
                            <GitCommit size={14} strokeWidth={1.5} />
                          </div>
                          <div className="flex w-full flex-col gap-1">
                            {entry.title && (
                              <Link href={entry.url}>
                                <h3 className="text-foreground text-2xl">{entry.title}</h3>{' '}
                              </Link>
                            )}
                            <p className="text-muted text-lg">
                              {dayjs(entry.created_at).format('MMM D, YYYY')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-8 ml-8 lg:ml-0 max-w-[calc(100vw-80px)]">
                        <article className="prose prose-docs max-w-none [overflow-wrap:break-word]">
                          <MDXRemote {...entry.source} components={mdxComponents('blog')} />
                        </article>
                      </div>
                    </div>
                  )
                })}
          </div>
          {hasNextPage && (
            <div className="my-8 flex items-center justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="border-control text-foreground bg-foreground/5 hover:bg-foreground/10 flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default ChangelogPage
