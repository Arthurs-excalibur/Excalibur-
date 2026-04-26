import { useEffect, useRef, useCallback } from 'react'

/**
 * Horizontal resize handle hook.
 * Returns a ref to attach to the handle element and calls onResize with the new width.
 */
export function useResizeH(
  currentWidth: number,
  onResize: (w: number) => void,
  direction: 'left' | 'right' = 'right'
) {
  const startX = useRef(0)
  const startW = useRef(currentWidth)

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      const delta = direction === 'right'
        ? e.clientX - startX.current
        : startX.current - e.clientX
      onResize(startW.current + delta)
    },
    [direction, onResize]
  )

  const onMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [onMouseMove])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startX.current = e.clientX
      startW.current = currentWidth
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [currentWidth, onMouseMove, onMouseUp]
  )

  return { onMouseDown }
}

/**
 * Vertical resize handle hook.
 * Returns a ref to attach to the handle element and calls onResize with the new height.
 */
export function useResizeV(
  currentHeight: number,
  onResize: (h: number) => void,
  direction: 'up' | 'down' = 'up'
) {
  const startY = useRef(0)
  const startH = useRef(currentHeight)

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      const delta = direction === 'up'
        ? startY.current - e.clientY
        : e.clientY - startY.current
      onResize(startH.current + delta)
    },
    [direction, onResize]
  )

  const onMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [onMouseMove])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startY.current = e.clientY
      startH.current = currentHeight
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [currentHeight, onMouseMove, onMouseUp]
  )

  return { onMouseDown }
}

/**
 * Auto-scroll a ref'd element to bottom when deps change.
 */
export function useAutoScroll(deps: unknown[], enabled = true) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (enabled && ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [deps, enabled])
  return ref
}
