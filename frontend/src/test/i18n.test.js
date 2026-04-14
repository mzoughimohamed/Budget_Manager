import { describe, it, expect } from 'vitest'
import en from '../i18n/en'
import fr from '../i18n/fr'
import ar from '../i18n/ar'

describe('translation files', () => {
  it('fr has every key that en has', () => {
    const missing = Object.keys(en).filter((k) => !(k in fr))
    expect(missing).toEqual([])
  })

  it('ar has every key that en has', () => {
    const missing = Object.keys(en).filter((k) => !(k in ar))
    expect(missing).toEqual([])
  })

  it('fr has no extra keys', () => {
    const extra = Object.keys(fr).filter((k) => !(k in en))
    expect(extra).toEqual([])
  })

  it('ar has no extra keys', () => {
    const extra = Object.keys(ar).filter((k) => !(k in en))
    expect(extra).toEqual([])
  })

  it('no translation is an empty string', () => {
    for (const [lang, dict] of [['en', en], ['fr', fr], ['ar', ar]]) {
      for (const [key, val] of Object.entries(dict)) {
        expect(val, `${lang}.${key} must not be empty`).not.toBe('')
      }
    }
  })
})
