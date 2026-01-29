fn main() -> Result<(), Box<dyn std::error::Error>> {
    prost_build::compile_protos(&["src/proto/client.proto"], &["src/proto/"])?;
    Ok(())
}
