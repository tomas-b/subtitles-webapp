import React, {useState, useEffect} from 'react'

const Video = props => {

    let [subline, setSubline] = useState('')

    const printSubs = () => {
        let currentTimeMS = props.videoref.current.currentTime * 1000
        let currentLine = ''
        for( let i=0; i<props.subtitles.length; i++ ) {
            let data = props.subtitles[i].data
            if( data.start <= currentTimeMS && data.end >= currentTimeMS ) {
                currentLine = data.text; break
            }
        }
        setSubline(currentLine)
    }

    useEffect(() => {
    props.videoref.current.addEventListener('timeupdate', printSubs);
    return () => props.videoref.current.removeEventListener('timeupdate', printSubs);
    }, [props.subtitles]);

    return (
    <div className="video">
        <p className='subline'>{subline}</p>
        <video controls ref={props.videoref}>
        </video>
    </div>
    )
}

export default Video;