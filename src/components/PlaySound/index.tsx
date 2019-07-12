import React, { Component } from 'react';


export default class PlaySound extends Component<{ playSound: boolean }, { playSound: boolean }> {
    audio: HTMLAudioElement;
    timeout: number = 20;
    constructor(props: { playSound: boolean }) {
        super(props);
        this.audio = new Audio('assets/sound/alert.wav');
        this.audio.loop = true;
        this.audio.playbackRate = 0.5;
        this.state = {playSound: false };

        this.setPlaySound(props.playSound);       
    }

    setPlaySound = (playSound: boolean) => {
        if (this.state.playSound !== playSound) {
            if (playSound) {
                this.audio.play();
            }
            else {
                this.audio.pause();
            }

            this.setState({ playSound });
        }
    };

    componentWillReceiveProps(nextProps: { playSound: boolean }) {
        this.setPlaySound(nextProps.playSound);
    }

    render() {
        return (<div></div>);
    }
}