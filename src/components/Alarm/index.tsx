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

function appendzero(num: number) {
    if (num >= 10) {
        return num.toString();
    }

    return "0" + num.toString();
}

function ToTimeFormat(num: string | Number) {
    let sec_num = Number(num); // don't forget the second param
    let hours = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);

    return appendzero(hours) + ':' + appendzero(minutes) + ':' + appendzero(seconds);
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

        retval.push({ name, values });
    }

    // console.log(retval);
    return retval;
}

const AlarmList = (props: { alarms: IMessage }) => {

    let percentage = (time: number) => {
        return Math.min((time / timeout), 1) * 100;
    }
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
            {/* <List dataSource={dictToArr(props.alarms)} itemLayout="horizontal" 
                renderItem={item => (
                    <List.Item style={{ margin: '2px 3px', padding: '5px', minHeight:'100px', marginBottom:'10px'}}>
                        <List.Item.Meta
                            title={                               
                            <div>
                                <h2>{item.name}</h2>
                            </div>}
                            description={
                                <List dataSource={item.values} itemLayout="vertical"
                                    renderItem={sub_item => (
                                        <List.Item.Meta
                                            title={                               
                                            <div>
                                                <h3>{sub_item.topic}</h3>
                                            </div>}

                                            description={
                                                <div>
                                                    <h5>{sub_item.value}</h5>
                                                </div>
                                            }
                                        />
                                    )}
                                />
                            }
                        />
                    </List.Item>
                )}
            /> */}
        </div>
    )
}

export default AlarmList
