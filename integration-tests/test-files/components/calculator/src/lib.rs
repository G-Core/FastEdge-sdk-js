// Test component for integration-tests: exports two interfaces from one file and covers
// integers, floats, result, list, record and string across the component boundary.
wit_bindgen::generate!({ world: "calculator" });

use exports::acme::calc::{arith, format as fmt};

struct Calculator;

impl arith::Guest for Calculator {
    fn add(a: i32, b: i32) -> i32 {
        a.wrapping_add(b)
    }

    fn divide(a: f64, b: f64) -> Result<f64, String> {
        if b == 0.0 {
            return Err("division by zero".to_string());
        }
        Ok(a / b)
    }

    fn sum(values: Vec<f64>) -> f64 {
        values.iter().sum()
    }
}

impl fmt::Guest for Calculator {
    fn describe(e: fmt::Expr, value: f64) -> String {
        format!("{} {} {} = {}", e.a, e.op, e.b, value)
    }
}

export!(Calculator);
