import { expect, Page } from '@playwright/test'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import {
  createRealtimeEnabledTable,
  dropTestTable,
  executeSQL,
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
const testTableName = 'pw_realtime_test_table'

// Run all realtime inspector tests serially since they share state
test.describe.configure({ mode: 'serial' })

test.describe('Realtime Inspector', () => {
  test.describe('Basic Inspector UI', () => {
    test('inspector page loads correctly with empty state', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${ref}/realtime/inspector`))

      // Verify the page loads with the "Join a channel" button
      await expect(page.getByRole('button', { name: 'Join a channel' })).toBeVisible({
        timeout: 30000,
      })

      // Verify the "Start listening" button is visible but disabled (no channel joined)
      const startButton = page.getByRole('button', { name: 'Start listening' })
      await expect(startButton).toBeVisible()
      await expect(startButton).toBeDisabled()

      // Verify empty state text is shown
      await expect(page.getByText('Realtime message logs will be shown here')).toBeVisible()
    })

    test('channel selection popover opens and works', async ({ page, ref }) => {
      await navigateToRealtimeInspector(page, ref)

      // Click the "Join a channel" button
      await page.getByRole('button', { name: 'Join a channel' }).click()

      // Verify the popover opens with the channel input
      await expect(page.getByPlaceholder('Enter a channel name')).toBeVisible({ timeout: 5000 })

      // Verify the "Listen to channel" button is present
      await expect(page.getByRole('button', { name: 'Listen to channel' })).toBeVisible()

      // Verify the private channel switch is present
      await expect(page.getByText('Is channel private?')).toBeVisible()

      // Close the popover by clicking elsewhere
      await page.keyboard.press('Escape')
    })

    test('can join and leave a channel', async ({ page, ref }) => {
      await navigateToRealtimeInspector(page, ref)

      // Join a channel
      await joinChannel(page, testChannelName)

      // Verify we're listening to the channel
      await expect(page.getByText('Listening')).toBeVisible({ timeout: 10000 })

      // Verify the channel name is shown in the button
      await expect(page.getByRole('button', { name: `Channel: ${testChannelName}` })).toBeVisible()

      // Leave the channel
      await leaveChannel(page)

      // Verify we're back to the "Join a channel" state
      await expect(page.getByRole('button', { name: 'Join a channel' })).toBeVisible()
    })

    test('start/stop listening button works', async ({ page, ref }) => {
      await navigateToRealtimeInspector(page, ref)

      // Join a channel (which auto-starts listening)
      await joinChannel(page, testChannelName)

      // Verify we're listening
      await expect(page.getByText('Listening')).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('button', { name: 'Stop listening' })).toBeVisible()

      // Stop listening
      await stopListening(page)

      // Verify listening stopped
      await expect(page.getByRole('button', { name: 'Start listening' })).toBeVisible()
      await expect(page.getByText('Listening')).not.toBeVisible()

      // Start listening again
      await startListening(page)

      // Verify we're listening again
      await expect(page.getByText('Listening')).toBeVisible({ timeout: 10000 })

      // Cleanup: leave channel
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

    test('broadcast messages appear in the UI when listening', async ({ ref }) => {
      // Join a channel and start listening
      await joinChannel(page, testChannelName)

      // Verify we're listening
      await expect(page.getByText('Listening')).toBeVisible({ timeout: 10000 })

      // Open the broadcast modal
      await openBroadcastModal(page)

      // Fill in the message name (the input is pre-filled with "Test message")
      const messageInput = page.getByLabel('Message name')
      await messageInput.clear()
      await messageInput.fill('test-event')

      // The payload is pre-filled with a default value, we can use it as-is
      // Click confirm to send the message
      await page.getByRole('button', { name: 'Confirm' }).click()

      // Wait for success toast
      await expect(page.getByText('Successfully broadcasted message')).toBeVisible({
        timeout: 10000,
      })

      // CRITICAL: Verify the message appears in the UI grid
      // This is the key assertion that would have caught the supabase-js regression
      const messageRow = await waitForRealtimeMessage(page, { timeout: 30000 })
      await expect(messageRow).toBeVisible()

      // Verify the message count shows at least 1 message
      const count = await getMessageCount(page)
      expect(count).toBeGreaterThanOrEqual(1)
    })

    test('clicking broadcast message shows detail panel', async () => {
      // Click on a message row to select it
      const messageRow = page.locator('.data-grid--simple-logs [role="row"]').first()
      await expect(messageRow).toBeVisible({ timeout: 5000 })
      await messageRow.click()

      // Verify the detail panel appears (right side panel)
      // The detail panel shows message metadata
      await expect(page.locator('.border-l').filter({ hasText: 'timestamp' })).toBeVisible({
        timeout: 5000,
      })
    })

    test('broadcast modal validates JSON payload', async () => {
      // Open the broadcast modal
      await openBroadcastModal(page)

      // Enter invalid JSON in the payload editor
      const codeEditor = page.locator('#message-payload')
      await codeEditor.click()
      await page.keyboard.press('ControlOrMeta+KeyA')
      await page.keyboard.type('{ invalid json }')

      // Try to confirm
      await page.getByRole('button', { name: 'Confirm' }).click()

      // Verify error message appears
      await expect(page.getByText('Please provide a valid JSON')).toBeVisible({ timeout: 5000 })

      // Close the modal
      await page.getByRole('button', { name: 'Cancel' }).click()
    })

    test('cleanup: leave channel', async () => {
      await leaveChannel(page)
      await expect(page.getByRole('button', { name: 'Join a channel' })).toBeVisible()
    })
  })

  test.describe('Database Changes (postgres_changes)', () => {
    let page: Page

    test.beforeAll(async ({ browser, ref }) => {
      page = await browser.newPage()

      // Create a test table with realtime enabled
      await createRealtimeEnabledTable(page, ref, testTableName)

      // Navigate to the inspector
      await navigateToRealtimeInspector(page, ref)
    })

    test.afterAll(async ({ ref }) => {
      // Clean up the test table
      try {
        await dropTestTable(page, ref, testTableName)
      } catch {
        // Ignore cleanup errors
      }
      await page.close()
    })

    test('database INSERT events appear in inspector', async ({ ref }) => {
      // Join a channel (using the standard "realtime" prefix for postgres changes)
      await joinChannel(page, `realtime:public:${testTableName}`)

      // Verify we're listening
      await expect(page.getByText('Listening')).toBeVisible({ timeout: 10000 })

      // Wait a moment for the subscription to be established
      await page.waitForTimeout(2000)

      // Insert a row via SQL (in a new page)
      await executeSQL(
        page,
        ref,
        `INSERT INTO public.${testTableName} (name) VALUES ('test_insert_${Date.now()}');`
      )

      // Wait for the INSERT event to appear in the grid
      // Note: This may take a few seconds for the realtime event to propagate
      const messageRow = await waitForRealtimeMessage(page, { timeout: 30000 })
      await expect(messageRow).toBeVisible()

      // Cleanup
      await leaveChannel(page)
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
      // Join a channel
      await joinChannel(page, `${testChannelName}_counter`)

      // Initially should show "No message found yet"
      await expect(page.getByText('No message found yet')).toBeVisible({ timeout: 5000 })

      // Send a broadcast message
      await openBroadcastModal(page)
      await page.getByRole('button', { name: 'Confirm' }).click()
      await expect(page.getByText('Successfully broadcasted message')).toBeVisible({
        timeout: 10000,
      })

      // Wait for the message to appear
      await waitForRealtimeMessage(page, { timeout: 30000 })

      // Verify counter shows at least 1 message
      const count = await getMessageCount(page)
      expect(count).toBeGreaterThanOrEqual(1)

      // Cleanup
      await leaveChannel(page)
    })

    test('message detail panel shows full payload when clicked', async () => {
      // Join a channel
      await joinChannel(page, `${testChannelName}_detail`)

      // Send a broadcast message with a specific payload
      await openBroadcastModal(page)
      const codeEditor = page.locator('#message-payload')
      await codeEditor.click()
      await page.keyboard.press('ControlOrMeta+KeyA')
      await page.keyboard.type('{ "test_key": "test_value_12345" }')
      await page.getByRole('button', { name: 'Confirm' }).click()
      await expect(page.getByText('Successfully broadcasted message')).toBeVisible({
        timeout: 10000,
      })

      // Wait for the message to appear
      await waitForRealtimeMessage(page, { timeout: 30000 })

      // Click on the message to show details
      const messageRow = page.locator('.data-grid--simple-logs [role="row"]').first()
      await messageRow.click()

      // Verify the detail panel shows the payload
      // The payload should be displayed in the right panel
      await expect(page.getByText('test_value_12345')).toBeVisible({ timeout: 5000 })

      // Cleanup
      await leaveChannel(page)
    })
  })
})
