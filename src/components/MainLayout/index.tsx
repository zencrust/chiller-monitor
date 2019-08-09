import React from 'react';
import './index.css';

import { Layout, Alert } from 'antd';
import AlarmList from '../Alarm/index';
import update from 'immutability-helper'; // ES6

import { SelectParam } from 'antd/lib/menu';
import MqttManager, { ServerStatus, IDeviceStatus, IChannelType, ISendDeviceValue, setValuesType, Ilimits, limits_combined, MqttUnsubscribeType } from '../../MqttManager';
import { isBoolean, isString, isNumber, isUndefined } from 'util';

const { Header, Content, Footer } = Layout;


function isAliveMessage(x: any): x is ISendDeviceValue<boolean> {
  return isBoolean((x as ISendDeviceValue<boolean>).value);
}

function isChannelValue(x: any): x is ISendDeviceValue<IChannelType> {
  return isString((x as ISendDeviceValue<IChannelType>).value.topic);
}

export interface IPhaseData{
  R_Phase: boolean;
  Y_Phase: boolean;
  B_Phase: boolean;
}

export interface IChillerStatus{
  ChillerFault: boolean;
  ChillerOk: boolean;
}

export type TemperatureType = number | "Disconnected";

export interface ITankStatus {
  values: TemperatureType[];
  retries: number[];
  usl: number;
  lsl: number;
}

export interface IMotorStatus{
  values: TemperatureType[];
  retries: number[];
  usl: number;
  lsl: number;
}

export interface IComposedResultsData{
  phase: IPhaseData;
  chiller_status:IChillerStatus;
  tank_status: ITankStatus;
  motor_status: IMotorStatus;
}

export interface IComposedDeviceData {
  name: string;
  values: IComposedResultsData;
  isAlive: boolean;
  wifiSignalPercentage: number;
  epochTime?: number;
}

function CreateNewResultState(lim: limits_combined) : IComposedResultsData{

  let motor_index = lim.temperature.findIndex(x => x.name.indexOf("Motor 1") !== -1);
  let tank_index = lim.temperature.findIndex(x => x.name.indexOf("Tank 1") !== -1);

  return {
    phase: {
      R_Phase : false,
      Y_Phase : false,
      B_Phase : false
    },
    chiller_status: {
      ChillerFault: true,
      ChillerOk: false
    },
    tank_status:{
      values: ["Disconnected", "Disconnected"],
      usl: lim.temperature[tank_index].usl,
      lsl: lim.temperature[tank_index].lsl,
      retries: [0, 0]
    },
    motor_status:{
      values: ["Disconnected", "Disconnected", "Disconnected", "Disconnected"],
      usl: lim.temperature[motor_index].usl,
      lsl: lim.temperature[motor_index].lsl,
      retries: [0, 0, 0, 0]
    }
  }
}

// let motor_id = ["Tank 1", "Tank 2", "Tank 3", "Motor 1"];
// let tank_id = ["Tank 4", "Motor 2"];

// Pins T1:4: J7, T2:13: J8, M1:25: J9, M2:26:J10, M3:27:J11, M4:32:J12
let tank_id = ["Tank 1", "Tank 2"];
let motor_id = ["Motor 1", "Motor 2", "Motor 3", "Motor 4"];

function deviceValues(device: Map<string, IComposedDeviceData>){
  return Array.from(device.values());
}

interface IState {
  collapsed: boolean;
  content: string;
  data: Map<string, IComposedDeviceData>;
  status: ServerStatus;
  deviceStatus: IDeviceStatus;
  limits: Ilimits;
}

export default class MainLayout extends React.Component<any, IState> {
  mqtt_sub: MqttUnsubscribeType;
  /**
   *
   */
  constructor(props: any) {
    super(props);
    this.state = {
      collapsed: false,
      content: "1",
      data: new Map(),
      deviceStatus: {},
      limits: undefined,
      status: { color: "info", message: "Initializing" }
    };
  }

  componentDidMount() {
    this.mqtt_sub = MqttManager((val: ServerStatus) => {
      this.setState({ status: val });
      if(val.color !== "success"){
        this.state.data.forEach((value) =>
        {
          this.setState({
            data: update(this.state.data, { [value.name]: { $set: 
              update(value, {$merge:{isAlive: false, values: CreateNewResultState(this.state.limits as limits_combined)}})} })
          });
        });
      }
    },
      (val: setValuesType) => {
        if(isAliveMessage(val)){
          let oldVal = this.state.data.get(val.name);
          if(oldVal !== undefined){
            if(oldVal.isAlive === val.value)
            {
              return;
            }
            if(!val.value){
              this.setState({
                data: update(this.state.data, { [oldVal.name]: { $set: 
                  update(oldVal, {$merge:{isAlive: false, values: CreateNewResultState(this.state.limits as limits_combined)}})} })
              });
            }
            else{
              this.setState({
                data: update(this.state.data, { [val.name]: { $set: 
                  update(oldVal, {$merge:{isAlive: val.value}})} })
              });
            }
          }
          else{
            let newVal: IComposedDeviceData = {name: val.name, isAlive: val.value, wifiSignalPercentage:0, epochTime: undefined, values: CreateNewResultState(this.state.limits as limits_combined) };
            this.setState(prevState => ({
              data: update(prevState.data, { $add: [
                [val.name, newVal]] })
            }));
          }
        }
        else if(isChannelValue(val)){
          let old_device = this.state.data.get(val.name);
          if(old_device === undefined){
            return;
          }
          let new_device = old_device.isAlive === false ? update(old_device, {$merge: {isAlive: true}}): old_device;

          if(val.value.topic === "wifi Signal Strength"){
            if(isNumber(val.value.value)){
              let dev_val = update(new_device, { wifiSignalPercentage: { $set:val.value.value }});
              this.setState({data: update(this.state.data, { [val.name]: { $set: dev_val }})});  
            }
            return
          }
          else if(val.value.topic === "last update time"){
            if(isNumber(val.value.value)){
              //dont update isAlive here
              let dev_val = update(old_device, { epochTime: { $set:val.value.value }});
              this.setState({data: update(this.state.data, { [val.name]: { $set: dev_val }})});  
            }
            return
          }
                   
          let motor_index = motor_id.indexOf(val.value.topic);
          if(motor_index !== -1){
            if(isNumber (val.value.value)) {              
              let dev_val = update(new_device, { values: { motor_status: { 
                values: {[motor_index] : { $set:val.value.value }},
                retries: {[motor_index] : { $set:0 }}
              }}});

              this.setState({data: update(this.state.data, { [val.name]: { $set: dev_val }})});
            }
            else if(val.value.value === "Disconnected"){
              let updated_disconnect = new_device.values.motor_status.retries[motor_index] +1;
              if(updated_disconnect > 3){
                let dev_val = update(new_device, { values: { motor_status: { 
                  values: {[motor_index] : { $set:val.value.value }},
                  retries: {[motor_index] : { $set:0 }}
                }}});

                this.setState({data: update(this.state.data, { [val.name]: { $set: dev_val }})});
              }
              else{
                let dev_val = update(new_device, { values: { motor_status: { retries: {[motor_index] : { $set: updated_disconnect}}}}});
                this.setState({data: update(this.state.data, { [val.name]: { $set: dev_val }})});
              }
            }
          }
          else{
            let tank_index = tank_id.indexOf(val.value.topic);
            if(tank_index !== -1){
              if(isNumber (val.value.value)) {              
                let dev_val = update(new_device, { values: { tank_status: 
                  { values: {[tank_index] : { $set:val.value.value }},
                    retries: {[tank_index] : { $set: 0}} }
                }});

                this.setState({data: update(this.state.data, { [val.name]: { $set: dev_val }})});
              }
              else if(val.value.value === "Disconnected"){
                let updated_disconnect = new_device.values.tank_status.retries[tank_index] +1;
                if(updated_disconnect > 3){
                  let dev_val = update(new_device, { values: { tank_status: 
                    { values: {[tank_index] : { $set:val.value.value }},
                      retries: {[tank_index] : { $set: 0}}
                  }}});

                  this.setState({data: update(this.state.data, { [val.name]: { $set: dev_val }})});
                }
                else{
                  let dev_val = update(new_device, { values: { tank_status: { retries: {[tank_index] : { $set: updated_disconnect}}}}});
                  this.setState({data: update(this.state.data, { [val.name]: { $set: dev_val }})});
                }
              }
            }
            else{
              if(val.value.topic === "R Phase IN"){
                if(isBoolean (val.value.value)) {              
                  let dev_val = update(new_device, { values: { phase: { R_Phase: {$set:val.value.value }}}});
                  this.setState({data: update(this.state.data, { [val.name]: { $set: dev_val }})});
                }              
              }
              else if(val.value.topic === "Y Phase IN"){
                if(isBoolean (val.value.value)) {              
                  let dev_val = update(new_device, { values: { phase: { Y_Phase: {$set:val.value.value }}}});
                  this.setState({data: update(this.state.data, { [val.name]: { $set: dev_val }})});
                }  
              }
              else if(val.value.topic === "B Phase IN"){
                if(isBoolean (val.value.value)) {              
                  let dev_val = update(new_device, { values: { phase: { B_Phase: {$set:val.value.value }}}});
                  this.setState({data: update(this.state.data, { [val.name]: { $set: dev_val }})});
                }  
              }
              else if(val.value.topic === "Chiller Fault"){
                if(isBoolean (val.value.value)) {              
                  let dev_val = update(new_device, { values: { chiller_status: { ChillerFault: {$set:val.value.value }}}});
                  this.setState({data: update(this.state.data, { [val.name]: { $set: dev_val }})});
                }  
              }
              else if(val.value.topic === "Chiller Healthy"){
                if(isBoolean (val.value.value)) {              
                  let dev_val = update(new_device, { values: { chiller_status: { ChillerOk: {$set:val.value.value }}}});
                  this.setState({data: update(this.state.data, { [val.name]: { $set: dev_val }})});
                }  
              }
            }
          }
        }
      },
      (limits: Ilimits) =>
      {
        this.setState({limits:limits});
      });
  }

  componentWillUnmount() {
    if(!isUndefined(this.mqtt_sub)){
      this.mqtt_sub();
    }
  }

  onCollapse = (collapsed: boolean) => {
    this.setState({ collapsed });
  };

  onSelect = (param: SelectParam) => {
    this.setState({ content: param.key });
  };

  render() {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Layout>
          <Header style={{ background: '#fff', padding: 0, textAlign: "center", fontSize: 20 }}>
            <div style={{ marginBottom: '10px' }}>
              <h1 className="title-header" style={{ textTransform: 'uppercase', textOverflow: 'ellipsis' }}>Chiller Monitor</h1>
            </div>
          </Header>
          <Content style={{ margin: '16px' }}>
            <Alert message={this.state.status.message} type={this.state.status.color} showIcon style={{ textAlign: "left", fontSize: 15, textOverflow: 'ellipsis', textJustify: 'inter-word', textTransform: 'capitalize' }} />
            <AlarmList data={deviceValues(this.state.data)} />
          </Content>
          <Footer style={{ textAlign: 'center' }}>Chiller Monitor 2019. {}</Footer>
        </Layout>
      </Layout>
    );
  }
}
