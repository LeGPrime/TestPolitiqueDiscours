// pages/_app.tsx - Version avec AvatarProvider
import { SessionProvider, useSession } from 'next-auth/react'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '../lib/theme-context'
import { AvatarProvider } from '../lib/avatar-context' // 🆕 Import AvatarProvider
import '../styles/globals.css'

function FootRateApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <>
      <Head>
        <title>Sporating - Ton oeil sur le jeu</title>
        <meta name="description" content="Notez et découvrez les meilleurs événements sportifs" />
        
        {/* 📱 META TAGS MOBILE ESSENTIELS */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SportRate" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        
        {/* 🔗 PREFETCH ET PRELOAD */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* 🎨 FAVICONS POUR TOUS LES DEVICES */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* 📐 PREVENT ZOOM ON INPUTS (iOS Safari) */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media screen and (max-width: 768px) {
              input[type="text"], 
              input[type="email"], 
              input[type="password"], 
              textarea, 
              select {
                font-size: 16px !important;
              }
            }
          `
        }} />
      </Head>
      
      <ThemeProvider>
        <SessionProvider session={session}>
          {/* 🆕 WRAPPER AVEC AVATARPROVIDER POUR LES USERS CONNECTÉS */}
          <SessionAwareAvatarProvider>
            <Component {...pageProps} />
            
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'rgb(var(--card))',
                  color: 'rgb(var(--card-foreground))',
                  borderRadius: '12px',
                  border: '1px solid rgb(var(--border))',
                  fontSize: '14px',
                  maxWidth: '90vw', // 📱 Responsive width
                  wordBreak: 'break-word'
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </SessionAwareAvatarProvider>
        </SessionProvider>
      </ThemeProvider>
    </>
  )
}

// 🆕 COMPOSANT WRAPPER POUR CONDITIONNER L'AVATARPROVIDER
function SessionAwareAvatarProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  
  // Seulement utiliser AvatarProvider si l'utilisateur est connecté
  if (session?.user) {
    return (
      <AvatarProvider>
        {children}
      </AvatarProvider>
    )
  }
  
  // Pas de provider si pas connecté
  return <>{children}</>
}

export default FootRateApp