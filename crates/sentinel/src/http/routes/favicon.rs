use axum::http::header;
use axum::response::IntoResponse;

pub async fn handler() -> impl IntoResponse {
    (
        [(header::CONTENT_TYPE, "image/x-icon")],
        include_bytes!("favicon.ico").as_slice(),
    )
}
