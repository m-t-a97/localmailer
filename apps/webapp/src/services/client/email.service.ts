import { NewComposedEmail, ComposedEmail } from "@repo/data-commons";

import API_ENDPOINTS from "@/config/api-endpoints";

export const getAllEmails = async (): Promise<ComposedEmail[]> => {
  const response = await fetch(API_ENDPOINTS.emails, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return Promise.reject(new Error("Failed to fetch emails"));
  }

  return response.json();
};

export const sendEmail = async (
  data: NewComposedEmail,
): Promise<{ success: boolean; emailId: string }> => {
  const response = await fetch(API_ENDPOINTS.emails, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return Promise.reject(new Error("Failed to send email"));
  }

  return response.json();
};

export async function deleteEmailById(id: string): Promise<void> {
  const response = await fetch(`${API_ENDPOINTS.emails}?id=${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete email");
  }
}
