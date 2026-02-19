import crypto from "crypto";

/**
 * Salt and hash a password with JWT
 * @param password - The password to salt and hash
 * @returns The salted and hashed password
 */
export const saltAndHashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return { salt, hash };
};
