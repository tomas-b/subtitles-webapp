import React, { useState, useRef, useEffect } from 'react'
import SubtitleBox from './SubtitleBox'
import SidePanel from './SidePanel'

const Timeline = props => {

    let [zoom, setZoom] = useState(2)
    let [videoDuration, setVideoDuration] = useState(0)
    let [scrollX, setScrollX] = useState(0)
    let timelineWidth = props.wave.data.length*zoom

    const cvWrapperRef = useRef(null)
    const boxesRef = useRef(null)
    const cursorRef = useRef(null)

    let video = props.video.current

    const handleZoom = e => {
        setZoom(e.target.value)
    }

    useEffect(()=>{
        try { drawPointer() } catch {}
    }, [zoom])

    useEffect(()=>{

        // videoDuration
        if (video?.duration) setVideoDuration(video.duration*1000)

        // scrolling trigger after 100ms
        let isScrolling;
        const windowScroll = e => {
            window.clearTimeout( isScrolling );
            isScrolling = setTimeout(()=>{setScrollX(cvWrapperRef.current.scrollLeft);}, 100)
        }
        cvWrapperRef.current.addEventListener('scroll', windowScroll, false);

        ['play','pause','seeking','seeked'].map(e=>video?.addEventListener(e, drawPointer, false))

        return ()=>{
            ['play','pause','seeking','seeked'].map(e=>video?.removeEventListener(e, drawPointer, false))
            cvWrapperRef.current.removeEventListener('scroll', windowScroll)
        }

    },[video?.getAttribute('src')])

    const svgWave = ()=>{
        let points = ''
        let timelineHeightOffset = 195/2
        props.wave.data.map((v,k)=>{points+=`${k*zoom},${v+timelineHeightOffset} `})
        return (
            <svg height='195' width={timelineWidth}>
                <line ref={cursorRef} y1='0%' y2='100%' stroke='red' fill='green' strokeWidth='2'/>
                <polyline stroke="yellow" strokeWidth='2' fill="none" points={ points }/>
            </svg>
            )
    }

    const drawPointer = e => {
        let distance = ( video.currentTime / video.duration ) * boxesRef.current.offsetWidth
        let timeline = cvWrapperRef.current

        let diff = (distance - timeline.scrollLeft - timeline.offsetWidth)
        if(diff > 0 && diff < 100) timeline.scrollTo({left: distance, behavior: 'smooth' })

        cursorRef.current.setAttribute('x1', distance)
        cursorRef.current.setAttribute('x2', distance)
        if (!video.paused) requestAnimationFrame(drawPointer)
    }

    const editSubtitleBox = (id, type, px, offset)=>{

        let data = {...props.subtitles[id].data}
        let px2ms = Math.max(0, Math.round(px / timelineWidth * videoDuration))

        if(type=='left') data.start = Math.round(Math.min(data.end-1, px2ms))
        if(type=='right') data.end = Math.round(Math.min(Math.max(data.start+1, px2ms), videoDuration))

        if(type=='text' || type.match('box')) {
            px2ms = Math.max(0, Math.round((px-offset) / timelineWidth * videoDuration))
            let width = data.end - data.start
            data.start = Math.round(Math.max(0, px2ms))
            data.end = Math.round(data.start + width)
        }

        let subs = [...props.subtitles]
        subs[id].data = data

        props.edit(subs)
    }

    const reconsiliateOrder = k => {
        let subs = [...props.subtitles]
        //subs.sort((a,b)=>a.data.start>b.data.start)
        let mapped = subs.map((sub, i)=>{return {index: i, sub: sub}})
        mapped.sort( (a,b) => a.sub.data.start > b.sub.data.start )
        let newId = props.sID
        let result = mapped.map((s, i)=>{
            if (s.index == k) newId = i;
            return subs[s.index];
        })
        props.select(newId, false)
        props.edit(result)
    }

    const editSubtitlePanel = (id, value, action) => {

        let subs = [...props.subtitles]

        if (action=='add' && subs.length == 0) {
            props.edit([{type:'cue', data:{ start:10, end:2000, text:'' }}])
            props.select(0, false)
            return;
        }

        let data = {...props.subtitles[id].data}

        if(action=='start') {
            data.start = value
            subs[id].data = data
        }

        if(action=='end') {
            data.end = value
            subs[id].data = data
        }

        if(action=='delete') {
            if(subs.length == id+1) props.select((subs.length == 1 ? null : id-1), false)
            subs.splice(id, 1)
        }
        if(action=='add') {
            let newSub = {text:''}
            newSub.start = data.end + 10
            newSub.end = props.subtitles[id+1]?.data.start
            newSub.end = newSub.end ? newSub.end -10 : newSub.start + 1500
            subs.splice(id, 0, {type:'cue', data: newSub})
            props.select(id, false)
        }

        props.edit(subs)

    }
    
    const windowingBoxes = ()=>{

        let boxes = []
        let winWidth = window.innerWidth * 2
        for(let k in props.subtitles) {

            let sub = props.subtitles[k]
            let start = (sub.data.start/videoDuration)*timelineWidth
            let width = ((sub.data.end-sub.data.start)/videoDuration)*timelineWidth

            if ((start+width)<(scrollX-1000)) continue;
            if (start>(scrollX+winWidth)) break;

            boxes.push(<SubtitleBox
                key={k}
                edit={(drag, pos, offset)=>{editSubtitleBox(k, drag, pos, offset)}}
                data={sub.data}
                start={start}
                width={width}
                selected={ k == props.sID }
                select={()=>props.select(k, false)}
                reconsiliateOrder={()=>{reconsiliateOrder(props.sID)}}
            />)
        }
        return boxes
    }

    return (
    <div className="timeline">
        <SidePanel
            data={ props?.subtitles[props.sID]?.data }
            edit={(action, data)=>{editSubtitlePanel(props.sID, data, action)}}
            prev={()=>{ return props.sID > 0 ? props.select(props.sID-1, true) : null}}
            next={()=>{ return props.sID < (props.subtitles.length-1) ? props.select(props.sID+1, true) : null}}
            timelineActive={timelineWidth>0}
        />
        <div className="bar">
            <input onChange={handleZoom} type='range' id='zoom' defaultValue='4' min='2' max='12'/> 
        </div>
        <div ref={cvWrapperRef} className="canvas-wrapper">
            <div id='boxes' ref={boxesRef} style={{width: timelineWidth}}>
                {windowingBoxes()}
            </div>
            {svgWave()}
        </div>
    </div>
    )
}

export default Timeline