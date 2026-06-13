use bytes::Bytes;
use chrono::NaiveDate;
use futures_util::{future::BoxFuture, stream};
use multer::Multipart;
use reqwest::multipart::{Form, Part};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::env;
use vercel_runtime::{run, Body, Error, Request, Response, StatusCode};

struct StoreWarrantyReceiptRequest {
    image: Vec<u8>,
    user_id: String,
    content_type: String,
    filename: String,
    source: String,
    title: String,
    expiration_date: Option<String>,
}

type UploadResult = Result<CloudinaryResponse, Error>;
type UploadFn = for<'a> fn(&'a StoreWarrantyReceiptRequest) -> BoxFuture<'a, UploadResult>;

impl StoreWarrantyReceiptRequest {
    pub fn validate(&self) -> Result<(), String> {
        if self.image.is_empty() {
            return Err("image is required.".to_string());
        }

        if self.user_id.trim().is_empty() {
            return Err("id is required.".to_string());
        }

        if self.title.trim().is_empty() {
            return Err("title is required.".to_string());
        }

        if self.content_type.trim().is_empty() {
            return Err("content_type is required.".to_string());
        }

        if self.filename.trim().is_empty() {
            return Err("filename is required.".to_string());
        }

        if self.source.trim().is_empty() {
            return Err("source is required.".to_string());
        }

        if let Some(expiration_date) = &self.expiration_date {
            NaiveDate::parse_from_str(&expiration_date, "%Y-%m-%d").map_err(|_| {
                "expiration_date must be a valid date string (YYYY-MM-DD)".to_string()
            })?;
        }

        Ok(())
    }
}

#[derive(Serialize)]
struct StoreWarrantyReceiptResponse {
    image_url: String,
    image_public_id: String,
    user_id: String,
    title: String,
    expiration_date: Option<String>,
    content_type: String,
    filename: String,
    source: String,
}

#[derive(Debug, Deserialize)]
struct CloudinaryResponse {
    public_id: String,
    secure_url: String,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(handler).await
}

pub async fn handler(_req: Request) -> Result<Response<Body>, Error> {
    handler_with_uploader(_req, cloudinary_uploader).await
}

async fn handler_with_uploader(
    _req: Request,
    upload_to_storage: UploadFn,
) -> Result<Response<Body>, Error> {
    let parsed = parse_request(_req).await?;
    parsed.validate()?;

    let upload = upload_to_storage(&parsed).await?;

    let response_data = StoreWarrantyReceiptResponse {
        image_url: upload.secure_url,
        image_public_id: upload.public_id,
        user_id: parsed.user_id.clone(),
        title: parsed.title.clone(),
        expiration_date: parsed.expiration_date.clone(),
        content_type: parsed.content_type.clone(),
        filename: parsed.filename.clone(),
        source: parsed.source.clone(),
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

fn cloudinary_uploader(
    store_warranty_receipt_request: &StoreWarrantyReceiptRequest,
) -> BoxFuture<'_, UploadResult> {
    Box::pin(upload_to_cloudinary(store_warranty_receipt_request))
}

async fn upload_to_cloudinary(
    store_warranty_receipt_request: &StoreWarrantyReceiptRequest,
) -> Result<CloudinaryResponse, Error> {
    let cloud_name = env::var("CLOUDINARY_CLOUD_NAME")?;
    let api_key = env::var("CLOUDINARY_API_KEY")?;
    let api_secret = env::var("CLOUDINARY_API_SECRET")?;

    let folder = format!("myday-web/{}", store_warranty_receipt_request.user_id);

    let file_part = Part::bytes(store_warranty_receipt_request.image.clone())
        .file_name(store_warranty_receipt_request.filename.clone())
        .mime_str(&store_warranty_receipt_request.content_type)?;

    let form = Form::new().part("file", file_part).text("folder", folder);

    let url: String = format!(
        "https://api.cloudinary.com/v1_1/{}/image/upload",
        cloud_name
    );

    let request = reqwest::Client::new()
        .post(&url)
        .basic_auth(api_key, Some(api_secret))
        .multipart(form)
        .send()
        .await?
        .error_for_status()?
        .json::<CloudinaryResponse>()
        .await?;

    Ok(request)
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
        expiration_date: None,
        user_id: "".to_string(),
        content_type: "".to_string(),
        filename: "".to_string(),
        source: "".to_string(),
        title: "".to_string(),
    };

    while let Some(field) = multipart.next_field().await? {
        let name = field.name().unwrap_or("").to_string();

        match name.as_str() {
            "image" => {
                parsed.content_type = field
                    .content_type()
                    .map(|mime| mime.to_string())
                    .unwrap_or_default();
                parsed.filename = field
                    .file_name()
                    .map(|filename| filename.to_string())
                    .unwrap_or_default();
                parsed.image = field.bytes().await?.to_vec();
            }
            "id" | "user_id" => {
                parsed.user_id = field.text().await?;
            }
            "expiration_date" => {
                parsed.expiration_date = Some(field.text().await?);
            }
            "source" => {
                parsed.source = field.text().await?;
            }
            "title" => {
                parsed.title = field.text().await?;
            }
            _ => {
                // Ignore unknown fields
            }
        }
    }

    return Ok(parsed);
}

#[cfg(test)]
mod tests {
    use super::*;

    fn valid_request() -> StoreWarrantyReceiptRequest {
        StoreWarrantyReceiptRequest {
            image: vec![1, 2, 3],
            user_id: "some-id".to_string(),
            content_type: "image/png".to_string(),
            expiration_date: Some("2027-12-31".to_string()),
            filename: "receipt.png".to_string(),
            source: "apple".to_string(),
            title: "Macbook M5 Receipt".to_string(),
        }
    }

    fn fake_uploader(request: &StoreWarrantyReceiptRequest) -> BoxFuture<'_, UploadResult> {
        assert_eq!(request.image, b"fake image bytes");
        assert_eq!(request.user_id, "some-id");
        assert_eq!(request.content_type, "image/png");
        assert_eq!(request.filename, "receipt.png");
        assert_eq!(request.source, "apple");
        assert_eq!(request.title, "Macbook M5 Receipt");

        Box::pin(async {
            Ok(CloudinaryResponse {
                public_id: "myday-web/some-id/receipt".to_string(),
                secure_url: "https://res.cloudinary.com/test/image/upload/receipt.png".to_string(),
            })
        })
    }

    fn multipart_request() -> Request {
        let boundary = "test-boundary";
        let body = concat!(
            "--test-boundary\r\n",
            "Content-Disposition: form-data; name=\"image\"; filename=\"receipt.png\"\r\n",
            "Content-Type: image/png\r\n",
            "\r\n",
            "fake image bytes\r\n",
            "--test-boundary\r\n",
            "Content-Disposition: form-data; name=\"id\"\r\n",
            "\r\n",
            "some-id\r\n",
            "--test-boundary\r\n",
            "Content-Disposition: form-data; name=\"expiration_date\"\r\n",
            "\r\n",
            "2027-12-31\r\n",
            "--test-boundary\r\n",
            "Content-Disposition: form-data; name=\"source\"\r\n",
            "\r\n",
            "apple\r\n",
            "--test-boundary\r\n",
            "Content-Disposition: form-data; name=\"title\"\r\n",
            "\r\n",
            "Macbook M5 Receipt\r\n",
            "--test-boundary--\r\n",
        );

        let mut request = Request::new(Body::from(body.as_bytes()));
        request.headers_mut().insert(
            "content-type",
            format!("multipart/form-data; boundary={}", boundary)
                .parse()
                .expect("content-type should parse"),
        );
        request
    }

    #[test]
    fn validation_passes_for_valid_request() {
        let request = valid_request();

        let result = request.validate();

        assert!(result.is_ok());
    }

    #[test]
    fn validation_fails_when_some_are_missing() {
        let mut image_missing = valid_request();
        image_missing.image = Vec::new();
        let result = image_missing.validate();
        assert_eq!(result, Err("image is required.".to_string()));

        let mut id_missing = valid_request();
        id_missing.user_id = "".to_string();
        let result = id_missing.validate();
        assert_eq!(result, Err("id is required.".to_string()));

        let mut title_missing = valid_request();
        title_missing.title = "".to_string();
        let result = title_missing.validate();
        assert_eq!(result, Err("title is required.".to_string()));

        let mut source_missing = valid_request();
        source_missing.source = "".to_string();
        let result = source_missing.validate();
        assert_eq!(result, Err("source is required.".to_string()));

        let mut content_type_missing = valid_request();
        content_type_missing.content_type = "".to_string();
        let result = content_type_missing.validate();
        assert_eq!(result, Err("content_type is required.".to_string()));

        let mut filename_missing = valid_request();
        filename_missing.filename = "".to_string();
        let result = filename_missing.validate();
        assert_eq!(result, Err("filename is required.".to_string()));
    }

    #[test]
    fn validation_fails_when_expiration_date_is_invalid() {
        let mut request = valid_request();
        request.expiration_date = Some("12/31/2027".to_string());

        let result = request.validate();

        assert_eq!(
            result,
            Err("expiration_date must be a valid date string (YYYY-MM-DD)".to_string())
        );
    }

    #[tokio::test]
    async fn handler_uses_injected_uploader() {
        let response = handler_with_uploader(multipart_request(), fake_uploader)
            .await
            .expect("handler should return a response");

        assert_eq!(response.status(), StatusCode::OK);

        let body = String::from_utf8(response.body().as_ref().to_vec())
            .expect("response body should be utf-8");
        let json: serde_json::Value =
            serde_json::from_str(&body).expect("response body should be json");

        assert_eq!(json["message"], "Warranty receipt stored successfully.");
        assert_eq!(
            json["image"]["image_url"],
            "https://res.cloudinary.com/test/image/upload/receipt.png"
        );
        assert_eq!(
            json["image"]["image_public_id"],
            "myday-web/some-id/receipt"
        );
        assert_eq!(json["image"]["user_id"], "some-id");
        assert_eq!(json["image"]["title"], "Macbook M5 Receipt");
        assert_eq!(json["image"]["expiration_date"], "2027-12-31");
        assert_eq!(json["image"]["content_type"], "image/png");
        assert_eq!(json["image"]["filename"], "receipt.png");
        assert_eq!(json["image"]["source"], "apple");
    }
}
