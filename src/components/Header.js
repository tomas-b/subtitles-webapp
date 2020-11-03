import React, {useState} from 'react'

const Header = props => {

    let [vidFileName, setVidFileName] = useState(null)

    const handleVideo = (e)=>{

        setVidFileName(e.target.files[0].name)

        // video URI
        let URI = URL.createObjectURL( e.target.files[0] )
        props.loadVideo( URI )

        // Wave
        console.log('wave')
        let vidReader = new FileReader()
        vidReader.onload = () => {

            console.log('onload triggred')

            let audioContext = new AudioContext()

            audioContext.decodeAudioData(vidReader.result)
            .then( decodedAudioData => {

                console.log('decoding')

                let sampleRate = 8000
                let offlineAudioContext = new OfflineAudioContext(1, sampleRate * decodedAudioData.duration, sampleRate);
                let soundSource = offlineAudioContext.createBufferSource();

                soundSource.buffer = decodedAudioData;
                soundSource.connect(offlineAudioContext.destination);
                soundSource.start();

                offlineAudioContext.startRendering()
                .then((renderedBuffer)=>{
                    props.saveWavePoints(renderedBuffer.getChannelData(0), 250);
                })
                .catch((err)=>{
                    console.log('Rendering failed: ' + err)
                })

            })

        }
        vidReader.readAsArrayBuffer( e.target.files[0] )

    }

    const handleSubtitles = (e)=>{
        let subsReader = new FileReader()
        subsReader.onload = ()=>{
            props.loadSubtitles( subsReader.result )
        }
        subsReader.readAsText( e.target.files[0], 'ISO-8859-1' )
    }

    return(
        <div className='header'>
        <ul id='menu'>
            <li>
            <input onChange={handleVideo} type='file' id='file' name='file'/>
            <label htmlFor='file'>Choose Video</label>
            </li>
            <li>
            <input onChange={handleSubtitles} type='file' id='subs_file' name='subs_file'/>
            <label htmlFor='subs_file'>Choose Subtitle</label>
            </li>
            <li>
            <input id='save_str' onClick={()=>props.handleSave(vidFileName)}/>
            <label className='specialBtn' htmlFor='save_str'>Save as .STR</label>
            </li>
        </ul>
        <a className='github' target='_blank' href="http://github.com/tomas-b">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill='#fff' d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            /tomas-b
        </a>
        </div>
    )
}

export default Header;