import axios from "axios";

const BASE_URL = "https://smd-server-agepb7h5fgdzc7fw.eastasia-01.azurewebsites.net/api/";

// tạo axios instance
const smdApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json" // chấp nhận dữ liệu json
  },
});

// interceptor để tự động thêm token vào header
smdApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// interceptor để xử lý response
smdApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi chung
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// export api function
export const AccountApi = {
  login: (username: string, password: string) => smdApi.post('Account/login', { username, password }),
}