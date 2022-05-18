import jwt from 'jsonwebtoken'

export function createToken(
	{ name, email }: { name: String; email: String },
	expiresIn = '30 days'
) {
	return jwt.sign({ name, email }, process.env.JWT_TOKEN_KEY || 'MES', {
		expiresIn: expiresIn
	})
}

export function verifyToken(bearer: string) {
	const parts = bearer.split(' ')

	if (parts.length === 2) {
		var scheme = parts[0]
		var credentials = parts[1]

		if (/^Bearer$/i.test(scheme)) {
			const token = credentials

			//verify token
			return jwt.verify(token, process.env.JWT_TOKEN_KEY || 'MES') as any
		}
	}
}
