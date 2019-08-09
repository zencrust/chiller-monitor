import React, { FunctionComponent } from 'react'
import { Card, Progress, Divider, Tooltip } from 'antd';
import { isNumber, isUndefined } from 'util';
import { IComposedDeviceData, IChillerStatus, TemperatureType } from '../MainLayout';
import './stylesheet.css';
import { WiFiSignalIndicator, WifiIndicator } from '../WifiIndicator';
import { number } from 'prop-types';


function calculateWifiSignal(isAlive: boolean, v: number): WiFiSignalIndicator {
    if (!isAlive) {
        return "DISCONNECTED";
    }
    if (v > 80) {
        return "EXCELLENT";
    }

    if (v > 65) {
        return "GREAT";
    }

    if (v > 40) {
        return "OKAY";
    }

    if (v > 25) {
        return "WEAK";
    }

    return "UNUSABLE";
}

function getDateTimeString(epochTime:number){
    let date = new Date(0);
    date.setUTCSeconds(epochTime);
    return date.toLocaleString();
}

let setDisconnect = (isAlive: boolean, signal: number) => {
    return (
        <div>           
            <WifiIndicator strength={calculateWifiSignal(isAlive, signal)} />
        </div>            
    );
}

const ChillerStatus : FunctionComponent<({ data: IChillerStatus })> = ({data}) => {
    let c = "digitalStyle-disabled";
    let message = "Chiller OFF";
    if (data.ChillerFault === false) {
        c = "digitalStyle-exception";
        message = "Chiller Fault";
    }
    else if (data.ChillerOk === true) {
        c = "digitalStyle-success";
        message = "Chiller Healthy";
    }
    return (
        <>
            <div className="digitalStyle-message">{message}</div>
            <div className={c} />
        </>
    );
}

const TemperatureGauge: FunctionComponent<{ topic: string, value: TemperatureType, usl: number, lsl: number }> =
 ({value, usl, lsl}) => {

    function calculatePercetage(x: TemperatureType) {
        if (!isNumber(x)) {
            return 100;
        }

        return x;
    }

    let c: "success" | "exception" | "normal" =
        (value < usl) && (value > lsl) ? "success" : "exception";
    let p = calculatePercetage(value);
    let p_c = p * (100 / (usl + 10))
    let msg = p === 0 || isNaN(p) ? "" : `${p} ℃`;
    return (
        <Progress type="line"
            percent={p_c}
            format={() => `${msg}`}
            status={c}
        />
    )
}

function calculateTemeratureColor(temp: TemperatureType, usl: number, lsl: number) {
    if (!isNumber(temp)) {
        return "#848484"
    }

    if (temp <= usl && temp >= lsl) {
        return "#04B431"
    }

    return "#FF8000";
}

const TemperatureCard: FunctionComponent<{ temp1: TemperatureType, temp2: TemperatureType, usl: number, lsl: number }> =
    ({ temp1, temp2, usl, lsl }) => {
        function AddDegreeSymbol(val: TemperatureType) {
            if (val === "Disconnected") {
                return val;
            }

            else return `${val} ℃`;
        }

        return (
            <div>
                <TemperatureGauge topic={"Tank 1"} value={average(temp1, temp2)} usl={usl} lsl={lsl} />
                <div className="TemperatureCardStyle">
                    <div style={{ display: 'inline-block', float: 'left', color: calculateTemeratureColor(temp1, usl, lsl) }}>{AddDegreeSymbol(temp1)}</div>
                    <div style={{ display: 'inline-block', float: 'right', color: calculateTemeratureColor(temp2, usl, lsl) }}>{AddDegreeSymbol(temp2)}</div>
                </div>
            </div>
        );
    }

function roundtoOneDecimal(a: number) {
    return Math.round(a * 10) / 10;
}

function average(a: number | "Disconnected", b: number | "Disconnected") {
    if (isNumber(a) && isNumber(b)) {
        return roundtoOneDecimal((a + b) / 2);
    }

    if (isNumber(a)) {
        return roundtoOneDecimal(a);
    }

    if (isNumber(b)) {
        return roundtoOneDecimal(b);
    }

    return 0;
}

type PhaseType = "R" | "Y" | "B";
const PhaseTile: FunctionComponent<{ type: PhaseType, value: boolean }> = ({type, value}) => {
    let c = "digitalStyle-disabled";
    let onoff = value ? "ON" : "OFF";
    let message = `${type} IN ${onoff}`;
    if (value) {
        if (type === "R") {
            c = "digitalStyle-exception";
        }
        else if (type === "Y") { 
            c = "digitalStyle-warning";
        }
        else if (type === "B") {
            c = "digitalStyle-active";
        }
    }
    return (
        <>
            <div className="digitalStyle-message">{message}</div>
            <div className={c} />
        </>
    );

}
const TitleCard: FunctionComponent<{name: string, epochTime: number | undefined}> = ({name, epochTime})=> {
    if(isUndefined(epochTime)){
        return(<>{name}</>);
    }

    return (<Tooltip placement="top" title= {"Last Update Time :" + getDateTimeString(epochTime)}>
        {name}
    </Tooltip>)
}


const DeviceTile: FunctionComponent<{ data: IComposedDeviceData }> = ({ data }) => {
    const title = <TitleCard name={data.name} epochTime={data.epochTime} />
    return (
        <Card className="cardStyle" extra={setDisconnect(data.isAlive, data.wifiSignalPercentage)}
            hoverable={true} size="small"
            title={title}
            style={{ background: data.isAlive ? "#fefefe" : "#bfbfbf" }}
        >
            <div>
                {/* <h3 style={{textAlign:'center'}}>Input Power Supply</h3> */}
                <Divider>Input Power Supply</Divider>
                <PhaseTile type={"R"} value={data.values.phase.R_Phase} />
                <PhaseTile type={"Y"} value={data.values.phase.Y_Phase} />
                <PhaseTile type={"B"} value={data.values.phase.B_Phase} />
                <Divider>Chiller</Divider>
                <ChillerStatus data={data.values.chiller_status} />
                <Tooltip placement="top" style={{ float: "left" }} title="Tank Temperature in Celcius">
                    <Divider>Tank Status</Divider>
                </Tooltip>

                <TemperatureCard
                    temp1={data.values.tank_status.values[0]}
                    temp2={data.values.tank_status.values[1]}
                    usl={data.values.tank_status.usl}
                    lsl={data.values.tank_status.lsl}
                />
                <Tooltip placement="top" style={{ float: "left" }} title="Facility Pump Temperature in Celcius">
                    <Divider>Facility Pump</Divider>
                </Tooltip>
                <TemperatureCard
                    temp1={data.values.motor_status.values[0]}
                    temp2={data.values.motor_status.values[1]}
                    usl={data.values.motor_status.usl}
                    lsl={data.values.motor_status.lsl}
                />
                <Tooltip placement="top" style={{ float: "left" }} title="Compressor Pump Temperature in Celcius">
                    <Divider>Compressor Pump</Divider>
                </Tooltip>
                <TemperatureCard
                    temp1={data.values.motor_status.values[2]}
                    temp2={data.values.motor_status.values[3]}
                    usl={data.values.motor_status.usl}
                    lsl={data.values.motor_status.lsl}
                />
            </div>
        </Card>);
}

const AlarmList: FunctionComponent<{ data: IComposedDeviceData[] }> = ({ data }) => {
    return (
        <div className="CardsColumn">
            {data.map(item => {
                return (
                    <DeviceTile data={item} key={item.name} />
                )
            })}
        </div>
    )
}

export default AlarmList;
