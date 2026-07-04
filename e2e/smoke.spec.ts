import { expect, test, type Page } from '@playwright/test'

/**
 * These smoke tests exist to catch the class of problem that unit tests
 * and `tsc` cannot see: the app rendering wrong in a real browser —
 * broken images (a missing icon shows as a 0x0 image), uncaught runtime
 * errors, or a blank map.
 */

/** Uncaught exceptions and console errors, minus known-noisy sources. */
function collectPageProblems(page: Page): string[] {
  const problems: string[] = []
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    // Map tiles load from external hosts (OSM/swisstopo); a flaky tile is
    // a network issue, not an app bug, so it must not fail the smoke.
    if (/tile|wmts|openstreetmap|geo\.admin|ERR_/i.test(text)) return
    problems.push(`console.error: ${text}`)
  })
  return problems
}

/**
 * Return the src of every broken image, EXCLUDING map tiles (external,
 * network-dependent). Bundled UI/marker icons must always resolve.
 */
async function brokenNonTileImages(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter((img) => !img.classList.contains('leaflet-tile'))
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.getAttribute('src') ?? '(no src)'),
  )
}

test('app loads with a working map and no broken UI', async ({ page }) => {
  const problems = collectPageProblems(page)
  await page.goto('/')

  // Core chrome is present.
  await expect(page.locator('.leaflet-container')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'CrowdGIS' })).toBeVisible()

  // Give tiles/markers a moment to attempt loading.
  await page.waitForTimeout(1500)

  expect(await brokenNonTileImages(page), 'broken (non-tile) images').toEqual([])
  expect(problems, 'runtime errors').toEqual([])
})

test('sidebar panels collapse, and the icon rail works', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.leaflet-container')).toBeVisible()

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

test('drawing a marker shows a proper icon, not a broken image', async ({
  page,
}) => {
  const problems = collectPageProblems(page)
  await page.goto('/')
  await expect(page.locator('.leaflet-container')).toBeVisible()

  // Activate the marker draw tool (Leaflet-Geoman toolbar).
  const markerTool = page.locator('.leaflet-pm-icon-marker').first()
  await markerTool.click()

  // Move over the map so the preview marker appears, then place one.
  const map = page.locator('.leaflet-container')
  const box = await map.boundingBox()
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(300)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  }
  await page.waitForTimeout(500)

  // Both the preview marker and the placed marker are leaflet marker icons;
  // neither may be a broken image.
  expect(
    await brokenNonTileImages(page),
    'broken marker/preview icons',
  ).toEqual([])
  expect(problems, 'runtime errors').toEqual([])
})
