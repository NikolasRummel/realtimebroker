"use client";

import React, { useState } from "react";
import { useMessagesFromTopic } from "@/hooks/pubsub-hooks";

interface TopicMessagesProps {
    topic: string;
}

const TopicMessages: React.FC<TopicMessagesProps> = ({ topic }) => {
    const messages = useMessagesFromTopic(topic);
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Filter messages based on the search term
    const filteredMessages = messages.filter(message =>
        message.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {filteredMessages.length > 0 ? (
                <ul className="space-y-2">
                    {filteredMessages.map((message, index) => (
                        <li
                            key={index}
                            className="border rounded p-3 bg-gray-50 shadow-sm"
                        >
                            <p className="text-sm text-gray-600">
                                <strong>Timestamp:</strong>{" "}
                                {new Date(message.timestamp).toLocaleString()}
                            </p>
                            <p className="text-base">{message.message}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No messages available for this topic.</p>
            )}
        </div>
    );
};

export default TopicMessages;
