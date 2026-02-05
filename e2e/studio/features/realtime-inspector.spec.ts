import { expect, Page } from '@playwright/test'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import {
  getMessageCount,
  joinChannel,
  leaveChannel,
  navigateToRealtimeInspector,
  openBroadcastModal,
  startListening,
  stopListening,
  waitForRealtimeMessage,
} from '../utils/realtime-helpers.js'

const testChannelName = 'pw_realtime_test_channel'

test.describe.configure({ mode: 'serial' })

test.describe('Realtime Inspector', () => {
  test.describe('Basic Inspector UI', () => {
    test('inspector page loads correctly with empty state', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${ref}/realtime/inspector`))

      await expect(page.getByRole('button', { name: 'Join a channel' })).toBeVisible({
        timeout: 30000,
      })

      const startButton = page.getByRole('button', { name: 'Start listening' })
      await expect(startButton).toBeVisible()
      await expect(startButton).toBeDisabled()

      await expect(page.getByText('Create realtime experiences')).toBeVisible()
    })

    test('channel selection popover opens and works', async ({ page, ref }) => {
      await navigateToRealtimeInspector(page, ref)

      await page.getByRole('button', { name: 'Join a channel' }).click()

      await expect(page.getByPlaceholder('Enter a channel name')).toBeVisible({ timeout: 5000 })
      await expect(page.getByRole('button', { name: 'Listen to channel' })).toBeVisible()
      await expect(page.getByText('Is channel private?')).toBeVisible()

      await page.keyboard.press('Escape')
    })

    test('can join and leave a channel', async ({ page, ref }) => {
      await navigateToRealtimeInspector(page, ref)

      await joinChannel(page, testChannelName)

      await expect(page.getByText('Listening', { exact: true })).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('button', { name: `Channel: ${testChannelName}` })).toBeVisible()

      await leaveChannel(page)

      await expect(page.getByRole('button', { name: 'Join a channel' })).toBeVisible()
    })

    test('start/stop listening button works', async ({ page, ref }) => {
      await navigateToRealtimeInspector(page, ref)

      await joinChannel(page, testChannelName)

      await expect(page.getByText('Listening', { exact: true })).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('button', { name: 'Stop listening' })).toBeVisible()

      await stopListening(page)

      await expect(page.getByRole('button', { name: 'Start listening' })).toBeVisible()
      await expect(page.getByText('Listening', { exact: true })).not.toBeVisible()

      await startListening(page)

      await expect(page.getByText('Listening', { exact: true })).toBeVisible({ timeout: 10000 })

      await leaveChannel(page)
    })
  })

  test.describe('Broadcast Messages', () => {
    let page: Page

    test.beforeAll(async ({ browser, ref }) => {
      page = await browser.newPage()
      await navigateToRealtimeInspector(page, ref)
    })

    test.afterAll(async () => {
      await page.close()
    })

    test('broadcast messages appear in the UI when listening', async () => {
      await joinChannel(page, testChannelName)

      await expect(page.getByText('Listening', { exact: true })).toBeVisible({ timeout: 10000 })

      await openBroadcastModal(page)
      await page.getByRole('button', { name: 'Confirm' }).click()

      await expect(page.getByText('Successfully broadcasted message')).toBeVisible({
        timeout: 10000,
      })

      const messageRow = await waitForRealtimeMessage(page, { timeout: 30000 })
      await expect(messageRow).toBeVisible()

      const count = await getMessageCount(page)
      expect(count).toBeGreaterThanOrEqual(1)
    })

    test('clicking broadcast message shows detail panel', async () => {
      const messageRow = page.getByRole('row').filter({ hasText: 'broadcast' }).first()
      await expect(messageRow).toBeVisible({ timeout: 5000 })
      await messageRow.click()

      await expect(page.getByText('Timestamp')).toBeVisible({ timeout: 5000 })
    })

    test('broadcast modal validates JSON payload', async () => {
      await openBroadcastModal(page)

      const codeEditor = page.getByRole('textbox', { name: /Editor content/i })
      await codeEditor.click({ force: true })
      await page.keyboard.press('ControlOrMeta+KeyA')
      await page.keyboard.type('{ invalid json }')

      await page.getByRole('button', { name: 'Confirm' }).click()

      await expect(page.getByText('Please provide a valid JSON')).toBeVisible({ timeout: 5000 })

      await page.getByRole('button', { name: 'Cancel' }).click()
    })

    test('cleanup: leave channel', async () => {
      await leaveChannel(page)
      await expect(page.getByRole('button', { name: 'Join a channel' })).toBeVisible()
    })
  })

  test.describe('Message Display', () => {
    let page: Page

    test.beforeAll(async ({ browser, ref }) => {
      page = await browser.newPage()
      await navigateToRealtimeInspector(page, ref)
    })

    test.afterAll(async () => {
      await page.close()
    })

    test('messages counter shows correct count', async () => {
      await joinChannel(page, `${testChannelName}_counter`)

      const initialCount = await getMessageCount(page)

      await openBroadcastModal(page)
      await page.getByRole('button', { name: 'Confirm' }).click()
      await expect(page.getByText('Successfully broadcasted message')).toBeVisible({
        timeout: 10000,
      })

      await waitForRealtimeMessage(page, { timeout: 30000 })

      const newCount = await getMessageCount(page)
      expect(newCount).toBeGreaterThan(initialCount)

      await leaveChannel(page)
    })
  })
})
