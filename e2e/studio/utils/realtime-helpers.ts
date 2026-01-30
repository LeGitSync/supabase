import { expect, Page } from '@playwright/test'
import { toUrl } from './to-url.js'

/**
 * Navigate to the realtime inspector page.
 */
export async function navigateToRealtimeInspector(page: Page, ref: string) {
  await page.goto(toUrl(`/project/${ref}/realtime/inspector`))
  // Wait for the page to load - the header should be visible
  await expect(page.locator('text=Join a channel')).toBeVisible({ timeout: 30000 })
}

/**
 * Join a channel in the realtime inspector.
 * Opens the channel popover, enters the channel name, and clicks "Listen to channel".
 */
export async function joinChannel(page: Page, channelName: string) {
  // Click the "Join a channel" button to open the popover
  await page.getByRole('button', { name: /Join a channel|Channel:/ }).click()

  // Wait for the popover to open
  await expect(page.getByPlaceholder('Enter a channel name')).toBeVisible({ timeout: 5000 })

  // Enter the channel name
  await page.getByPlaceholder('Enter a channel name').fill(channelName)

  // Click "Listen to channel" button
  await page.getByRole('button', { name: 'Listen to channel' }).click()

  // Wait for the popover to close and listening to start
  await expect(page.getByText('Listening')).toBeVisible({ timeout: 10000 })
}

/**
 * Leave the current channel.
 */
export async function leaveChannel(page: Page) {
  // Click the channel button to open the popover
  await page.getByRole('button', { name: /Channel:/ }).click()

  // Wait for the popover to open and click "Leave channel"
  await expect(page.getByRole('button', { name: 'Leave channel' })).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: 'Leave channel' }).click()

  // Wait for the channel to be left (button should show "Join a channel" again)
  await expect(page.getByRole('button', { name: 'Join a channel' })).toBeVisible({ timeout: 5000 })
}

/**
 * Start listening to the current channel.
 */
export async function startListening(page: Page) {
  const listenButton = page.getByRole('button', { name: 'Start listening' })
  await expect(listenButton).toBeVisible({ timeout: 5000 })
  await listenButton.click()

  // Wait for listening indicator
  await expect(page.getByText('Listening')).toBeVisible({ timeout: 10000 })
}

/**
 * Stop listening to the current channel.
 */
export async function stopListening(page: Page) {
  const stopButton = page.getByRole('button', { name: 'Stop listening' })
  await expect(stopButton).toBeVisible({ timeout: 5000 })
  await stopButton.click()

  // Wait for start listening button to appear
  await expect(page.getByRole('button', { name: 'Start listening' })).toBeVisible({ timeout: 5000 })
}

/**
 * Open the broadcast message modal.
 */
export async function openBroadcastModal(page: Page) {
  // Click the "Broadcast a message" button
  const broadcastButton = page.getByRole('button', { name: 'Broadcast a message' })
  await expect(broadcastButton).toBeVisible({ timeout: 5000 })
  await broadcastButton.click()

  // Wait for the modal to open
  await expect(page.getByText('Broadcast a message to all clients')).toBeVisible({ timeout: 5000 })
}

/**
 * Send a broadcast message via the modal.
 * Assumes the inspector is already listening to a channel.
 */
export async function sendBroadcastMessage(page: Page, messageName: string, payload: object) {
  await openBroadcastModal(page)

  // Fill in the message name
  const messageInput = page.locator('input').filter({ hasText: '' }).first()
  await messageInput.fill(messageName)

  // Fill in the payload in the code editor
  const payloadString = JSON.stringify(payload, null, 2)
  const codeEditor = page.locator('#message-payload')
  await codeEditor.click()
  // Select all and replace
  await page.keyboard.press('ControlOrMeta+KeyA')
  await page.keyboard.type(payloadString)

  // Click confirm button
  await page.getByRole('button', { name: 'Confirm' }).click()

  // Wait for success toast
  await expect(page.getByText('Successfully broadcasted message')).toBeVisible({ timeout: 10000 })
}

/**
 * Wait for a realtime message to appear in the messages grid.
 * Returns the first matching row element.
 */
export async function waitForRealtimeMessage(
  page: Page,
  options?: {
    messageType?: 'BROADCAST' | 'PRESENCE' | 'POSTGRES' | 'SYSTEM'
    timeout?: number
  }
) {
  const timeout = options?.timeout ?? 30000

  // Wait for at least one row to appear in the data grid
  const gridRow = page.locator('.data-grid--simple-logs [role="row"]').first()
  await expect(gridRow).toBeVisible({ timeout })

  return gridRow
}

/**
 * Get the message count from the "Found X messages" text.
 */
export async function getMessageCount(page: Page): Promise<number> {
  const countText = page.locator('text=/Found \\d+ messages/')
  if ((await countText.count()) === 0) {
    // Check for "No message found yet"
    const noMessages = page.locator('text=No message found yet')
    if ((await noMessages.count()) > 0) {
      return 0
    }
    // Check for "showing only the latest 100"
    const maxMessages = page.locator('text=/showing only the latest 100/')
    if ((await maxMessages.count()) > 0) {
      return 100
    }
    return 0
  }

  const text = await countText.textContent()
  const match = text?.match(/Found (\d+) messages/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Execute SQL via the SQL editor in a new page.
 * Opens a new page, executes the SQL, and closes the page.
 */
export async function executeSQL(page: Page, ref: string, sql: string) {
  const sqlPage = await page.context().newPage()

  try {
    await sqlPage.goto(toUrl(`/project/${ref}/sql/new?skip=true`))

    // Wait for the editor to load
    await sqlPage.waitForSelector('.view-lines', { timeout: 30000 })
    await sqlPage.locator('.view-lines').click()

    // Clear any existing content and type the SQL
    await sqlPage.keyboard.press('ControlOrMeta+KeyA')
    await sqlPage.keyboard.type(sql)

    // Run the SQL
    await sqlPage.getByTestId('sql-run-button').click()

    // Wait for the query to complete (success or error)
    await sqlPage.waitForTimeout(2000)
  } finally {
    await sqlPage.close()
  }
}

/**
 * Create a table with realtime enabled.
 * Uses executeSQL to create the table and enable realtime publication.
 */
export async function createRealtimeEnabledTable(page: Page, ref: string, tableName: string) {
  const sql = `
    -- Create the test table
    CREATE TABLE IF NOT EXISTS public.${tableName} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Enable RLS (optional but good practice)
    ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;

    -- Create a policy to allow all operations (for testing)
    DROP POLICY IF EXISTS "Allow all for testing" ON public.${tableName};
    CREATE POLICY "Allow all for testing" ON public.${tableName}
      FOR ALL USING (true) WITH CHECK (true);

    -- Add the table to the realtime publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.${tableName};
  `

  await executeSQL(page, ref, sql)
}

/**
 * Drop a test table.
 */
export async function dropTestTable(page: Page, ref: string, tableName: string) {
  const sql = `
    -- Remove from publication first
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.${tableName};

    -- Drop the table
    DROP TABLE IF EXISTS public.${tableName} CASCADE;
  `

  await executeSQL(page, ref, sql)
}

/**
 * Insert a row into a table (to trigger postgres_changes).
 */
export async function insertRow(page: Page, ref: string, tableName: string, name: string) {
  const sql = `INSERT INTO public.${tableName} (name) VALUES ('${name}');`
  await executeSQL(page, ref, sql)
}

/**
 * Update a row in a table (to trigger postgres_changes).
 */
export async function updateRow(
  page: Page,
  ref: string,
  tableName: string,
  id: number,
  newName: string
) {
  const sql = `UPDATE public.${tableName} SET name = '${newName}' WHERE id = ${id};`
  await executeSQL(page, ref, sql)
}

/**
 * Delete a row from a table (to trigger postgres_changes).
 */
export async function deleteRow(page: Page, ref: string, tableName: string, id: number) {
  const sql = `DELETE FROM public.${tableName} WHERE id = ${id};`
  await executeSQL(page, ref, sql)
}
