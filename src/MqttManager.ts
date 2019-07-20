import mqtt, { IClientOptions } from "mqtt"
import { bool } from "prop-types";

export interface ServerStatus {
    message: string;
    color: "success" | "error" | "warning" | "info" | undefined;
}

export type IMessageType = number | boolean | "Disconnected";
export type IDeviceData = Map<string, IMessageType>;
export type IDeviceAllData = { data: Map<string, IDeviceData>, isAlive: boolean };
export type IMessage = Map<string, IDeviceAllData>;
export type IDeviceStatus = Record<string, boolean>;

interface ISettings {
    mqtt_server: string,
    port: number,
    user_name: string,
    protocol: 'wss' | 'ws' | 'mqtt' | 'mqtts' | 'tcp' | 'ssl' | 'wx' | 'wxs',
    password: string,
    devices: string[]
}
export type IChannelType = {topic: string, value: IMessageType};
export type IDeviceMessage = Map<string, IChannelType>;

export interface IDeviceMessages {
    name: string;
    values: IDeviceMessage;
    isAlive: boolean;
}

export interface ISendDeviceValue<T>{
    name: string;
    value: T;
}

// function dictToArr(name: string, msg: IDeviceAllData) {
//     let values = Object.keys(msg.data).flatMap(func =>
//         Object.keys(msg.data[func]).map(
//             function (topic) {
//                 return { topic, value: msg.data[func][topic] };
//             })
//     );

//     return { name, values, isAlive: msg.isAlive };
// }

export type setValuesType = IDeviceMessages | ISendDeviceValue<boolean> | ISendDeviceValue<IChannelType>;

export default function MqttManager(setServerStatus: (val: ServerStatus) => void, setValues: (val: setValuesType) => void) {
    let settings: Promise<ISettings> = fetch('assets/config/settings.json')
        .then(x => x.json())
        .catch(x => console.log(x));
    let clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8);

    let options: IClientOptions = {
        keepalive: 10,
        clientId: clientId,
        protocolId: 'MQTT',
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 5000,
        will: {
            topic: 'WillMsg',
            payload: 'Connection Closed abnormally..!',
            qos: 0,
            retain: false
        },
        rejectUnauthorized: false
    }

    // let allDeviceData: IMessage = new Map<string, IDeviceAllData>();
    setServerStatus({ message: 'Connecting ', color: "info" });

    let _registerChanges = (client: mqtt.MqttClient) => {
        console.log('_registerChanges');
        client.on('message', (topic, msg) => {
            //console.log(topic);

            let [device, func, topic_id] = topic.split('/');

            //console.log(func);
            // let partUpdate = true;
            // if (allDeviceData[device] === undefined) {
            //     allDeviceData[device] = { data: {}, isAlive: false };
            //     allDeviceData[device].data['dio'] = {};
            //     allDeviceData[device].data['temp'] = {};
            //     partUpdate = false;
            // }

            // let devdata = allDeviceData[device].data[func];
            //console.log(topic);
            if (func === 'heartbeat') {
                // allDeviceData[device].isAlive = false;
                // if(partUpdate){
                    setValues({name: device, value:false});
                // }
                //console.log(topic);
            }
            else {
                let finalval: IMessageType = 'Disconnected';
                let strVal = msg.toString();

                if (func === 'dio') {
                    finalval = strVal === '1' ? true : false;
                }
                else if (func === 'temp') {
                    let numVal = parseFloat(strVal);
                    if (!isNaN(numVal)) {
                        finalval = numVal;
                    }
                    //else it should be disconnected
                }
                // partUpdate = partUpdate && devdata[topic_id] !== undefined;
                // devdata[topic_id] = finalval;
                // allDeviceData[device].isAlive = true;
                
                // if(partUpdate){
                     setValues({name: device, value:{topic: topic_id, value: finalval}});
                // }

                // allDeviceData[device].isAlive = true;

            }

            //if(!partUpdate){
            // setValues(dictToArr(device, allDeviceData[device]));
            //}
        });
    }

    let _registerErrors = (client: mqtt.MqttClient) => {
        client.on('connect', () => {
            console.log('Connected');
            setServerStatus({ message: 'Connection succeessful', color: "success" });
        });
        client.on('reconnect', () => {
            console.log('connecting error');
            if (!client.connected) {
                setServerStatus({ message: 'connection failed', color: "error" });
            }
        });
        client.on('error', () => {
            console.log('connection error');
            setServerStatus({ message: 'connection failed ', color: "error" });
        });
    }

    let unmount: any = null;
    settings.then(val => {
        //console.log(val.mqtt_server, options);
        options.username = val.user_name;
        options.password = val.password;
        options.protocol = val.protocol;
        options.servers = [{
            host: val.mqtt_server,
            port: val.port,
            protocol: val.protocol
        }];
        //console.log(val);
        let client = mqtt.connect(options);

        // console.log("all dev", `${val.devices}`);
        val.devices.forEach(device => {
            // console.log("topic sub", `${dev}`);
            client.subscribe(`${device}/dio/#`);
            client.subscribe(`${device}/temp/#`);
            client.subscribe(`${device}/heartbeat`);
            setValues({name: device, value:false});
        });

       
        console.log('connection sub', val.mqtt_server);
        setServerStatus({ message: 'Connecting ', color: "warning" })
        _registerErrors(client);
        _registerChanges(client);

        unmount = () => {
            console.log('disconnecting');
            client.end(true)
        };
    });

    return unmount;
}