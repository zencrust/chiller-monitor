import React from 'react'
import { List, Progress } from 'antd';
import { Row, Col, Card } from 'antd';
import { IMessage } from '../../MqttManager';

let timeout = 30;

function calculateColor(time: number) {
    let r = 0;
    let g = 20;
    let b = 20;
    r = Math.min((time / timeout), 1) * 255;
    b = Math.max(0, 1 - (time / timeout)) * 255;
    return `rgb(${r}, ${g}, ${b})`;
}

interface IMessageArray {
    name: string;
    values: { topic: string, value: string }[];
    isAlive: boolean;
}

function dictToArr(msg: IMessage) {
    let retval: IMessageArray[] = []
    for (let name in msg) {
        let values: { topic: string, value: string }[] = []
        for (let topic in msg[name].data) {
            values.push({ topic, value: msg[name].data[topic] })
        }

        retval.push({ name, values, isAlive:msg[name].isALive });
    }

    //console.log(retval);
    return retval;
}

let setDisconnect  = (isAlive: boolean) => {
    if(isAlive){
        return(
        <div style={{color:'#4EB94A', fontWeight:'bold'}}>
            Connected
        </div>);
    }

    return (
        <div style={{color: '#ff7f50', fontWeight:'bold'}}>
            Disconnected
        </div>
    );
}

const AlarmList = (props: { data: IMessage }) => {
    let arr = dictToArr(props.data);
    return (
        <div>
            {arr.map(item => {
                return (
                    <div key={item.name}>
                        <Card title={item.name} style={{background:'#FAFAFA'}} extra={setDisconnect(item.isAlive)}>
                            <div style={{display:'flex', flexDirection:'row', flexWrap:'wrap'}}>
                                {item.values.map(itr => {
                                    return (
                                        <Card title={itr.topic} key={item.name + itr.topic} style={{width:'200px', margin:'5px 5px', background:'#EFFBFB'}}>
                                            {itr.value}
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
