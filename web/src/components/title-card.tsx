import type { Title } from '@/lib/data'

interface TitleCardProps {
  title: Title
  onClick: () => void
}

export function TitleCard({ title, onClick }: TitleCardProps) {
  const posterUrl = title.poster_url.replace('/s718/', '/s276/')
  const score = title.imdb_score || title.tmdb_score

  return (
    <button
      onClick={onClick}
      className="group relative aspect-[2/3] rounded-md overflow-hidden bg-[var(--card)] hover:ring-2 hover:ring-[var(--accent)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] block w-full"
      aria-label={title.title}
    >
      <img
        src={posterUrl}
        alt={title.title}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        srcSet={`${title.poster_url.replace('/s718/', '/s166/')} 166w, ${title.poster_url.replace('/s718/', '/s276/')} 276w, ${title.poster_url.replace('/s718/', '/s592/')} 592w`}
        sizes="(max-width: 768px) 120px, (max-width: 1024px) 160px, 200px"
      />

      {/* Rating badge top-right */}
      {score !== null && score !== undefined && score > 0 && (
        <div className="absolute top-1 right-1 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-0.5 text-[10px] font-semibold text-white">
          <svg className="w-2.5 h-2.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {score.toFixed(1)}
        </div>
      )}

      {/* Hover overlay with title */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <h3 className="text-white text-xs font-semibold line-clamp-2 leading-tight text-left">
          {title.title}
        </h3>
        <p className="text-gray-300 text-[10px] mt-0.5 text-left">
          {title.release_year}
        </p>
      </div>
    </button>
  )
}
