import type { ReactNode } from 'react'

// Tombol pilihan (seperti radio) dengan warna aksen arena
export function Choice({
  active,
  onClick,
  children,
  disabled,
  accent = 'border-primary bg-primary/5 text-primary',
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  disabled?: boolean
  accent?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
        active ? accent : 'border-line bg-white enabled:hover:bg-stone-50'
      }`}
    >
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 accent-primary" />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  )
}

export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold">{label}</h3>
      <div className="mt-2">{children}</div>
    </div>
  )
}
