import { useState } from 'react';
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

export default function ImageGallery({ images }) {
  const [open, setOpen] = useState(false);
  const [clickIndex, setClickIndex] = useState();

  return (
    <div className="ImageGallery">
      {images.length ?
        <div className="carousel-container">

          <figure className="main-image-container">
            <img
              src={images[0].src}
              alt={images[0].title}
              className="main-image"
              onClick={e => {
                setClickIndex(0);
                setOpen(true)
              }}
            />
            <figcaption>
              {images[0].title ? <h4>{images[0].title}</h4> : null}
              {images[0].description ? <p>{images[0].description}</p> : null}
            </figcaption>
          </figure>
          {
            images.length > 1 ?
            <div className="carousel-images-container">
              {
                images.map(({src, title, description}, index) => (
                  <figure key={index} 
                    className="carousel-image"
                  >
                    <img
                      src={src}
                      alt={title}
                      className="main-image"
                      onClick={e => {
                        setClickIndex(index);
                        setOpen(true)
                      }}
                    />
                  </figure>
                ))
              }            
          </div>
            : null
          }
          
        </div>

        : null}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={clickIndex}
        slides={images}
        plugins={[Captions, Fullscreen, Slideshow, Thumbnails, Video, Zoom]}
      />

      {/* <button onClick={() => setOpen(true)}>Lightbox</button> */}

    </div>
  );
}
