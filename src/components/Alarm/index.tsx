import React from 'react'
import { Card, Progress, Divider, Badge, Tooltip } from 'antd';
import { Ilimits } from '../../MqttManager';
import { isNumber } from 'util';
import { IComposedDeviceData, IChillerStatus, TemperatureType } from '../MainLayout';
import './stylesheet.css';

function calculateWifiColor(v: number){
    if(v > 70){
        return "#04B404";
    }

    if(v > 35){
        return "#D7DF01";
    }

    return "#f5222d";

}

let setDisconnect = (isAlive: boolean, signal:number) => {
    if (isAlive) {
        return (
            <div>
                <div className="DeviceConnectedStyle">
                    Connected
                </div>
                <Tooltip placement="top" style={{float:"left"}} title="WiFi Signal Strength On the Device"> 
                    <Badge count={signal} style={{ backgroundColor:calculateWifiColor(signal)}}/>
                </Tooltip>
            </div>
        );
    }

    return (
        <div className="DeviceDisconnectedStyle">
            Disconnected
        </div>
    );
}

function ChillerStatus(props: {data: IChillerStatus}){
    let c = "digitalStyle-disabled";
    let message = "Chiller OFF";
    if(props.data.ChillerFault === false){
        c = "digitalStyle-exception";
        message = "Chiller Fault";
    }
    else if(props.data.ChillerOk === true){
        c = "digitalStyle-success";
        message = "Chiller Healthy";
    }
    return (
        <>
            <div className="digitalStyle-message">{message}</div>
            <div className={c}/>
        </>
    );
}

function TemperatureGauge(props: {topic: string, value: TemperatureType, usl: number, lsl: number}){

    function IsDisconnected(x: TemperatureType){
        if(!isNumber(x)){
            return 100;
        }

        return x;
    }

    let c : "success" | "exception"| "normal" = "normal";
    c = (props.value < props.usl) && (props.value > props.lsl) ? "success" : "exception";
    let p = IsDisconnected(props.value);
    let msg = p === 0 || isNaN(p)? "" : `${p} ℃`;
    return (
        <Progress type="line"
            percent={p}
            format={() => `${msg}`}
            status={c}
        />
    )
}

function calculateTemeratureColor(temp: TemperatureType, usl: number, lsl: number){
    if(!isNumber(temp)){
        return "#848484"
    }

    if(temp <= usl && temp >= lsl){
        return "#04B431"
    }

    return "#FF8000";
}

function TemperatureCard(props: {temp1: TemperatureType, temp2: TemperatureType, usl: number, lsl: number}){
    function AddDegreeSymbol(val: TemperatureType){
        if(val === "Disconnected"){
            return val;
        }

        else return `${val} ℃`;
    }

    return (
        <div>
            <TemperatureGauge topic={"Tank 1"} value={average(props.temp1, props.temp2)} usl={props.usl} lsl={props.lsl} />
            <div className="TemperatureCardStyle">
                <div style={{display:'inline-block', float:'left', color:calculateTemeratureColor(props.temp1, props.usl, props.lsl)}}>{AddDegreeSymbol(props.temp1)}</div>
                <div style={{display:'inline-block', float:'right', color:calculateTemeratureColor(props.temp2, props.usl, props.lsl)}}>{AddDegreeSymbol(props.temp2)}</div>
            </div>
        </div>
    );
}

function roundtoOneDecimal(a: number){
    return Math.round(a * 10)/10;
}

function average(a: number | "Disconnected", b: number | "Disconnected"){
    if(isNumber(a) && isNumber(b)){
        return roundtoOneDecimal((a + b) /2);
    }

    if(isNumber(a)){
        return roundtoOneDecimal(a);
    }

    if(isNumber(b)){
        return roundtoOneDecimal(b);
    }

    return 0;
}

function PhaseTile(props: {type: "R"| "Y"| "B", value: boolean}){
    let c = "digitalStyle-disabled";
    let onoff = props.value? "ON" : "OFF";
    let message = `${props.type} IN ${onoff}`;
    if(props.value){
        if(props.type === "R"){
            c = "digitalStyle-exception";
        }
        else if(props.type === "Y"){
            c = "digitalStyle-warning";
        }
        else if(props.type === "B"){
            c = "digitalStyle-active";
        }
    }
    return (
        <>
            <div className="digitalStyle-message">{message}</div>
            <div className={c}/>
        </>
    );

}

const DeviceTile = (props: {data: IComposedDeviceData, limits:Ilimits}) => {
    let val = props.data;

    return(
    <Card title={val.name} className="cardStyle" extra={setDisconnect(val.isAlive, val.wifiSignalPercentage)}>
        <div>
            {/* <h3 style={{textAlign:'center'}}>Input Power Supply</h3> */}
            <Divider>Input Power Supply</Divider>
            <PhaseTile type={"R"} value={val.values.phase.R_Phase} />
            <PhaseTile type={"Y"} value={val.values.phase.Y_Phase} />
            <PhaseTile type={"B"} value={val.values.phase.B_Phase} />
            <Divider>Chiller</Divider>
            <ChillerStatus data={val.values.chiller_status}/>
            <Tooltip placement="top" style={{float:"left"}} title="Tank Temperature in Celcius"> 
                <Divider>Tank Status</Divider>
            </Tooltip>

            <TemperatureCard 
                temp1 = {val.values.tank_status.values[0]}
                temp2 = {val.values.tank_status.values[1]}
                usl={val.values.tank_status.usl}
                lsl={val.values.tank_status.lsl}
                />
            <Divider>Motor 1</Divider>
            <TemperatureCard 
                temp1 = {val.values.motor_status.values[0]}
                temp2 = {val.values.motor_status.values[1]} 
                usl={val.values.motor_status.usl}
                lsl={val.values.motor_status.lsl}                
            />
            <Divider>Motor 2</Divider>
            <TemperatureCard 
                temp1 = {val.values.motor_status.values[2]}
                temp2 = {val.values.motor_status.values[3]} 
                usl={val.values.motor_status.usl}
                lsl={val.values.motor_status.lsl}                
            />
        </div>
    </Card>);
}

const AlarmList = (props: { data: IComposedDeviceData[], limits:Ilimits }) => {
    let arr = props.data;

    return (
        <div className="CardsColumn">
            {arr.map(item => {
                return (
                    <DeviceTile data={item} limits={props.limits} key={item.name}/>
                )
            })}
        </div>
    )
}

export default AlarmList;
