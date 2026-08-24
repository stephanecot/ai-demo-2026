---
name: java-best-practices
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Modern Java language best practices for the backend in this repo (Java 21 LTS
  features, all available on the project's Java 25) — records, sealed types,
  pattern matching for switch & record patterns, switch expressions, text
  blocks, var, Optional over null, the Stream API, immutability, enums,
  exceptions, and virtual threads / sequenced collections. Use when writing or
  reviewing the Java language itself (independent of Spring). Pairs with
  `spring-boot-best-practices` for the framework side.
---

# Modern Java best practices

Language-level conventions for backend Java in this repo. The project compiles
on **Java 25** (baseline 17); everything here is available from **Java 21 (LTS)**
onward, so use it freely. This skill is about *Java the language* — for Spring/
framework conventions see `spring-boot-best-practices` and the per-layer skills.

> Goal: small, immutable, expressive code. Prefer data carriers + exhaustive
> pattern matching over inheritance + instanceof chains and null juggling.

## Records for data

- Use `record` for any immutable data carrier (DTOs, value objects, query
  results, config). No boilerplate getters/equals/hashCode.
- Add **compact constructors** for validation/normalization. Records are shallowly
  immutable — defensively copy mutable components if they must not leak.

```java
public record Money(BigDecimal amount, Currency currency) {
    public Money {                                  // compact constructor
        if (amount.signum() < 0) throw new IllegalArgumentException("negative");
        amount = amount.stripTrailingZeros();
    }
}
```

## Sealed types + exhaustive switch

- Model a closed set of cases with a `sealed interface`/`abstract class` and
  `permits`. The compiler then makes `switch` **exhaustive** — no `default`
  needed, and adding a case becomes a compile error until handled.
- This replaces visitor patterns and `instanceof` ladders.

```java
sealed interface StockEvent permits Received, Shipped, Adjusted {}
record Received(String sku, int qty) implements StockEvent {}
record Shipped(String sku, int qty) implements StockEvent {}
record Adjusted(String sku, int delta) implements StockEvent {}

int delta(StockEvent e) {
    return switch (e) {                              // exhaustive, no default
        case Received r -> r.qty();
        case Shipped s  -> -s.qty();
        case Adjusted a -> a.delta();
    };
}
```

## Pattern matching

- `instanceof` pattern: `if (o instanceof Product p) { … }` — no cast.
- **Record patterns** destructure: `case Received(var sku, var qty) ->`.
- **Guards** with `when`: `case Shipped s when s.qty() > 100 -> …`.
- Switch can match on `null` explicitly (`case null ->`) instead of a pre-check.

```java
String describe(Object o) {
    return switch (o) {
        case null            -> "nothing";
        case Received(var sku, var qty) when qty > 0 -> sku + " +" + qty;
        case String s        -> "text: " + s;
        default              -> o.toString();
    };
}
```

## Switch expressions & text blocks

- Prefer **switch expressions** (`->`, returns a value, arrow form) over
  statement switches with fall-through. No accidental `break` bugs.
- Use **text blocks** (`"""`) for multi-line JSON/SQL/HTML instead of `+`
  concatenation.

```java
String query = """
    { "quantity": { "$lt": %d } }
    """.formatted(threshold);
```

## `var` for locals

- Use `var` when the initializer makes the type obvious (`var products =
  repository.findAll();`). Don't use it when it hurts readability (e.g. naked
  literals or chained calls with a non-obvious result type).

## Null-safety & Optional

- Prefer **`Optional<T>`** as a return type for "maybe absent" lookups; never
  return `null` for collections (return empty). Don't use `Optional` for fields
  or parameters.
- Use `map`/`filter`/`orElseThrow` — avoid `isPresent()/get()` pairs.
- Annotate APIs with JSpecify (`@NullMarked`, `@Nullable`) per the repo (see
  `spring-boot-best-practices`).

```java
return repository.findBySku(sku)
    .map(ProductResponse::from)
    .orElseThrow(() -> new ProductNotFoundException(sku));
```

## Streams & collections

- Use the Stream API for transformation/aggregation; keep pipelines short and
  side-effect-free (no mutation inside `forEach` to build state — use collectors).
- Return **immutable** collections (`List.of`, `toList()`, `Map.of`). Don't
  expose internal mutable lists.
- Java 21 **sequenced collections**: `getFirst()`/`getLast()`/`reversed()` on
  `List`/`Deque`/`LinkedHashSet` instead of `list.get(0)` / manual reversal.

```java
List<String> lowStock = products.stream()
    .filter(p -> p.quantity() < threshold)
    .map(Product::sku)
    .sorted()
    .toList();                                       // immutable
```

## Immutability & encapsulation

- Default to `final` fields and immutable objects; mutate by producing new
  instances (records make this natural).
- No mutable static state. Constants are `static final` and deeply immutable.

## Enums over constants

- Use `enum` for a fixed set of values; attach behavior/fields to constants
  rather than scattering `switch` on raw strings/ints.

## Exceptions

- Throw specific, meaningful exceptions; prefer unchecked for programming/domain
  errors. Never catch-and-swallow (`catch (Exception e) {}`).
- Use try-with-resources for anything `AutoCloseable`. Don't use exceptions for
  control flow.

## Concurrency — virtual threads

- For blocking I/O concurrency, use **virtual threads** (Java 21):
  `Executors.newVirtualThreadPerTaskExecutor()`, or enable
  `spring.threads.virtual.enabled: true`. Don't build bounded platform-thread
  pools for I/O-bound work.
- Don't pool virtual threads, and avoid `synchronized` around blocking calls
  (prefer `ReentrantLock`) so threads don't pin the carrier.

## Avoid

- ❌ Raw types / unchecked casts; no `@SuppressWarnings` to hide a real issue.
- ❌ `null` returns for collections or "not found" — empty collection / `Optional`.
- ❌ Statement `switch` with fall-through where an expression switch fits.
- ❌ `instanceof` + cast ladders where sealed types + pattern switch fit.
- ❌ Mutable public fields / leaking internal mutable collections.
- ❌ Reinventing a record's `equals`/`hashCode`/`toString` by hand.

These reinforce `.claude/rules/java.md` (the forbidden-pattern list); when the
two overlap, the rules file wins.
