import mqtt, { IClientOptions } from "mqtt"

export interface ServerStatus {
    message: string;
    color: "success" | "error" | "warning" | "info" | undefined;
}

export type IMessageType = number | boolean | "Disconnected" | undefined;
export type IDeviceData = Map<string, IMessageType>;
export type IDeviceAllData = { data: Map<string, IDeviceData>, isAlive: boolean };
export type IMessage = Map<string, IDeviceAllData>;
export type IDeviceStatus = Record<string, boolean>;


export interface limits_combined {
    temperature: temperature_limits[];
    dio: digital_limits[];
}

export type Ilimits = limits_combined | undefined;

export interface temperature_limits{
    name: string[];
    lsl: number;
    usl: number;
}

export interface digital_limits{
    name: string[],
    expected_value: boolean;
}

interface ISettings {
    mqtt_server: string;
    port: number;
    user_name: string;
    protocol: 'wss' | 'ws' | 'mqtt' | 'mqtts' | 'tcp' | 'ssl' | 'wx' | 'wxs';
    password: string;
    devices: string[];
    order:string[];
    channel_limits: temperature_limits[];
    digital_limits: digital_limits[];
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

export type setValuesType =  ISendDeviceValue<boolean> | ISendDeviceValue<IChannelType>;
export type MqttUnsubscribeType = undefined | (() => void);
export default function MqttManager(setServerStatus: (val: ServerStatus) => void,
 setValues: (val: setValuesType) => void,
 setLimits: (val: Ilimits) => void) {
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
        rejectUnauthorized: false
    }

    // let allDeviceData: IMessage = new Map<string, IDeviceAllData>();
    setServerStatus({ message: 'Connecting ', color: "info" });

    let _registerChanges = (client: mqtt.MqttClient) => {
        console.log('_registerChanges');
        client.on('message', (topic, msg) => {
            let [device, func, topic_id] = topic.split('/');
            if (func === 'heartbeat') {
                setValues({name: device, value:false});
            }
            else if(topic_id === 'wifi Signal Strength' || topic_id === 'last update time'){
                let finalval = parseInt(msg.toString());
                setValues({name: device, value:{topic: topic_id, value: finalval}});
            }
            else {
                let finalval: IMessageType = 'Disconnected';
                let strVal = msg.toString();

                if (func === 'dio') {
                    finalval = strVal === '1';
                }
                else if (func === 'temp') {
                    let numVal = parseFloat(strVal);
                    if (!isNaN(numVal)) {
                        finalval = numVal;
                    }
                }
                setValues({name: device, value:{topic: topic_id, value: finalval}});
            }
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

    let unmount: MqttUnsubscribeType = undefined;
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
        setLimits({temperature: val.channel_limits, dio:val.digital_limits});

        // console.log("all dev", `${val.devices}`);
        val.devices.forEach(device => {
            // console.log("topic sub", `${dev}`);
            client.subscribe(`${device}/dio/#`);
            client.subscribe(`${device}/temp/#`);
            client.subscribe(`${device}/heartbeat`);
            client.subscribe(`${device}/telemetry/#`);
            setValues({name: device, value:false});
        });

       
        console.log('connection sub', val.mqtt_server);
        setServerStatus({ message: 'Connecting ', color: "warning" });
        _registerErrors(client);
        _registerChanges(client);

        unmount = () => {
            console.log('disconnecting');
            client.end(true)
        };
    });

    return unmount;
}