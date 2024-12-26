import express from 'express';
import cors from 'cors';
import {TopicStore} from "../store/store";
import {CONFIG} from "../config";

const app = express();
const port = CONFIG.restApiPort;

app.use(express.json());
app.use(cors());

const handleResponse = (res: express.Response, data: any, statusCode: number = 200) => {
    res.status(statusCode).json(data);
};

app.get('/topics/:topic/subscribers', (req, res) => {
    const { topic } = req.params;
    const subscribers = TopicStore.getSubscribers(topic);
    if (subscribers.length > 0) {
        handleResponse(res, { topic, subscribers: subscribers.length });
    } else {
        handleResponse(res, { message: `No subscribers for topic: ${topic}` }, 404);
    }
});

app.get('/topics/:topic/messages', (req, res) => {
    const { topic } = req.params;
    const messages = TopicStore.getMessages(topic);
    if (messages.length > 0) {
        handleResponse(res, { topic, messages });
    } else {
        handleResponse(res, { message: `No messages for topic: ${topic}` }, 404);
    }
});

app.post('/topics/:topic/messages', (req, res) => {
    const { topic } = req.params;
    const { message } = req.body;

    if (!message) {
        return handleResponse(res, { message: 'Message is required' }, 400);
    }

    TopicStore.addMessage(topic, message);

    handleResponse(res, { message: `Message added to topic: ${topic}` });
});

app.get('/topics/:topic/activity', (req, res) => {
    const { topic } = req.params;
    const activity = TopicStore.getActivity(topic);
    if (activity) {
        handleResponse(res, { topic, activity });
    } else {
        handleResponse(res, { message: `No activity found for topic: ${topic}` }, 404);
    }
});

app.delete('/topics/clear', (req, res) => {
    TopicStore.clearAllData();
    handleResponse(res, { message: 'All data cleared' });
});

app.delete('/topics/:topic/clear', (req, res) => {
    const { topic } = req.params;
    TopicStore.clearMessages(topic);
    TopicStore.clearActivity(topic);
    TopicStore.clearSubscriptionDurations(topic);
    handleResponse(res, { message: `Cleared data for topic: ${topic}` });
});

export default app;