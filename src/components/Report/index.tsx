import React from 'react'
import { List } from 'antd';

export interface ILog{
    timestamp: string;
    station: string;
    time: string;
}

const Report = (props: {logs: ILog[]}) => {
    return (
        <div>
            <List dataSource={props.logs} itemLayout="horizontal"
                renderItem={item => (
                    <List.Item style={{ margin: '2px 3px', padding: '5px', minHeight:'20px', marginBottom:'10px'}}>
                        <List.Item.Meta
                            title={
                                <div style={{ fontSize:'20px'}}>{item.timestamp}</div>}
                            
                            description={                               
                                <div style={{ fontSize:'20px'}}>{item.station} active for {item.time}</div>}
                        />
                    </List.Item>
                )}
            />
        </div>
    )
}

export default Report

