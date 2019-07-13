import mqtt, { IClientOptions } from "mqtt"
import { string } from "prop-types";

export interface ServerStatus{
    message: string;
    color: "success" | "error" | "warning" | "info" | undefined;
}

export interface IMessage{
    [id: string] : {[topic: string]: string};
}

interface ISettings{
    mqtt_server: string,
    port: number,
    user_name: string,
    protocol: 'wss' | 'ws' | 'mqtt' | 'mqtts' | 'tcp' | 'ssl' | 'wx' | 'wxs',
    password: string,
    devices:string[]
}

export default function MqttManager(setServerStatus:(val: ServerStatus) => void, setValues:(val: IMessage) => void){
    let settings:Promise<ISettings> = fetch('assets/config/settings.json')
                    .then(x => x.json())
                    .catch(x => console.log(x));
    let clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8);

    let options:IClientOptions = {
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

    let data: IMessage = {};

    setServerStatus({message:'Connecting ', color: "info"});
    setValues(data);

    let _registerChanges = (client:mqtt.MqttClient) => {
        console.log('_registerChanges');
        client.on('message', (topic, msg) => {
            //console.log(topic);

            let [device, func, topic_id ] = topic.split('/');
            if(data[device] === undefined){
                data[device] = {}
            }
            let finalval = msg.toString();
            if(func === 'dio'){
                finalval = finalval === '1'? 'ON': 'OFF';
            }
            data[device][topic_id] = finalval;           
            setValues(data);
        });
    }

    let _registerErrors = (client: mqtt.MqttClient) => {
        client.on('connect', () => {
            console.log('Connected');
            setServerStatus({ message: 'Connection succeessful', color: "success" });
        });
        client.on('reconnect', () => {
            console.log('connecting error');
            if(!client.connected){
                setServerStatus({ message: 'connection failed', color: "error" });
            }
        });
        client.on('error', () => {
            console.log('connection error');
            setServerStatus({ message: 'connection failed ', color: "error" });
        });
    }

    let unmount: any = null;
    settings.then(val =>{
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
        let client  = mqtt.connect(options);

        // console.log("all dev", `${val.devices}`);
        val.devices.forEach(dev => {
            // console.log("topic sub", `${dev}`);
            client.subscribe(`${dev}/dio/#`);
            client.subscribe(`${dev}/temp/#`);
        });
            
        console.log('connection sub', val.mqtt_server);
        setServerStatus({message:'Connecting ', color: "warning"})
        _registerErrors(client);
        _registerChanges(client);

        unmount = () => {
            console.log('disconnecting');
            client.end(true)};
    });

    return unmount;
}