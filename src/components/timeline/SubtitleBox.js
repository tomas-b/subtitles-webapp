import React, { useState, useEffect} from 'react'

const msToInput = ms => (new Date(ms)).toISOString().slice(11,-1)

const SubtitleBox = props => {

    let [drag, setDrag] = useState(false)
    let [dragOffset, setDragOffset] = useState(0)

    let style = {
        left:  `${props.start}px`,
        width: `${props.width}px`,
    }

    const mousemoveHandler = e => {
        let mousePositionInBoxes = e.clientX - document.querySelector('#boxes').getBoundingClientRect().x
        props.edit(drag, mousePositionInBoxes, dragOffset)
    }

    const mouseupHandler = e => {
        setDrag(false)
    }

    useEffect(()=>{
            if(!drag) {
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

    const mousedownHandler = e => {
        let offset = e.clientX - e.target.closest('.box').getBoundingClientRect().x
        props.select();
        setDragOffset(offset)
        setDrag(e.target.className)
    }

    return(
        <div className={`box ${props.selected?'selected':''}`}
            onMouseDown={mousedownHandler}
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

export default SubtitleBox