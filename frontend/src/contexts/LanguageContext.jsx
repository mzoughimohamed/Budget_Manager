import { createContext, useContext, useState } from 'react'
import en from '../i18n/en'
import fr from '../i18n/fr'
import ar from '../i18n/ar'

const translations = { en, fr, ar }
const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') ?? 'en')

  const setLang = (code) => {
    localStorage.setItem('lang', code)
    setLangState(code)
  }

  const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  return useContext(LanguageContext)
}
