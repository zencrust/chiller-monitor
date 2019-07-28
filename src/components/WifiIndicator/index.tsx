import React from 'react'
import EXCELLENT from './images/EXCELLENT.svg';
import GREAT from './images/GREAT.svg';
import OKAY from './images/OKAY.svg';
import WEAK from './images/WEAK.svg';
import UNUSABLE from './images/UNUSABLE.svg';
import DISCONNECTED from './images/DISCONNECTED.svg';

export type WiFiSignalIndicator = "EXCELLENT" | "GREAT" | "OKAY" | "WEAK" | "UNUSABLE" | "DISCONNECTED";

export function WifiIndicator(props: {strength: WiFiSignalIndicator}){
    const imageMap:Record<string, string> =   {
            'EXCELLENT': EXCELLENT,
            'GREAT': GREAT,
            'OKAY': OKAY,
            'WEAK': WEAK,
            'UNUSABLE': UNUSABLE,
            'DISCONNECTED': DISCONNECTED
        };
    return (
        <img src={imageMap[props.strength]} style={{height:'2em'}} alt={props.strength}>
        </img>
    )
}