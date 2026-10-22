// Test component for integration-tests: exports two interfaces from one file and covers
// integers, floats, result, list, record, string and a resource across the component boundary.
wit_bindgen::generate!({ world: "calculator" });

use std::cell::Cell;

use exports::acme::calc::{arith, format as fmt, memory};

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

struct Accumulator(Cell<f64>);

impl memory::Guest for Calculator {
    type Accumulator = Accumulator;
}

impl memory::GuestAccumulator for Accumulator {
    fn new(start: f64) -> Self {
        Accumulator(Cell::new(start))
    }

    fn add(&self, value: f64) {
        self.0.set(self.0.get() + value);
    }

    fn total(&self) -> f64 {
        self.0.get()
    }

    fn merge(a: memory::AccumulatorBorrow<'_>, b: memory::AccumulatorBorrow<'_>) -> memory::Accumulator {
        let total = a.get::<Accumulator>().total() + b.get::<Accumulator>().total();
        memory::Accumulator::new(Accumulator(Cell::new(total)))
    }
}

export!(Calculator);
