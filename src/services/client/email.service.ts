import API_ENDPOINTS from "@/config/api-endpoints";
import { StoredEmail } from "@/types";

export const getAllEmails = async (): Promise<StoredEmail[]> => {
  const response = await fetch(API_ENDPOINTS.emails);

  if (!response.ok) {
    return Promise.reject(new Error("Failed to fetch emails"));
  }

  return response.json();
};
