import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';
import api from './api';

const KEY_STORE = 'user_secret_key';

export const initCrypto = async () => {
  try {
    let secretKeyBase64 = await SecureStore.getItemAsync(KEY_STORE);
    let secretKey: Uint8Array;
    let keyPair: nacl.BoxKeyPair;

    if (!secretKeyBase64) {
      // Generate new keypair
      keyPair = nacl.box.keyPair();
      secretKey = keyPair.secretKey;
      await SecureStore.setItemAsync(KEY_STORE, naclUtil.encodeBase64(secretKey));
    } else {
      secretKey = naclUtil.decodeBase64(secretKeyBase64);
      keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
    }

    const publicKeyBase64 = naclUtil.encodeBase64(keyPair.publicKey);

    // Register public key to backend
    await api.post('/chat/key', { publicKey: publicKeyBase64 });

    return { publicKey: publicKeyBase64 };
  } catch (err) {
    console.error("Error initializing crypto:", err);
    throw err;
  }
};

export const encryptMessage = async (message: string, recipientPublicKeyBase64: string) => {
  const secretKeyBase64 = await SecureStore.getItemAsync(KEY_STORE);
  if (!secretKeyBase64) throw new Error("No secret key found. Init crypto first.");
  
  const secretKey = naclUtil.decodeBase64(secretKeyBase64);
  const recipientPublicKey = naclUtil.decodeBase64(recipientPublicKeyBase64);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = naclUtil.decodeUTF8(message);

  const encryptedMessage = nacl.box(messageUint8, nonce, recipientPublicKey, secretKey);

  return {
    encryptedMessage: naclUtil.encodeBase64(encryptedMessage),
    nonce: naclUtil.encodeBase64(nonce)
  };
};

export const decryptMessage = async (encryptedMessageBase64: string, nonceBase64: string, senderPublicKeyBase64: string) => {
  const secretKeyBase64 = await SecureStore.getItemAsync(KEY_STORE);
  if (!secretKeyBase64) throw new Error("No secret key found.");

  const secretKey = naclUtil.decodeBase64(secretKeyBase64);
  const senderPublicKey = naclUtil.decodeBase64(senderPublicKeyBase64);
  const nonce = naclUtil.decodeBase64(nonceBase64);
  const encryptedMessage = naclUtil.decodeBase64(encryptedMessageBase64);

  const decryptedMessageUint8 = nacl.box.open(encryptedMessage, nonce, senderPublicKey, secretKey);
  
  if (!decryptedMessageUint8) {
    throw new Error("Failed to decrypt message. Keys or nonce might be invalid.");
  }

  return naclUtil.encodeUTF8(decryptedMessageUint8);
};
