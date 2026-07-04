import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useMapStore } from '../../state/mapStore'
import mapOverview from './index'

const ToolbarItem = mapOverview.ToolbarItem!

beforeEach(() => {
  useMapStore.setState({ overviewToken: 0 })
})

describe('OverviewButton', () => {
  it('requests the Switzerland overview on click', () => {
    render(<ToolbarItem />)
    fireEvent.click(
      screen.getByRole('button', { name: /Ganze Schweiz anzeigen/ }),
    )
    expect(useMapStore.getState().overviewToken).toBe(1)

    fireEvent.click(
      screen.getByRole('button', { name: /Ganze Schweiz anzeigen/ }),
    )
    expect(useMapStore.getState().overviewToken).toBe(2)
  })
})
