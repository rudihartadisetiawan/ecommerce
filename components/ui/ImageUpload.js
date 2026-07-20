'use client'

import { useState, useRef } from 'react'

// ponytail: upload file → base64 → API → simpan di public/uploads/ → return URL
export default function ImageUpload({ value, onChange, multiple, label, preview }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    // Validasi client-side
    if (!file.type.startsWith('image/')) { alert('Hanya file gambar'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Maksimal 5MB'); return }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: reader.result }),
        })
        if (!res.ok) { alert('Gagal upload'); setUploading(false); return }
        const data = await res.json()
        if (multiple) {
          onChange([...(value || []), data.url])
        } else {
          onChange(data.url)
        }
        setUploading(false)
      }
    } catch { setUploading(false) }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const remove = (idx) => {
    if (multiple) {
      onChange(value.filter((_, i) => i !== idx))
    } else {
      onChange('')
    }
  }

  const urls = multiple ? (value || []) : (value ? [value] : [])

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{label || 'Gambar'}</label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-text-secondary)]/20 bg-[var(--color-bg-warm)]/50 px-4 py-6 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        {uploading ? <span>Mengupload…</span> : <span>Klik atau tarik file ke sini</span>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />

      {preview !== false && urls.length > 0 && (
        <div className={`mt-2 grid gap-2 ${multiple ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {urls.map((url, i) => (
            <div key={url} className="group relative overflow-hidden rounded-xl border border-[var(--color-bg-section)] bg-[var(--color-bg-section)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-24 w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
