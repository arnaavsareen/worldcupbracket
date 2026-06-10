import { useState } from 'react'
import { copyShareUrl } from '../share'

interface Props {
  label: string
  url: string
}

export default function ShareBar({ label, url }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const ok = await copyShareUrl(url)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 border border-neutral-200 bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
          Share
        </p>
        <p className="truncate text-sm text-neutral-600">{url}</p>
      </div>
      <button
        onClick={copy}
        className="shrink-0 cursor-pointer bg-neutral-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
      >
        {copied ? 'Copied ✓' : `Copy ${label}`}
      </button>
    </div>
  )
}
