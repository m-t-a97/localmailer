import { nanoid } from "nanoid";

export const generateEmailId = (): string => {
  return `email_${nanoid()}`;
};
