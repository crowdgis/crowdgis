import { beforeEach, describe, expect, it } from 'vitest'
import { useSentinel2TimetravelStore } from './store'

const SCENES = [
  { id: 'clear', datetime: '2023-05-01T10:00:00Z', cloudCover: 2, visualUrl: 'a.tif' },
  { id: 'cloudy', datetime: '2023-06-01T10:00:00Z', cloudCover: 80, visualUrl: 'b.tif' },
]

beforeEach(() => {
  useSentinel2TimetravelStore.setState({
    drawing: false,
    aoi: null,
    scenes: [],
    selectedSceneId: null,
    loading: false,
    error: null,
    opacity: 1,
  })
})

describe('setScenes', () => {
  it('selects the first (least cloudy) scene by default', () => {
    useSentinel2TimetravelStore.getState().setScenes(SCENES)
    expect(useSentinel2TimetravelStore.getState().selectedSceneId).toBe('clear')
  })

  it('clears the selection when the result list is empty', () => {
    useSentinel2TimetravelStore.getState().setScenes([])
    expect(useSentinel2TimetravelStore.getState().selectedSceneId).toBeNull()
  })
})

describe('reset', () => {
  it('clears the AOI, scenes, selection and error state', () => {
    useSentinel2TimetravelStore.setState({
      aoi: { type: 'Polygon', coordinates: [] },
      scenes: SCENES,
      selectedSceneId: 'clear',
      error: 'oops',
      loading: true,
    })
    useSentinel2TimetravelStore.getState().reset()
    const state = useSentinel2TimetravelStore.getState()
    expect(state.aoi).toBeNull()
    expect(state.scenes).toEqual([])
    expect(state.selectedSceneId).toBeNull()
    expect(state.error).toBeNull()
    expect(state.loading).toBe(false)
  })
})
