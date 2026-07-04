import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useSessionPersistenceStore } from './sessionStore'
import sessionPersistence from './index'

const SaveButton = sessionPersistence.ToolbarItem!

beforeEach(() => {
  useSessionPersistenceStore.setState({ lastSavedAt: null, saveToken: 0 })
})

describe('SaveButton', () => {
  it('requests a manual save when clicked', () => {
    render(<SaveButton />)
    fireEvent.click(screen.getByRole('button', { name: /Jetzt speichern/ }))
    expect(useSessionPersistenceStore.getState().saveToken).toBe(1)
  })

  it('shows the last saved time once available', () => {
    useSessionPersistenceStore.setState({ lastSavedAt: new Date(2026, 0, 1, 9, 30).getTime() })
    render(<SaveButton />)
    expect(screen.getByText('(09:30)')).toBeInTheDocument()
  })
})
