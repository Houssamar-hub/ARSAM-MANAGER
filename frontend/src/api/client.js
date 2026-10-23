const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export const getToken = () => {
  return localStorage.getItem("arsam_auth_token");
};

export const setToken = (token) => {
  if (token) {
    localStorage.setItem("arsam_auth_token", token);
  } else {
    localStorage.removeItem("arsam_auth_token");
  }
};

export const removeToken = () => {
  localStorage.removeItem("arsam_auth_token");
};

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent("arsam:auth_error", { detail: data }));
      }

      let message = "Une erreur est survenue lors de la communication avec le serveur";
      if (data) {
        if (data.message) {
          message = data.message;
        } else if (Array.isArray(data.errors) && data.errors.length > 0) {
          message = data.errors.join(", ");
        }
      }

      throw new ApiError(message, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network / Fetch failure
    console.error("Network request failed:", error);
    throw new ApiError(
      "Impossible de se connecter au serveur backend. Veuillez vérifier que le serveur est bien démarré sur le port 5000.",
      0,
      null
    );
  }
}

export const apiClient = {
  get: (endpoint, params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, val);
      }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return request(url, { method: "GET" });
  },

  post: (endpoint, body = {}) => {
    return request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put: (endpoint, body = {}) => {
    return request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete: (endpoint) => {
    return request(endpoint, { method: "DELETE" });
  },
};

export default apiClient;
