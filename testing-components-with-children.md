---
layout: chapter
title: Testing Components with children
description: How to write unit and integration tests for Components with children
---

# Testing Components with children

<aside class="learning-objectives" markdown="1">
Learning objectives

- Rendering a Component with or without its children
- Checking that the parent and its children are wired up correctly
- Replacing child Components with fakes
- Using the ng-mocks library to fake dependencies
</aside>

<aside class="margin-note">Presentational Components</aside>

So far, we have tested an independent Component that renders plain HTML elements, but no child Components. Such low-level Components are the workhorses of an Angular application.

- They directly render what the user sees and interacts with.
- They are often highly generic and reusable.
- They are controlled through Inputs and report back using Outputs.
- They have little to none dependencies.
- They are easy to reason about and therefore easy to test.
- The preferred way of testing them is a unit test.

These Components are called **presentational Components** since they directly present a part of the user interface using HTML and CSS. Presentational Components need to be combined and wired to form a working user interface.

<aside class="margin-note">Container Components</aside>

This is the duty of **container Components**. These high-level Components bring multiple low-level Components together. They pull data from different sources, like Services and state managers, and distribute it to their children.

Container Components have several types of dependencies. They depend on the nested child Components, but also Injectables. These are classes, functions, objects, etc. provided via dependency injection, like Services. These dependencies make testing container Components complicated.

<aside class="margin-note">Shallow vs. deep rendering</aside>

There are two fundamental ways to test Components with children:

- A unit test using **shallow rendering**. The child Components are not rendered.
- An integration test using **deep rendering**. The child Components are rendered.

Again, both are valid approaches we are going to discuss.

## Shallow vs. deep rendering

In the counter example application, the [`HomeComponent`](https://github.com/9elements/angular-workshop/blob/main/src/app/components/home/home.component.ts) contains `CounterComponent`s, `ServiceCounterComponent`s and `NgRxCounterComponent`s.

<button class="load-iframe">
See the HomeComponent in action
</button>

<script type="text/x-template">
<p class="responsive-iframe">
<iframe src="https://9elements.github.io/angular-workshop/" class="responsive-iframe__iframe"></iframe>
</p>
</script>

From the [template](https://github.com/9elements/angular-workshop/blob/main/src/app/components/home/home.component.html):

```html
<app-counter
  [startCount]="5"
  (countChange)="handleCountChange($event)"
></app-counter>
<!-- … -->
<app-service-counter></app-service-counter>
<!-- … -->
<app-ngrx-counter></app-ngrx-counter>
```

These custom `app-*` elements end up in the DOM tree. They become the *host elements* of the child Components.

<aside class="margin-note">Check wiring only</aside>

A **unit test of `HomeComponent`** does not render these children. The host elements are rendered, but they remain empty. You might wonder, what is the point of such a test? What does it do after all?

From `HomeComponent`’s perspective, the inner workings of its children are not relevant. We need to test that the template contains the children. Also, we need to check that `HomeComponent` and its children are wired up correctly using Inputs and Outputs.

In particular, the `HomeComponent` unit test checks that an `app-counter` element is present, that the `startCount` Input is passed correctly and that `HomeComponent` handles the `countChange` event. The same is done for the other children, `app-service-counter` and `app-ngrx-counter`.

<aside class="margin-note">Render children</aside>

An **integration test of `HomeComponent`** renders the child Components. The host elements are filled with the output of `CounterComponent`, `ServiceCounterComponent` and `NgRxCounterComponent`, respectively. This integration test is actually testing all four Components.

<aside class="margin-note">Test cooperation</aside>

We need to decide the level of detail for testing the nested Components. If separate unit tests for them exist, we do not need to click on each respective increment button. After all, the integration test needs to prove that the four Component work together, without going into the child Component details.

<div class="book-sources" markdown="1">
- [HomeComponent: implementation and test code](https://github.com/9elements/angular-workshop/tree/main/src/app/components/home)
</div>

## Unit test

Let us write a unit test for `HomeComponent` first. The setup looks familiar to the `CounterComponent` test suite. We are using `TestBed` to configure a testing Module and to render the Component under test.

```typescript
describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders without errors', () => {
    expect(component).toBeTruthy();
  });
});
```

<aside class="margin-note">Smoke test</aside>

This suite has one spec that acts as a *smoke test*. It checks the presence of a Component instance. It does not assert anything specific about the Component behavior yet. It merely proves that the Component renders without errors.

If the smoke test fails, you know that something is wrong with the testing setup.

<aside class="margin-note">Unknown custom elements</aside>

From Angular 9 on, the spec passes but produces a bunch of warnings on the shell:

`'app-counter' is not a known element:`<br>
`1. If 'app-counter' is an Angular component, then verify that it is part of this module.`<br>
`2. If 'app-counter' is a Web Component then add 'CUSTOM_ELEMENTS_SCHEMA' to the '@NgModule.schemas' of this component to suppress this message.`

We get the same warning regarding `app-service-counter` and `app-ngrx-counter`. Another warning reads:

`Can't bind to 'startCount' since it isn't a known property of 'app-counter'.`

What do these warnings mean? Angular does not recognize the custom elements `app-counter`, `app-service-counter` and `app-ngrx-counter` because we have not declared Components that match these selectors. The warning points at two solutions:

1. Either declare the child Components in the testing Module. **This turns the test into an integration test.**
2. Or tell Angular to ignore the unknown elements. **This turns the test into a unit test.**

<aside class="margin-note">Ignore child elements</aside>

Since we plan to write a unit test, we opt for the second.

When configuring the testing Module, we can specify `schemas` to tell Angular how to deal with elements that are not handled by Directives or Components.

The warning suggests `CUSTOM_ELEMENTS_SCHEMA`, but the elements in question are not Web Components. We want Angular to simply ignore the elements. Therefore we use the `NO_ERRORS_SCHEMA`, “a schema that allows any property on any element”.

```typescript
await TestBed.configureTestingModule({
  declarations: [HomeComponent],
  schemas: [NO_ERRORS_SCHEMA],
}).compileComponents();
```

With this addition, our smoke test passes.

Now let us write a more meaningful spec! We start with the nested `app-counter`. This is the code we need to cover:

```html
<app-counter
  [startCount]="5"
  (countChange)="handleCountChange($event)"
></app-counter>
```

<aside class="margin-note">Child presence</aside>

First of all, we need to test the presence of `app-counter`, the independent counter. We create a new spec for that purpose:

```typescript
it('renders an independent counter', () => {
  /* … */
});
```

To verify that an `app-counter` element exists in the DOM, we use the familiar `query` method of the topmost `DebugElement`.

```typescript
const { debugElement } = fixture;
const counter = debugElement.query(By.css('app-counter'));
```

This code uses the `app-counter` type selector to find the element. You might wonder, why not use a test id and the `findEl` helper?

<aside class="margin-note">Find by element type</aside>

In this rare occasion, we need to enforce the element `app-counter` because this is `CounterComponent`’s selector.

Using a test id makes the element type arbitrary. This makes tests more robust in other case. When testing the existence of child Components though, it is the element type that invokes the child.

Our spec still lacks an expectation. The query method returns a `DebugElement` or `null`. We simply expect the return value to be truthy:

```typescript
it('renders an independent counter', () => {
  const { debugElement } = fixture;
  const counter = debugElement.query(By.css('app-counter'));
  expect(counter).toBeTruthy();
});
```

Finding a child Component is a common task. Such repeating patterns are good candidates for testing helpers. Not because it is much code, but because the code has a specific meaning we would like to convey.

`debugElement.query(By.css('app-counter'))` is not particularly descriptive. The reader has to think for a moment to realize that the code tries to find a nested Component.

<aside class="margin-note" markdown="1">
  `findComponent`
</aside>

So let us introduce a helper function named `findComponent`.

```typescript
export function findComponent<T>(
  fixture: ComponentFixture<T>,
  selector: string,
): DebugElement {
  return fixture.debugElement.query(By.css(selector));
}
```

Our spec now looks like this:

```typescript
it('renders an independent counter', () => {
  const counter = findComponent(fixture, 'app-counter');
  expect(counter).toBeTruthy();
});
```

<aside class="margin-note">Check Inputs</aside>

The next feature we need to test is the `startCount` Input. In particular, the property binding `[startCount]="5"` in `HomeComponent`’s template. Let us create a new spec:

```typescript
it('passes a start count', () => {
  const counter = findComponent(fixture, 'app-counter');
  /* … */
});
```

<aside class="margin-note" markdown="1">
  `properties`
</aside>

How do we read the Input value? Each `DebugElement` has a `properties` object that contains DOM properties together with its values. In addition, it contains certain property bindings. (The type is `{ [key: string]: any }`).

In a unit test with shallow rendering, `properties` contains the Inputs of a child Component. First, we find `app-counter` to obtain the corresponding `DebugElement`. Then we check the Input value, `properties.startCount`.

```typescript
it('passes a start count', () => {
  const counter = findComponent(fixture, 'app-counter');
  expect(counter.properties.startCount).toBe(5);
});
```

That was quite easy! Last but not least, we need to test the Output.

<aside class="margin-note">Output event</aside>

From `HomeComponent`’s perspective, reacting to the Output is like handling an event on the `app-counter` element. The template uses the familiar `(event)="handler($event)"` syntax:

```html
<app-counter
  [startCount]="5"
  (countChange)="handleCountChange($event)"
></app-counter>
```

The `handleCountChange` method is defined in the Component class. It simply calls `console.log` to prove that the child-parent communication worked:

```typescript
export class HomeComponent {
  public handleCountChange(count: number): void {
    console.log('countChange event from CounterComponent', count);
  }
}
```

Let us add a new spec for testing the Output:

```typescript
it('listens for count changes', () => {
  /* … */
});
```

The spec needs to do two things:

1. *Act:* Find the child Component and let the `countChange` Output emit a value.
2. *Assert:* Check that `console.log` has been called.

From the parent’s viewpoint, `countChange` is simply an event. Shallow rendering means there is no `CounterComponent` instance and no `EventEmitter` named `countChange`. Angular only sees an element, `app-counter`, with an event handler, `(countChange)="handleCountChange($event)"`.

<aside class="margin-note">Simulate Output</aside>

In this setup, we can simulate the Output using the known `triggerEventHandler` method.

```typescript
it('listens for count changes', () => {
  /* … */
  const counter = findComponent(fixture, 'app-counter');
  const count = 5;
  counter.triggerEventHandler('countChange', 5);
  /* … */
});
```

The spec finds the `app-counter` element and triggers the `countChange` event handler.

The second `triggerEventHandler` parameter, `5`, is not an event object as we know from DOM events like `click`. It is a value that the Output would emit. The `countChange` Output has the type `EventEmitter<number>`, so we use the fixed number `5` for testing purposes.

<aside class="margin-note">Output effect</aside>

Under the hood, `triggerEventHandler` runs `handleCountChange($event)` with `$event` being `5`. `handleCountChange` calls `console.log`. This is the observable effect we need to test.

How do we verify that `console.log` has been called? We can [spy on existing methods](../faking-dependencies/#spying-on-existing-methods) with Jasmine’s `spyOn`.

```typescript
spyOn(console, 'log');
```

This overwrites `console.log` with a spy for the duration of the test run. We need to set up the spy in the *Arrange* phase, at the beginning of our spec.

```typescript
it('listens for count changes', () => {
  spyOn(console, 'log');
  const counter = findComponent(fixture, 'app-counter');
  const count = 5;
  counter.triggerEventHandler('countChange', count);
  /* … */
});
```

In the *Assert* phase, we expect that the spy has been called with a certain text and the number the Output has emitted.

```typescript
it('listens for count changes', () => {
  spyOn(console, 'log');
  const counter = findComponent(fixture, 'app-counter');
  const count = 5;
  counter.triggerEventHandler('countChange', count);
  expect(console.log).toHaveBeenCalledWith(
    'countChange event from CounterComponent',
    count,
  );
});
```

So much for testing the `CounterComponent` child. The `HomeComponent` also renders a `ServiceCounterComponent` and an `NgRxCounterComponent` like this:

```html
<app-service-counter></app-service-counter>
<!-- … -->
<app-ngrx-counter></app-ngrx-counter>
```

<aside class="margin-note">Child presence</aside>

Since they do not have Inputs or Outputs, we merely need to test whether they are mentioned in the template. We add two additional specs that check the presence of these `app-service-counter` and `app-ngrx-counter` elements, respectively.

```typescript
it('renders a service counter', () => {
  const serviceCounter = findComponent(fixture, 'app-service-counter');
  expect(serviceCounter).toBeTruthy();
});

it('renders a NgRx counter', () => {
  const ngrxCounter = findComponent(fixture, 'app-ngrx-counter');
  expect(ngrxCounter).toBeTruthy();
});
```

This is it! We have written a unit test with shallow rendering that proves that `HomeComponent` correctly embeds several child Components.

Note that this is one possible testing method. As always, it has pros and cons. Compared with a full integration test, there is little setup. The specs can use Angular’s `DebugElement` abstraction to test presence as well as Inputs and Outputs.

<aside class="margin-note">Unit test confidence</aside>

However, the unit test gives little confidence that `HomeComponent` works in production. We have instructed Angular to ignore the elements `app-counter`, `app-service-counter` and `app-ngrx-counter`.

What if `HomeComponent` uses a wrong element name and the test copies that error? The test would pass incorrectly. We need to render the involved Components together to spot the error.

<div class="book-sources" markdown="1">
- [HomeComponent: implementation and test code](https://github.com/9elements/angular-workshop/blob/main/src/app/components/home)
- [Element spec helpers: full code](https://github.com/9elements/angular-workshop/blob/main/src/app/spec-helpers/element.spec-helper.ts)
</div>

## Faking a child Component

There is a middle ground between a naive unit test and an integration test. Instead of working with empty custom elements, we can render *fake* child Components.

A fake Component has the same selector, Inputs and Outputs, but has no dependencies and does not have to render anything. When testing a Component with children, we substitute the children for fake Components.

Let us reduce the `CounterComponent` to an empty shell that offers the same public API:

```typescript
@Component({
  selector: 'app-counter',
  template: '',
})
class FakeCounterComponent implements Partial<CounterComponent> {
  @Input()
  public startCount = 0;

  @Output()
  public countChange = new EventEmitter<number>();
}
```

This fake Component lacks a template and any logic, but has the same selector, Input and Output.

<aside class="margin-note">Same public API</aside>

Remember the [rules for faking dependencies](../faking-dependencies/#faking-dependencies)? We need to make sure the fake resembles the original. `FakeCounterComponent implements Partial<CounterComponent>` requires the class to implement a subset of `CounterComponent`. TypeScript enforces that the given properties and methods have the same types as in the original class.

<aside class="margin-note">Declare fake Component</aside>

In our test suite, we place the `FakeCounterComponent` before the `describe` block. The next step is to add the Component to the testing Module:

```typescript
TestBed.configureTestingModule({
  declarations: [HomeComponent, FakeCounterComponent],
  schemas: [NO_ERRORS_SCHEMA],
}).compileComponents();
```

When Angular encounters an `app-counter` element, it instantiates and mounts a `FakeCounterComponent`. The element stays empty since the fake template is empty as well. The `startCount` Input property is set and the parent `HomeComponent` subscribes to the `countChange` Output.

We need to adapt the test suite now that child Component are rendered. Instead of searching for an `app-counter` element and inspecting its properties, we explicitly search for a `FakeCounterComponent` instance.

So far, we have used `DebugElement`’s `query` method to find nested elements. For example:

```typescript
const element = fixture.debugElement.query(By.css('…'));
```

Our helpers `findEl` and `findComponent` are using this pattern as well.

<aside class="margin-note">Find by Directive</aside>

Now we want to find a nested Component. We can use `query` together with the `By.directive` predicate function:

```typescript
const counterEl = fixture.debugElement.query(
  By.directive(FakeCounterComponent)
);
```

`By.directive` finds all kinds of Directives. A Component is a kind of Directive.

`query` returns a `DebugElement` or `null` in case no match was found. As we have learned, a `DebugElement` always wraps a native DOM element. When we query for `FakeCounterComponent`, we get a `DebugElement` that wraps the `app-counter` element – just as `By.css('app-counter')` would return.

<aside class="margin-note">Child Component instance</aside>

The difference is that we can now access the rendered `FakeCounterComponent` via the `componentInstance` property:

```typescript
const counterEl = fixture.debugElement.query(
  By.directive(FakeCounterComponent)
);
const counter: CounterComponent = counterEl.componentInstance;
```

Angular does not know the type of the Component, `componentInstance` has the type `any`. So we add an explicit type annotation.

<aside class="margin-note">Child presence</aside>

Having access to the child Component instance, we can make expectations against it. First of all, we verify the presence.

```typescript
it('renders an independent counter', () => {
  const counterEl = fixture.debugElement.query(
    By.directive(FakeCounterComponent)
  );
  const counter: CounterComponent = counterEl.componentInstance;

  expect(counter).toBeTruthy();
});
```

This is a smoke test that fails early if no instance of `FakeCounterComponent` was found. `query` would return `null` and `counterEl.componentInstance` would fail with a `TypeError: counterEl is null`.

<aside class="margin-note">Check Inputs</aside>

The second spec checks the Input. An Input is a property of the Component instance, so `counter.startCount` gives us the value of the `startCount` Input.

```typescript
it('passes a start count', () => {
  const counterEl = fixture.debugElement.query(
    By.directive(FakeCounterComponent)
  );
  const counter: CounterComponent = counterEl.componentInstance;

  expect(counter.startCount).toBe(5);
});
```

The third spec checks the Output handling: If the counter emits a value, the `HomeComponent` passes it to `console.log`.

<aside class="margin-note">Emit Output</aside>

As mentioned earlier, an Output is an `EventEmitter` property on the Component instance. Previously, we have simulated an Output event using the `triggerEventHandler` abstraction. Now we can access the Output directly and call its `emit` method, just like the code in the child Component does.

```typescript
it('listens for count changes', () => {
  const counterEl = fixture.debugElement.query(
    By.directive(FakeCounterComponent)
  );
  const counter: CounterComponent = counterEl.componentInstance;

  spyOn(console, 'log');
  const count = 5;
  counter.countChange.emit(5);
  expect(console.log).toHaveBeenCalledWith(
    'countChange event from CounterComponent',
    count,
  );
});
```

We are done! Here is the `HomeComponent` test suite that vets the `CounterComponent` child. To minimize repetition and noise, we move the query part into the `beforeEach` block.

```typescript
@Component({
  selector: 'app-counter',
  template: '',
})
class FakeCounterComponent implements Partial<CounterComponent> {
  @Input()
  public startCount = 0;

  @Output()
  public countChange = new EventEmitter<number>();
}

describe('HomeComponent (faking a child Component)', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let counter: FakeCounterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeComponent, FakeCounterComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const counterEl = fixture.debugElement.query(
      By.directive(FakeCounterComponent)
    );
    counter = counterEl.componentInstance;
  });

  it('renders an independent counter', () => {
    expect(counter).toBeTruthy();
  });

  it('passes a start count', () => {
    expect(counter.startCount).toBe(5);
  });

  it('listens for count changes', () => {
    spyOn(console, 'log');
    const count = 5;
    counter.countChange.emit(count);
    expect(console.log).toHaveBeenCalledWith(
      'countChange event from CounterComponent',
      count,
    );
  });
});
```

Let us recap what we have gained with this type of testing the `HomeComponent`.

We have replaced a Component dependency with a fake that behaves the same, as far as `HomeComponent` is concerned. The fake child is rendered, but the template may be empty.

The original child Component, `CounterComponent`, is imported only to create the derived fake Component. Our test remains a fast and short unit test.

<aside class="margin-note">Advantages</aside>

Instead of searching for an element named `app-counter`, we search for a Component instance. This is more robust. The presence of the host element is a good indicator, but it is more relevant that a Component has been rendered into this element.

Working with the Component instance is more intuitive than working with the `DebugElement` abstraction. We can read Component properties to learn about Inputs and Outputs. Basic JavaScript and Angular knowledge suffices to write specs against such an instance.

<aside class="margin-note">Manual faking drawbacks</aside>

Our simple approach to faking a child Component has its flaws. We have created the fake manually. This is tedious and time-consuming, but also risky. The fake is only partly tied to the original.

For example, if the original changes its selector `app-counter`, the test should fail and remind us to adapt the template. Instead, it passes incorrectly since we did not inherit the Component metadata, `{ selector: 'app-counter', … }`, but duplicated it in the test.

We are going to address these shortcomings in the next chapter.

<div class="book-sources" markdown="1">
- [HomeComponent spec that fakes a child Component](https://github.com/9elements/angular-workshop/blob/main/src/app/components/home/home.component.fake-child.spec.ts)
</div>

## Faking a child Component with ng-mocks

We have manually created a Component fake. This is an important exercise to understand how faking Components works, but it does not produce a robust, versatile fake. In this guide, we cannot discuss all necessary bits and pieces of creating airtight fake Components.

Instead, we will use a mature solution: [ng-mocks](https://github.com/help-me-mom/ng-mocks) is a feature-rich library for
testing Components with fake dependencies. (Remember, this guide uses the umbrella term “fake” while other articles and tools use terms like “mock” or “stub”.)

<aside class="margin-note">Create fake from original</aside>

Among other things, ng-mocks helps creating fake Components to substitute children. The `MockComponent` function expects the original Component and returns a fake that resembles the original.

Instead of creating a `FakeCounterComponent`, we call `MockComponent(CounterComponent)` and add the fake to the testing Module.

```typescript
import { MockComponent } from 'ng-mocks';
```

```typescript
beforeEach(async () => {
  await TestBed.configureTestingModule({
    declarations: [HomeComponent, MockComponent(CounterComponent)],
    schemas: [NO_ERRORS_SCHEMA],
  }).compileComponents();
});
```

We can then query the rendered DOM for an instance of `CounterComponent`. The found instance is in fact a fake created by ng-mocks.
Still, we can declare the type `CounterComponent`.

```typescript
describe('HomeComponent with ng-mocks', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  // Original type!
  let counter: CounterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeComponent, MockComponent(CounterComponent)],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const counterEl = fixture.debugElement.query(
      // Original class!
      By.directive(CounterComponent)
    );
    counter = counterEl.componentInstance;
  });

  /* … */
});
```

From a TypeScript viewpoint, the fake conforms to the `CounterComponent` type. TypeScript uses a structural type system that checks if all type requirements are met.

<aside class="margin-note">Type equivalence</aside>

Every proposition that holds true for a `CounterComponent` holds true for the fake as well. The fake has all properties and methods that the original has. That is why we can safely replace the original with the fake and treat the fake the same in our test.

The full code:

```typescript
describe('HomeComponent with ng-mocks', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let counter: CounterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeComponent, Mock(CounterComponent)],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const counterEl = fixture.debugElement.query(
      By.directive(CounterComponent)
    );
    counter = counterEl.componentInstance;
  });

  it('renders an independent counter', () => {
    expect(counter).toBeTruthy();
  });

  it('passes a start count', () => {
    expect(counter.startCount).toBe(5);
  });

  it('listens for count changes', () => {
    spyOn(console, 'log');
    const count = 5;
    counter.countChange.emit(count);
    expect(console.log).toHaveBeenCalledWith(
      'countChange event from CounterComponent',
      count,
    );
  });
});
```

We have eliminated the manual `FakeCounterComponent`. We are using `MockComponent(CounterComponent)` to create the fake and the original class `CounterComponent`. The specs itself did not change.

This was only a glimpse of ng-mocks. The library not only helps with nested Components, but provides high-level helpers for setting up the Angular test environment. ng-mocks replaces the conventional setup with `TestBed.configureTestingModule` and helps faking Modules, Components, Directives, Pipes and Services.

<div class="book-sources" markdown="1">
- [HomeComponent spec with ng-mocks](https://github.com/9elements/angular-workshop/blob/main/src/app/components/home/home-component.ng-mocks.spec.ts)
- [ng-mocks](https://github.com/help-me-mom/ng-mocks)
</div>

<p id="next-chapter-link"><a href="../testing-components-depending-on-services/#testing-components-depending-on-services">Testing Components depending on Services</a></p>
