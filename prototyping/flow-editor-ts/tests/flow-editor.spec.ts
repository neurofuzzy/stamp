import { test, expect } from '@playwright/test';

test.describe('FlowBuilder Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/simple-demo.html');
    await page.waitForSelector('#flowEditor');
  });

  test('should maintain cursor position when typing "ON"', async ({ page }) => {
    const editor = page.locator('#flowEditor');
    
    // Clear existing content
    await editor.clear();
    
    // Type "ON" character by character
    await editor.type('O');
    await page.waitForTimeout(100); // Allow processing
    
    // Check that "O" appears correctly
    await expect(editor).toContainText('O');
    
    await editor.type('N');
    await page.waitForTimeout(100);
    
    // Should show "ON" not "NO"
    await expect(editor).toContainText('ON');
    
    // Check debug info
    const debug = page.locator('#debugInfo');
    await expect(debug).toContainText('Processing: "ON"');
  });

  test('should show syntax highlighting for "ON"', async ({ page }) => {
    const editor = page.locator('#flowEditor');
    
    await editor.clear();
    await editor.type('ON');
    await page.waitForTimeout(100);
    
    // Should have trigger color (red)
    const onSpan = editor.locator('span').filter({ hasText: 'ON' });
    await expect(onSpan).toHaveCSS('color', 'rgb(255, 51, 0)'); // #ff3300
  });

  test('should show completion for partial words', async ({ page }) => {
    const editor = page.locator('#flowEditor');
    
    await editor.clear();
    await editor.type('ON col');
    await page.waitForTimeout(100);
    
    // Should show completion in data-after attribute
    await expect(editor).toHaveAttribute('data-after', 'lision');
    
    // Debug should show completion
    const debug = page.locator('#debugInfo');
    await expect(debug).toContainText('col → collision');
  });

  test('should accept completion with Tab key', async ({ page }) => {
    const editor = page.locator('#flowEditor');
    
    await editor.clear();
    await editor.type('ON col');
    await page.waitForTimeout(100);
    
    // Press Tab to accept completion
    await editor.press('Tab');
    await page.waitForTimeout(100);
    
    // Should show full word
    await expect(editor).toContainText('collision');
    
    // Completion should be cleared
    await expect(editor).toHaveAttribute('data-after', '');
  });

  test('should accept completion with Space key', async ({ page }) => {
    const editor = page.locator('#flowEditor');
    
    await editor.clear();
    await editor.type('ON col');
    await page.waitForTimeout(100);
    
    // Press Space to accept completion
    await editor.press('Space');
    await page.waitForTimeout(100);
    
    // Should show full word with space
    await expect(editor).toContainText('collision ');
  });

  test('should handle complex flow statement', async ({ page }) => {
    const editor = page.locator('#flowEditor');
    
    await editor.clear();
    await editor.type('ON collision THEN do goto');
    await page.waitForTimeout(200);
    
    // Should have multiple colored spans
    const triggers = editor.locator('span').filter({ hasText: 'ON' });
    await expect(triggers).toHaveCSS('color', 'rgb(255, 51, 0)'); // trigger red
    
    const connectors = editor.locator('span').filter({ hasText: 'THEN' });
    await expect(connectors).toHaveCSS('color', 'rgb(0, 153, 204)'); // connector blue
    
    const actions = editor.locator('span').filter({ hasText: 'DO' });
    await expect(actions).toHaveCSS('color', 'rgb(221, 136, 102)'); // action orange
  });

  test('should maintain cursor position during continuous typing', async ({ page }) => {
    const editor = page.locator('#flowEditor');
    
    await editor.clear();
    
    // Type a longer string character by character
    const text = 'ON collision';
    for (let i = 0; i < text.length; i++) {
      await editor.type(text[i]);
      await page.waitForTimeout(50);
      
      // Check that text is building correctly
      const expectedText = text.substring(0, i + 1);
      await expect(editor).toContainText(expectedText);
    }
    
    // Final check
    await expect(editor).toContainText('ON collision');
  });

  test('should handle backspace correctly', async ({ page }) => {
    const editor = page.locator('#flowEditor');
    
    await editor.clear();
    await editor.type('ON collision');
    await page.waitForTimeout(100);
    
    // Backspace a few characters
    await editor.press('Backspace');
    await editor.press('Backspace');
    await editor.press('Backspace');
    await page.waitForTimeout(100);
    
    await expect(editor).toContainText('ON collis');
  });

  test('should load examples correctly', async ({ page }) => {
    // Click on the first example
    await page.click('.example:first-child');
    await page.waitForTimeout(100);
    
    const editor = page.locator('#flowEditor');
    await expect(editor).toContainText('ON collision THEN do goto player');
  });

  test('cursor position should be preserved across HTML updates', async ({ page }) => {
    const editor = page.locator('#flowEditor');
    
    await editor.clear();
    await editor.type('ON ');
    
    // Get cursor position
    const cursorPos = await page.evaluate(() => {
      const sel = window.getSelection();
      return sel ? sel.focusOffset : 0;
    });
    
    // Type more text
    await editor.type('collision');
    await page.waitForTimeout(100);
    
    // Text should be in correct order
    await expect(editor).toContainText('ON collision');
    await expect(editor).not.toContainText('collisionON');
  });
}); 