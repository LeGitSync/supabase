import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchChangelogPage, recursiveDecodeURI } from '~/lib/changelog.server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=900')

  const encodedNext = (req.query.next ?? null) as string | null
  const next = recursiveDecodeURI(encodedNext)
  const restPage = req.query.restPage ? Number(req.query.restPage) : 1

  const data = await fetchChangelogPage({ next, restPage })
  res.status(200).json(data)
}
