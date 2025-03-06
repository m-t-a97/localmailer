// NOTE: All properties are in hex format which needs to be converted from hex to bytes during decryption
export type EncryptedField = {
  salt: string;
  iv: string;
  authTag: string;
  value: string;
};
