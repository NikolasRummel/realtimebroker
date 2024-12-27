"use client";

import React, { useState, useRef, useCallback } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {useMessagesFromTopic} from "@/hooks/pubsub-hooks";
import {PubSubMessage} from "@/lib/pubsubclient";

const TIME_SLOTS = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000
};

const MessageChart: React.FC = () => {
    const messages = useMessagesFromTopic("MAIN");


    const [timeSlotSize, setTimeSlotSize] = useState<number>(TIME_SLOTS.SECOND);
    const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

    const aggregateMessages = useCallback((msgs: PubSubMessage[], slotSize: number): [number, number][] => {
        const aggregated: { [key: number]: number } = {};
        msgs.forEach(msg => {
            const timestamp = Math.floor(parseInt(String(msg.timestamp.getTime() / slotSize)) * slotSize);
            aggregated[timestamp] = (aggregated[timestamp] || 0) + 1;
        });
        return Object.entries(aggregated).map(([timestamp, count]) => [parseInt(timestamp), count]);
    }, []);

    const getTimeSlotLabel = useCallback((slotSize: number): string => {
        if (slotSize === TIME_SLOTS.SECOND) return 'Second';
        if (slotSize === TIME_SLOTS.MINUTE) return 'Minute';
        if (slotSize === TIME_SLOTS.HOUR) return 'Hour';
        return 'Time Slot';
    }, []);

    const chartOptions: Highcharts.Options = {
        chart: {
            type: 'column',
        },
        title: {
            text: 'Real-time Message Timeline'
        },
        xAxis: {
            type: 'datetime',
            tickPixelInterval: 150
        },
        yAxis: {
            title: {
                text: `Message Count per ${getTimeSlotLabel(timeSlotSize)}`
            },
            min: 0
        },
        tooltip: {
            formatter: function () {
                return '<b>' + Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '</b><br/>' +
                    `Messages in this ${getTimeSlotLabel(timeSlotSize).toLowerCase()}: ` + this.y;
            }
        },
        legend: {
            enabled: false
        },
        series: [{
            name: 'Messages',
            type: 'column',
            data: aggregateMessages(messages, timeSlotSize)
        }]
    };

    return (
        <div>
            <div>
                <button onClick={() => setTimeSlotSize(TIME_SLOTS.SECOND)}>Per Second</button>
                <button onClick={() => setTimeSlotSize(TIME_SLOTS.MINUTE)}>Per Minute</button>
                <button onClick={() => setTimeSlotSize(TIME_SLOTS.HOUR)}>Per Hour</button>
            </div>
            <HighchartsReact
                highcharts={Highcharts}
                options={chartOptions}
                ref={chartComponentRef}
            />
        </div>
    );
};

export default MessageChart;
