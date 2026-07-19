'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const variants = {
  primary: 'bg-[var(--color-accent)] text-white hover:brightness-110',
  outline: 'border border-[var(--color-text-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-text-primary)] hover:text-white',
  ghost: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
}

export default function Button({
  variant = 'primary',
  as,
  href,
  children,
  className = '',
  ...props
}) {
  const Tag = href ? Link : as || motion.button
  const isMotion = Tag === motion.button

  const classes = `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium font-[var(--font-body)] transition-colors ${variants[variant]} ${className}`

  const motionProps = isMotion
    ? { whileTap: { scale: 0.97 }, transition: { type: 'spring', stiffness: 400, damping: 17 } }
    : {}

  return (
    <Tag
      href={href}
      className={classes}
      {...motionProps}
      {...props}
    >
      {children}
    </Tag>
  )
}
