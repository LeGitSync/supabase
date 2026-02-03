import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchChangelogPage, recursiveDecodeURI } from '~/lib/changelog.server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=900')

  const encodedNext = (req.query.next ?? null) as string | null
  const next = recursiveDecodeURI(encodedNext)
  const parsedRestPage = req.query.restPage ? Number(req.query.restPage) : 1
  const restPage = Number.isNaN(parsedRestPage) || parsedRestPage < 1 ? 1 : parsedRestPage

  try {
    const data = await fetchChangelogPage({ next, restPage })
    res.status(200).json(data)
  } catch (error) {
    console.error('Failed to fetch changelog:', error)
    res.status(500).json({ error: 'Failed to fetch changelog' })
  }
}
