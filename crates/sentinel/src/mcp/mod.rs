mod query;
mod schema;

use std::sync::Arc;
use std::time::Instant;

use rmcp::handler::server::tool::ToolRouter;
use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::{CallToolResult, Content, Implementation, ServerCapabilities, ServerInfo};
use rmcp::transport::streamable_http_server::session::local::LocalSessionManager;
use rmcp::transport::streamable_http_server::tower::StreamableHttpService;
use rmcp::transport::streamable_http_server::StreamableHttpServerConfig;
use rmcp::{tool, tool_handler, tool_router, ErrorData, ServerHandler};
use sqlx::PgPool;

use crate::telemetry::{self, McpErrorType, McpTool};
use crate::utils::meta;

async fn with_metrics<F, Fut>(tool: McpTool, f: F) -> Result<CallToolResult, ErrorData>
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = Result<CallToolResult, ErrorData>>,
{
    let start = Instant::now();
    telemetry::record_mcp_request(tool);

    let result = f().await;

    if result.is_ok() {
        telemetry::record_mcp_duration(tool, start.elapsed().as_secs_f64());
    }

    result
}

fn classify_error(msg: &str) -> McpErrorType {
    const PATTERNS: &[(&[&str], McpErrorType)] = &[
        (&["timeout"], McpErrorType::Timeout),
        (
            &["Unknown table", "not filterable", "not sortable"],
            McpErrorType::InvalidParams,
        ),
    ];

    PATTERNS
        .iter()
        .find(|(keywords, _)| keywords.iter().any(|k| msg.contains(k)))
        .map(|(_, err)| *err)
        .unwrap_or(McpErrorType::Database)
}

fn json_result(v: impl serde::Serialize) -> CallToolResult {
    let text = serde_json::to_string_pretty(&v).unwrap_or_else(|_| "{}".into());
    CallToolResult::success(vec![Content::text(text)])
}

#[derive(Clone)]
pub struct McpHandler {
    db: PgPool,
    #[allow(dead_code)]
    tool_router: ToolRouter<Self>,
}

impl McpHandler {
    pub fn new(db: PgPool) -> Self {
        Self {
            db,
            tool_router: Self::tool_router(),
        }
    }
}

#[tool_router]
impl McpHandler {
    #[tool(
        description = "Returns available tables and their columns with data types. Call this first to discover what data can be queried and which columns support filtering/sorting."
    )]
    async fn get_schema(&self) -> Result<CallToolResult, ErrorData> {
        with_metrics(McpTool::GetSchema, || async {
            serde_json::to_value(schema::TABLES)
                .map(json_result)
                .map_err(|e| {
                    telemetry::record_mcp_error(McpTool::GetSchema, McpErrorType::Internal);
                    ErrorData::internal_error(format!("Failed to serialize schema: {e}"), None)
                })
        })
        .await
    }

    #[tool(
        description = "Query WoW game data tables with optional filtering, sorting, and pagination"
    )]
    async fn query(
        &self,
        params: Parameters<query::TableQuery>,
    ) -> Result<CallToolResult, ErrorData> {
        with_metrics(McpTool::Query, || async {
            let results = query::execute(&self.db, params.0).await.map_err(|e| {
                telemetry::record_mcp_error(McpTool::Query, classify_error(&e));
                ErrorData::invalid_params(e, None)
            })?;

            telemetry::record_mcp_query_rows(results.len() as u64);

            Ok(if results.is_empty() {
                CallToolResult::success(vec![Content::text("No results")])
            } else {
                json_result(results)
            })
        })
        .await
    }
}

#[tool_handler]
impl ServerHandler for McpHandler {
    fn get_info(&self) -> ServerInfo {
        ServerInfo {
            protocol_version: Default::default(),
            capabilities: ServerCapabilities {
                tools: Some(Default::default()),
                ..Default::default()
            },
            server_info: Implementation {
                name: "wowlab".into(),
                version: env!("CARGO_PKG_VERSION").into(),
                title: Some("WoW Lab MCP Server".into()),
                icons: None,
                website_url: Some(meta::WEBSITE.into()),
            },
            instructions: Some(
                "WoW game data query API. Workflow: 1) Call get_schema to see available tables \
                 and columns. 2) Call query with table name, optional filters, and pagination. \
                 Example: query game.spells with name contains 'Fireball'."
                    .into(),
            ),
        }
    }
}

pub fn create_service(db: PgPool) -> StreamableHttpService<McpHandler, LocalSessionManager> {
    StreamableHttpService::new(
        move || Ok(McpHandler::new(db.clone())),
        Arc::new(LocalSessionManager::default()),
        StreamableHttpServerConfig {
            stateful_mode: false,
            ..Default::default()
        },
    )
}
