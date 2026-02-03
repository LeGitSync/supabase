import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/core'
import { paginateGraphql } from '@octokit/plugin-paginate-graphql'
import { Octokit as OctokitRest } from '@octokit/rest'
import dayjs from 'dayjs'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { deletedDiscussions } from '~/lib/changelog.utils'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'

export type Discussion = {
  id: string
  updatedAt: string
  url: string
  title: string
  body: string
}

export type Entry = {
  id: string
  title: string
  url: string
  created_at: string
  source: MDXRemoteSerializeResult
  type: string
}

export type DiscussionsResponse = {
  repository: {
    discussions: {
      totalCount: number
      nodes: Discussion[]
      pageInfo: any
    }
  }
}

type FetchChangelogPageOptions = {
  next?: string | null
  restPage?: number
}

// uses the graphql api
async function fetchDiscussions(
  owner: string,
  repo: string,
  categoryId: string,
  cursor: string | null = null
) {
  const ExtendedOctokit = Octokit.plugin(paginateGraphql)
  type ExtendedOctokit = InstanceType<typeof ExtendedOctokit>

  const octokit = new ExtendedOctokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_CHANGELOG_APP_ID,
      installationId: process.env.GITHUB_CHANGELOG_APP_INSTALLATION_ID,
      privateKey: process.env.GITHUB_CHANGELOG_APP_PRIVATE_KEY,
    },
  })

  const query = `
    query troubleshootDiscussions($cursor: String, $owner: String!, $repo: String!, $categoryId: ID!) {
      repository(owner: $owner, name: $repo) {
        discussions(first: 50, after: $cursor, categoryId: $categoryId, orderBy: { field: CREATED_AT, direction: DESC }) {
          totalCount
          pageInfo {
            hasPreviousPage
            hasNextPage
            startCursor
            endCursor
          }
          nodes {
            id
            publishedAt
            createdAt
            url
            title
            body
          }
        }
      }
    }
  `
  const queryVars = {
    owner,
    repo,
    categoryId,
    cursor,
  }

  // fetch discussions
  const {
    repository: {
      discussions: { nodes: discussions, pageInfo },
    },
  } = await octokit.graphql<DiscussionsResponse>(query, queryVars)

  return { discussions, pageInfo }
}

function isEncoded(uri: string | null | undefined) {
  uri = uri ?? ''
  return uri !== decodeURIComponent(uri)
}

// Decodes a URI if it is encoded
export const recursiveDecodeURI = (uri: string | null) => {
  if (!uri) {
    return uri
  }
  let tries = 0
  while (isEncoded(uri)) {
    uri = decodeURIComponent(uri)
    tries++
    if (tries > 10) {
      break
    }
  }

  return uri
}

// Process as of Feb. 2024:
// create a Release each month and create a corresponding changelog discussion
// — we don't want to pull in both the changelog entry and the release entry
// — we want to ignore new releases and only show the old ones that don't have a corresponding changelog discussion
// — so we have this list of old releases that we want to show
const oldReleases = [
  40981345, 39091930, 37212777, 35927141, 34612423, 33383788, 32302703, 30830915, 29357247,
  28108378,
]

export async function fetchChangelogPage({ next, restPage = 1 }: FetchChangelogPageOptions) {
  const octokitRest = new OctokitRest({
    auth: process.env.GITHUB_CHANGELOG_APP_REST_KEY,
  })

  // uses the rest api
  async function fetchGitHubReleases() {
    try {
      const response = await octokitRest.repos.listReleases({
        owner: 'supabase',
        repo: 'supabase',
        per_page: 10,
        page: restPage,
      })

      return response.data || []
    } catch (error) {
      console.error(error)
      return []
    }
  }

  const releases = (await fetchGitHubReleases()).filter(
    (release) => release.id && oldReleases.includes(release.id)
  )

  const { discussions, pageInfo } = await fetchDiscussions(
    'supabase',
    'supabase',
    'DIC_kwDODMpXOc4CAFUr', // 'Changelog' category
    next ?? null
  )

  if (!discussions) {
    return {
      changelog: [],
      pageInfo: null,
      restPage,
    }
  }

  // Process discussions
  const formattedDiscussions = await Promise.all(
    discussions.map(async (item: any): Promise<any> => {
      try {
        const discussionsMdxSource: MDXRemoteSerializeResult = await mdxSerialize(item.body)
        // Find a date rewrite for the current item's title
        const dateRewrite = deletedDiscussions.find((rewrite) => {
          return item.title && rewrite.title && item.title.includes(rewrite.title)
        })

        // Use the createdAt date from dateRewrite if found, otherwise use item.createdAt
        const created_at = dateRewrite ? dateRewrite.createdAt : item.createdAt

        return {
          ...item,
          source: discussionsMdxSource,
          type: 'discussion',
          created_at,
          url: item.url,
        }
      } catch (err) {
        console.error(`Problem processing discussion MDX: ${err}`)
      }
    })
  )

  // Process releases
  const formattedReleases = await Promise.all(
    releases.map(async (item: any): Promise<any> => {
      try {
        const releasesMdxSource: MDXRemoteSerializeResult = await mdxSerialize(item.body)

        return {
          ...item,
          source: releasesMdxSource,
          type: 'release',
          created_at: item.created_at,
          title: item.name ?? '',
          url: item.html_url ?? '',
        }
      } catch (err) {
        console.error(`Problem processing discussion MDX: ${err}`)
      }
    })
  )

  // Combine discussions and releases into a single array of entries
  const combinedEntries = formattedDiscussions.concat(formattedReleases).filter(Boolean)

  const sortedCombinedEntries = combinedEntries.sort((a: any, b: any) => {
    const dateA = dayjs(a.created_at)
    const dateB = dayjs(b.created_at)

    if (dateA.isValid() && dateB.isValid()) {
      return dateB.diff(dateA)
    } else {
      return 0
    }
  })

  return {
    changelog: sortedCombinedEntries,
    pageInfo,
    restPage,
  }
}
