import { expect, test, type Page } from '@playwright/test'

/**
 * These smoke tests exist to catch the class of problem that unit tests
 * and `tsc` cannot see: the app rendering wrong in a real browser —
 * uncaught runtime errors, a blank map, broken tool interactions.
 */

/** Uncaught exceptions and console errors, minus known-noisy sources. */
function collectPageProblems(page: Page): string[] {
  const problems: string[] = []
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    // Map tiles load from external hosts (OSM/swisstopo); a flaky or
    // out-of-coverage tile is a network issue, not an app bug.
    if (/tile|wmts|openstreetmap|geo\.admin|ERR_|404|400/i.test(text)) return
    problems.push(`console.error: ${text}`)
  })
  return problems
}

/** Broken bundled images (there are no external tile <img>s with OL). */
async function brokenImages(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.getAttribute('src') ?? '(no src)'),
  )
}

test('app loads with a working map and no broken UI', async ({ page }) => {
  const problems = collectPageProblems(page)
  await page.goto('/')

  // Core chrome is present: OL viewport with a rendered canvas.
  await expect(page.locator('.ol-viewport')).toBeVisible()
  await expect(page.locator('.ol-viewport canvas').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'CrowdGIS' })).toBeVisible()

  // Give tiles a moment to attempt loading.
  await page.waitForTimeout(1500)

  expect(await brokenImages(page), 'broken images').toEqual([])
  expect(problems, 'runtime errors').toEqual([])
})

test('sidebar panels collapse, and the icon rail works', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.ol-viewport')).toBeVisible()

  // First visit: core panels open, everything else collapsed.
  const ebenen = page.getByRole('button', { name: 'Ebenen' })
  await expect(ebenen).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText(/Noch keine Ebenen geladen/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Messen' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )

  // Collapse a panel via its header.
  await ebenen.click()
  await expect(page.getByText(/Noch keine Ebenen geladen/)).toBeHidden()

  // Switch to the compact icon rail and open one panel there.
  await page.getByRole('button', { name: 'Kompakte Seitenleiste' }).click()
  await page.getByRole('button', { name: 'Ebenen' }).click()
  await expect(page.getByText(/Noch keine Ebenen geladen/)).toBeVisible()

  // And back to the stacked list.
  await page.getByRole('button', { name: 'Breite Seitenleiste' }).click()
  await expect(page.getByRole('button', { name: 'Messen' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
})

test('drawing works: a sketched line appears in the panels', async ({
  page,
}) => {
  const problems = collectPageProblems(page)
  await page.goto('/')
  await expect(page.locator('.ol-viewport canvas').first()).toBeVisible()
  await page.waitForTimeout(500)

  // Draw a line with the sketch toolbar (two clicks + double click ends).
  await page.getByRole('button', { name: 'Linie zeichnen' }).click()
  const map = page.locator('.ol-viewport')
  const box = await map.boundingBox()
  expect(box).not.toBeNull()
  if (box) {
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    await page.mouse.click(cx, cy)
    await page.waitForTimeout(200)
    await page.mouse.click(cx + 120, cy + 40)
    await page.waitForTimeout(200)
    await page.mouse.dblclick(cx + 120, cy + 40)
  }

  // The sketch syncs into the stores: sketch panel counts it and the
  // measure panel shows a length.
  await page.getByRole('button', { name: 'Skizzieren' }).click()
  await expect(page.getByText(/1 Objekt gezeichnet/)).toBeVisible()
  await page.getByRole('button', { name: 'Messen' }).click()
  await expect(page.getByText(/km|m/).first()).toBeVisible()

  expect(problems, 'runtime errors').toEqual([])
})
