import React, { useState, useRef, useEffect } from 'react'
import ReactDOM, { render } from 'react-dom'
import { parseSync, stringifySync } from 'subtitle'
import Header       from './components/Header'
import ListEditor   from './components/ListEditor'
import Video        from './components/Video'
import Timeline     from './components/Timeline'
import './style.css'

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

    const loadVideo = videoURI => {
        vidRef.current.setAttribute('src', videoURI)
    }

    const saveWavePoints = (leftChannel, step) => {
        let wavePoints = []
        for (let i=0; i<leftChannel.length; i+=step) wavePoints.push(Math.floor(leftChannel[i]*195/2))
        setWave(wavePoints)
        setStep(step)
    }

    const selectLine = (id, move) => {
        if ( move ) vidRef.current.currentTime = subtitles[id].data.start/1000;
        console.log(`selected id change!!!! for ${id}`)
        setSelectedId(id)
    }

    return (
        <div className='grid-container'>
        <Header
            loadSubtitles={loadSubtitles}
            loadVideo={loadVideo}
            saveWavePoints={saveWavePoints}
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
