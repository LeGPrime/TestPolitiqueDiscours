// lib/mma-api.ts - SERVICE API MMA/UFC COMPLET CORRIGÉ
// 🥊 IMPORT UFC COMBATS RÉELS AVEC DIAGNOSTIC AVANCÉ

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const MMA_API_HOST = 'mma-stats.p.rapidapi.com'

// 🥊 INTERFACE COMBAT UFC RÉEL (basée sur la vraie API)
export interface UFCFight {
  id: string
  date: string
  matchup: [string, string] // [fighter1, fighter2]
  tale_of_the_tape?: {
    [key: string]: {
      [fighterName: string]: string
    }
  }
  winner?: string
  loser?: string
  odds?: {
    [fighterName: string]: {
      American: string
      Decimal: string
      Fractional: string
      'Implied Probability': number
    }
  }
  event: string
  processed: {
    fighter1: {
      name: string
      record?: string
      stats?: any
    }
    fighter2: {
      name: string
      record?: string
      stats?: any
    }
    result?: {
      winner: 'fighter1' | 'fighter2' | 'draw'
      method?: string
    }
  }
}

// 🥊 CLASSE SERVICE API UFC RÉEL
class UFCAPIService {
  private quotaUsed = 0
  private dailyLimit = 2500 // Plan pro
  private baseUrl = `https://${MMA_API_HOST}`

  async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY non configurée pour l\'API UFC')
    }

    if (this.quotaUsed >= this.dailyLimit) {
      throw new Error('Quota mensuel API UFC dépassé')
    }

    try {
      const url = new URL(`${this.baseUrl}${endpoint}`)
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined) {
          url.searchParams.append(key, params[key].toString())
        }
      })

      console.log(`🥊 API UFC Request: ${url.toString()}`)

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': MMA_API_HOST,
        }
      })

      this.quotaUsed++

      console.log(`📊 Status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API UFC Error ${response.status}:`, errorText)
        
        // Ne pas throw pour les 404, juste retourner null
        if (response.status === 404) {
          return null
        }
        
        throw new Error(`API UFC Error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ API UFC Success:`, {
        type: Array.isArray(data) ? 'array' : typeof data,
        length: Array.isArray(data) ? data.length : 'N/A',
        keys: typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : 'N/A'
      })
      
      return data
    } catch (error) {
      console.error('❌ Erreur API UFC:', error)
      throw error
    }
  }

  // 🔍 RÉCUPÉRER COMBATS UFC PAR ANNÉE (MÉTHODE FIABLE)
  async getUFCFightsByYear(year: string = '2024'): Promise<UFCFight[]> {
    try {
      console.log(`🥊 Récupération combats UFC pour l'année ${year}...`)
      
      const endpoint = `/fights_by_year`
      const rawData = await this.makeRequest(endpoint, { year })

      const fights: UFCFight[] = []
      
      if (!rawData) {
        console.log(`❌ Pas de données pour l'année ${year}`)
        return fights
      }
      
      // rawData est un objet avec les dates comme clés
      if (rawData && typeof rawData === 'object') {
        console.log(`📅 Dates trouvées pour ${year}:`, Object.keys(rawData))
        
        for (const [dateKey, dayFights] of Object.entries(rawData)) {
          if (Array.isArray(dayFights)) {
            console.log(`📊 ${dateKey}: ${dayFights.length} combats`)
            
            for (const fightData of dayFights) {
              const processedFight = this.processFightData(fightData, dateKey, dateKey)
              if (processedFight) {
                fights.push(processedFight)
              }
            }
          }
        }
      }

      console.log(`✅ ${fights.length} combats UFC trouvés pour ${year}`)
      return fights

    } catch (error) {
      console.error(`❌ Erreur récupération combats ${year}:`, error)
      return []
    }
  }

  // 🥊 RÉCUPÉRER COMBATS UFC PAR DATE SPÉCIFIQUE
  async getUFCFightsByDate(dateString: string): Promise<UFCFight[]> {
    try {
      console.log(`🥊 Récupération combats UFC pour ${dateString}...`)
      
      // Formater la date pour l'API (ex: "April_08_2024")
      const formattedDate = this.formatDateForAPI(dateString)
      console.log(`📅 Date formatée: ${formattedDate}`)

      // Appel API pour cette date spécifique
      const endpoint = `/${formattedDate}`
      const rawData = await this.makeRequest(endpoint)

      const fights: UFCFight[] = []
      
      if (!rawData) {
        console.log(`❌ Pas d'événement UFC le ${dateString}`)
        return fights
      }
      
      // rawData devrait être un array pour une date spécifique
      if (Array.isArray(rawData)) {
        console.log(`📊 ${formattedDate}: ${rawData.length} combats`)
        
        for (const fightData of rawData) {
          const processedFight = this.processFightData(fightData, dateString, formattedDate)
          if (processedFight) {
            fights.push(processedFight)
          }
        }
      }

      console.log(`✅ ${fights.length} combats UFC trouvés pour ${dateString}`)
      return fights

    } catch (error) {
      console.error(`❌ Erreur récupération combats ${dateString}:`, error)
      return []
    }
  }

  // 🔍 RECHERCHER DES COMBATTANTS SPÉCIFIQUES
  async searchUFCFighter(fighterName: string): Promise<any> {
    try {
      console.log(`🔍 Recherche combattant UFC: "${fighterName}"`)
      
      const rawData = await this.makeRequest('/search', { name: fighterName })
      
      if (rawData) {
        console.log(`✅ Données combattant trouvées pour "${fighterName}"`)
        return rawData
      } else {
        console.log(`❌ Aucun combattant trouvé pour "${fighterName}"`)
        return null
      }

    } catch (error) {
      console.error(`❌ Erreur recherche UFC "${fighterName}":`, error)
      return null
    }
  }

  // 🥊 IMPORT COMPLET UFC AVEC DIAGNOSTIC AVANCÉ
  async importRealUFCFights2025(): Promise<{
    imported: number
    skipped: number
    errors: number
    examples: string[]
    diagnostics: string[]
    summary: {
      totalEvents: number
      period: string
      source: string
    }
  }> {
    const result = {
      imported: 0,
      skipped: 0,
      errors: 0,
      examples: [] as string[],
      diagnostics: [] as string[],
      summary: {
        totalEvents: 0,
        period: 'Multi-années (2024, 2023)',
        source: 'API MMA Stats (RapidAPI)'
      }
    }

    try {
      console.log('🥊 IMPORT UFC - VRAIS COMBATS AVEC DIAGNOSTIC')
      result.diagnostics.push('🚀 Début de l\'import UFC')
      
      // STRATÉGIE 1: Essayer fights_by_year pour 2024
      console.log('📅 Stratégie 1: fights_by_year pour 2024...')
      let fights = await this.getUFCFightsByYear('2024')
      result.diagnostics.push(`📊 2024: ${fights.length} combats trouvés`)
      
      // STRATÉGIE 2: Si pas assez de données 2024, essayer 2023
      if (fights.length < 50) {
        console.log('📅 Stratégie 2: fights_by_year pour 2023...')
        const fights2023 = await this.getUFCFightsByYear('2023')
        result.diagnostics.push(`📊 2023: ${fights2023.length} combats trouvés`)
        fights.push(...fights2023)
      }
      
      // STRATÉGIE 3: Si toujours pas assez, tester des dates spécifiques connues
      if (fights.length < 100) {
        console.log('📅 Stratégie 3: Dates spécifiques d\'événements UFC majeurs...')
        
        // Dates d'événements UFC réels de 2024
        const knownUFCDates2024 = [
          '2024-01-20', // UFC 297
          '2024-02-17', // UFC 298  
          '2024-03-09', // UFC 299
          '2024-04-13', // UFC 300
          '2024-05-04', // UFC 301
          '2024-06-01', // UFC 302
          '2024-06-29', // UFC 303
          '2024-07-27', // UFC 304
          '2024-08-17', // UFC 305
          '2024-09-14', // UFC 306
          '2024-10-05', // UFC 307
          '2024-11-16', // UFC 309
          '2024-12-07'  // UFC 310
        ]
        
        let specificDateFights = 0
        for (const dateStr of knownUFCDates2024) {
          const dateFights = await this.getUFCFightsByDate(dateStr)
          if (dateFights.length > 0) {
            fights.push(...dateFights)
            specificDateFights += dateFights.length
            result.diagnostics.push(`✅ ${dateStr}: ${dateFights.length} combats`)
          } else {
            result.diagnostics.push(`❌ ${dateStr}: Aucun combat`)
          }
          
          // Pause pour éviter rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        result.diagnostics.push(`📊 Dates spécifiques: ${specificDateFights} combats supplémentaires`)
      }
      
      console.log(`🎯 TOTAL: ${fights.length} combats UFC trouvés`)
      result.summary.totalEvents = fights.length
      
      if (fights.length === 0) {
        result.diagnostics.push('❌ PROBLÈME: Aucun combat trouvé avec toutes les stratégies')
        result.diagnostics.push('🔧 Suggestions: Vérifier les endpoints API ou l\'abonnement')
        result.errors++
        return result
      }

      result.diagnostics.push(`🎯 Début import en base: ${fights.length} combats à traiter`)

      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()

      for (const fight of fights) {
        try {
          // Créer un ID unique plus robuste
          const uniqueId = this.createUniqueId(fight.matchup[0], fight.matchup[1], fight.date)
          
          console.log(`🔍 Import: ${fight.matchup[0]} vs ${fight.matchup[1]} (${fight.event})`)

          // Vérifier si ce combat existe déjà (recherche plus robuste)
          const existing = await prisma.match.findFirst({
            where: {
              OR: [
                { 
                  AND: [
                    { homeTeam: fight.matchup[0] },
                    { awayTeam: fight.matchup[1] },
                    { sport: 'MMA' }
                  ]
                },
                {
                  AND: [
                    { homeTeam: fight.matchup[1] },
                    { awayTeam: fight.matchup[0] },
                    { sport: 'MMA' }
                  ]
                }
              ]
            }
          })

          if (existing) {
            console.log(`⚠️ Combat déjà existant: ${fight.matchup[0]} vs ${fight.matchup[1]}`)
            result.skipped++
            continue
          }

          // Créer le combat UFC avec plus de robustesse
          const fightData = {
            apiMatchId: parseInt(uniqueId) || Math.floor(Math.random() * 1000000),
            sport: 'MMA' as const,
            homeTeam: fight.matchup[0],
            awayTeam: fight.matchup[1],
            homeScore: fight.processed.result?.winner === 'fighter1' ? 1 : 
                      fight.processed.result?.winner === 'fighter2' ? 0 : null,
            awayScore: fight.processed.result?.winner === 'fighter2' ? 1 : 
                      fight.processed.result?.winner === 'fighter1' ? 0 : null,
            date: this.parseEventDate(fight.date),
            status: (fight.winner || fight.loser) ? 'FINISHED' : 'SCHEDULED',
            competition: fight.event || 'UFC Event',
            season: this.extractYear(fight.date),
            venue: this.extractVenue(fight) || "UFC Arena",
            referee: null,
            homeTeamLogo: null,
            awayTeamLogo: null,
            details: {
              type: 'UFC_FIGHT',
              matchup: fight.matchup,
              tale_of_the_tape: fight.tale_of_the_tape,
              winner: fight.winner,
              loser: fight.loser,
              odds: fight.odds,
              processed: fight.processed,
              api_data: fight,
              import_source: 'MMA Stats API',
              import_date: new Date().toISOString()
            }
          }

          await prisma.match.create({ data: fightData })
          result.imported++
          result.examples.push(`${fight.matchup[0]} vs ${fight.matchup[1]} (${fight.event})`)
          
          console.log(`✅ Combat UFC importé: ${fight.matchup[0]} vs ${fight.matchup[1]}`)

        } catch (error) {
          console.error(`❌ Erreur import combat ${fight.matchup[0]} vs ${fight.matchup[1]}:`, error)
          result.errors++
          result.diagnostics.push(`❌ Erreur: ${fight.matchup[0]} vs ${fight.matchup[1]} - ${error.message}`)
        }
      }

      await prisma.$disconnect()
      
      result.diagnostics.push(`🏁 Import terminé: ${result.imported} importés, ${result.skipped} ignorés, ${result.errors} erreurs`)
      console.log(`🏁 Import terminé: ${result.imported} combats importés`)

    } catch (error) {
      console.error('❌ Erreur import UFC:', error)
      result.errors++
      result.diagnostics.push(`❌ Erreur fatale: ${error.message}`)
    }

    return result
  }

  // 🔧 UTILITAIRES PRIVÉS

  private createUniqueId(fighter1: string, fighter2: string, date: string): string {
    const combined = `${fighter1}_${fighter2}_${date}`.replace(/[^a-zA-Z0-9_]/g, '')
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString()
  }

  private extractYear(dateStr: string): string {
    // Extraire l'année de différents formats
    if (dateStr.includes('_')) {
      const parts = dateStr.split('_')
      const yearPart = parts.find(part => part.length === 4 && /^\d{4}$/.test(part))
      if (yearPart) return yearPart
    }
    
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-')
      if (parts[0].length === 4) return parts[0]
    }
    
    return '2024' // Fallback
  }

  private extractVenue(fight: UFCFight): string | null {
    // Essayer d'extraire le lieu depuis tale_of_the_tape ou autres données
    if (fight.tale_of_the_tape) {
      // Chercher des indices de lieu dans les données
      for (const [key, values] of Object.entries(fight.tale_of_the_tape)) {
        if (key.toLowerCase().includes('venue') || key.toLowerCase().includes('location')) {
          const venue = Object.values(values)[0]
          if (venue && typeof venue === 'string') return venue
        }
      }
    }
    return null
  }

  private formatDateForAPI(dateString: string): string {
    const date = new Date(dateString)
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    const month = months[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear()
    
    return `${month}_${day}_${year}`
  }

  private parseEventDate(dateKey: string): Date {
    try {
      // Convertir "July_01_2024" en Date
      if (dateKey.includes('_')) {
        const parts = dateKey.split('_')
        if (parts.length === 3) {
          const [monthName, day, year] = parts
          const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ]
          const monthIndex = months.indexOf(monthName)
          if (monthIndex !== -1) {
            return new Date(parseInt(year), monthIndex, parseInt(day))
          }
        }
      }
      
      // Format ISO
      if (dateKey.includes('-')) {
        const date = new Date(dateKey)
        if (!isNaN(date.getTime())) return date
      }
      
      // Fallback
      return new Date()
    } catch {
      return new Date()
    }
  }

  private processFightData(fightData: any, originalDate: string, formattedDate: string): UFCFight | null {
    try {
      if (!fightData.matchup || !Array.isArray(fightData.matchup) || fightData.matchup.length !== 2) {
        console.log('⚠️ Combat sans matchup valide:', fightData)
        return null
      }

      const [fighter1, fighter2] = fightData.matchup

      // Validation des noms de combattants
      if (!fighter1 || !fighter2 || typeof fighter1 !== 'string' || typeof fighter2 !== 'string') {
        console.log('⚠️ Noms de combattants invalides:', fightData.matchup)
        return null
      }

      // Créer l'ID unique
      const fightId = `${formattedDate}_${fighter1.replace(/\s+/g, '_')}_vs_${fighter2.replace(/\s+/g, '_')}`

      // Traiter les données du tale of the tape
      const processed = {
        fighter1: {
          name: fighter1,
          record: this.extractRecord(fightData.tale_of_the_tape, fighter1),
          stats: this.extractStats(fightData.tale_of_the_tape, fighter1)
        },
        fighter2: {
          name: fighter2,
          record: this.extractRecord(fightData.tale_of_the_tape, fighter2),
          stats: this.extractStats(fightData.tale_of_the_tape, fighter2)
        }
      }

      // Déterminer le résultat si disponible
      if (fightData.winner && fightData.loser) {
        processed.result = {
          winner: fightData.winner === fighter1 ? 'fighter1' : 'fighter2',
          method: this.extractMethod(fightData) || 'Decision'
        }
      }

      const fight: UFCFight = {
        id: fightId,
        date: originalDate,
        matchup: [fighter1, fighter2],
        tale_of_the_tape: fightData.tale_of_the_tape,
        winner: fightData.winner,
        loser: fightData.loser,
        odds: fightData.odds,
        event: this.cleanEventName(formattedDate),
        processed
      }

      return fight

    } catch (error) {
      console.error('❌ Erreur traitement données combat:', error, fightData)
      return null
    }
  }

  private cleanEventName(formattedDate: string): string {
    return formattedDate.replace(/_/g, ' ').replace(/(\d{4})/, '$1')
  }

  private extractMethod(fightData: any): string | null {
    // Essayer d'extraire la méthode de victoire depuis les données disponibles
    if (fightData.method) return fightData.method
    if (fightData.finish) return fightData.finish
    if (fightData.result && fightData.result.method) return fightData.result.method
    return null
  }

  private extractRecord(taleOfTape: any, fighterName: string): string | undefined {
    if (!taleOfTape) return undefined
    
    try {
      const recordField = taleOfTape['Wins/Losses/Draws']
      return recordField ? recordField[fighterName] : undefined
    } catch {
      return undefined
    }
  }

  private extractStats(taleOfTape: any, fighterName: string): any {
    if (!taleOfTape) return {}
    
    const stats: any = {}
    
    try {
      // Extraire les stats importantes
      const statFields = [
        'Height', 'Weight', 'Reach', 'Stance',
        'Striking Accuracy', 'Takedown Accuracy', 'Defense',
        'Strikes Landed per Min. (SLpM)', 'Strikes Absorbed per Min. (SApM)'
      ]
      
      statFields.forEach(field => {
        if (taleOfTape[field] && taleOfTape[field][fighterName]) {
          stats[field] = taleOfTape[field][fighterName]
        }
      })
    } catch (error) {
      console.log('⚠️ Erreur extraction stats:', error)
    }
    
    return stats
  }

  // 🥊 TEST DE CONNEXION À L'API UFC
  async testConnection(): Promise<{
    success: boolean
    message: string
    data?: any
  }> {
    try {
      console.log('🔍 Test de connexion API UFC...')
      
      // Test 1: Search
      const searchTest = await this.makeRequest('/search', { name: 'Jones' })
      
      // Test 2: Fights by year
      const yearTest = await this.makeRequest('/fights_by_year', { year: '2024' })
      
      // Test 3: Specific date
      const dateTest = await this.makeRequest('/July_27_2024')
      
      return {
        success: true,
        message: '✅ API UFC connectée et opérationnelle',
        data: {
          endpoint: 'MMA Stats API (RapidAPI)',
          tests: {
            search: searchTest ? 'OK' : 'Empty',
            year: yearTest ? 'OK' : 'Empty', 
            date: dateTest ? 'OK' : 'Empty'
          },
          features: [
            'Combats UFC par date spécifique (/July_27_2024)',
            'Recherche par combattant (/search?name=Jones)',
            'Combats par année (/fights_by_year?year=2024)',
            'Tale of the tape complet',
            'Cotes de paris disponibles',
            'Plan PRO: 2500 requêtes/mois'
          ],
          quota: `${this.quotaUsed}/${this.dailyLimit} requêtes utilisées`,
          plan: 'PRO (2500/mois)'
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur test API UFC:', error)
      return {
        success: false,
        message: `❌ Erreur API UFC: ${error.message}`,
        data: {
          error: error.message,
          suggestions: [
            'Vérifiez votre RAPIDAPI_KEY dans .env',
            'Assurez-vous d\'être abonné à MMA Stats API sur RapidAPI',
            'Vérifiez votre quota sur RapidAPI (Plan PRO)',
            'L\'API doit être "mma-stats" par "chirikutsikuda"'
          ]
        }
      }
    }
  }

  // 🥊 QUOTA ET STATISTIQUES
  getQuotaStatus() {
    return {
      used: this.quotaUsed,
      remaining: this.dailyLimit - this.quotaUsed,
      limit: this.dailyLimit,
      percentage: Math.round((this.quotaUsed / this.dailyLimit) * 100),
      plan: 'PRO'
    }
  }

  resetQuota() {
    this.quotaUsed = 0
    console.log('🔄 Quota API UFC réinitialisé')
  }

  // 🧪 DEBUG - VOIR LES RÉPONSES BRUTES
  async debugAPIResponses(): Promise<any> {
    const tests = [
      { name: 'Search Jones', endpoint: '/search', params: { name: 'Jones' } },
      { name: 'Fights 2024', endpoint: '/fights_by_year', params: { year: '2024' } },
      { name: 'Date July 27 2024', endpoint: '/July_27_2024', params: {} },
      { name: 'Date April 13 2024', endpoint: '/April_13_2024', params: {} }
    ]
    
    const results = []
    
    for (const test of tests) {
      try {
        console.log(`🧪 Testing ${test.name}...`)
        const response = await this.makeRequest(test.endpoint, test.params)
        results.push({
          test: test.name,
          endpoint: test.endpoint,
          success: true,
          dataType: Array.isArray(response) ? 'array' : typeof response,
          count: Array.isArray(response) ? response.length : 'N/A',
          hasData: !!response,
          sample: Array.isArray(response) ? response.slice(0, 1) : response,
          keys: typeof response === 'object' && response ? Object.keys(response) : []
        })
      } catch (error) {
        results.push({
          test: test.name,
          endpoint: test.endpoint,
          success: false,
          error: error.message
        })
      }
      
      // Pause entre tests
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    return {
      results,
      quota: this.getQuotaStatus(),
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    }
  }
}

// 🥊 EXPORT SINGLETON
export const ufcAPI = new UFCAPIService()
export type { UFCFight }

// 🥊 FONCTIONS UTILITAIRES UFC
export function formatUFCMatchup(matchup: [string, string]): string {
  return `${matchup[0]} vs ${matchup[1]}`
}

export function extractFightResult(fight: UFCFight): string {
  if (fight.winner && fight.loser) {
    return `${fight.winner} bat ${fight.loser}`
  }
  if (fight.processed.result) {
    const winner = fight.processed.result.winner === 'fighter1' 
      ? fight.matchup[0] 
      : fight.matchup[1]
    return `${winner} victoire par ${fight.processed.result.method || 'Decision'}`
  }
  return 'Résultat non disponible'
}

export function getFighterRecord(fight: UFCFight, fighterIndex: 0 | 1): string {
  const fighter = fighterIndex === 0 ? fight.processed.fighter1 : fight.processed.fighter2
  return fighter.record || 'Record non disponible'
}

export default ufcAPI