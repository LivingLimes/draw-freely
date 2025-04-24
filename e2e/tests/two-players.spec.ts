import { test, expect, BrowserContext, Page } from '@playwright/test'

test.describe('two players', () => {
  let p1: BrowserContext
  let p2: BrowserContext
  let p1Page: Page
  let p2Page: Page
  let currentPlayer: 'player-1' | 'player-2'
  
  test.beforeEach(async ({ browser }) => {
    p1 = await browser.newContext()
    p2 = await browser.newContext()
    p1Page = await p1.newPage()
    p2Page = await p2.newPage()
  })
  
  test.afterEach(async () => {
    await p1Page.close()
    await p2Page.close()
    await p1.close()
    await p2.close()
  })
  
  test('should be able to select game mode', async () => {
    await p1Page.goto('/')
    
    await expect(p1Page.getByRole('button', { name: 'One Line' })).toBeVisible()
    await expect(p1Page.getByRole('button', { name: 'Line Length Limit' })).toBeVisible()
  })
  
  test('should update turn to another player after drawing', async () => {
    await p1Page.goto('/')
    await p2Page.goto('/')
    
    await p1Page.getByRole('button', { name: 'One Line' }).click()
    
    await expect(p1Page.locator('canvas')).toBeVisible()
    await expect(p2Page.locator('canvas')).toBeVisible()
  })
})
