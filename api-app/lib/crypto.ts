const CryptoJS = require('crypto-js')
const { createHash } = require('crypto')

/**
 * Encrypt a string that's going to be stored in the database.
 * @param text value to encrypt
 * @returns ciphertext based on the CIPHER_SECRET
 */
export function encrypt(text: string) {
	return CryptoJS.AES.encrypt(text, process.env.CIPHER_SECRET).toString()
}

/**
 * Decrypts a string that was encrypted using the encrypt function above.
 * @param ciphertext encrypted value
 * @returns decrypted text
 */
export function decrypt(ciphertext: string) {
	const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.CIPHER_SECRET)
	return bytes.toString(CryptoJS.enc.Utf8)
}

/**
 * Generate hash from text; used to verify API keys.
 * @param text text to generate hash on
 */
export function getHash(text: string) {
	const hash = createHash('sha256', process.env.CIPHER_SECRET)
		// updating data
		.update(text)

		// Encoding to be used
		.digest('hex')

	return hash
}

/**
 * Get the API key, hash the second part,
 * rebuild and return it to be used in the query.
 *
 * @param apiKey api key as passed via the request
 * @returns rebuilt hashed key
 */
export function getAPIHash(apiKey: string) {
	// Split the key; usually contains "prod_", "dev_", "test_", etc.
	const apiKeyArr = apiKey.split('_')

	// Get the hash from the last part of the key
	const hash = apiKeyArr.length > 1 ? getHash(apiKeyArr[1]) : ''

	// rebuild the hashed key and return it
	return `${apiKeyArr[0]}_${hash}`
}
