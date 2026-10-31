// Avatar pengguna: foto (URL), avatar bawaan ("emoji:🦁"), atau huruf awal nickname

export default function Avatar({ url, name, size = 40, className = '' }: { url?: string | null; name?: string; size?: number; className?: string }) {
  const style = { width: size, height: size, fontSize: size * 0.5 }
  if (url?.startsWith('emoji:')) {
    return (
      <span style={style} className={`grid shrink-0 place-items-center rounded-full bg-gold-soft ${className}`} aria-hidden>
        {url.slice(6)}
      </span>
    )
  }
  if (url) return <img src={url} alt="" style={style} className={`shrink-0 rounded-full object-cover ${className}`} />
  return (
    <span style={{ ...style, fontSize: size * 0.42 }} className={`grid shrink-0 place-items-center rounded-full bg-primary font-extrabold text-white ${className}`} aria-hidden>
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  )
}
