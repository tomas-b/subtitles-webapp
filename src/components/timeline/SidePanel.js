import React from 'react'

const msToInput = ms   => (new Date(ms)).toISOString().slice(11,-1)
const inputToMs = time => (new Date(`1970-01-01T${time}Z`)).getTime()

const SidePanel = props => {

    console.log(props.timelineActive)

    if(!props.timelineActive) return(<div className='side-panel'></div>)

    const handleEdit = (k, v = null) => {
        props.edit(k,v)
    }

    if(props.data == null) return (
        <div className='side-panel'>
            <button onClick={()=>handleEdit('add')} >🞧 add</button>
        </div>
    )

    return(
        <div className='side-panel'>
            <div className='controls'>
            <button className='prev' onClick={props.prev}>⬅</button>
            <input className='start' onChange={e=>handleEdit('start', inputToMs(e.target.value))} type='time' value={msToInput(props.data.start)} required="required"/>
            <input className='end' onChange={e=>handleEdit('end', inputToMs(e.target.value))} type='time' value={msToInput(props.data.end)} required="required"/>
            <button className='next' onClick={props.next}>➡</button>
            </div>
            <br/>
            <button className='specialBtn' onClick={()=>handleEdit('delete')} >🞮 delete</button>
            <button onClick={()=>handleEdit('add')} >🞧 add</button>
        </div>
    )
}

export default SidePanel