interface GetFinanceApiProps {
  isSocket?: boolean;
  imageUrl?: boolean;
}

export function getFinanceApi({ isSocket, imageUrl }: GetFinanceApiProps) {
  let baseUrl = import.meta.env.VITE_BASE_URL_API || "http://localhost:5009";

  if (imageUrl) return baseUrl;

  const currentUrl = window.location.href;

  if (currentUrl.includes("http://localhost")) {
    // baseUrl = 'http://localhost:4000';

    return isSocket ? baseUrl : `${baseUrl}`;
  }

  return isSocket ? baseUrl : `${baseUrl}`;
}
