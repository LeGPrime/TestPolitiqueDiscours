import { SessionProvider } from 'next-auth/react'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '../lib/theme-context'
import '../styles/globals.css'

function FootRateApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <ThemeProvider>
      <SessionProvider session={session}>
        <Head>
          <title>FootRate - Le Letterboxd du football</title>
          <meta name="description" content="Notez et découvrez les meilleurs matchs de football" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <Component {...pageProps} />
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgb(var(--card))',
              color: 'rgb(var(--card-foreground))',
              borderRadius: '8px',
              border: '1px solid rgb(var(--border))',
            },
          }}
        />
      </SessionProvider>
    </ThemeProvider>
  )
}

export default FootRateApp