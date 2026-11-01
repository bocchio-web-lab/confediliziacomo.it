export const MIN_PASSWORD_LENGTH = 10;

export const PASSWORD_HINT = `Almeno ${MIN_PASSWORD_LENGTH} caratteri.`;

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
