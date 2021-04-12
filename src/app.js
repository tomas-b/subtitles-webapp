import React, { useState, useRef, useEffect } from 'react'
import ReactDOM, { render } from 'react-dom'
import { parseSync, stringifySync } from 'subtitle'
import Header       from './components/Header'
import ListEditor   from './components/ListEditor'
import Video        from './components/Video'
import Timeline     from './components/timeline/Timeline'
import './style.css'
import totalIndiferenciaMp4 from '../demo_files/total_indiferencia.mp4'
import totalIndiferenciaSTR from '../demo_files/subtitle.str'

function App(){

    let [subtitles, setSubtitles] = useState([])
    let [wave, setWave] = useState([])
    let [step, setStep] = useState(250)
    let [selectedId, setSelectedId] = useState(null)

    const vidRef = useRef(null)

    const loadSubtitles = subtitlesAsText => {
        editSubtitles( parseSync(subtitlesAsText) )
    }

    const editSubtitles = subs => {
        console.log('edited!')
        setSubtitles( subs )
    }

    const loadVideo = file => {

        let URI = URL.createObjectURL( file );
        vidRef.current.setAttribute('src', URI)

        // Wave
        let vidReader = new FileReader()
        vidReader.onload = () => {

            let audioContext = new AudioContext()

            audioContext.decodeAudioData(vidReader.result)
            .then( decodedAudioData => {

                let sampleRate = 8000
                let offlineAudioContext = new OfflineAudioContext(1, sampleRate * decodedAudioData.duration, sampleRate);
                let soundSource = offlineAudioContext.createBufferSource();

                soundSource.buffer = decodedAudioData;
                soundSource.connect(offlineAudioContext.destination);
                soundSource.start();

                offlineAudioContext.startRendering()
                .then((renderedBuffer)=>{
                    saveWavePoints(renderedBuffer.getChannelData(0), 250);
                })
                .catch((err)=>{
                    console.log('Rendering failed: ' + err)
                })

            })

        }

        vidReader.readAsArrayBuffer( file )

    }

    const saveWavePoints = (leftChannel, step) => {
        let wavePoints = []
        for (let i=0; i<leftChannel.length; i+=step) wavePoints.push(Math.floor(leftChannel[i]*195/2))
        setWave(wavePoints)
        setStep(step)
    }

    const selectLine = (id, move) => {
        if ( move ) vidRef.current.currentTime = subtitles[id].data.start/1000;
        setSelectedId(id)
    }

    const saveStr = videoFileName => {
       
        let strText = stringifySync( subtitles, {format:'str'} );
        let strBlob = new Blob([strText], {type: 'text/plain'});

        let downloadLink = document.createElement('a');
        downloadLink.download = (videoFileName ? videoFileName : 'subtitle') + '.str';
        downloadLink.innerHTML = 'Download File';
        if ('webkitURL' in window) {
          downloadLink.href = window.webkitURL.createObjectURL(strBlob);
          downloadLink.click();
        } else {
          downloadLink.href = window.URL.createObjectURL(strBlob);
          downloadLink.style.display = 'none';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeCHild(downloadLink);
        }


    }

    useEffect(()=>{

        fetch(totalIndiferenciaMp4)
        .then(r => r.blob())
        .then(blob => loadVideo(blob))

        fetch(totalIndiferenciaSTR)
        .then(r => r.text())
        .then(str => loadSubtitles(str))

    }, [])

    return (
        <div className='grid-container'>
        <Header
            loadSubtitles={loadSubtitles}
            loadVideo={loadVideo}
            saveWavePoints={saveWavePoints}
            handleSave={saveStr}
        />
        <ListEditor
            edit={editSubtitles}
            subtitles={subtitles}
            video={vidRef}
            sID={selectedId}
            select={selectLine}
        />
        <Video
            videoref={vidRef}
            subtitles={subtitles}
        />
        <Timeline
            video={vidRef}
            edit={editSubtitles}
            subtitles={subtitles}
            wave={{data: wave, step: step}}
            sID={selectedId}
            select={selectLine}
        ></Timeline>
        </div>
    )
}

ReactDOM.render(<App/>, document.getElementById('root'))
