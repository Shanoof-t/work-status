
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Types
export type User = {
    id: string
    username: string
    createdAt: Date
    updatedAt: Date
}

// Create User
export async function createUser(username: string) {
    try {
        // Validate username
        if (!username || username.trim().length < 2) {
            return { error: 'Username must be at least 2 characters long' }
        }

        if (username.trim().length > 50) {
            return { error: 'Username must be less than 50 characters' }
        }

        const cleanUsername = username.trim()

        let user = await prisma.user.findUnique({
            where: { username: cleanUsername }
        })

        if (!user) {

            // Create new user
            user = await prisma.user.create({
                data: {
                    username: cleanUsername
                },
                select: {
                    id: true,
                    username: true,
                    createdAt: true,
                    updatedAt: true
                }
            })

        }

        return { success: true, data: user }
    } catch (error) {
        console.error('Error creating user:', error)
        return { error: 'Failed to create user. Please try again.' }
    }
}

// // Get User by ID
// export async function getUserById(id: string) {
//     try {
//         const user = await prisma.user.findUnique({
//             where: { id },
//             select: {
//                 id: true,
//                 username: true,
//                 createdAt: true,
//                 updatedAt: true
//             }
//         })

//         if (!user) {
//             return { error: 'User not found' }
//         }

//         return { success: true, data: user }
//     } catch (error) {
//         console.error('Error fetching user:', error)
//         return { error: 'Failed to fetch user' }
//     }
// }

// // Get User by Username
// export async function getUserByUsername(username: string) {
//     try {
//         const user = await prisma.user.findUnique({
//             where: { username: username.trim() },
//             select: {
//                 id: true,
//                 username: true,
//                 createdAt: true,
//                 updatedAt: true
//             }
//         })

//         if (!user) {
//             return { error: 'User not found' }
//         }

//         return { success: true, data: user }
//     } catch (error) {
//         console.error('Error fetching user:', error)
//         return { error: 'Failed to fetch user' }
//     }
// }

// // Get All Users (for admin purposes)
// export async function getAllUsers() {
//     try {
//         const users = await prisma.user.findMany({
//             select: {
//                 id: true,
//                 username: true,
//                 createdAt: true,
//                 updatedAt: true,
//                 _count: {
//                     select: {
//                         workStatus: true
//                     }
//                 }
//             },
//             orderBy: {
//                 createdAt: 'desc'
//             }
//         })

//         return { success: true, data: users }
//     } catch (error) {
//         console.error('Error fetching users:', error)
//         return { error: 'Failed to fetch users' }
//     }
// }

// // Update User
// export async function updateUser(id: string, username: string) {
//     try {
//         // Validate username
//         if (!username || username.trim().length < 2) {
//             return { error: 'Username must be at least 2 characters long' }
//         }

//         if (username.trim().length > 50) {
//             return { error: 'Username must be less than 50 characters' }
//         }

//         const cleanUsername = username.trim()

//         // Check if username already exists (excluding current user)
//         const existingUser = await prisma.user.findFirst({
//             where: {
//                 username: cleanUsername,
//                 NOT: { id }
//             }
//         })

//         if (existingUser) {
//             return { error: 'Username already exists' }
//         }

//         const user = await prisma.user.update({
//             where: { id },
//             data: {
//                 username: cleanUsername
//             },
//             select: {
//                 id: true,
//                 username: true,
//                 createdAt: true,
//                 updatedAt: true
//             }
//         })

//         revalidatePath('/')
//         return { success: true, data: user }
//     } catch (error) {
//         console.error('Error updating user:', error)
//         return { error: 'Failed to update user' }
//     }
// }

// // Delete User
// export async function deleteUser(id: string) {
//     try {
//         await prisma.user.delete({
//             where: { id }
//         })

//         revalidatePath('/')
//         return { success: true }
//     } catch (error) {
//         console.error('Error deleting user:', error)
//         return { error: 'Failed to delete user' }
//     }
// }

// // Check if username is available
// export async function checkUsernameAvailability(username: string) {
//     try {
//         const existingUser = await prisma.user.findUnique({
//             where: { username: username.trim() }
//         })

//         return {
//             success: true,
//             data: {
//                 available: !existingUser
//             }
//         }
//     } catch (error) {
//         console.error('Error checking username:', error)
//         return { error: 'Failed to check username availability' }
//     }
// }