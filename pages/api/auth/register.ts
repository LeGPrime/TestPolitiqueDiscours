import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' })
  }

  const { name, email, password } = req.body

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis' })
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' })
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    })

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user

    res.status(201).json({ 
      message: 'Utilisateur créé avec succès', 
      user: userWithoutPassword 
    })
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    res.status(500).json({ message: 'Erreur interne du serveur' })
  }
}
