// Image thumbnails for the component-imports example: exports example:image/thumbnail
// (see wit/thumbnail.wit) using the `image` crate.
wit_bindgen::generate!({ world: "thumbnail-component" });

use std::io::Cursor;

use exports::example::image::thumbnail::{Format, Guest, Options, Size};
use image::{ImageFormat, ImageReader};

struct Thumbnail;

impl Guest for Thumbnail {
    fn dimensions(image: Vec<u8>) -> Result<Size, String> {
        let (width, height) = ImageReader::new(Cursor::new(image))
            .with_guessed_format()
            .map_err(|e| e.to_string())?
            .into_dimensions()
            .map_err(|e| e.to_string())?;
        Ok(Size { width, height })
    }

    fn resize(image: Vec<u8>, options: Options) -> Result<Vec<u8>, String> {
        let img = image::load_from_memory(&image).map_err(|e| e.to_string())?;
        // `thumbnail` is a fast downscale; `min` stops small images being enlarged
        let thumb = img.thumbnail(options.max_width.min(img.width()), u32::MAX);
        let mut out = Cursor::new(Vec::new());
        match options.format {
            // JPEG has no alpha channel
            Format::Jpeg => thumb.to_rgb8().write_to(&mut out, ImageFormat::Jpeg),
            Format::Png => thumb.write_to(&mut out, ImageFormat::Png),
        }
        .map_err(|e| e.to_string())?;
        Ok(out.into_inner())
    }
}

export!(Thumbnail);
