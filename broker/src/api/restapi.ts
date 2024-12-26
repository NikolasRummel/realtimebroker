import express from 'express';
import cors from 'cors';
import {TopicStore} from "../store/store";

const app = express();

app.use(express.json());
app.use(cors());

const handleResponse = (res: express.Response, data: any, statusCode: number = 200) => {
    try {
        res.status(statusCode).json(data);
    } catch (error) {
        res.status(500).json({message: 'Internal server error: ' + error});
    }
};

app.get('/', (req, res) => {
    const data = TopicStore.getAllData();

    const serializedData = {
        topicSubscriberCounts: data.topicSubscriberCounts,
        topicMessages: serializeMap(data.topicMessages),
        topicActivity: serializeMap(data.topicActivity),
        topicSubscriptionDurations: serializeMap(data.topicSubscriptionDurations),
    };

    handleResponse(res, serializedData);
});

function serializeMap(map: Map<string, any>): Record<string, any> {
    const obj: Record<string, any> = {};
    map.forEach((value, key) => {
        obj[key] = value instanceof Map ? serializeMap(value) : value;
    });
    return obj;
}

app.get('/topics', (req, res) => {
    const topics = TopicStore.getAllTopics();
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

app.get('/topics/messages', (req, res) => {
    const messages = TopicStore.getAllMessages();
    const serialized = serializeMap(messages);
    handleResponse(res, serialized);
});

app.get('/topics/messages/ordered', (req, res) => {
    const messages = TopicStore.getAllMessagesOrderedByTimestamp();
    handleResponse(res, messages);
});

app.get('/topics/:topic/messages', (req, res) => {
    const {topic} = req.params;
    const messages = TopicStore.getMessages(topic);

    handleResponse(res, {topic, messages: messages.length > 0 ? messages : []});
});

interface PostMessageRequest {
    message: string;
}


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

export default app;
