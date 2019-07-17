import React from 'react'
import { Card, Alert, Statistic, Progress } from 'antd';
import { IDeviceMessages, IMessageType, IChannelType } from '../../MqttManager';
import { isBoolean, isNumber } from 'util';

let setDisconnect = (isAlive: boolean) => {
    if (isAlive) {
        return (
            <div style={{ color: '#4EB94A', fontWeight: 'bold', fontSize:16 }}>
                Connected
        </div>);
    }

    return (
        <div style={{ color: '#ff7f50', fontWeight: 'bold', fontSize:18 }}>
            Disconnected
        </div>
    );
}


const ResultTile = (props: { data: IChannelType }) => {
    let value = props.data;
    if (isBoolean(value.value)) {
        let c: "success" | "exception" = value.value ? "success" : "exception";
        return (
            <Progress type="circle"
                percent={100}
                key={value.topic}
                status={c}
            />        
        );
    }

    if (isNumber(value.value)) {
        let c : "success" | "exception" = value.value < 26 ? "success" : "exception";
        
        return (
            <Progress type="circle"
                percent={value.value}
                key={value.topic}
                format={(p) => `${p} ℃`}
                status={c}
            />
        )
    }

    return (
        <Progress type="circle"
                    percent={100}
                    key={value.topic}
                    format={() => `${value.value}`} 
                    status="exception"
        />
    );
}


const AlarmList = (props: { data: IDeviceMessages[] }) => {
    let arr = props.data;
    return (
        <div>
            {arr.map(item => {
                return (
                    <div key={item.name}>
                        <Card title={item.name} style={{ background: '#FAFAFA' }} extra={setDisconnect(item.isAlive)}>
                            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                                {item.values.map(itr => {
                                    return (
                                        <Card title={itr.topic} style={{ margin: '5px 5px' }}> 
                                            <ResultTile data={itr} />
                                        </Card>
                                    );
                                })}
                            </div>

                        </Card>
                    </div>
                )
            })}
        </div>
    )
}

export default AlarmList;
