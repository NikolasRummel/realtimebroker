"use client";

import React, {useEffect, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ClockIcon, MessageCircleIcon, TagIcon, UserIcon} from "lucide-react";
import {getTopics, getTotalSubscribers} from "@/lib/api";
import {useMessagesFromTopic} from "@/hooks/pubsub-hooks";

const CardsGrid = () => {
    const [totalSubscribers, setTotalSubscribers] = useState(0);
    const [topics, setTopics] = useState<string[]>([]);

    const totalMessages = useMessagesFromTopic("ALL");

    const [startTime, setStartTime] = useState<number | null>(null);

    useEffect(() => {
        getTotalSubscribers().then((data) => {
            const total = Object.values(data).reduce((sum, count) => sum + count, 0);
            setTotalSubscribers(total);
        });

        getTopics().then((data) => setTopics(data.topics));

        if (totalMessages.length > 0 && startTime === null) {
            setStartTime(totalMessages[0].timestamp.getTime());
        }
    }, [totalMessages]);

    const messagesPerSecond = () => {
        if (startTime !== null && totalMessages.length > 0) {
            const elapsedTimeInSec = (Date.now() - startTime) / 1000;
            return (totalMessages.length / elapsedTimeInSec).toFixed(2);
        }
        return "0.00";
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Connected Subscribers</CardTitle>
                    <UserIcon/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalSubscribers}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Topics</CardTitle>
                    <TagIcon/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{topics.length}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                    <MessageCircleIcon/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalMessages.length}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Messages Per Second</CardTitle>
                    <ClockIcon/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{messagesPerSecond()}</div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CardsGrid;
