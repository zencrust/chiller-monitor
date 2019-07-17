import React from 'react'
import { Card, Alert  } from 'antd';
import { IDeviceMessages, IMessageType } from '../../MqttManager';
import { isBoolean, isNumber } from 'util';

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
function typeToVal(value:IMessageType){
    if(isBoolean(value)){
        return value ? "ON" : "OFF";
    }

    if(isNumber(value)){
        return value.toString();
    }

    return value;
}

function valtoResult(value:IMessageType){
    if(isBoolean(value)){
        return value ? "success": "error";
    }

    if(isNumber(value)){
        return (value < 15 && value > 0)? "success": "error";
    }

    return "warning";
}


const AlarmList = (props: { data: IDeviceMessages[] }) => {
    let arr = props.data;
    return (
        <div>
            {arr.map(item => {
                return (
                    <div key={item.name}>
                        <Card title={item.name} style={{background:'#FAFAFA'}} extra={setDisconnect(item.isAlive)}>
                            <div style={{display:'flex', flexDirection:'row', flexWrap:'wrap'}}>
                                {item.values.map(itr => {
                                    return (
                                        <Alert message={itr.topic} 
                                               key={item.name + itr.topic} 
                                               type={valtoResult(itr.value)}
                                               style={{width:'200px', margin:'5px 5px'}}
                                               description={typeToVal(itr.value)}
                                        />
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
