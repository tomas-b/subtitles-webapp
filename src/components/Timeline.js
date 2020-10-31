import React, { useState, useRef, useEffect, useCallback } from 'react'

const msToInput = ms   => (new Date(ms)).toISOString().slice(11,-1)
const inputToMs = time => (new Date(`1970-01-01T${time}Z`)).getTime()

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

    },[video])

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

    const editSubtitleBox = (id, type, px)=>{

        let data = {...props.subtitles[id].data}
        let px2ms = Math.max(0, Math.round(px / timelineWidth * videoDuration))

        if(type=='left') data.start = Math.round(Math.min(data.end-1, px2ms))
        if(type=='right') data.end = Math.round(Math.min(Math.max(data.start+1, px2ms), videoDuration))

        if(type=='text' || type.match('box')) {
            let width = data.end - data.start
            data.start = Math.round(Math.max(0, px2ms - width/2))
            data.end = Math.round(data.start + width)
        }

        let subs = [...props.subtitles]
        subs[id].data = data

        props.edit(subs)
    }

    const reconsiliateOrder = k => {
        console.log(`---->${k}`)
        let subs = [...props.subtitles]
        //subs.sort((a,b)=>a.data.start>b.data.start)
        let mapped = subs.map((sub, i)=>{return {index: i, sub: sub}})
        mapped.sort( (a,b) => a.sub.data.start > b.sub.data.start )
        let newId = props.sID
        let result = mapped.map((s, i)=>{
            console.log(s)
            console.log(`${s.index} === ${k} --. ${i}`);
            if (s.index == k) newId = i;
            return subs[s.index];
        })
        console.log(`new selected: ${newId}`)
        props.select(newId, false)
        console.log(`/new selected: ${newId}`)
        props.edit(result)
    }

    const editSubtitlePanel = (id, value, action) => {

        let subs = [...props.subtitles]
        let data = {...props.subtitles[id].data}

        if(action=='start') data.start = value
        if(action=='end') data.end = value
        // if(action=='delete') slice
        // if(action=='add') add_next + focus
        // reconsiliate

        subs[id].data = data
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
                edit={(drag, pos)=>{editSubtitleBox(k, drag, pos)}}
                data={sub.data}
                start={start}
                width={width}
                selected={ k == props.sID }
                select={()=>props.select(k, false)}
                reconsiliateOrder={()=>{reconsiliateOrder(k)}}
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


const SubtitleBox = props => {

    let [drag, setDrag] = useState(false)

    let style = {
        left:  `${props.start}px`,
        width: `${props.width}px`,
    }

    const mousemoveHandler = e => {
        let mousePositionInBoxes = e.clientX - document.querySelector('#boxes').getBoundingClientRect().x
        props.edit(drag, mousePositionInBoxes)
    }

    const mouseupHandler = e => {
        setDrag(false)
    }

    useEffect(()=>{
            if(!drag) {
                console.log('calling from effect')
                props.reconsiliateOrder();
                return;
            }
            window.addEventListener('mousemove', mousemoveHandler, false)
            window.addEventListener('mouseup', mouseupHandler, false)
        return ()=>{
            window.removeEventListener('mousemove', mousemoveHandler)
            window.removeEventListener('mouseup', mouseupHandler)
        }
    }, [drag])

    return(
        <div className={`box ${props.selected?'selected':''}`}
            onMouseDown={(e)=>{props.select();setDrag(e.target.className)}}
            style={style}
        >
        <div className='left'></div>
        <div className='text'>   {props.data.text}
        <div className='timestp'>{msToInput(props.data.start)} → {msToInput(props.data.end)}</div>
        </div>
        <div className='right'></div>
        </div>
    )
}

const SidePanel = React.memo(props => {

    if(props.data == null) return(<div className='side-panel'></div>)

    const handleEdit = (k, v = null) => {
        props.edit(k,v)
    }


    return(
        <div className='side-panel'>
            <input onChange={e=>handleEdit('start', inputToMs(e.target.value))} type='time' value={msToInput(props.data.start)} required="required"/>
            <input onChange={e=>handleEdit('end', inputToMs(e.target.value))} type='time' value={msToInput(props.data.end)} required="required"/>
            <br/>
            <button onClick={props.prev}>prev</button>
            <button onClick={props.next}>next</button>
            <br/>
            <button onClick={()=>handleEdit('delete')} >delete</button>
            <button onClick={()=>handleEdit('add')} >add</button>
            <br/>
        </div>
    )
})

export default Timeline