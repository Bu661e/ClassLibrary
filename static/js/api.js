const API_BASE = '/api';

async function request(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        credentials: 'same-origin'
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || '请求失败');
    }

    return data;
}

export const authApi = {
    login: (student_id, password) => request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ student_id, password })
    }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me')
};

export const bookApi = {
    list: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/books?${query}`);
    },
    get: (id) => request(`/books/${id}`),
    create: (data) => request('/books', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id, status) => request(`/books/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    })
};

export const borrowApi = {
    list: () => request('/borrows'),
    create: (book_id) => request('/borrows', { method: 'POST', body: JSON.stringify({ book_id }) }),
    return: (id) => request(`/borrows/${id}/return`, { method: 'PUT' })
};

export const adminApi = {
    getBorrows: (status) => request(`/admin/borrows?${status ? `status=${status}` : ''}`),
    approveBorrow: (id) => request(`/admin/borrows/${id}/approve`, { method: 'PUT' }),
    rejectBorrow: (id) => request(`/admin/borrows/${id}/reject`, { method: 'PUT' }),
    confirmReturn: (id) => request(`/admin/borrows/${id}/confirm-return`, { method: 'PUT' }),
    getUsers: () => request('/admin/users'),
    createUser: (data) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    getDashboard: () => request('/admin/dashboard'),
    getSettings: () => request('/admin/settings'),
    updateSettings: (data) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
    sendReminder: (recordIds) => request('/admin/overdue/send-reminder', {
        method: 'POST',
        body: JSON.stringify({ record_ids: recordIds })
    })
};

export const donorApi = {
    getConfirms: () => request('/donor/confirms'),
    approve: (id) => request(`/donor/confirms/${id}/approve`, { method: 'PUT' }),
    reject: (id) => request(`/donor/confirms/${id}/reject`, { method: 'PUT' })
};

export const reviewApi = {
    getBookReviews: (bookId) => request(`/books/${bookId}/reviews`),
    createReview: (bookId, data) => request(`/books/${bookId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(data)
    })
};

export const wishlistApi = {
    list: () => request('/wishlists'),
    add: (data) => request('/wishlists', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/wishlists/${id}`, { method: 'DELETE' }),
    adminList: (status) => request(`/admin/wishlists${status ? `?status=${status}` : ''}`),
    fulfill: (id) => request(`/admin/wishlists/${id}/fulfill`, { method: 'PUT' }),
    reject: (id) => request(`/admin/wishlists/${id}/reject`, { method: 'PUT' })
};

export const donationApi = {
    list: () => request('/donations'),
    add: (data) => request('/donations', { method: 'POST', body: JSON.stringify(data) }),
    adminList: (status) => request(`/admin/donations${status ? `?status=${status}` : ''}`),
    approve: (id) => request(`/admin/donations/${id}/approve`, { method: 'PUT' }),
    reject: (id) => request(`/admin/donations/${id}/reject`, { method: 'PUT' })
};
