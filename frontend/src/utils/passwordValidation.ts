export const PASSWORD_RULE_TEXT =
  'Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character like @ or _.';

export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const isValidPassword = (value: string) => PASSWORD_PATTERN.test(value);
