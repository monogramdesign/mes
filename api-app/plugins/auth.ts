import Hapi from '@hapi/hapi'
import jwt from 'jsonwebtoken'
import { getHash } from '@lib/crypto'
import { verifyToken } from '@lib/auth'

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
				method: '*',
				path: '/auth',
				handler: (request, reply) => {
					return reply.redirect('/')
				}
			},
			{
				method: 'POST',
				path: '/auth/register',
				handler: registerUserHandler
			},
			{
				method: 'POST',
				path: '/auth/sign-in',
				handler: signInUserHandler
			},
			{
				method: 'POST',
				path: '/auth/verify-token',
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

		// Create token
		const token = jwt.sign({ name, email }, process.env.JWT_TOKEN_KEY || 'MES', {
			expiresIn: '30 days'
		})

		return h.response({ success: register.id ? true : false, token }).code(200)
	} catch (err) {
		console.log(err)
	}
}

async function signInUserHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {}

/**
 * Verify the token
 * @param request contains the jwt token
 * @param h
 * @returns
 */
async function verifyTokenHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
	const { token } = request.payload as any

	try {
		return h.response(verifyToken(token)).code(200)
	} catch (err) {
		return h.response('Token is not valid.').code(401)
	}
}
