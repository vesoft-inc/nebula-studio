package utils

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
)

// Encrypt encrypts plaintext using AES encryption with a given key.
// It returns a base64-encoded ciphertext.
func Encrypt(plaintext, key []byte) (string, error) {
	// Generate a new AES cipher block using the key.
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher block: %v", err)
	}

	// Generate a new initialization vector (IV).
	iv := make([]byte, aes.BlockSize)
	if _, err := rand.Read(iv); err != nil {
		return "", fmt.Errorf("failed to generate initialization vector: %v", err)
	}

	// Pad the plaintext to a multiple of the block size.
	plaintext = pkcs7Pad(plaintext, aes.BlockSize)

	// Encrypt the plaintext using AES-CBC encryption.
	mode := cipher.NewCBCEncrypter(block, iv)
	ciphertext := make([]byte, len(plaintext))
	mode.CryptBlocks(ciphertext, plaintext)

	// Concatenate the IV and the ciphertext and encode them using base64.
	encoded := base64.StdEncoding.EncodeToString(append(iv, ciphertext...))

	return encoded, nil
}

// Decrypt decrypts a base64-encoded ciphertext using AES encryption with a given key.
// It returns the plaintext.
func Decrypt(encoded string, key []byte) ([]byte, error) {
	// Decode the base64-encoded ciphertext.
	ciphertext, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return nil, fmt.Errorf("failed to decode ciphertext: %v", err)
	}

	// Split the initialization vector (IV) and the ciphertext.
	iv := ciphertext[:aes.BlockSize]
	ciphertext = ciphertext[aes.BlockSize:]

	// Generate a new AES cipher block using the key.
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create cipher block: %v", err)
	}

	// Decrypt the ciphertext using AES-CBC decryption.
	mode := cipher.NewCBCDecrypter(block, iv)
	plaintext := make([]byte, len(ciphertext))
	mode.CryptBlocks(plaintext, ciphertext)

	// Unpad the plaintext.
	plaintext, err = pkcs7Unpad(plaintext, aes.BlockSize)
	if err != nil {
		return nil, fmt.Errorf("failed to unpad plaintext: %v", err)
	}

	return plaintext, nil
}

// pkcs7Pad pads the input to a multiple of the block size using the PKCS#7 padding scheme.
func pkcs7Pad(input []byte, blockSize int) []byte {
	padding := blockSize - len(input)%blockSize
	padtext := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(input, padtext...)
}

// pkcs7Unpad unpads the input using the PKCS#7 padding scheme.
func pkcs7Unpad(input []byte, blockSize int) ([]byte, error) {
	padding := int(input[len(input)-1])
	if padding < 1 || padding > blockSize {
		return nil, fmt.Errorf("invalid padding")
	}
	for i := 0; i < padding; i++ {
		if input[len(input)-padding+i] != byte(padding) {
			return nil, fmt.Errorf("invalid padding")
		}
	}
	return input[:len(input)-padding], nil
}
