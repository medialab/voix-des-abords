import {useState} from 'react';
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

export default function ImageGallery({images}) {
  const [open, setOpen] = useState(false);

  const src = images.map(src => `${process.env.PUBLIC_URL}/images/${src}`);

  return (
    <div className="ImageGallery">
      {src.length ? 
        <img src={src[0]} alt={src[0]} className="main-image" onClick={e => setOpen(true)} /> 
        : null}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={src.map(src => ({src}))}
        plugins={[Captions, Fullscreen, Slideshow, Thumbnails, Video, Zoom]}
      />

      {/* <button onClick={() => setOpen(true)}>Lightbox</button> */}

    </div>
  );
}
