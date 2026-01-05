use super::*;

// Preprocess tests
mod preprocess_tests {
    use super::*;

    fn pp(s: &str) -> preprocess::TransformResult {
        preprocess::transform(s, &NamespaceConfig::default())
    }

    #[test]
    fn properties_flattened() {
        let r = pp("$talent.foo.enabled");
        assert_eq!(r.script, "talent_foo_enabled");
        assert!(r.method_calls.is_empty());
    }

    #[test]
    fn method_calls_extracted() {
        let r = pp("$spell.fireball.ready()");
        assert_eq!(r.script, "__m0");
        assert_eq!(r.method_calls.len(), 1);
        assert_eq!(r.method_calls[0].namespace, "spell");
        assert_eq!(r.method_calls[0].path, vec!["fireball"]);
        assert_eq!(r.method_calls[0].method, "ready");
    }

    #[test]
    fn multiple_calls_unique_vars() {
        let r = pp("$spell.a.ready() && $aura.b.stacks()");
        assert_eq!(r.script, "__m0 && __m1");
        assert_eq!(r.method_calls.len(), 2);
        assert_eq!(r.method_calls[0].var, "__m0");
        assert_eq!(r.method_calls[1].var, "__m1");
    }

    #[test]
    fn stringify_spell() {
        let r = pp("cast($spell.fireball)");
        assert_eq!(r.script, "cast(\"fireball\")");
        assert!(r.method_calls.is_empty());
    }

    #[test]
    fn local_vars_unchanged() {
        let r = pp("let x = 1; x.foo");
        assert_eq!(r.script, "let x = 1; x.foo");
    }

    #[test]
    fn mixed_expression() {
        let r = pp("if $talent.ki.enabled && $spell.ks.ready() { cast($spell.ks) }");
        assert_eq!(r.script, "if talent_ki_enabled && __m0 { cast(\"ks\") }");
        assert_eq!(r.method_calls.len(), 1);
    }

    #[test]
    fn nested_parens_in_call() {
        let r = pp("$spell.foo.damage(1 + (2 * 3))");
        assert_eq!(r.script, "__m0");
        assert_eq!(r.method_calls[0].method, "damage");
    }
}

// Compiler tests
mod compiler_tests {
    use super::*;

    #[test]
    fn basic_rotation() {
        let script = "if ready { cast(\"spell\") } else { wait_gcd() }";
        let compiler = RotationCompiler::compile(script).unwrap();
        let mut state = compiler.new_state();
        let slot = compiler.schema().slot("ready").unwrap();

        state.set_bool(slot, true);
        assert_eq!(compiler.evaluate(&state), Action::Cast("spell".into()));

        state.set_bool(slot, false);
        assert_eq!(compiler.evaluate(&state), Action::WaitGcd);
    }

    #[test]
    fn namespace_api() {
        let script = r"
            if $talent.killer.enabled && $target.health < 0.2 {
                cast($spell.execute)
            } else {
                cast($spell.filler)
            }
        ";

        let compiler = RotationCompiler::compile(script).unwrap();
        let mut state = compiler.new_state();

        let talent = compiler.schema().slot("talent_killer_enabled").unwrap();
        let health = compiler.schema().slot("target_health").unwrap();

        state.set_bool(talent, true);
        state.set_float(health, 0.1);
        assert_eq!(compiler.evaluate(&state), Action::Cast("execute".into()));

        state.set_float(health, 0.8);
        assert_eq!(compiler.evaluate(&state), Action::Cast("filler".into()));
    }

    #[test]
    fn cached_evaluation() {
        let script = "if x { cast(\"a\") } else { cast(\"b\") }";
        let compiler = RotationCompiler::compile(script).unwrap();
        let mut state = compiler.new_state();
        state.set_bool(compiler.schema().slot("x").unwrap(), true);

        let optimized = compiler.optimize(&state);
        for _ in 0..100 {
            assert_eq!(
                compiler.evaluate_optimized(&optimized),
                Action::Cast("a".into())
            );
        }
    }

    #[test]
    fn method_calls_extracted() {
        let script = r"
            if $spell.kill_shot.ready() && $target.health < 0.2 {
                cast($spell.kill_shot)
            } else {
                cast($spell.steady_shot)
            }
        ";

        let compiler = RotationCompiler::compile(script).unwrap();
        let schema = compiler.schema();

        // Method call extracted
        let calls = schema.method_calls();
        assert_eq!(calls.len(), 1);
        assert_eq!(calls[0].var, "__m0");
        assert_eq!(calls[0].namespace, "spell");
        assert_eq!(calls[0].path, vec!["kill_shot"]);
        assert_eq!(calls[0].method, "ready");

        // Method var registered in schema
        assert!(schema.slot("__m0").is_some());

        // Test with method result injected
        let mut state = compiler.new_state();
        state.set_bool(schema.slot("__m0").unwrap(), true);
        state.set_float(schema.slot("target_health").unwrap(), 0.1);
        assert_eq!(compiler.evaluate(&state), Action::Cast("kill_shot".into()));

        state.set_bool(schema.slot("__m0").unwrap(), false);
        assert_eq!(
            compiler.evaluate(&state),
            Action::Cast("steady_shot".into())
        );
    }

    #[test]
    fn two_pass_optimization() {
        let script = r"
            if $talent.execute.enabled && $target.health < 0.2 {
                cast($spell.execute)
            } else if $spell.filler.ready() {
                cast($spell.filler)
            } else {
                wait_gcd()
            }
        ";

        let compiler = RotationCompiler::compile(script).unwrap();
        let schema = compiler.schema();

        // First pass: bake in static state (talents)
        let mut static_state = compiler.new_state();
        static_state.set_bool(schema.slot("talent_execute_enabled").unwrap(), true);

        let partial = compiler.optimize_partial(&static_state);

        // Second pass: optimize with dynamic state
        let mut dynamic_state = compiler.new_state();
        dynamic_state.set_float(schema.slot("target_health").unwrap(), 0.1);
        dynamic_state.set_bool(schema.slot("__m0").unwrap(), true);

        let optimized = compiler.optimize_from_partial(&partial, &dynamic_state);
        assert_eq!(
            compiler.evaluate_optimized(&optimized),
            Action::Cast("execute".into())
        );

        // Different dynamic state
        dynamic_state.set_float(schema.slot("target_health").unwrap(), 0.8);
        let optimized = compiler.optimize_from_partial(&partial, &dynamic_state);
        assert_eq!(
            compiler.evaluate_optimized(&optimized),
            Action::Cast("filler".into())
        );
    }
}
