import axios from 'axios';

const api = axios.create({
    // 如果是开发环境 (import.meta.env.DEV)，使用完整地址跨域请求本地后端
    // 如果是生产环境 (服务器打包后)，使用相对路径，让 Nginx 处理转发
    //Nginx 是专门用来接收和转发网络请求的服务器软件。
    baseURL: import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '/api/v1',
    timeout: 10000,
});

// 请求拦截器，携带 Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 响应拦截器，处理全局错误
api.interceptors.response.use(
    (response) => {
        // 如果后端返回 code 不是 200，可以抛出异常
        const res = response.data;
        if (res && res.code && res.code !== 200) {
            // 特别处理如果后端返回 401
            if (res.code === 401) {
                // 不做任何拦截器层面的跳转！只抛出错误让业务代码自己处理。
            }
            return Promise.reject(new Error(res.message || 'Error'));
        }
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // 不做任何拦截器层面的跳转！只抛出错误让业务代码自己处理。
        }
        return Promise.reject(error);
    }
);

export default api;
