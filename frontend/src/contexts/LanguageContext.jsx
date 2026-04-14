import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import en from '../i18n/en'
import fr from '../i18n/fr'
import ar from '../i18n/ar'

const translations = { en, fr, ar }
const LanguageContext = createContext(null)
const SUPPORTED = ['en', 'fr', 'ar']

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const stored = localStorage.getItem('lang')
    return SUPPORTED.includes(stored) ? stored : 'en'
  })

  const setLang = useCallback((code) => {
    if (!SUPPORTED.includes(code)) return
    localStorage.setItem('lang', code)
    setLangState(code)
  }, [])

  const t = useCallback(
    (key) => translations[lang]?.[key] ?? translations.en[key] ?? key,
    [lang]
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useTranslation must be used inside <LanguageProvider>')
  return ctx
}
