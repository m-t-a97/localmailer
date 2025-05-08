import { SmtpServerAction } from "@repo/data-commons";

import API_ENDPOINTS from "@/config/api-endpoints";

export const toggleSmtpServer = async (action: SmtpServerAction) => {
  const response = await fetch(API_ENDPOINTS.server, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    return Promise.reject(new Error(`Failed to ${action} server`));
  }

  return response.json();
};

export const checkSmtpServerStatus = async () => {
  const response = await fetch(API_ENDPOINTS.server);

  if (!response.ok) {
    return Promise.reject(new Error("Failed to check server status"));
  }

  return response.json();
};
