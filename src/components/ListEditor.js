import React, {useState} from 'react'

const ListEditor = props => {

    let [editorId, setEditorId] = useState(null)

    const editLine = text => {
        if(props.sID==null) return;
        let subs = [...props.subtitles]
        subs[props.sID].data.text = text
        props.edit(subs)
    }

    return (
    <div className="subtitles">
        <div className='subtitle-table'>
            <table>
            <tbody>
                { props.subtitles.map( (line, id) => <tr key={id} className={id == props.sID ? 'selected' : null} onClick={()=>props.select(id, true)}>
                    <td>#{id}</td>
                    <td>{line.data.start}</td>
                    <td>{line.data.end}</td>
                    <td>{line.data.text}</td>
                </tr>) }
            </tbody>
            </table>
        </div>
        <div className='editor'>
        <div className='panel'></div>
        <div className='text-editor'>
            <textarea
                col='1'
                id='subtitle-text'
                placeholder='line text...'
                onChange={e=>editLine(e.target.value)}
                value={ props.sID!==null ? props.subtitles[props.sID].data.text  : '' }
            ></textarea>
        </div>
        </div>
    </div>
    )
}

export default ListEditor