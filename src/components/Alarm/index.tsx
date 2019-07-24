import React from 'react'
import { Card, Alert, Statistic, Progress } from 'antd';
import { IDeviceMessages, IMessageType, IChannelType, Ilimits } from '../../MqttManager';
import { isBoolean, isNumber, isUndefined } from 'util';
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


const ResultTile = (props: { data: IChannelType, limits:Ilimits }) => {
    let channel_value = props.data;
    if (isBoolean(channel_value.value)) {
        let c : "success" | "exception"| "normal" = "normal";
        if(!isUndefined(props.limits)){
            let channel_limit = props.limits.dio.find((x) => x.name.indexOf(channel_value.topic) !== -1);
            if(!isUndefined(channel_limit)){
                c = channel_value.value === channel_limit.expected_value ? "success" : "exception";
            }
        }
        return (
            <Progress type="circle"
                percent={100}
                key={channel_value.topic}
                status={c}
            />        
        );
    }

    if (isNumber(channel_value.value)) {
        let c : "success" | "exception"| "normal" = "normal";
        if(!isUndefined(props.limits)){
            let channel_limit = props.limits.temperature.find((x) => x.name.indexOf(channel_value.topic) !== -1);
            if(!isUndefined(channel_limit)){
                c = (channel_value.value < channel_limit.usl) && (channel_value.value > channel_limit.lsl) ? "success" : "exception";
            }
        }        
        return (
            <Progress type="circle"
                percent={channel_value.value}
                key={channel_value.topic}
                format={(p) => `${p} ℃`}
                status={c}
            />
        )
    }
    if(isUndefined(channel_value.value)){
        return(
            <div/>
        )
    }

    return (
        <Progress type="circle"
                    percent={100}
                    key={channel_value.topic}
                    format={() => `${channel_value.value}`} 
                    status="exception"
        />
    );
}

const DeviceTile = (props: {data: IDeviceMessages, limits:Ilimits}) => {
    let val = props.data;
    function deviceValues(device: IDeviceMessages): IChannelType[]{
        if(device.values.size > 0){
            return Array.from(device.values.keys()).map(key => device.values.get(key) as IChannelType);
        }
        return [];
    }

    return(
    <Card title={val.name} style={{ background: '#FAFAFA' }} extra={setDisconnect(val.isAlive)}>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
            {deviceValues(props.data).map(itr => {
                return (
                    <Card title={itr.topic} style={{ margin: '5px 5px' }} key={itr.topic}> 
                        <ResultTile data={itr} limits={props.limits}/>
                    </Card>
                );
            })}
        </div>

    </Card>);
}

const AlarmList = (props: { data: Map<string, IDeviceMessages>, limits:Ilimits }) => {
    let arr = props.data;
    let deviceArray = Array.from(arr.keys()).map(key => arr.get(key) as IDeviceMessages);

    return (
        <div>
            {deviceArray.map(item => {
                return (
                    <div key={item.name}>
                        <DeviceTile data={item} limits={props.limits}/>
                    </div>
                )
            })}
        </div>
    )
}

export default AlarmList;
