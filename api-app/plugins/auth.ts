import Hapi from '@hapi/hapi'
import jwt from 'jsonwebtoken'
import { getHash } from '@lib/crypto'
import { createToken, verifyToken } from '@lib/auth'

/*
 * TODO: We can't use this type because it is available only in 2.11.0 and previous versions
 * In 2.12.0, this will be namespaced under Prisma and can be used as Prisma.UserCreateInput
 * Once 2.12.0 is release, we can adjust this example.
 */
// import { UserCreateInput } from '@prisma/client'

// plugin to instantiate Prisma Client
const usersPlugin = {
	name: 'app/auth',
	dependencies: ['prisma'],
	register: async function (server: Hapi.Server) {
		server.route([
			{
				method: 'GET',
				path: '/auth/sign-in',
				handler(request, h) {
					return h.view('sign-in')
				}
			},
			{
				method: '*',
				path: '/api/auth',
				handler: (request, reply) => {
					return reply.redirect('/')
				}
			},
			{
				method: 'POST',
				path: '/api/auth/register',
				handler: registerUserHandler
			},
			{
				method: 'POST',
				path: '/api/auth/reset-password',
				handler: resetPasswordHandler
			},
			{
				method: 'POST',
				path: '/api/auth/sign-in',
				handler: signInUserHandler
			},
			{
				method: '*',
				path: '/api/auth/verify-token',
				handler: verifyTokenHandler
			}
		])
	}
}

export default usersPlugin

async function registerUserHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
	const { prisma } = request.server.app
	const { name, email, password, orgName } = request.payload as any

	if (!name || !email || !password || !orgName) {
		return h
			.response({
				error: 'Missing required fields'
			})
			.code(400)
	}

	try {
		const register = await prisma.user.create({
			data: {
				name,
				email,
				password: getHash('password'),
				account: {
					create: {
						org: {
							create: {
								name: orgName
							}
						},
						isActive: true
					}
				}
			}
		})

		// TODO: Check response before continuing

		// Create token
		const token = createToken({ name, email })

		return h.response({ success: register.id ? true : false, token }).code(200)
	} catch (err) {
		console.log(err)
	}
}

async function signInUserHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
	const { prisma } = request.server.app
	const { username, password } = request.payload as any

	if (!username || !password) {
		return h.response('Username or password missing.').code(401)
	} else {
		const user = await prisma.user.findMany({
			where: {
				email: username,
				password: getHash(password)
			}
		})

		console.log(user)
		if (user.length === 0) {
			return h.response('Invalid username or password.').code(401)
		} else {
			// Create token
			const token = createToken({ name: user[0].name || '', email: user[0].email })

			return h.response({ success: true, token }).code(200)
		}
	}
}

/**
 * Verify the token
 * @param request contains the jwt token
 * @param h
 * @returns
 */
async function verifyTokenHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
	const bearer = request.headers['authorization']

	try {
		return h.response(verifyToken(bearer)).code(200)
	} catch (err) {
		return h.response('Token is not valid.').code(401)
	}
}

async function resetPasswordHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
	const { prisma } = request.server.app
	const bearer = request.headers['authorization']
	const { oldPassword, newPassword } = request.payload as any

	try {
		const tokenContents = verifyToken(bearer)

		if (oldPassword === newPassword)
			return h
				.response({
					success: false,
					message: 'New password is the same as the old. Password not changed.'
				})
				.code(401)

		// Token invalid
		if (!tokenContents?.email || tokenContents?.email === '') {
			return h.response({ success: false, message: 'Invalid token' }).code(401)
		} else {
			// Lookup user; make sure password matches
			const user = await prisma.user.findMany({
				where: {
					email: tokenContents?.email,
					password: getHash(oldPassword)
				}
			})

			if (user.length === 0) {
				return h.response({ success: false, message: 'Invalid old password' }).code(401)
			} else {
				// User found, update password
				await prisma.user.update({
					where: {
						email: tokenContents?.email
					},
					data: {
						password: getHash(newPassword)
					}
				})

				return h.response({ success: true, message: 'Password reset successful.' }).code(200)
			}
		}
	} catch (err) {
		return h.response('Token is not valid.').code(401)
	}
}
