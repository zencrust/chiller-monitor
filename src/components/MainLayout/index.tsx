import React from 'react';
import './index.css';

import { Layout, Menu, Icon, Badge, Alert } from 'antd';
import AlarmList from '../Alarm/index';
import Report from '../Report/index';
import update, { extend } from 'immutability-helper'; // ES6

import { SelectParam } from 'antd/lib/menu';
import MqttManager, { ServerStatus, IDeviceMessages, IDeviceMessage, IDeviceStatus, IMessageType, IChannelType, ISendDeviceValue, setValuesType } from '../../MqttManager';
import { isBoolean, isString } from 'util';
import { string } from 'prop-types';

const { Header, Content, Footer, Sider } = Layout;

interface IState {
  collapsed: boolean,
  content: string,
  data: Map<string, IDeviceMessages>,
  status: ServerStatus,
  deviceStatus: IDeviceStatus;
}

let logs = {
  "log": [
    { "timestamp": "21/06/2019 05:02:00 PM", "station": "Station 1", "time": "00:15:00" },
    { "timestamp": "21/06/2019 05:01:00 PM", "station": "Station 2", "time": "00:12:00" },
    { "timestamp": "21/06/2019 04:01:00 PM", "station": "Station 3", "time": "00:23:45" },
  ]
}

function isDeviceMessage(x: any): x is IDeviceMessages {
  return (x as IDeviceMessages).isAlive !== undefined;
}

function isAliveMessage(x: any): x is ISendDeviceValue<boolean> {
  return isBoolean((x as ISendDeviceValue<boolean>).value);
}

function isChannelValue(x: any): x is ISendDeviceValue<IChannelType> {
  return isString((x as ISendDeviceValue<IChannelType>).value.topic);
}

extend('$auto', function(value, object) {
  return object ?
    update(object, value):
    update({}, value);
});

extend('$autoArray', function(value, object) {
  return object ?
    update(object, value):
    update([], value);
});

export default class MainLayout extends React.Component<any, IState> {
  mqtt_sub: any;
  timerID: any;
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
      status: { color: "info", message: "Initializing" }
    };
  }

  componentDidMount() {
    this.mqtt_sub = MqttManager((val: ServerStatus) => {
      this.setState({ status: val });
    },
      (val: setValuesType) => {

        //let index = this.state.data.findIndex((value) => value.name === val.name);
                  
        if(isDeviceMessage(val)){
          this.setState({
            data: update(this.state.data, { [val.name]: { $set: val} })
          });
        }

        else if(isAliveMessage(val)){
          let oldVal = this.state.data.get(val.name);
          if(oldVal !== undefined){
            if(oldVal.isAlive === val.value)
            {
              return;
            }

            this.setState({
              data: update(this.state.data, { [val.name]: { $set: 
                update(oldVal, {$merge:{isAlive: val.value}})} })
            });
          }
          else{
            let newVal: IDeviceMessages = {name: val.name, isAlive: val.value, values: new Map<string, { topic: string, value: IMessageType }>()};
            // this.setState({
            //   data: update(this.state.data, { $add: [
            //     [val.name, newVal]] })
            // });
            this.setState(prevState => ({
              data: update(prevState.data, { $add: [
                [val.name, newVal]] })
            }));
            // this.setState(prevState => ({
            //   data:prevState.data.set(val.name, newVal)
            // }));
          }
        }
        else if(isChannelValue(val)){
          let old_device = this.state.data.get(val.name);
          if(old_device === undefined){
            let newVal: IDeviceMessages = {name: val.name, isAlive: true, values: new Map([
              [val.value.topic, val.value]
            ])};

            
            this.setState({
              data: update(this.state.data, { $add: [
                [val.name, newVal]] })
            });

            return;
          }

          let new_device = update(old_device, {$merge: {isAlive: true}});
          let old_channel = new_device.values.get(val.value.topic);          
          if(old_channel === undefined){
              let newData = update(new_device, {values: { $add: [[val.value.topic, val.value]] }});

              this.setState((prevState) => ({
                data: update(prevState.data as any, { [val.name]: { $set: newData} })
              }));
          }
          else{
            if(old_device.isAlive === new_device.isAlive && old_channel.value === val.value.value){
              return;
            }
            let channel_val = update(old_channel, { $merge: {value: val.value.value}});
            let dev_val = update(new_device, {values: { [val.value.topic]: { $set: channel_val}}});
            this.setState({
              data: update(this.state.data, { [val.name]: { $set: dev_val }}) 
            });
          }
        }
      });
  }

  componentWillUnmount() {
    this.mqtt_sub();
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
        <Sider collapsible collapsed={this.state.collapsed} onCollapse={this.onCollapse}>
          <div className="logo" style={{ margin: '5px 10px' }}>
          </div>
          <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" onSelect={this.onSelect}>
            <Menu.Item key="1">
              <Icon type="warning" />
              <span>Alarms</span>
            </Menu.Item>
            <Menu.Item key="2">
              <Icon type="database" />
              <span>Report</span>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Header style={{ background: '#fff', padding: 0, textAlign: "center", fontSize: 20 }}>
            <div style={{ marginBottom: '10px' }}>
              <h1 className="title-header" style={{ textTransform: 'uppercase', textOverflow: 'ellipsis' }}>Chiller Monitor</h1>
              <Alert message={this.state.status.message} type={this.state.status.color} showIcon style={{ textAlign: "left", fontSize: 15, textOverflow: 'ellipsis', textJustify: 'inter-word', textTransform: 'capitalize' }} />
            </div>
          </Header>
          <Content style={{ margin: '16px' }}>
            <div style={{ padding: 24, background: '#fff', minHeight: 360, marginTop: '20px' }}>
              {(() => {
                switch (this.state.content) {
                  case "1": return <AlarmList data={this.state.data} />;
                  case "2": return <Report logs={logs.log} />;
                  default: return <div>Unknown option selected</div>;
                }
              })()}
            </div>
          </Content>
          <Footer style={{ textAlign: 'center' }}>Chiller Monitor 2019. {}</Footer>
        </Layout>
      </Layout>
    );
  }
}
