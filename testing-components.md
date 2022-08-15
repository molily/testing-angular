---
layout: chapter
title: Testing Components
description: Introduction to testing Angular Components with Angular’s TestBed
---

# Testing Components

<aside class="learning-objectives" markdown="1">
Learning objectives

- Setting up a Component test using Angular’s testing Module
- Getting familiar with Angular’s Component testing abstractions
- Accessing the rendered DOM and checking text content
- Simulating user input like clicks and form field input
- Testing Component Input and Outputs
- Using helpers functions for common Component testing tasks
</aside>

Components are the power houses of an Angular application. Components are composed to form the user interface.

A Component deals with several concerns, among others:

- It renders the template into the HTML DOM.
- It accepts data from parent Components using Input properties.
- It emits data to parent Components using Outputs.
- It reacts to user input by registering event handlers.
- It renders the content (`ng-content`) and templates (`ng-template`) that are passed.
- It binds data to form controls and allows the user to edit the data.
- It talks to Services or other state managers.
- It uses routing information like the current URL and URL parameters.

All these tasks need to be tested properly.

## Unit test for the counter Component

As a first example, we are going to test the [CounterComponent](https://github.com/9elements/angular-workshop/tree/main/src/app/components/counter).

<button class="load-iframe">
See the CounterComponent in action
</button>

<script type="text/x-template">
<p class="responsive-iframe">
<iframe src="https://9elements.github.io/angular-workshop/counter-component" class="responsive-iframe__iframe"></iframe>
</p>
</script>

When designing a Component test, the guiding questions are: What does the Component do, what needs to be tested? How do I test this behavior?

<aside class="margin-note">Counter features</aside>

We will test the following features of the `CounterComponent`:

- It displays the current count. The initial value is 0 and can be set by an Input.
- When the user activates the “+” button, the count increments.
- When the user activates the “-” button, the count decrements.
- When the user enters a number into the reset input field and activates the reset button, the count is set to the given value.
- When the user changes the count, an Output emits the new count.

Writing down what the Component does already helps to structure the unit test. The features above roughly translate to specs in a test suite.

<div class="book-sources" markdown="1">
- [CounterComponent: full code](https://github.com/9elements/angular-workshop/tree/main/src/app/components/counter)
</div>

## TestBed

Several chores are necessary to render a Component in Angular, even the simple counter Component. If you look into the [main.ts](https://github.com/9elements/angular-workshop/blob/main/src/main.ts) and the [AppModule](https://github.com/9elements/angular-workshop/blob/main/src/app/app.module.ts) of a typical Angular application, you find that a “platform” is created, a Module is declared and this Module is bootstrapped.

The Angular compiler translates the templates into JavaScript code. To prepare the rendering, an instance of the Component is created, dependencies are resolved and injected, inputs are set.

Finally, the template is rendered into the DOM. For testing, you could do all that manually, but you would need to dive deeply into Angular internals.

<aside class="margin-note" markdown="1">
  `TestBed`
</aside>

Instead, the Angular team provides the `TestBed` to ease unit testing. The `TestBed` creates and configures an Angular environment so you can test particular application parts like Components and Services safely and easily.

<div class="book-sources" markdown="1">
- [Angular API reference: TestBed](https://angular.io/api/core/testing/TestBed)
- [Testing Utility APIs: TestBed](https://angular.io/guide/testing-utility-apis#testbed-class-summary)
</div>

## Configuring the testing Module

The `TestBed` comes with a testing Module that is configured like normal Modules in your application: You can declare Components, Directives and Pipes, provide Services and other Injectables as well as import other Modules. `TestBed` has a static method `configureTestingModule` that accepts a Module definition:

```typescript
TestBed.configureTestingModule({
  imports: [ /*… */ ],
  declarations: [ /*… */ ],
  providers: [ /*… */ ],
});
```

<aside class="margin-note">Declare what is necessary</aside>

In a unit test, add those parts to the Module that are strictly necessary: the code under test, mandatory dependencies and fakes. For example, when writing a unit test for `CounterComponent`, we need to declare that Component class. Since the Component does not have dependencies, does not render other Components, Directives or Pipes, we are done.

```typescript
TestBed.configureTestingModule({
  declarations: [CounterComponent],
});
```

Our Component under test is now part of a Module. We are ready to render it, right? Not yet. First we need to compile all declared Components, Directives and Pipes:

```typescript
TestBed.compileComponents();
```

This instructs the Angular compiler to translate the template files into JavaScript code.

<aside class="margin-note">Configure and compile</aside>

Since `configureTestingModule` returns the `TestBed` again, we can chain those two calls:

```typescript
TestBed
  .configureTestingModule({
    declarations: [CounterComponent],
  })
  .compileComponents();
```

You will see this pattern in most Angular tests that rely on the `TestBed`.

## Rendering the Component

Now we have a fully-configured testing Module with compiled Components. Finally, we can render the Component under test using `createComponent`:

```typescript
const fixture = TestBed.createComponent(CounterComponent);
```

`createComponent` returns a `ComponentFixture`, essentially a wrapper around the Component with useful testing tools. We will learn more about the `ComponentFixture` later.

`createComponent` renders the Component into a `div` container element in the HTML DOM. Alas, something is missing. The Component is not fully rendered. All the static HTML is present, but the dynamic HTML is missing. The template bindings, like `{% raw %}{{ count }}{% endraw %}` in the example, are not evaluated.

<aside class="margin-note">Manual change detection</aside>

In our testing environment, there is **no automatic change detection**. Even with the default change detection strategy, a Component is not automatically rendered and re-rendered on updates.

In testing code, we have to **trigger the change detection manually**. This might be a nuisance, but it is actually a feature. It allows us to test asynchronous behavior in a synchronous manner, which is much simpler.

So the last thing we need to do is to trigger change detection:

```typescript
fixture.detectChanges();
```

<div class="book-sources" markdown="1">
- [Angular API reference: ComponentFixture](https://angular.io/api/core/testing/ComponentFixture)
</div>

## TestBed and Jasmine

The code for rendering a Component using the `TestBed` is now complete. Let us wrap the code in a Jasmine test suite.

```typescript
describe('CounterComponent', () => {
  let fixture: ComponentFixture<CounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CounterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    fixture.detectChanges();
  });

  it('…', () => {
    /* … */
  });
});
```

Using `describe`, we define a test suite for the `CounterComponent`. In contains a `beforeEach` block that configures the `TestBed` and renders the Component.

<aside class="margin-note">Async compilation</aside>

You might wonder why the function passed to `beforeEach` is marked as an `async` function. It is because `compileComponents` is an asynchronous operation. To compile the Components, Angular needs to fetch external the template files referenced by `templateUrl`.

If you are using the Angular CLI, which is most likely, the template files are already included in the test bundle. So they are available instantly. If you are not using the CLI, the files have to be loaded asynchronously.

This is an implementation detail that might change in the future. The safe way is wait for `compileComponents` to complete.

<aside class="margin-note" markdown="1">
  `async` and `await`
</aside>

Per default, Jasmine expects that your testing code is synchronous. The functions you pass to `it` but also `beforeEach`, `beforeAll`, `afterEach`, `afterAll` need to finish in a certain amount of time, also known as timeout. Jasmine also supports asynchronous specs. If you pass an `async` function, Jasmine waits for it to finish.


<div class="book-sources" markdown="1">
- [Test suites with Jasmine](../test-suites-with-jasmine/#test-suites-with-jasmine)
</div>

## ComponentFixture and DebugElement

`TestBed.createComponent(CounterComponent)` returns a fixture, an instance of `ComponentFixture`. What is the fixture and what does it provide?

The term fixture is borrowed from real-world testing of mechanical parts or electronic devices. A fixture is a standardized frame into which the test object is mounted. The fixture holds the object and connects to electrical contacts in order to provide power and to take measurements.

<aside class="margin-note">
  <p><code>Component&#xAD;Fixture</code></p>
</aside>

In the context of Angular, the `ComponentFixture` holds the Component and provides a convenient interface to both the Component instance and the rendered DOM.

The fixture references the Component instance via the `componentInstance` property. In our example, it contains a `CounterComponent` instance.

```typescript
const component = fixture.componentInstance;
```

The Component instance is mainly used to set Inputs and subscribe to Outputs, for example:

```typescript
// This is a ComponentFixture<CounterComponent>
const component = fixture.componentInstance;
// Set Input
component.startCount = 10;
// Subscribe to Output
component.countChange.subscribe((count) => {
  /* … */
});
```

We will learn more on testing Inputs and Outputs later.

<aside class="margin-note" markdown="1">
  `DebugElement`
</aside>

For accessing elements in the DOM, Angular has another abstraction: The `DebugElement` wraps the native DOM element. The fixture’s `debugElement` property returns the Component’s host element. For the `CounterComponent`, this is the `app-counter` element.

```typescript
const { debugElement } = fixture;
```

The `DebugElement` offers handy properties like `properties`, `attributes`, `classes` and `styles` to examine the DOM element itself. The properties `parent`, `children` and `childNodes` help navigating in the DOM tree. They return `DebugElement`s as well.

<aside class="margin-note" markdown="1">
  `nativeElement`
</aside>

Often it is necessary to unwrap the `DebugElement` to access the native DOM element inside. Every `DebugElement` has a `nativeElement` property:

```typescript
const { debugElement } = fixture;
const { nativeElement } = debugElement;
console.log(nativeElement.tagName);
console.log(nativeElement.textContent);
console.log(nativeElement.innerHTML);
```

`nativeElement` is typed as `any` because Angular does not know the exact type of the wrapped DOM element. Most of the time, it is a subclass of [`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement).

When you use `nativeElement`, you need to learn about the DOM interface of the specific element. For example, a `button` element is represented as [`HTMLButtonElement`](https://developer.mozilla.org/en-US/docs/Web/API/) in the DOM.

<div class="book-sources" markdown="1">
- [Angular API reference: ComponentFixture](https://angular.io/api/core/testing/ComponentFixture)
- [Angular API reference: DebugElement](https://angular.io/api/core/DebugElement)
</div>

## Writing the first Component spec

We have compiled a test suite that renders the `CounterComponent`. We have met Angular’s primary testing abstractions: `TestBed`, `ComponentFixture` and `DebugElement`.

Now let us roll up our sleeves and write the first spec! The main feature of our little counter is the ability to increment the count. Hence the spec:

```typescript
it('increments the count', () => {
  /* … */
});
```

The **Arrange, Act and Assert** phases help us to structure the spec:

- We have already covered the *Arrange* phase in the `beforeEach` block that renders the Component.
- In the *Act* phase, we click on the increment button.
- In the *Assert* phase, we check that the displayed count has incremented.

```typescript
it('increments the count', () => {
  // Act: Click on the increment button
  // Assert: Expect that the displayed count now reads “1”.
});
```

To click on the increment button, two actions are necessary:

1. Find the increment button element in the DOM.
2. Fire a click event on it.

Let us learn about finding elements in the DOM first.

## Querying the DOM with test ids

Every `DebugElement` features the methods `query` and `queryAll` for finding descendant elements (children, grandchildren and so forth).

<aside class="margin-note" markdown="1">
  `query` and `queryAll`
</aside>

- `query` returns the first descendant element that meets a condition.
- `queryAll` returns an array of all matching elements.

Both methods expect a predicate, that is a function judging every element and returning `true` or `false`.

<aside class="margin-note" markdown="1">
  `By.css`
</aside>

Angular ships with predefined predicate functions to query the DOM using familiar CSS selectors. For this purpose, pass `By.css('…')` with a CSS selector to `query` and `queryAll`.

```typescript
const { debugElement } = fixture;
// Find the first h1 element
const h1 = debugElement.query(By.css('h1'));
// Find all elements with the class .user
const userElements = debugElement.queryAll(By.css('.user'));
```

The return value of `query` is a `DebugElement` again, that of `queryAll` is an array of `DebugElement`s (`DebugElement[]` in TypeScript notation).

In the example above, we have used a type selector (`h1`) and a class selector (`.user`) to find elements in the DOM. For everyone familiar with CSS, this is familiar as well.

While these selectors are fine when styling Components, using them in a test needs to be challenged.

<aside class="margin-note">Avoid tight coupling</aside>

Type and class selectors introduce a *tight coupling* between the test and the template. HTML elements are picked for semantic reasons. Classes are picked mostly for styling. Both change frequently when the Component template is refactored. Should the test fail if the element type or class changes?

Sometimes the element type and the class are crucial for the feature under test. But most of the time, they are not relevant for the feature. The test should better find the element by a feature that never changes and that bears no additional meaning: test ids.

<aside class="margin-note">Test ids</aside>

A **test id** is an identifier given to an element just for the purpose of finding it in a test. The test will still find the element if the element type or unrelated attributes change.

The preferred way to mark an HTML element is a [data attribute](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes). In contrast to element types, `class` or `id` attributes, data attributes do not come with any predefined meaning. Data attributes never clash with each other.

<aside class="margin-note" markdown="1">
  `data-testid`
</aside>

For the purpose of this guide, we use the **`data-testid`** attribute. For example, we mark the increment button in the `CounterComponent` with `data-testid="increment-button"`:

```html
<button (click)="increment()" data-testid="increment-button">+</button>
```

In the test, we use the corresponding attribute selector:

```typescript
const incrementButton = debugElement.query(
  By.css('[data-testid="increment-button"]')
);
```

<aside class="margin-note">Establish a convention</aside>

There is a nuanced discussion around the best way to find elements during testing. Certainly, there are several valid and elaborate approaches. This guide will only present one possible approach that is simple and approachable.

The Angular testing tools are neutral when it comes to DOM querying. They tolerate different approaches. After consideration, you should opt for one specific solution, document it as a [testing convention](../angular-testing-principles/#testing-conventions) and apply it consistently across all tests.

<div class="book-sources" markdown="1">
- [Angular API reference: By.css](https://angular.io/api/platform-browser/By)
</div>

## Triggering event handlers

Now that we have marked and got hold of the increment button, we need to click on it.

It is a common task in tests to simulate user input like clicking, typing in text, moving pointers and pressing keys. From an Angular perspective, user input causes DOM events.

The Component template registers event handlers using the schema `(event)="handler($event)"`. In the test, we need to simulate an event to call these handlers.

<aside class="margin-note">Trigger event handler</aside>

`DebugElement` has a useful method for firing events: `triggerEventHandler`. This method calls all event handlers for a given event type like `click`. As a second parameter, it expects a fake event object that is passed to the handlers:

```typescript
incrementButton.triggerEventHandler('click', {
  /* … Event properties … */
});
```

This example fires a `click` event on the increment button. Since the template contains `(click)="increment()"`, the `increment` method of `CounterComponent` will be called.

<aside class="margin-note">Event object</aside>

The `increment` method does not access the event object. The call is simply `increment()`, not `increment($event)`. Therefore, we do not need to pass a fake event object, we can simply pass `null`:

```typescript
incrementButton.triggerEventHandler('click', null);
```

It is worth noting that `triggerEventHandler` does not dispatch a synthetic DOM event. The effect stays on the `DebugElement` abstraction level and does not touch the native DOM.

<aside class="margin-note">No bubbling</aside>

This is fine as long as the event handler is registered on the element itself. If the event handler is registered on a parent and relies on event bubbling, you need to call `triggerEventHandler` directly on that parent. `triggerEventHandler` does not simulate event bubbling or any other effect a real event might have.

## Expecting text output

We have completed the *Act* phase in which the test clicks on the increment button. In the *Assert* phase, we need to expect that the displayed count changes from “0” to “1”.

In the template, the count is rendered into a `strong` element:

```html
{% raw %}<strong>{{ count }}</strong>{% endraw %}
```

<aside class="margin-note">Find by test id</aside>

In our test, we need to find this element and read its text content. For this purpose, we add a test id:

```html
{% raw %}<strong data-testid="count">{{ count }}</strong>{% endraw %}
```

We can now find the element as usual:

```typescript
const countOutput = debugElement.query(
  By.css('[data-testid="count"]')
);
```

<aside class="margin-note">Text content</aside>

The next step is to read the element’s content. In the DOM, the count is a text node that is a child of `strong`.

Unfortunately, the `DebugElement` does not have a method or property for reading the text content. We need to access the native DOM element that has a convenient `textContent` property.

```typescript
countOutput.nativeElement.textContent
```

Finally, we expect that this string is `"1"` using Jasmine’s `expect`:

```typescript
expect(countOutput.nativeElement.textContent).toBe('1');
```

The `counter.component.spec.ts` now looks like this:

```typescript
/* Incomplete! */
describe('CounterComponent', () => {
  let fixture: ComponentFixture<CounterComponent>;
  let debugElement: DebugElement;

  // Arrange
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CounterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    fixture.detectChanges();
    debugElement = fixture.debugElement;
  });

  it('increments the count', () => {
    // Act
    const incrementButton = debugElement.query(
      By.css('[data-testid="increment-button"]')
    );
    incrementButton.triggerEventHandler('click', null);

    // Assert
    const countOutput = debugElement.query(
      By.css('[data-testid="count"]')
    );
    expect(countOutput.nativeElement.textContent).toBe('1');
  });
});
```

When we run that suite, the spec fails:

```
CounterComponent increments the count FAILED
  Error: Expected '0' to be '1'.
```

What is wrong here? Is the implementation faulty? No, the test just missed something important.

<aside class="margin-note">Manual change detection</aside>

We have mentioned that in the testing environment, Angular does not automatically detect changes in order to update the DOM. Clicking the increment button changes the `count` property of the Component instance. To update the template binding `{% raw %}{{ count }}{% endraw %}`, we need to *trigger the change detection manually*.

```typescript
fixture.detectChanges();
```

The full test suite now looks like this:

```typescript
describe('CounterComponent', () => {
  let fixture: ComponentFixture<CounterComponent>;
  let debugElement: DebugElement;

  // Arrange
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CounterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    fixture.detectChanges();
    debugElement = fixture.debugElement;
  });

  it('increments the count', () => {
    // Act
    const incrementButton = debugElement.query(
      By.css('[data-testid="increment-button"]')
    );
    incrementButton.triggerEventHandler('click', null);
    // Re-render the Component
    fixture.detectChanges();

    // Assert
    const countOutput = debugElement.query(
      By.css('[data-testid="count"]')
    );
    expect(countOutput.nativeElement.textContent).toBe('1');
  });
});
```

Congratulations! We have written our first Component test. It is not complete yet, but it already features a typical workflow. We will make small improvements to the existing code with each spec we add.

<div class="book-sources" markdown="1">
- [CounterComponent: test code](https://github.com/9elements/angular-workshop/blob/main/src/app/components/counter/counter.component.spec.ts)
</div>

## Testing helpers

The next `CounterComponent` feature we need to test is the decrement button. It is very similar to the increment button, so the spec looks almost the same.

First, we add a test id to the decrement button:

```html
<button (click)="decrement()" data-testid="decrement-button">-</button>
```

Then we write the spec:

```typescript
it('decrements the count', () => {
  // Act
  const decrementButton = debugElement.query(
    By.css('[data-testid="decrement-button"]')
  );
  decrementButton.triggerEventHandler('click', null);
  // Re-render the Component
  fixture.detectChanges();

  // Assert
  const countOutput = debugElement.query(
    By.css('[data-testid="count"]')
  );
  expect(countOutput.nativeElement.textContent).toBe('-1');
});
```

There is nothing new here, only the test id, the variable names and the expected output changed.

<aside class="margin-note">Repeating patterns</aside>

Now we have two specs that are almost identical. The code is repetitive and the signal-to-noise ratio is low, meaning there is much code that does little. Let us identify the patterns repeated here:

1. Finding an element by test id
2. Clicking on an element found by test id
3. Expecting a given text content on an element found by test id

These tasks are highly generic and they will appear in almost every Component spec. It is worth writing testing helpers for them.

<aside class="margin-note">Testing helpers</aside>

A **testing helper** is a piece of code that makes writing tests easier. It makes test code more concise and more meaningful. Since a spec should describe the implementation, a readable spec is better than an obscure, convoluted one.

Your testing helpers should cast your [testing conventions](../angular-testing-principles/#testing-conventions) into code. They not only improve the individual test, but make sure all tests use the same patterns and work the same.

A testing helper can be a simple function, but it can also be an abstraction class or a Jasmine extension. For the start, we extract common tasks into plain functions.

<aside class="margin-note">Find by test id</aside>

First, let us write a helper for finding an element by test id. We have used this pattern multiple times:

```typescript
const xyzElement = fixture.debugElement.query(
  By.css('[data-testid="xyz"]')
);
```

We move this code into a reusable function:

```typescript
function findEl<T>(
  fixture: ComponentFixture<T>,
  testId: string
): DebugElement {
  return fixture.debugElement.query(
    By.css(`[data-testid="${testId}"]`)
  );
}
```

This function is self-contained. We need to pass in the Component fixture explicitly. Since `ComponentFixture<T>` requires a type parameter – the wrapped Component type –, `findEl` also has a type parameter called `T`. TypeScript will infer the Component type automatically when you pass a `ComponentFixture`.

<aside class="margin-note">Click</aside>

Second, we write a testing helper that clicks on an element with a given test id. This helper builds on `findEl`.

```typescript
export function click<T>(
  fixture: ComponentFixture<T>,
  testId: string
): void {
  const element = findEl(fixture, testId);
  const event = makeClickEvent(element.nativeElement);
  element.triggerEventHandler('click', event);
}
```

To create a fake click event object, `click` calls another function, `makeClickEvent`.

```typescript
export function makeClickEvent(
  target: EventTarget
): Partial<MouseEvent> {
  return {
    preventDefault(): void {},
    stopPropagation(): void {},
    stopImmediatePropagation(): void {},
    type: 'click',
    target,
    currentTarget: target,
    bubbles: true,
    cancelable: true,
    button: 0
  };
}
```

This function returns a partial [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent) fake object with the most important methods and properties of real click events. It is suitable for clicks on buttons and links when the pointer position and modifier keys do not matter.

<aside class="margin-note">Click means activate</aside>

The `click` testing helper can be used on every element that has a `(click)="…"` event handler. For accessibility, make sure the element can be focussed and activated. This is already the case for buttons (`button` element) and links (`a` elements).

Historically, the `click` event was only triggered by mouse input. Today, it is a generic “activate” event. It is also triggered by touch input (“tap”), keyboard input or voice input.

So in your Component, you do not need to listen for touch or keyboard events separately. In the test, a generic `click` event usually suffices.

<aside class="margin-note">Expect text content</aside>

Third, we write a testing helper that expects a given text content on an element with a given test id.

```typescript
export function expectText<T>(
  fixture: ComponentFixture<T>,
  testId: string,
  text: string,
): void {
  const element = findEl(fixture, testId);
  const actualText = element.nativeElement.textContent;
  expect(actualText).toBe(text);
}
```

Again, this is a simple implementation we will improve later.

Using these helpers, we rewrite our spec:

```typescript
it('decrements the count', () => {
  // Act
  click(fixture, 'decrement-button');
  // Re-render the Component
  fixture.detectChanges();

  // Assert
  expectText(fixture, 'count', '-1');
});
```

That is much better to read and less to write! You can tell what the spec is doing at first glance.

<div class="book-sources" markdown="1">
- [CounterComponent: test code](https://github.com/9elements/angular-workshop/blob/main/src/app/components/counter/counter.component.spec.ts)
- [Element spec helpers: full code](https://github.com/9elements/angular-workshop/blob/main/src/app/spec-helpers/element.spec-helper.ts)
</div>

## Filling out forms

We have tested the increment and decrement button successfully. The remaining user-facing feature we need to test is the reset feature.

In the user interface, there is a reset input field and a reset button. The user enters a new number into the field, then clicks on the button. The Component resets the count to the user-provided number.

<aside class="margin-note">Set field value</aside>

We already know how to click a button, but how do we fill out a form field? Unfortunately, Angular’s testing tools do not provide a solution for filling out forms easily.

The answer depends on the field type and value. The generic answer is: Find the native DOM element and set the `value` property to the new value.

For the reset input, this means:

```typescript
const resetInput = debugElement.query(
  By.css('[data-testid="reset-input"]')
);
resetInput.nativeElement.value = '123';
```

With our testing helper:

```typescript
const resetInputEl = findEl(fixture, 'reset-input').nativeElement;
resetInputEl.value = '123';
```

This fills in the value programmatically.

In `CounterComponent`’s template, the reset input has a *template reference variable*, `#resetInput`:

```html
<input type="number" #resetInput data-testid="reset-input" />
<button (click)="reset(resetInput.value)" data-testid="reset-button">
  Reset
</button>
```

The click handler uses `resetInput` to access the `input` element, reads the `value` and passes it to the `reset` method.

The example already works because the form is very simple. Setting a field’s `value` is not a full simulation of user input and will not work with Template-driven or Reactive Forms yet.

<aside class="margin-note" markdown="1">
  Fake `input` event
</aside>

Angular forms cannot observe `value` changes directly. Instead, Angular listens for an `input` event that the browser fires when a field value changes.

For **compatibility with Template-driven and Reactive Forms**, we need to dispatch a fake `input` event. Such events are also called *synthetic events*.

In newer browsers, we create a fake `input` event with `new Event('input')`. To dispatch the event, we use the `dispatchEvent` method of the target element.

```typescript
const resetInputEl = findEl(fixture, 'reset-input').nativeElement;
resetInputEl.value = '123';
resetInputEl.dispatchEvent(new Event('input'));
```

If you need to run your tests in legacy Internet Explorer, a bit more code is necessary. Internet Explorer does not support `new Event('…')`, but the `document.createEvent` method:

```typescript
const event = document.createEvent('Event');
event.initEvent('input', true, false);
resetInputEl.dispatchEvent(event);
```

The full spec for the reset feature then looks like this:

```typescript
it('resets the count', () => {
  const newCount = '123';

  // Act
  const resetInputEl = findEl(fixture, 'reset-input').nativeElement;
  // Set field value
  resetInputEl.value = newCount;
  // Dispatch input event
  const event = document.createEvent('Event');
  event.initEvent('input', true, false);
  resetInputEl.dispatchEvent(event);

  // Click on reset button
  click(fixture, 'reset-button');
  // Re-render the Component
  fixture.detectChanges();

  // Assert
  expectText(fixture, 'count', newCount);
});
```

Filling out forms is a common task in tests, so it makes sense to extract the code and put it into a helper.

<aside class="margin-note">Helper functions</aside>

The helper function `setFieldValue` takes a Component fixture, a test id and a string value. It finds the corresponding element using `findEl`. Using another helper, `setFieldElementValue`, it sets the `value` and dispatches an `input` event.

```typescript
export function setFieldValue<T>(
  fixture: ComponentFixture<T>,
  testId: string,
  value: string,
): void {
  setFieldElementValue(
    findEl(fixture, testId).nativeElement,
    value
  );
}
```

You can find the full source code of the involved helper functions in [element.spec-helper.ts](https://github.com/9elements/angular-workshop/blob/main/src/app/spec-helpers/element.spec-helper.ts).

Using the newly created `setFieldValue` helper, we can simplify the spec:

```typescript
it('resets the count', () => {
  const newCount = '123';

  // Act
  setFieldValue(fixture, 'reset-input', newCount);
  click(fixture, 'reset-button');
  fixture.detectChanges();

  // Assert
  expectText(fixture, 'count', newCount);
});
```

While the reset feature is simple, this is how to test most form logic. Later, we will learn how to [test complex forms](../testing-complex-forms/#testing-complex-forms).

<aside class="margin-note">Invalid input</aside>

The `CounterComponent` checks the input value before it resets the count. If the value is not a number, clicking the reset button does nothing.

We need to cover this behavior with another spec:

```typescript
it('does not reset if the value is not a number', () => {
  const value = 'not a number';

  // Act
  setFieldValue(fixture, 'reset-input', value);
  click(fixture, 'reset-button');
  fixture.detectChanges();

  // Assert
  expectText(fixture, 'count', startCount);
});
```

The small difference in this spec is that we set the field value to “not a number”, a string that cannot be parsed as a number, and expect the count to remain unchanged.

This is it! We have tested the reset form with both valid and invalid input.

<div class="book-sources" markdown="1">
- [CounterComponent: test code](https://github.com/9elements/angular-workshop/blob/main/src/app/components/counter/counter.component.spec.ts)
- [Element spec helpers: full code](https://github.com/9elements/angular-workshop/blob/main/src/app/spec-helpers/element.spec-helper.ts)
</div>

## Testing Inputs

`CounterComponent` has an Input `startCount` that sets the initial count. We need to test that the counter handles the Input properly.

For example, if we set `startCount` to `123`, the rendered count needs to be `123` as well. If the Input is empty, the rendered count needs to be `0`, the default value.

<aside class="margin-note">Set Input value</aside>

An Input is a special property of the Component instance. We can set this property in the *Arrange* phase.

```typescript
const component = fixture.componentInstance;
component.startCount = 10;
```

It is a good practice not to change an Input value within a Component. An Input property should always reflect the data passed in by the parent Component.

<aside class="margin-note">Input vs. Component state</aside>

That is why `CounterComponent` has a public Input named `startCount` as well as an internal property named `count`. When the user clicks the increment or decrement buttons, `count` is changed, but `startCount` remains unchanged.

Whenever the `startCount` Input changes, `count` needs to be set to `startCount`. The safe place to do that is the `ngOnChanges` lifecycle method:

```typescript
public ngOnChanges(): void {
  this.count = this.startCount;
}
```

`ngOnChanges` is called whenever a “data-bound property” changes, including Inputs.

Let us write a test for the `startCount` Input. We set the Input in the `beforeEach` block, before calling `detectChanges`. The spec itself checks that the correct count is rendered.

```typescript
/* Incomplete! */
beforeEach(async () => {
  /* … */

  // Set the Input
  component.startCount = startCount;
  fixture.detectChanges();
});

it('shows the start count', () => {
  expectText(fixture, 'count', String(count));
});
```

When we run this spec, we find that it fails:

```
CounterComponent > shows the start count
  Expected '0' to be '123'.
```

<aside class="margin-note" markdown="1">
  `ngOnChanges`
</aside>

What is wrong here? Did we forget to call `detectChanges` again? No, but we forgot to call `ngOnChanges`!

In the testing environment, `ngOnChanges` is not called automatically. We have to call it manually after setting the Input.

Here is the corrected example:

```typescript
describe('CounterComponent', () => {
  let component: CounterComponent;
  let fixture: ComponentFixture<CounterComponent>;

  const startCount = 123;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CounterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    component.startCount = startCount;
    // Call ngOnChanges, then re-render
    component.ngOnChanges();
    fixture.detectChanges();
  });

  /* … */

  it('shows the start count', () => {
    expectText(fixture, 'count', String(startCount));
  });
});
```

The `CounterComponent` expects a `number` Input and renders it into the DOM. When reading text from the DOM, we always deal with strings. That is why we pass in a number `123` but expect to find the string `'123'`.

<div class="book-sources" markdown="1">
- [CounterComponent: test code](https://github.com/9elements/angular-workshop/blob/main/src/app/components/counter/counter.component.spec.ts)
</div>

## Testing Outputs

While Inputs pass data from parent to child, Outputs send data from child to parent. In combination, a Component can perform a specific operation just with the required data.

For example, a Component may render a form so the user can edit or review the data. Once completed, the Component emits the data as an Output.

Outputs are not a user-facing feature, but a vital part of the public Component API. Technically, Outputs are Component instance properties. A unit test must inspect the Outputs thoroughly to proof that the Component plays well with other Components.

The `CounterComponent` has an output named `countChange`. Whenever the count changes, the `countChange` Output emits the new value.

```typescript
export class CounterComponent implements OnChanges {
  /* … */
  @Output()
  public countChange = new EventEmitter<number>();
  /* … */
}
```

<aside class="margin-note">Subscribe to Observable</aside>

`EventEmitter` is a subclass of RxJS `Subject`, which itself extends RxJS `Observable`. The Component uses the `emit` method to publish new values. The parent Component uses the `subscribe` method to listen for emitted values. In the testing environment, we will do the same.

Let us write a spec for the `countChange` Output!

```typescript
it('emits countChange events on increment', () => {
  /* … */
});
```

Within the spec, we access the Output via `fixture.componentInstance.countChange`. In the *Arrange* phase, we subscribe to the `EventEmitter`.

```typescript
it('emits countChange events on increment', () => {
  // Arrange
  component.countChange.subscribe((count) => {
    /* … */
  });
});
```

We need to verify that the observer function is called with the right value when the increment button is clicked. In the *Act* phase, we click on the button using our helper function:

```typescript
it('emits countChange events on increment', () => {
  // Arrange
  component.countChange.subscribe((count) => {
    /* … */
  });

  // Act
  click(fixture, 'increment-button');
});
```

<aside class="margin-note">Change variable value</aside>

In the *Assert* phase, we expect that `count` has the correct value. The easiest way is to declare a variable in the spec scope. Let us name it `actualCount`. Initially, it is `undefined`. The observer function sets a value – or not, if it is never called.

```typescript
it('emits countChange events on increment', () => {
  // Arrange
  let actualCount: number | undefined;
  component.countChange.subscribe((count: number) => {
    actualCount = count;
  });

  // Act
  click(fixture, 'increment-button');

  // Assert
  expect(actualCount).toBe(1);
});
```

<aside class="margin-note">Expect changed value</aside>

The click on the button emits the count and calls the observer function synchronously. That is why the next line of code can expect that `actualCount` has been changed.

You might wonder why we did not put the `expect` call in the observer function:

```typescript
/* Not recommended! */
it('emits countChange events on increment', () => {
  // Arrange
  component.countChange.subscribe((count: number) => {
    // Assert
    expect(count).toBe(1);
  });

  // Act
  click(fixture, 'increment-button');
});
```

<aside class="margin-note">Always run expectation</aside>

This works as well. But if the feature under test is broken and the Output does not emit, `expect` is never called.

Per default, Jasmine warns you that the spec has no expectations but treats the spec as successful (see [Configuring Karma and Jasmine](../angular-testing-principles/#configuring-karma-and-jasmine)). We want the spec to fail explicitly in this case, so we make sure the expectation is always run.

Now we have verified that `countChange` emits when the increment button is clicked. We also need to proof that the Output emits on decrement and reset. We can achieve that by adding two more specs that copy the existing spec:

```typescript
it('emits countChange events on decrement', () => {
  // Arrange
  let actualCount: number | undefined;
  component.countChange.subscribe((count: number) => {
    actualCount = count;
  });

  // Act
  click(fixture, 'decrement-button');

  // Assert
  expect(actualCount).toBe(-1);
});

it('emits countChange events on reset', () => {
  const newCount = '123';

  // Arrange
  let actualCount: number | undefined;
  component.countChange.subscribe((count: number) => {
    actualCount = count;
  });

  // Act
  setFieldValue(fixture, 'reset-input', newCount);
  click(fixture, 'reset-button');

  // Assert
  expect(actualCount).toBe(newCount);
});
```

<div class="book-sources" markdown="1">
- [CounterComponent: test code](https://github.com/9elements/angular-workshop/blob/main/src/app/components/counter/counter.component.spec.ts)
</div>

## Repetitive Component specs

Testing the `countChange` Output with three specs works fine, but the code is highly repetitive. A testing helper can reduce the repetition. Experts disagree on whether repetitive testing code is a problem at all.

On the one hand, it is hard to grasp the essence of repetitive specs. Testing helpers form a custom language for expressing testing instructions clearly and briefly. For example, if your specs find DOM elements via test ids, a testing helper establishes the convention and hides the implementation details.

On the other hand, abstractions like helper functions make tests more complex and therefore harder to understand. A developer reading the specs needs to get familiar with the testing helpers first. After all, tests should be more readable than the implementation code.

<aside class="margin-note">Duplication vs. abstraction</aside>

There is a controversial debate in software development regarding repetition and the value of abstractions. [As Sandi Metz famously stated](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction), “duplication is far cheaper than the wrong abstraction”.

This is especially true when writing specs. You should try to eliminate duplication and boilerplate code with `beforeEach`/`beforeAll`, simple helper functions and even testing libraries. But do not try to apply your optimization habits and skills to test code.

A test is supposed to reproduce all relevant logical cases. Finding a proper abstraction for all these diverse, sometimes mutually exclusive cases is often futile.

<aside class="margin-note">Carefully reduce repetition</aside>

Your mileage may vary on this question. For completeness, let us discuss how to reduce the repetition in the `countChange` Output specs.

An Output is an `EventEmitter`, that is a fully-functional RxJS `Observable`. This allows us to transform the `Observable` as we please. Specifically, we can click all three buttons and then expect that the `countChange` Output has emitted three values.

```typescript
it('emits countChange events', () => {
  // Arrange
  const newCount = 123;

  // Capture all emitted values in an array
  let actualCounts: number[] | undefined;

  // Transform the Observable, then subscribe
  component.countChange.pipe(
    // Close the Observable after three values
    take(3),
    // Collect all values in an array
    toArray()
  ).subscribe((counts) => {
    actualCounts = counts;
  });

  // Act
  click(fixture, 'increment-button');
  click(fixture, 'decrement-button');
  setFieldValue(fixture, 'reset-input', String(newCount));
  click(fixture, 'reset-button');

  // Assert
  expect(actualCounts).toEqual([1, 0, newCount]);
});
```

This example requires some RxJS knowledge. We are going to encounter RxJS Observables again and again when testing Angular applications. If you do not understand the example above, that is totally fine. It is just an optional way to merge three specs into one.

<div class="book-sources" markdown="1">
- [CounterComponent: test code](https://github.com/9elements/angular-workshop/blob/main/src/app/components/counter/counter.component.spec.ts)
</div>

## Black vs. white box Component testing

Component tests are most meaningful if they closely mimic how the user interacts with the Component. The tests we have written apply this principle. We have worked directly with the DOM to read text, click on buttons and fill out form fields because this is what the user does.

These tests are black box tests. We have already talked about [black box vs. white box testing](../testing-principles/#black-box-vs-white-box-testing) in theory. Both are valid testing methods. As stated, this guide advises to use black box testing first and foremost.

A common technique to enforce black box testing is to mark internal methods as `private` so they cannot be called in the test. The test should only inspect the documented, public API.

<aside class="margin-note" markdown="1">
  Internal yet `public`
</aside>

In Angular Components, the difference between external and internal properties and methods does not coincide with their TypeScript visibility (`public` vs. `private`). Properties and methods need to be `public` so that the template is able to access them.

This makes sense for Input and Output properties. They need to be read and written from the outside, from your test. However, internal properties and methods exist that are `public` only for the template.

For example, the `CounterComponent` has an Input `startCount` and an Output `countChange`. Both are `public`:

```typescript
@Input()
public startCount = 0;

@Output()
public countChange = new EventEmitter<number>();
```

They form the public API. However, there are several more properties and methods that are `public`:

```typescript
public count = 0;
public increment(): void { /* … */ }
public decrement(): void { /* … */ }
public reset(newCount: string): void { /* … */ }
```

<aside class="margin-note" markdown="1">
  `public` for the template
</aside>

These properties and methods are internal, they are used only within the Component. Yet they need to be `public` so the template may access them. Angular compiles templates into TypeScript code, and TypeScript ensures that the template code only accesses public properties and methods.

In our `CounterComponent` black box test, we increment the count by clicking on the “+” button. In contrast, many Angular testing tutorials conduct Component white box tests. They call the `increment` method directly:

```typescript
/* Not recommended! */
describe('CounterComponent', () => {
  /* … */
  it('increments the count', () => {
    component.increment();
    fixture.detectChanged();
    expectText(fixture, 'count', '1');
  });
});
```

This white box test reaches into the Component to access an internal, yet `public` method. This is sometimes valuable, but most of the time it is misused.

<aside class="margin-note">Inputs, Outputs, DOM</aside>

As we have learned, a Component test is meaningful if it interacts with the Component via Inputs, Outputs and the rendered DOM. If the Component test calls internal methods or accesses internal properties instead, it often misses important template logic and event handling.

The white box spec above calls the `increment` method, but does not test the corresponding template code, the increment button:

```html
<button (click)="increment()" data-testid="increment-button">+</button>
```

If we remove the increment button from the template entirely, the feature is obviously broken. But the white box test does not fail.

<aside class="margin-note">Start with black box tests</aside>

When applied to Angular Components, black box testing is more intuitive and easier for beginners. When writing a black box test, ask what the Component does for the user and for the parent Component. Then imitate the usage in your test.

A white box test does not examine the Component strictly from the DOM perspective. Thereby, it runs the risk of missing crucial Component behavior. It gives the illusion that all code is tested.

That being said, white box testing is a viable advanced technique. Experienced testers can write efficient white box specs that still test out all Component features and cover all code.

The following table shows which properties and methods of an Angular Component you should access or not in a black box test.

<aside class="margin-note">Recommendation</aside>

<div class="wide-table-wrapper">
<table class="wide-table">
<caption>Black box testing an Angular Component</caption>
<tr>
<th scope="col">Class member</th>
<th scope="col">Access from test</th>
</tr>
<tr>
<th scope="row"><code>@Input</code> properties</th>
<td>Yes (write)</td>
</tr>
<tr>
<th scope="row"><code>@Output</code> properties</th>
<td>Yes (subscribe)</td>
</tr>
<tr>
<th scope="row">Lifecycle methods</th>
<td>Avoid except for <code>ngOnChanges</code></td>
</tr>
<tr>
<th scope="row">Other public methods</th>
<td>Avoid</td>
</tr>
<tr>
<th scope="row">Private properties<br>and methods</th>
<td>No access</td>
</tr>
</table>
</div>

<p id="next-chapter-link"><a href="../testing-components-with-children/#testing-components-with-children">Testing Components with children</a></p>
