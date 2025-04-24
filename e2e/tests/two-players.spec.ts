import { expect, test } from '@playwright/test'
import Player from '../utils/player'
import { GameMode } from '../utils/game-mode'
import { afterEach } from 'node:test'

test.describe('Two players in the game', () => {
  
  afterEach(async () => {
    await Player.cleanUp()
  })
  
  test('Player should see and select game mode (one line)', async ({ browser }) => {
    const player1 = await Player.create(browser)
    
    await player1.goto()
    
    await expect(player1.page.getByRole('button', { name: 'One Line' })).toBeVisible()
    await expect(player1.page.getByRole('button', { name: 'Line Length Limit' })).toBeVisible()
    
    await player1.selectMode(GameMode.OneLine)
    await expect(player1.page.getByText('You\'ve selected the \'One Line')).toBeVisible()
    
  })
  
  test('Both players should see the canvas', async ({ browser }) => {
    const player1 = await Player.create(browser)
    const player2 = await Player.create(browser)
    
    await player1.goto()
    await player2.goto()
    
    await player1.selectMode(GameMode.OneLine)
    
    await expect(player1.page.locator('canvas')).toBeVisible()
    await expect(player2.page.locator('canvas')).toBeVisible()
    
    
  })
  
  test('Only one player can be the current player and draw at the first turn', async ({ browser }) => {
    const player1 = await Player.create(browser)
    const player2 = await Player.create(browser)
    
    await player1.goto()
    await player2.goto()
    
    await player1.selectMode(GameMode.OneLine)
    
    if (await player1.isMyTurn()) {
      await test.step('Player 1 draws', async () => {
        await player1.drawDot()
        await expect(player1.page.getByText('Waiting for your turn to draw.')).toBeVisible()
      })
    }
    else if (await player2.isMyTurn()) {
      await test.step('Player 2 draws', async () => {
        await player2.drawDot()
        await expect(player2.page.getByText('Waiting for your turn to draw.')).toBeVisible()
      })
    }
    else {
      throw Error('No player is the current turn player')
    }
  })
})
