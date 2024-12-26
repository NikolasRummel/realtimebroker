import express from 'express';
import cors from 'cors';
import {TopicStore} from "../store/store";

const app = express();

app.use(express.json());
app.use(cors());

const handleResponse = (res: express.Response, data: any, statusCode: number = 200) => {
    res.status(statusCode).json(data);
};

app.get('/', (req, res) => {
    const data = TopicStore.getAllData();

    const serializedData = {
        topicSubscriberCounts: data.topicSubscriberCounts,
        topicMessages: serializeMap(data.topicMessages),
        topicActivity: serializeMap(data.topicActivity),
        topicSubscriptionDurations: serializeMap(data.topicSubscriptionDurations)
    };

    handleResponse(res, serializedData);
});

function serializeMap(map: Map<string, any>): Record<string, any> {
    const obj: Record<string, any> = {};  // Use Record<string, any> to represent an object with string keys
    map.forEach((value, key) => {
        // If the value is a Map, call serializeMap recursively; otherwise, just assign the value
        obj[key] = value instanceof Map ? serializeMap(value) : value;
    });
    return obj;
}

app.get('/topics', (req, res) => {
    const topics = TopicStore.getAllTopics();
    console.log("topics", topics);
    handleResponse(res, {topics});
});

app.get('/topics/subscribers', (req, res) => {
    const subscribers = TopicStore.getSubscriberCount();
    handleResponse(res, {subscribers});
});

app.get('/topics/:topic/subscribers', (req, res) => {
    const {topic} = req.params;
    const subscribers = TopicStore.getSubscriberCountByTopic(topic);
    handleResponse(res, {subscribers});
});

app.get('/topics/:topic/messages', (req, res) => {
    const {topic} = req.params;
    const messages = TopicStore.getMessages(topic);
    if (messages.length > 0) {
        handleResponse(res, {topic, messages});
    } else {
        handleResponse(res, {message: `No messages for topic: ${topic}`}, 404);
    }
});

app.post('/topics/:topic/messages', (req, res) => {
    const {topic} = req.params;
    const {message} = req.body;

    if (!message) {
        return handleResponse(res, {message: 'Message is required'}, 400);
    }

    TopicStore.addMessage(topic, message);

    handleResponse(res, {message: `Message added to topic: ${topic}`});
});

app.get('/topics/:topic/activity', (req, res) => {
    const {topic} = req.params;
    const activity = TopicStore.getActivity(topic);
    if (activity) {
        handleResponse(res, {topic, activity});
    } else {
        handleResponse(res, {message: `No activity found for topic: ${topic}`}, 404);
    }
});

app.delete('/topics/clear', (req, res) => {
    TopicStore.clearAllData();
    handleResponse(res, {message: 'All data cleared'});
});

app.delete('/topics/:topic/clear', (req, res) => {
    const {topic} = req.params;
    TopicStore.clearMessages(topic);
    TopicStore.clearActivity(topic);
    TopicStore.clearSubscriptionDurations(topic);
    handleResponse(res, {message: `Cleared data for topic: ${topic}`});
});

export default app;