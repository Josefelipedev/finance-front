import axios from "axios";
import {getFinanceApi} from "../utils/get-finance-api";


export const baseURLWebChatApi = getFinanceApi({ isSocket: false });

const financeApi = axios.create({
    baseURL: baseURLWebChatApi,

});

// Função para atualizar o token no header
function setAuthTokenFromLocalStorage() {
    const token = localStorage.getItem("financeToken");
    if (token) {
        financeApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete financeApi.defaults.headers.common["Authorization"];
    }
}

// Chamada inicial para configurar o token
setAuthTokenFromLocalStorage();

// Interceptor de resposta para lidar com 403
financeApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Se foi um 403 e ainda não tentamos novamente
        if (
            error.response &&
            error.response.status === 403 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            // Tenta pegar o token atualizado do localStorage
            setAuthTokenFromLocalStorage();

            // Atualiza o header da requisição original
            originalRequest.headers["Authorization"] =
                financeApi.defaults.headers.common["Authorization"];

            // Reenvia a requisição
            return financeApi(originalRequest);
        }

        // Rejeita o erro se não for 403 ou se já tentou
        return Promise.reject(error);
    },
);

export default financeApi;
