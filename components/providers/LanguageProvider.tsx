'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import en from '@/messages/en.json'
import bn from '@/messages/bn.json'

type Locale = 'bn' | 'en'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  translateProduct: <T extends { name: string; name_bn?: string | null; description?: string | null; description_bn?: string | null }>(
    product: T
  ) => T & { displayName: string; displayDescription: string }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const messages = { en, bn } as any

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('bn') // Default language is Bangla

  useEffect(() => {
    // Read locale from cookie or localStorage
    const savedLocale = document.cookie
      .split('; ')
      .find((row) => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as Locale

    if (savedLocale === 'bn' || savedLocale === 'en') {
      setLocaleState(savedLocale)
    } else {
      const localSaved = localStorage.getItem('sm_locale') as Locale
      if (localSaved === 'bn' || localSaved === 'en') {
        setLocaleState(localSaved)
      }
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    // Save to cookie and localStorage
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000` // 1 year expiry
    localStorage.setItem('sm_locale', newLocale)

    // Dynamically update page font / language tags
    const html = document.documentElement
    html.setAttribute('lang', newLocale)
    if (newLocale === 'bn') {
      html.classList.add('font-bangla')
      html.classList.remove('font-english')
    } else {
      html.classList.add('font-english')
      html.classList.remove('font-bangla')
    }
  }

  // Effect to set initial class on mount
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('lang', locale)
    if (locale === 'bn') {
      html.classList.add('font-bangla')
      html.classList.remove('font-english')
    } else {
      html.classList.add('font-english')
      html.classList.remove('font-bangla')
    }
  }, [locale])

  const t = (key: string) => {
    try {
      const keys = key.split('.')
      let value = messages[locale]
      for (const k of keys) {
        value = value[k]
      }
      return typeof value === 'string' ? value : key
    } catch {
      return key
    }
  }

  const translateProduct = <T extends { name: string; name_bn?: string | null; description?: string | null; description_bn?: string | null }>(
    product: T
  ) => {
    const isBn = locale === 'bn'
    return {
      ...product,
      displayName: (isBn && product.name_bn) ? product.name_bn : product.name,
      displayDescription: (isBn && product.description_bn) ? product.description_bn : (product.description || ''),
    }
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, translateProduct }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
