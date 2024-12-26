import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'http://localhost:50052';

export interface SubscriberResponse {
    topic: string;
    subscribers: number;
}

export interface Message {
    message: string;
    timestamp: string;
}

export interface MessageResponse {
    topic: string;
    messages: Message[];
}

export interface ActivityResponse {
    topic: string;
    activity: { lastUpdated: string; subscriberCount: number; messageCount: number };
}

export interface SuccessResponse {
    message: string;
}

export const getDashboardData = async (): Promise<{ data: string }> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('Error fetching dashboard data:', axiosError.response?.data || axiosError.message);
        throw error;
    }
}

export const getTopics = async (): Promise<{ topics: string[] }> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/topics`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('Error fetching topics:', axiosError.response?.data || axiosError.message);
        throw error;
    }
};

export const getTotalSubscribers = async (): Promise<number> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/topics/subscribers`);
        return response.data.subscribers;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('Error fetching total subscribers:', axiosError.response?.data || axiosError.message);
        throw error;
    }
};

export const getSubscribersByTopic = async (topic: string): Promise<number> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/topics/${topic}/subscribers`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error(`Error fetching subscribers for topic ${topic}:`, axiosError.response?.data || axiosError.message);
        throw error;
    }
};

export const getMessages = async (): Promise<MessageResponse[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/topics/messages`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('Error fetching messages:', axiosError.response?.data || axiosError.message);
        throw error;
    }
}
export const getMessagesOrdered = async (): Promise<Message[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/topics/messages/ordered`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('Error fetching messages:', axiosError.response?.data || axiosError.message);
        throw error;
    }
}


export const getMessagesByTopic = async (topic: string): Promise<MessageResponse | { message: string }> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/topics/${topic}/messages`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error(`Error fetching messages for topic ${topic}:`, axiosError.response?.data || axiosError.message);
        throw error;
    }
};

export const postMessage = async (topic: string, message: string): Promise<SuccessResponse> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/topics/${topic}/messages`, { message });
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error(`Error posting message to topic ${topic}:`, axiosError.response?.data || axiosError.message);
        throw error;
    }
};

export const getActivity = async (topic: string): Promise<ActivityResponse | { message: string }> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/topics/${topic}/activity`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error(`Error fetching activity for topic ${topic}:`, axiosError.response?.data || axiosError.message);
        throw error;
    }
};

export const clearAllData = async (): Promise<SuccessResponse> => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/topics/clear`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('Error clearing all data:', axiosError.response?.data || axiosError.message);
        throw error;
    }
};

export const clearTopicData = async (topic: string): Promise<SuccessResponse> => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/topics/${topic}/clear`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error(`Error clearing data for topic ${topic}:`, axiosError.response?.data || axiosError.message);
        throw error;
    }
};
