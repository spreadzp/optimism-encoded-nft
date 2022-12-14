export const getTemplateByTypeFile = (base64Content: string, typeFile: string) => {
  switch (typeFile) {
    case 'image': return (<img className="rounded " width="350" src={base64Content} />)
    case 'video': return (<video className="rounded " controls width="250" height="240">
      <source src={base64Content}
        type="video/webm"></source>
    </video>)
    case 'audio': return (<audio className="rounded " controls src={base64Content}  ></audio>)
    case 'application': return (    
       <embed id="pdfID" className="rounded" color="white"  type="text/html" width="100%" height="100%" src={base64Content}></embed>
      // <iframe src={  b64DecodeUnicode(base64Content)}
      // width="250" height="240"
      // >
      // </iframe>
    )
    default: return (<textarea className="rounded  text-white" rows={80} cols={60} value={base64Content} />)
  }
}