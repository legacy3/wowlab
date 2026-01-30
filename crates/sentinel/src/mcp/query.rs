//! Query execution for MCP game data tables.
//!
//! Builds and executes parameterized SQL queries with filtering, sorting,
//! and pagination. All user input is bound via query parameters to prevent
//! SQL injection.

use std::time::Duration;

use schemars::JsonSchema;
use serde::Deserialize;
use serde_json::{Map, Value};
use sqlx::{PgPool, QueryBuilder, Row};
use tokio::time::timeout;

use super::schema::{get_column, get_table, ColType, Table};

#[derive(Debug, Clone, Deserialize, JsonSchema)]
#[schemars(description = "Query parameters for fetching rows from a game data table")]
pub struct TableQuery {
    #[schemars(
        description = "Table name: game.spells, game.items, game.auras, game.specs, game.classes, or game.specs_traits"
    )]
    pub table: String,
    #[serde(default)]
    #[schemars(description = "Array of filter conditions (all conditions are AND-ed together)")]
    pub filters: Vec<Filter>,
    #[serde(default)]
    #[schemars(
        description = "Column name to sort results by (must be a valid column for the table)"
    )]
    pub order_by: Option<String>,
    #[serde(default)]
    #[schemars(description = "Sort in descending order when true (default: false, ascending)")]
    pub order_desc: bool,
    #[serde(default = "default_limit")]
    #[schemars(description = "Maximum rows to return (default: 100, max: 1000)")]
    pub limit: u64,
    #[serde(default)]
    #[schemars(description = "Number of rows to skip for pagination")]
    pub offset: Option<u64>,
}

fn default_limit() -> u64 {
    100
}

#[derive(Debug, Clone, Deserialize, JsonSchema)]
#[schemars(description = "A single filter condition to apply to the query")]
pub struct Filter {
    #[schemars(description = "Column name to filter on (must exist in the table)")]
    pub column: String,
    #[schemars(description = "Comparison operation to apply")]
    pub op: FilterOp,
    #[serde(default)]
    #[schemars(
        description = "Value to compare against (type must match column: int, text, or bool)"
    )]
    pub value: Option<Value>,
}

#[derive(Debug, Clone, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
#[schemars(description = "Filter comparison operation")]
pub enum FilterOp {
    #[schemars(description = "Equals (works with int, text, bool)")]
    Eq,
    #[schemars(description = "Not equals (works with int, text, bool)")]
    Ne,
    #[schemars(description = "Greater than (works with int)")]
    Gt,
    #[schemars(description = "Greater than or equal (works with int)")]
    Gte,
    #[schemars(description = "Less than (works with int)")]
    Lt,
    #[schemars(description = "Less than or equal (works with int)")]
    Lte,
    #[schemars(description = "Text contains substring (works with text columns only)")]
    Contains,
    #[schemars(description = "Text starts with prefix (works with text columns only)")]
    StartsWith,
}

pub async fn execute(db: &PgPool, q: TableQuery) -> Result<Vec<Value>, String> {
    let table = get_table(&q.table).ok_or_else(|| format!("Unknown table: {}", q.table))?;
    validate_columns(table, &q)?;

    let mut query = build_query(table, &q)?;
    let rows = timeout(Duration::from_secs(30), query.build().fetch_all(db))
        .await
        .map_err(|_| "Query timeout".to_string())?
        .map_err(|e| e.to_string())?;

    rows.iter().map(|row| row_to_json(row, table)).collect()
}

fn row_to_json(row: &sqlx::postgres::PgRow, table: &Table) -> Result<Value, String> {
    let mut map = Map::with_capacity(table.columns.len());

    for col in table.columns {
        let value = match col.typ {
            ColType::Int => row
                .try_get::<i64, _>(col.name)
                .map(Value::from)
                .or_else(|_| row.try_get::<i32, _>(col.name).map(Value::from))
                .unwrap_or(Value::Null),
            ColType::Float => row
                .try_get::<f64, _>(col.name)
                .map(Value::from)
                .unwrap_or(Value::Null),
            ColType::Text => row
                .try_get::<String, _>(col.name)
                .map(Value::from)
                .unwrap_or(Value::Null),
            ColType::Bool => row
                .try_get::<bool, _>(col.name)
                .map(Value::from)
                .unwrap_or(Value::Null),
        };
        map.insert(col.name.to_string(), value);
    }

    Ok(Value::Object(map))
}

fn validate_columns(table: &Table, q: &TableQuery) -> Result<(), String> {
    for f in &q.filters {
        if get_column(table, &f.column).is_none() {
            return Err(format!(
                "Column '{}' not filterable on {}",
                f.column, table.name
            ));
        }
    }
    if let Some(col) = &q.order_by {
        if get_column(table, col).is_none() {
            return Err(format!("Column '{}' not sortable on {}", col, table.name));
        }
    }
    Ok(())
}

fn build_query<'a>(
    table: &'a Table,
    q: &'a TableQuery,
) -> Result<QueryBuilder<'a, sqlx::Postgres>, String> {
    let mut qb: QueryBuilder<sqlx::Postgres> = QueryBuilder::new("SELECT ");

    for (i, col) in table.columns.iter().enumerate() {
        if i > 0 {
            qb.push(", ");
        }
        qb.push(col.name);
    }

    qb.push(" FROM ");
    qb.push(table.name);

    let mut first = true;
    for f in &q.filters {
        let col_def = get_column(table, &f.column).expect("column validated in validate_columns");
        qb.push(if first { " WHERE " } else { " AND " });
        first = false;
        push_filter(&mut qb, col_def.name, col_def.typ, &f.op, &f.value)?;
    }

    if let Some(user_col) = &q.order_by {
        let col_def = get_column(table, user_col).expect("column validated in validate_columns");
        qb.push(" ORDER BY ");
        qb.push(col_def.name);
        qb.push(if q.order_desc { " DESC" } else { " ASC" });
    }

    qb.push(" LIMIT ");
    qb.push_bind(q.limit.min(1000) as i64);

    if let Some(off) = q.offset {
        qb.push(" OFFSET ");
        qb.push_bind(off as i64);
    }

    Ok(qb)
}

fn push_filter(
    qb: &mut QueryBuilder<sqlx::Postgres>,
    col_name: &str,
    col_type: ColType,
    op: &FilterOp,
    value: &Option<Value>,
) -> Result<(), String> {
    let val = value.as_ref().ok_or("Filter requires a value")?;

    match op {
        FilterOp::Eq => {
            qb.push(col_name).push(" = ");
            push_typed_value(qb, val, col_type)?;
        }
        FilterOp::Ne => {
            qb.push(col_name).push(" <> ");
            push_typed_value(qb, val, col_type)?;
        }
        FilterOp::Gt | FilterOp::Gte | FilterOp::Lt | FilterOp::Lte => {
            if !matches!(col_type, ColType::Int | ColType::Float) {
                return Err(format!("{:?} only works on numeric columns", op));
            }
            let symbol = match op {
                FilterOp::Gt => " > ",
                FilterOp::Gte => " >= ",
                FilterOp::Lt => " < ",
                FilterOp::Lte => " <= ",
                _ => unreachable!(),
            };
            qb.push(col_name).push(symbol);
            push_typed_value(qb, val, col_type)?;
        }
        FilterOp::Contains => {
            if col_type != ColType::Text {
                return Err("contains only works on text columns".into());
            }
            let s = val.as_str().ok_or("contains requires string value")?;
            qb.push("strpos(").push(col_name).push(", ");
            qb.push_bind(s.to_string()).push(") > 0");
        }
        FilterOp::StartsWith => {
            if col_type != ColType::Text {
                return Err("starts_with only works on text columns".into());
            }
            let s = val.as_str().ok_or("starts_with requires string value")?;
            qb.push("starts_with(").push(col_name).push(", ");
            qb.push_bind(s.to_string()).push(")");
        }
    }
    Ok(())
}

fn push_typed_value(
    qb: &mut QueryBuilder<sqlx::Postgres>,
    val: &Value,
    expected: ColType,
) -> Result<(), String> {
    match (expected, val) {
        (ColType::Int, Value::Number(n)) => {
            qb.push_bind(n.as_i64().ok_or("expected integer")?);
        }
        (ColType::Float, Value::Number(n)) => {
            qb.push_bind(n.as_f64().ok_or("expected float")?);
        }
        (ColType::Text, Value::String(s)) => {
            qb.push_bind(s.clone());
        }
        (ColType::Bool, Value::Bool(b)) => {
            qb.push_bind(*b);
        }
        _ => return Err(format!("type mismatch: expected {:?}", expected)),
    }
    Ok(())
}
