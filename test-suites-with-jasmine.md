---
layout: chapter
title: Test suites with Jasmine
description: How to create and structure efficient tests using the Jasmine library
---

# Test suites with Jasmine

<aside class="learning-objectives" markdown="1">
Learning objectives

- Introducing the Jasmine testing framework
- Writing test suites, specs and assertions
- Structuring a spec with Arrange, Act, Assert
- Efficient test suites with setup and teardown logic
</aside>

Angular ships with Jasmine, a JavaScript framework that enables you to write and execute unit and integration tests. Jasmine consists of three important parts:

1. A library with classes and functions for constructing tests.
2. A test execution engine.
3. A reporting engine that outputs test results in different formats.

If you are new to Jasmine, it is recommended to read the [official Jasmine tutorial](https://jasmine.github.io/tutorials/your_first_suite). This guide provides a short introduction to Jasmine, exploring the basic structure and terminology that will be used throughout this guide.

## Creating a test suite

In terms of Jasmine, a test consists of one or more **suites**. A suite is declared with a `describe` block:

```typescript
describe('Suite description', () => {
  /* … */
});
```

Each suite *describes* a piece of code, the *code under test*.

<aside class="margin-note" markdown="1">
  `describe`: Suite
</aside>

`describe` is a function that takes two parameters.

1. A string with a human-readable name. Typically the name of the function or class under test. For example, `describe('CounterComponent', /* … */)` is the suite that tests the `CounterComponent` class.
2. A function containing the suite definition.

A `describe` block groups related specs that we will learn about in the next chapter.

<aside class="margin-note" markdown="1">
  Nesting `describe`
</aside>

`describe` blocks can be nested to structure big suites and divide them into logical sections:

```typescript
describe('Suite description', () => {
  describe('One aspect', () => {
    /* … */
  });
  describe('Another aspect', () => {
    /* … */
  });
});
```

Nested `describe` blocks add a human-readable description to a group of specs. They can also host their own setup and teardown logic.

## Specifications

<aside class="margin-note" markdown="1">
  `it`: Spec
</aside>

Each suit consists of one or more *specifications*, or short, **specs**. A spec is declared with an `it` block:

```typescript
describe('Suite description', () => {
  it('Spec description', () => {
    /* … */
  });
  /* … more specs …  */
});
```

Again, `it` is a function that takes two parameters. The first parameter is a string with a human-readable description. The second parameter is a function containing the spec code.

<aside class="margin-note">Readable sentence</aside>

The pronoun `it` refers to the code under test. `it` should be the subject of a human-readable sentence that asserts the behavior of the code under test. The spec code then proves this assertion. This style of writing specs originates from the concept of Behavior-Driven Development (BDD).

One goal of BDD is to describe software behavior in a natural language – in this case, English. Every stakeholder should be able to read the `it` sentences and understand how the code is supposed to behave. Team members without JavaScript knowledge should be able to add more requirements by forming `it does something` sentences.

Ask yourself, what does the code under test do? For example, in case of a `CounterComponent`, *it* increments the counter value. And *it* resets the counter to a specific value. So you could write:

```typescript
it('increments the count', () => {
  /* … */
});
it('resets the count', () => {
  /* … */
});
```

After `it`, typically a verb follows, like `increments` and `resets` in the example.

<aside class="margin-note">No “should”</aside>

Some people prefer to write `it('should increment the count', /* … */)`, but `should` bears no additional meaning. The nature of a spec is to state what the code under test *should* do. The word “should” is redundant and just makes the sentence longer. This guide recommends to simply state what the code does.

<div class="book-sources" markdown="1">
- [Jasmine tutorial: Your first suite](https://jasmine.github.io/tutorials/your_first_suite)
</div>

## Structure of a test

Inside the `it` block lies the actual testing code. Irrespective of the testing framework, the testing code typically consists of three phases: **Arrange, Act and Assert**.

<aside class="margin-note">Arrange, Act, Assert</aside>

1. **Arrange** is the preparation and setup phase. For example, the class under test is instantiated. Dependencies are set up. Spies and fakes are created.
2. **Act** is the phase where interaction with the code under test happens. For example, a method is called or an HTML element in the DOM is clicked.
3. **Assert** is the phase where the code behavior is checked and verified. For example, the actual output is compared to the expected output.

How could the structure of the spec `it('resets the count', /* … */)` for the `CounterComponent` look like?

1. <p><strong>Arrange:</strong></p>

   - Create an instance of `CounterComponent`.
   - Render the Component into the document.

2. <p><strong>Act:</strong></p>

   - Find and focus the reset input field.
   - Enter the text “5”.
   - Find and click the “Reset” button.

3. <p><strong>Assert:</strong></p>

   - Expect that the displayed count now reads “5”.

<aside class="margin-note">Structure a test</aside>

This structure makes it easier to come up with a test and also to implement it. Ask yourself:

- What is the necessary setup? Which dependencies do I need to provide? How do they behave? (*Arrange*)
- What is the user input or API call that triggers the behavior I would like to test? (*Act*)
- What is the expected behavior? How do I prove that the behavior is correct? (*Assert*)

<aside class="margin-note">Given, When, Then</aside>

In Behavior-Driven Development (BDD), the three phases of a test are fundamentally the same. But they are called **Given, When and Then**. These plain English words try to avoid technical jargon and pose a natural way to think of a test’s structure: “*Given* these conditions, *when* the user interacts with the application, *then* it behaves in a certain way.”

## Expectations

In the *Assert* phase, the test compares the actual output or return value to the expected output or return value. If they are the same, the test passes. If they differ, the test fails.

Let us examine a simple contrived example, an `add` function:

```typescript
const add = (a, b) => a + b;
```

A primitive test without any testing tools could look like this:

```typescript
const expectedValue = 5;
const actualValue = add(2, 3);
if (expectedValue !== actualValue) {
  throw new Error(
    `Wrong return value: ${actualValue}. Expected: ${expectedValue}`
  );
}
```

<aside class="margin-note" markdown="1">
  `expect`
</aside>

We could write that code in a Jasmine spec, but Jasmine allows us to create expectations in an easier and more concise manner: The `expect` function together with a **matcher**.

```typescript
const expectedValue = 5;
const actualValue = add(2, 3);
expect(actualValue).toBe(expectedValue);
```

First, we pass the actual value to the `expect` function. It returns an expectation object with methods for checking the actual value. We would like to compare the actual value to the expected value, so we use the `toBe` matcher.

<aside class="margin-note">Matchers</aside>

`toBe` is the simplest matcher that applies to all possible JavaScript values. Internally, it uses JavaScript’s strict equality operator `===`. <code>expect(actualValue)&#x200b;.toBe(expectedValue)</code> essentially runs `actualValue === expectedValue`.

`toBe` is useful to compare primitive values like strings, numbers and booleans. For objects, `toBe` matches only if the actual and the expected value are the very same object. `toBe` fails if two objects are not identical, even if they happen to have the same properties and values.

For checking the deep equality of two objects, Jasmine offers the `toEqual` matcher. This example illustrates the difference:

```typescript
// Fails, the two objects are not identical
expect({ name: 'Linda' }).toBe({ name: 'Linda' });

// Passes, the two objects are not identical but deeply equal
expect({ name: 'Linda' }).toEqual({ name: 'Linda' });
```

Jasmine has numerous useful matchers built-in, `toBe` and `toEqual` being the most common. You can add custom matchers to hide a complex check behind a short name.

<aside class="margin-note">Readable sentence</aside>

The pattern `expect(actualValue).toEqual(expectedValue)` originates from Behavior-Driven Development (BDD) again. The `expect` function call and the matcher methods form a human-readable sentence: “Expect the actual value to equal the expected value.” The goal is to write a specification that is as readable as a plain text but can be verified automatically.

<div class="book-sources" markdown="1">
- [Jasmine documentation: Built-in matchers](https://jasmine.github.io/api/edge/matchers)
- [Jasmine tutorials: Custom matchers](https://jasmine.github.io/tutorials/custom_matcher)
</div>

## Efficient test suites

When writing multiple specs in one suite, you quickly realize that the *Arrange* phase is similar or even identical across these specs. For example, when testing the `CounterComponent`, the *Arrange* phase always consists of creating a Component instance and rendering it into the document.

<aside class="margin-note">Repetitive setup</aside>

This setup is repeated over and over, so it should be defined once in a central place. You could write a `setup` function and call it at the beginning of each spec. But using Jasmine, you can declare code that is called before and after each spec, or before and after all specs.

For this purpose, Jasmine provides four functions: `beforeEach`, `afterEach`, `beforeAll` and `afterAll`. They are called inside of a `describe` block, just like `it`. They expect one parameter, a function that is called at the given stages.

```typescript
describe('Suite description', () => {
  beforeAll(() => {
    console.log('Called before all specs are run');
  });
  afterAll(() => {
    console.log('Called after all specs are run');
  });

  beforeEach(() => {
    console.log('Called before each spec is run');
  });
  afterEach(() => {
    console.log('Called after each spec is run');
  });

  it('Spec 1', () => {
    console.log('Spec 1');
  });
  it('Spec 2', () => {
    console.log('Spec 2');
  });
});
```

This suite has two specs and defines shared setup and teardown code. The output is:

```
Called before all specs are run
Called before each spec is run
Spec 1
Called after each spec is run
Called before each spec is run
Spec 2
Called after each spec is run
Called after all specs are run
```

Most tests we are going to write will have a `beforeEach` block to host the *Arrange* code.

<p id="next-chapter-link"><a href="../faking-dependencies/#faking-dependencies">Faking dependencies</a></p>
