mod query;
mod schema;

use std::sync::Arc;

use rmcp::handler::server::tool::ToolRouter;
use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::{CallToolResult, Content, Implementation, ServerCapabilities, ServerInfo};
use rmcp::transport::streamable_http_server::session::local::LocalSessionManager;
use rmcp::transport::streamable_http_server::tower::StreamableHttpService;
use rmcp::transport::streamable_http_server::StreamableHttpServerConfig;
use rmcp::{tool, tool_handler, tool_router, ErrorData, ServerHandler};
use serde_json::Value;
use sqlx::PgPool;

use self::query::TableQuery;

fn json_result(v: Value) -> CallToolResult {
    CallToolResult::success(vec![Content::text(
        serde_json::to_string_pretty(&v).unwrap_or_else(|_| "{}".into()),
    )])
}

fn text_result(s: impl Into<String>) -> CallToolResult {
    CallToolResult::success(vec![Content::text(s.into())])
}

#[derive(Clone)]
pub struct McpHandler {
    db: PgPool,
    // Required by #[tool_router] macro - stores the generated tool routing table
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
        let schema_value = serde_json::to_value(schema::TABLES).map_err(|e| {
            ErrorData::internal_error(format!("Failed to serialize schema: {}", e), None)
        })?;
        Ok(json_result(schema_value))
    }

    #[tool(
        description = "Query WoW game data tables with optional filtering, sorting, and pagination"
    )]
    async fn query(&self, params: Parameters<TableQuery>) -> Result<CallToolResult, ErrorData> {
        let results = query::execute(&self.db, params.0)
            .await
            .map_err(|e| ErrorData::invalid_params(e, None))?;

        if results.is_empty() {
            Ok(text_result("No results"))
        } else {
            Ok(json_result(Value::Array(results)))
        }
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
                website_url: Some("https://wowlab.gg".into()),
            },
            instructions: Some(
                "WoW game data query API. Workflow: 1) Call get_schema to see available tables and columns. 2) Call query with table name, optional filters, and pagination. Example: query game.spells with name contains 'Fireball'."
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
