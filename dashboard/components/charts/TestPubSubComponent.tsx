"use client";

import React, { useEffect } from 'react';
import {useMessagesFromTopic} from "@/hooks/pubsub-hooks";

const TestPubSubComponent: React.FC = () => {
    const topic = "MAIN"; // Specify the topic you want to test with

    // Get all messages from the topic
    const messages = useMessagesFromTopic(topic);

    // Display both all messages and the latest message
    return (
        <div>
            <h1>Testing PubSubClient with WebSocket</h1>

            {/* Display the latest message */}
            <h2>Latest Message:</h2>

            {/* Display the list of all messages */}
            <h2>All Messages:</h2>
            <ul>
                {messages.length === 0 ? (
                    <li>No messages received yet</li>
                ) : (
                    messages.map((msg, index) => <li key={index}>{msg}</li>)
                )}
            </ul>
        </div>
    );
};

export default TestPubSubComponent;
