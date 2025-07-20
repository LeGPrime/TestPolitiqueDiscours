// components/AnimatedCircularNote.tsx
import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'

interface Props {
  rating: number
  totalRatings: number
}

export default function AnimatedCircularNote({ rating, totalRatings }: Props) {
  const { ref, inView } = useInView({ triggerOnce: true })
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (inView && totalRatings > 0) {
      const finalValue = (rating / 5) * 100
      const animation = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 2
          if (next >= finalValue) {
            clearInterval(animation)
            return finalValue
          }
          return next
        })
      }, 10)
    }
  }, [inView, rating, totalRatings])

  const getColor = () => {
    if (rating >= 4) return 'text-green-500'
    if (rating >= 2.5) return 'text-yellow-400'
    return 'text-red-500'
  }

  const getTextColor = () => {
    if (rating >= 4) return 'text-green-600 dark:text-green-400'
    if (rating >= 2.5) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div ref={ref} className="w-8 h-8 relative">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-gray-300 dark:text-slate-600"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          d="M18 2.0845
             a 15.9155 15.9155 0 0 1 0 31.831
             a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        {totalRatings > 0 && (
          <path
            className={getColor()}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${progress}, 100`}
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[10px] font-bold ${getTextColor()}`}>
          {totalRatings > 0 ? rating.toFixed(1) : '—'}
        </span>
      </div>
    </div>
  )
}
