import React from 'react'
import { Card, Alert, Statistic, Progress } from 'antd';
import { IDeviceMessages, IMessageType, IChannelType } from '../../MqttManager';
import { isBoolean, isNumber } from 'util';
import { array } from 'prop-types';

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

const DeviceTile = (props: {data: IDeviceMessages}) => {
    let val = props.data;
    function deviceValues(device: IDeviceMessages): IChannelType[]{
        if(device.values.size > 0){
            return Array.from(device.values.keys()).map(key => device.values.get(key) as IChannelType).sort(
                (a, b) =>
                {
                    let a_bool = isBoolean(a.value);
                    let b_bool = isBoolean(b.value);
                    if((a_bool && b_bool))
                    {
                        return a.topic < b.topic ? -1 : 1;
                    }
                    if(a_bool){
                        return -1;
                    }

                    if(b_bool){
                        return 1;
                    }
                    
                    return a.topic < b.topic ? -1 : 1;
                }
            );
        }

        return [];
    }

    return(
    <Card title={val.name} style={{ background: '#FAFAFA' }} extra={setDisconnect(val.isAlive)}>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
            {deviceValues(props.data).map(itr => {
                return (
                    <Card title={itr.topic} style={{ margin: '5px 5px' }} key={itr.topic}> 
                        <ResultTile data={itr} />
                    </Card>
                );
            })}
        </div>

    </Card>);
}

const AlarmList = (props: { data: Map<string, IDeviceMessages> }) => {
    let arr = props.data;
    let deviceArray = Array.from(arr.keys()).map(key => arr.get(key) as IDeviceMessages);

    return (
        <div>
            {deviceArray.map(item => {
                return (
                    <div key={item.name}>
                        <DeviceTile data={item}/>
                    </div>
                )
            })}
        </div>
    )
}

export default AlarmList;
