import { useTranslation } from '../../contexts/LanguageContext'

const OPTIONS = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'ع' },
]

export default function LangSwitcher() {
  const { lang, setLang } = useTranslation()
  return (
    <div className="flex gap-1">
      {OPTIONS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            lang === code ? 'bg-app-accent text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
