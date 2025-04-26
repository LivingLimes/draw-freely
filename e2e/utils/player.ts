import { Browser, BrowserContext, expect, Page, test } from '@playwright/test'
import { GameMode } from './game-mode'

export default class Player {
  static allPlayers: Player[] = []
  id: number
  readonly browser: Browser
  context!: BrowserContext
  page!: Page
  
  constructor(browser: Browser) {
    this.browser = browser
  }
  
  static async create(browser: Browser) {
    let player: Player
    
    await test.step('Player connects', async () => {
      player = new Player(browser)
      Player.allPlayers.push(player)
      player.id = Player.allPlayers.indexOf(player) + 1
      player.context = await player.browser.newContext()
      player.page = await browser.newPage()
      return player
    })
    
    return player
  }
  
  static async cleanUp() {
    await test.step('Clean up players', async () => {
      for (let player of Player.allPlayers) {
        await player.disconnect()
      }
      
      Player.allPlayers = []
    })
  }
  
  public async goto(url: string = '/') {
    await test.step(`Player join the game`, async () => {
      await this.page.goto(url)
    }, { box: true })
  }
  
  public async disconnect() {
    await test.step('Player disconnects', async () => {
      await this.page.close()
      await this.context.close()
    })
  }
  
  public async selectMode(gameMode: GameMode) {
    await test.step(`Player select ${gameMode}`, async () => {
      const button = this.page.getByRole('button', { name: gameMode })
      await expect(button).toBeVisible()
      await button.click()
    }, { box: true })
  }
  
  
  public async drawDot() {
    await test.step(`Player draws line`, async () => {
      const canvas = this.page.locator('canvas')
      const rect = await canvas.boundingBox()
      
      await canvas.scrollIntoViewIfNeeded()
      
      await test.step(`Player should see the canvas. Position: (${rect.x},${rect.y})`, async () => {
        await expect(canvas).toBeVisible()
      }, { box: true })
      
      // TODO: mouse drag and draw a line
      await test.step(`Start drawing`, async () => {
        await this.page.mouse.move(rect.x + 50, rect.y + 50)
        await this.page.mouse.down()
        await this.page.mouse.up()
      }, { box: true })
    }, { box: true })
  }
  
  public async isMyTurn() {
    return await test.step('Wait 5s and check if I am the current turn player', async () => {
      const isMyTurn = this.page.getByText('It is your turn to draw')
      await isMyTurn.waitFor({ state: 'visible', timeout: 5000 })
      
      return isMyTurn.isVisible
    }, { box: true })
  }
  
}