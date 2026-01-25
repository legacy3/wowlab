fn main() {
    prost_build::compile_protos(&["src/proto/centrifugo.proto"], &["src/proto/"]).unwrap();
}
