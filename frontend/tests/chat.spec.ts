import { test, expect } from '@playwright/test';

test('can send message and receive response', async ({ page }) => {
  // Navigate to the chat page
  await page.goto('http://localhost:3000/');

  // Type a message in the input
  const messageInput = page.getByPlaceholder('Type a message...');
  await messageInput.fill('Hello AI assistant');

  // Click the send button
  await page.getByRole('button').click();

  // Verify the user message appears in the chat
  await expect(page.getByText('Hello AI assistant')).toBeVisible();

  // Verify the input is cleared after sending
  await expect(messageInput).toHaveValue('');

  // Verify there is an AI response (any message from the assistant)
  await expect(page.getByTestId('message-assistant')).toBeVisible();
});
