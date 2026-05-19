export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 bg-gradient-omnia rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">Ω</span>
      </div>
      <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-omnia dark:text-primary-500">
        Omnia
      </span>
    </div>
  )
}
