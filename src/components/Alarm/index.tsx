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

function ShouldPlayAlarm(alarms: IMessage) {
    for (let alarm in alarms) {
        if (Number(alarms[alarm].time) > timeout) {
            return true;
        }
    }

    return false;
}

interface IMessageArray {
    name: string;
    values: { topic: string, value: string }[];
}

function dictToArr(msg: IMessage) {
    let retval: IMessageArray[] = []
    for (let name in msg) {
        let values: { topic: string, value: string }[] = []
        for (let topic in msg[name]) {
            values.push({ topic, value: msg[name][topic] })
        }

        retval.push({ name, values,  });
    }

    // console.log(retval);
    return retval;
}

function setDisconnect(timeout: boolean){
    if(timeout){
        return 'red';
    }
    else{
        return '#FAFAFA';
    }
}

const AlarmList = (props: { alarms: IMessage }) => {
    let arr = dictToArr(props.alarms);
    return (
        <div>
            {arr.map(item => {
                return (
                    <div>
                        <Card title={item.name} style={{background:'#FAFAFA'}}>
                            <div style={{display:'flex', flexDirection:'row', flexWrap:'wrap'}}>
                                {item.values.map(itr => {
                                    return (
                                        <Card title={itr.topic} style={{width:'200px', margin:'5px 5px', background:'#EFFBFB'}}>
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
