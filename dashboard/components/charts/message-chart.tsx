"use client";

import React, {useState, useRef, useCallback} from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {useMessagesFromTopic} from "@/hooks/pubsub-hooks";
import {PubSubMessage} from "@/lib/pubsubclient";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {UserIcon} from "lucide-react";

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
            type: 'cawd',
        },
        title: {
            text: 'Real-time Message Timeline'
        },
        xAxis: {
            type: 'datetime',
            tickPixelInterval: 1
        },
        plotOptions: {
            series: {
                label: {
                    connectorAllowed: false
                },
            }
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
        series: [{
            name: 'Messages',
            type: 'column', //line, spline, area, areaspline, column, bar, pie, scatter,
            data: aggregateMessages(messages, timeSlotSize)
        }]
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium"> </CardTitle>
                <select
                    className="border border-gray-300 rounded p-2 "
                    value={timeSlotSize}
                    onChange={(e) => setTimeSlotSize(Number(e.target.value))}
                >
                    <option value={TIME_SLOTS.SECOND}>Per Second</option>
                    <option value={TIME_SLOTS.MINUTE}>Per Minute</option>
                    <option value={TIME_SLOTS.HOUR}>Per Hour</option>
                </select>
            </CardHeader>
            <CardContent>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={chartOptions}
                    ref={chartComponentRef}
                />
            </CardContent>
        </Card>
    );
};

export default MessageChart;
