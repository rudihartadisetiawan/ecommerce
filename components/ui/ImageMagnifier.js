'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

// ponytail: magnifier on hover — tanpa library tambahan
export default function ImageMagnifier({ src, alt, width, height, priority }) {
  const containerRef = useRef(null)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [show, setShow] = useState(false)

  const handleMouse = (e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-[9/11] overflow-hidden rounded-2xl bg-[var(--color-bg-section)] cursor-crosshair"
      onMouseEnter={() => setShow(true)}
      onMouseMove={handleMouse}
      onMouseLeave={() => setShow(false)}
    >
      <Image src={src} alt={alt} width={width} height={height} className="h-full w-full object-cover" priority={priority} />
      {show && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: '200%',
            backgroundPosition: `${pos.x}% ${pos.y}%`,
          }}
        />
      )}
    </div>
  )
}
