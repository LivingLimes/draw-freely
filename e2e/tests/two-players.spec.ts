import { expect, test } from '@playwright/test'
import Player from '../utils/player'
import { GameMode } from '../utils/game-mode'
import { getServerDebugInfo } from '../utils/utils'

test('Two players in the game playing in turns', async ({ browser }) => {
  let player1: Player
  let player2: Player
  
  player1 = await Player.create(browser)
  player2 = await Player.create(browser)
  
  await test.step('Players should see and select game mode (one line)', async () => {
    await player1.goto()
    console.log('Player 1 joins: ', await getServerDebugInfo())
    
    await player2.goto()
    console.log('Player 2 joins: ', await getServerDebugInfo())
    
    await expect(player1.page.getByRole('button', { name: 'One Line' })).toBeVisible()
    await expect(player1.page.getByRole('button', { name: 'Line Length Limit' })).toBeVisible()
    
    await player1.selectMode(GameMode.OneLine)
    await expect(player1.page.getByText('You\'ve selected the \'One Line')).toBeVisible()
  })
  
  await test.step('Players should see the canvas initiated', async () => {
    await expect(player1.page.locator('canvas')).toBeVisible()
    await expect(player2.page.locator('canvas')).toBeVisible()
  })
  
  await test.step('Only one player can be the current player and draw at the first turn', async () => {
    async function drawAndCheck(player: Player) {
      await test.step(`Player ${player.id} draws`, async () => {
        await player.drawDot()
        await expect(player.page.getByText('Waiting for your turn to draw.')).toBeVisible()
        
        console.log(`After ${player.id} draws: `, await getServerDebugInfo())
      })
    }
    
    try {
      await drawAndCheck(player1)
    } catch (error) {
      try {
        await drawAndCheck(player2)
      } catch (error) {
        throw Error('No player is the current turn player')
      }
    }
  })
  
  await Player.cleanUp()
})