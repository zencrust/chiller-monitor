import React from 'react'
import { List, Progress } from 'antd';
import PlaySound from '../PlaySound/index';
import { Row, Col } from 'antd';
import { IDisplayMessage } from '../../MqttManager';

let timeout = 30;

function calculateColor(time: number){
    let r = 0;
    let g = 20;
    let b = 20;
    r = Math.min((time/timeout), 1) * 255;
    b = Math.max(0, 1- (time/timeout)) * 255;
    return `rgb(${r}, ${g}, ${b})`;
}

function appendzero(num: number){
    if(num >= 10){
        return num.toString();
    }

    return "0"+ num.toString();
}

function ToTimeFormat(num: string | Number) {
    let sec_num = Number(num); // don't forget the second param
    let hours   = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);
    
    return appendzero(hours) +':' + appendzero(minutes) +':'+ appendzero(seconds);
}

function ShouldPlayAlarm(alarms: IDisplayMessage[]){
    for (let alarm in alarms) {
        if (Number(alarms[alarm].time) > timeout) {
            return true;
        }
    }

    return false;
}


const AlarmList = (props: {alarms: IDisplayMessage[]}) => {
    
    let percentage = (time: number) => {
        return Math.min((time/timeout), 1) * 100;
    }

    return (
        <div>
            <PlaySound playSound={ShouldPlayAlarm(props.alarms)}/>
            <List dataSource={props.alarms} itemLayout="horizontal" 
                renderItem={item => (
                    <List.Item style={{ background: calculateColor(Number(item.time)), margin: '2px 3px', padding: '5px', minHeight:'100px', marginBottom:'10px'}}>
                        <List.Item.Meta
                            title={                               
                            <div>
                                <Row >
                                    <Col span={18} push={6}>
                                        <div style={{ fontSize:'33px', color:'white', textAlign:'center', marginBottom:'20px'}}>{item.title}</div>
                                        <Progress percent={percentage(Number(item.time))} showInfo={false} status="active" strokeWidth={20} />
                                    </Col>
                                    <Col span={6} pull={18}>
                                        <div style={{ color:'white',  verticalAlign:'center', alignContent:'center', textAlign:'center'}}>
                                            <div style={{ fontSize:'20px', marginBottom:'20px'}}>Time elasped</div>
                                            <div style={{ fontSize:'40px'}}>{ToTimeFormat(item.time)}</div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>}
                        />
                    </List.Item>
                )}
            />
        </div>
    )
}

export default AlarmList
