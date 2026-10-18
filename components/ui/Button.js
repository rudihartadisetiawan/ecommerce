'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const variants = {
  primary: 'bg-[#111111] text-white border border-[#111111] hover:bg-white hover:text-[#111111]',
  secondary: 'bg-white text-[#111111] border border-white hover:bg-transparent hover:text-white',
  outline: 'border border-[#111111] bg-transparent text-[#111111] hover:bg-[#111111] hover:text-white',
  outlineWhite: 'border border-white bg-transparent text-white hover:bg-white hover:text-[#111111]',
  ghost: 'text-[#767676] hover:text-[#111111]',
}

export default function Button({
  variant = 'primary',
  as,
  href,
  children,
  className = '',
  loading = false,
  disabled = false,
  ...props
}) {
  const Tag = href ? Link : as || motion.button
  const isMotion = Tag === motion.button && !loading && !disabled

  const classes = `inline-flex items-center justify-center gap-2 rounded-xs px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer ${variants[variant] || variants.primary} ${loading || disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`

  const motionProps = isMotion
    ? { whileTap: { scale: 0.97 }, transition: { type: 'spring', stiffness: 400, damping: 17 } }
    : {}

  return (
    <Tag
      href={loading || disabled ? undefined : href}
      disabled={disabled || loading}
      className={classes}
      {...motionProps}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </Tag>
  )
}
