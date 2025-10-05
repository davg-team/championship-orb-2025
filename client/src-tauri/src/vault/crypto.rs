use base64;
use chacha20poly1305::aead::{Aead, KeyInit};
use chacha20poly1305::{Key, XChaCha20Poly1305, XNonce};
use rand::rngs::OsRng;
use rand::RngCore;

pub fn encrypt_with_key(
    key_bytes: &[u8; 32],
    plain: &[u8],
    aad: Option<&[u8]>,
) -> Result<(String, String), String> {
    let key = Key::from_slice(key_bytes);
    let cipher = XChaCha20Poly1305::new(key);
    let mut nonce_bytes = [0u8; 24];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = XNonce::from_slice(&nonce_bytes);
    let ciphertext = match aad {
        Some(a) => cipher.encrypt(
            nonce,
            chacha20poly1305::aead::Payload { msg: plain, aad: a },
        ),
        None => cipher.encrypt(nonce, plain),
    }
    .map_err(|e| format!("encrypt err: {:?}", e))?;
    Ok((base64::encode(&ciphertext), base64::encode(&nonce_bytes)))
}

pub fn decrypt_with_key(
    key_bytes: &[u8; 32],
    cipher_b64: &str,
    nonce_b64: &str,
    aad: Option<&[u8]>,
) -> Result<Vec<u8>, String> {
    let key = Key::from_slice(key_bytes);
    let cipher = XChaCha20Poly1305::new(key);
    let cipher_bytes =
        base64::decode(cipher_b64).map_err(|e| format!("base64 cipher decode: {:?}", e))?;
    let nonce_bytes =
        base64::decode(nonce_b64).map_err(|e| format!("base64 nonce decode: {:?}", e))?;
    let nonce = XNonce::from_slice(&nonce_bytes);
    let plain = match aad {
        Some(a) => cipher.decrypt(
            nonce,
            chacha20poly1305::aead::Payload {
                msg: &cipher_bytes,
                aad: a,
            },
        ),
        None => cipher.decrypt(nonce, cipher_bytes.as_ref()),
    }
    .map_err(|e| format!("decrypt err: {:?}", e))?;
    Ok(plain)
}
