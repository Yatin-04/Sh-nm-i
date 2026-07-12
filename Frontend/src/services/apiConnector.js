export const apiConnector = async (method, url, bodyData = null, headers = null, params = null) => {
    // Safely append query parameters to the URL
    let finalUrl = url;

    if (params) {
        const queryString = new URLSearchParams(params).toString();
        finalUrl = `${url}?${queryString}`;
    }

    // Get token from localStorage for Authorization header
    const token = localStorage.getItem('token');

    // Set up request configuration with default JSON headers
    const config = {
        method: method.toUpperCase(),
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }),
            ...headers,
        },
    };

    // Attach body data if it exists and the method allows it
    if (bodyData && config.method !== "GET") {
        config.body = typeof bodyData === "object" ? JSON.stringify(bodyData) : bodyData;
    }

    // Execute request
    const response = await fetch(finalUrl, config);
    
    // Parse response data based on content type
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    // Fetch does not reject on HTTP errors automatically; throw explicitly
    if (!response.ok) {
        throw {
            status: response.status,
            statusText: response.statusText,
            data: data
        };
    }

    return data;
};