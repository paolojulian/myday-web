use bytes::Bytes;
use futures_util::stream;
use multer::Multipart;
use serde::Serialize;
use serde_json::json;
use vercel_runtime::{run, Body, Error, Request, Response, StatusCode};

struct StoreWarrantyReceiptRequest {
    image: Vec<u8>,
    content_type: Option<String>,
    expiration_date: Option<String>,
    filename: Option<String>,
    source: Option<String>,
    title: Option<String>,
}

#[derive(Serialize)]
struct StoreWarrantyReceiptResponse {
    image_url: String,
    title: Option<String>,
    expiration_date: Option<String>,
    content_type: Option<String>,
    filename: Option<String>,
    source: Option<String>,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(handler).await
}

pub async fn handler(_req: Request) -> Result<Response<Body>, Error> {
    // Parse the request body into a typed struct
    let parsed = parse_request(_req).await?;
    validate_request(&parsed)?;

    let response_data = StoreWarrantyReceiptResponse {
        image_url: "Dummy String".to_string(),
        title: parsed.title,
        expiration_date: parsed.expiration_date,
        content_type: parsed.content_type,
        filename: parsed.filename,
        source: parsed.source,
    };

    Ok(Response::builder().status(StatusCode::OK).body(
        json!({
            "message": "Warranty receipt stored successfully.",
            "image": response_data
        })
        .to_string()
        .into(),
    )?)
}

async fn parse_request(_req: Request) -> Result<StoreWarrantyReceiptRequest, Error> {
    let content_type = _req
        .headers()
        .get("content-type")
        .and_then(|value| value.to_str().ok())
        .ok_or("Missing content-type header")?;

    let boundary = multer::parse_boundary(content_type)?;

    let body = _req.into_body();
    let bytes = Bytes::copy_from_slice(body.as_ref());
    let stream = stream::once(async move { Ok::<Bytes, Error>(bytes) });

    let mut multipart = Multipart::new(stream, boundary);

    let mut parsed = StoreWarrantyReceiptRequest {
        image: Vec::new(),
        content_type: None,
        expiration_date: None,
        filename: None,
        source: None,
        title: None,
    };

    while let Some(field) = multipart.next_field().await? {
        let name = field.name().unwrap_or("").to_string();

        match name.as_str() {
            "image" => {
                parsed.content_type = field.content_type().map(|mime| mime.to_string());
                parsed.filename = field.file_name().map(|filename| filename.to_string());
                parsed.image = field.bytes().await?.to_vec();
            }
            "expiration_date" => {
                parsed.expiration_date = Some(field.text().await?);
            }
            "source" => {
                parsed.source = Some(field.text().await?);
            }
            "title" => {
                parsed.title = Some(field.text().await?);
            }
            "file" => {
                parsed.filename = Some(field.text().await?);
            }
            _ => {
                // Ignore unknown fields
            }
        }
    }

    return Ok(parsed);
}

fn validate_request(request: &StoreWarrantyReceiptRequest) -> Result<(), &'static str> {
    if request.image.is_empty() {
        return Err("image is required.");
    }

    if request.title.as_deref().unwrap_or("").trim().is_empty() {
        return Err("title is required.");
    }

    if request
        .expiration_date
        .as_deref()
        .unwrap_or("")
        .trim()
        .is_empty()
    {
        return Err("expiration_date is required.");
    }

    if request
        .content_type
        .as_deref()
        .unwrap_or("")
        .trim()
        .is_empty()
    {
        return Err("content_type is required.");
    }

    if request.filename.as_deref().unwrap_or("").trim().is_empty() {
        return Err("filename is required.");
    }

    if request.source.as_deref().unwrap_or("").trim().is_empty() {
        return Err("source is required.");
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn valid_request() -> StoreWarrantyReceiptRequest {
        StoreWarrantyReceiptRequest {
            image: vec![1, 2, 3],
            content_type: Some("image/png".to_string()),
            expiration_date: Some("2027-12-31".to_string()),
            filename: Some("receipt.png".to_string()),
            source: Some("apple".to_string()),
            title: Some("Macbook M5 Receipt".to_string()),
        }
    }

    #[test]
    fn validation_passes_for_valid_request() {
        let request = valid_request();

        let result = validate_request(&request);

        assert!(result.is_ok());
    }

    #[test]
    fn validation_fails_when_some_are_missing() {
        // Image Missing
        let mut request = valid_request();
        request.image = Vec::new();
        let result = validate_request(&request);
        assert_eq!(result, Err("image is required."));

        let mut title_missing = valid_request();
        title_missing.title = None;
        let result = validate_request(&title_missing);
        assert_eq!(result, Err("title is required."));

        let mut source_missing = valid_request();
        source_missing.source = None;
        let result = validate_request(&source_missing);
        assert_eq!(result, Err("source is required."));

        let mut content_type_missing = valid_request();
        content_type_missing.content_type = None;
        let result = validate_request(&content_type_missing);
        assert_eq!(result, Err("content_type is required."));

        let mut expiration_date_missing = valid_request();
        expiration_date_missing.expiration_date = None;
        let result = validate_request(&expiration_date_missing);
        assert_eq!(result, Err("expiration_date is required."));

        let mut filename_missing = valid_request();
        filename_missing.filename = None;
        let result = validate_request(&filename_missing);
        assert_eq!(result, Err("filename is required."));
    }
}
