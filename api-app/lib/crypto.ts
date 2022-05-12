const CryptoJS = require('crypto-js')

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
