---
layout: chapter
title: Testing Components depending on Services
description: How to write unit and integration tests for Components with Service dependencies
---

# Testing Components depending on Services

<aside class="learning-objectives" markdown="1">
Learning objectives

- Choosing between a unit or an integration test for Components that talk to Services
- Creating fake Services to test the Component in isolation
- Verifying that the Component correctly interacts with the Service
- Understanding different approaches for faking a Service dependency
</aside>

We have successfully tested the independent `CounterComponent` as well as the container `HomeComponent`. The next Component on our list is the [ServiceCounterComponent](https://github.com/9elements/angular-workshop/tree/main/src/app/components/service-counter).

<button class="load-iframe">
See the ServiceCounterComponent in action
</button>

<script type="text/x-template">
<p class="responsive-iframe">
<iframe src="https://9elements.github.io/angular-workshop/service-counter-component" class="responsive-iframe__iframe"></iframe>
</p>
</script>

As the name suggests, this Component depends on the `CounterService`. The counter state is not stored in the Component itself, but in the central Service.

<aside class="margin-note">Shared central state</aside>

Angular’s dependency injection maintains only one app-wide instance of the Service, a so-called singleton. Therefore, multiple instances of `ServiceCounterComponent` share the same counter state. If the user increments the count with one instance, the count also changes in the other instance.

Again, there are two fundamental ways to test the Component:

- A unit test that replaces the `CounterService` dependency with a fake.
- An integration test that includes a real `CounterService`.

This guide will demonstrate both. For your Components, you need to make a decision on an individual basis. These questions may guide you: Which type of test is more beneficial, more meaningful? Which test is easier to set up and maintain in the long run?

## Service dependency integration test

For the `ServiceCounterComponent`, the integration test is much easier to set up than the unit test. The trivial `CounterService` has little logic and no further dependencies. It does not have side effects we need to suppress in the testing environment, like HTTP requests. It only changes its internal state.

The integration test looks almost identical to the `CounterComponent` test we have already written.

```typescript
describe('ServiceCounterComponent: integration test', () => {
  let component: ServiceCounterComponent;
  let fixture: ComponentFixture<ServiceCounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ServiceCounterComponent],
      providers: [CounterService],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceCounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the start count', () => {
    expectText(fixture, 'count', '0');
  });

  it('increments the count', () => {
    click(fixture, 'increment-button');
    fixture.detectChanges();
    expectText(fixture, 'count', '1');
  });

  it('decrements the count', () => {
    click(fixture, 'decrement-button');
    fixture.detectChanges();
    expectText(fixture, 'count', '-1');
  });

  it('resets the count', () => {
    const newCount = 456;
    setFieldValue(fixture, 'reset-input', String(newCount));
    click(fixture, 'reset-button');
    fixture.detectChanges();
    expectText(fixture, 'count', String(newCount));
  });
});
```

Compared to the `CounterComponent` test, there is nothing new here except for one line:

```typescript
providers: [CounterService],
```

<aside class="margin-note">Provide Service</aside>

This line adds the `CounterService` to the testing Module. Angular creates an instance of the Service and injects it into the Component under test. The test is shorter because the `ServiceCounterComponent` does not have Inputs or Outputs to test.

As the `CounterService` always starts with the count `0`, the test needs to take that for granted. Neither the Component nor the Service allow a different start count.

<aside class="margin-note">Interaction with Service</aside>

The integration test does not examine the Component’s inner workings. It only provides the Service but does not check how the Component and the Service interact. The Component might not talk to the Service at all.

If we want an integration test to verify that the Component stores the count in the Service, we would need a test with two `ServiceCounterComponent`s: When increasing the count using one Component, the displayed count in the other should change accordingly.

<div class="book-sources" markdown="1">
- [ServiceCounterComponent: integration test](https://github.com/9elements/angular-workshop/blob/main/src/app/components/service-counter/service-counter.component.spec.ts)
</div>

## Faking Service dependencies

Let us move on to the **unit test** for the `ServiceCounterComponent`. To tackle this challenge, we need to learn the art of faking Service dependencies.

There are several practical approaches with pros and cons. We have discussed two main [requirements on fake dependencies](../faking-dependencies/#faking-dependencies):

1. Equivalence of fake and original: The fake must have a type derived from the original.
2. Effective faking: the original stays untouched.

<aside class="margin-note">Recommended faking approach</aside>

This guide will present one solution that implements these requirements. Note that other solutions might meet these requirements as well.

The dependency we need to fake, `CounterService`, is a simple class annotated with `@Injectable()`. This is the outer shape of `CounterService`:

```typescript
class CounterService {
  public getCount(): Observable<number> { /* … */ }
  public increment(): void { /* … */ }
  public decrement(): void { /* … */ }
  public reset(newCount: number): void { /* … */ }
  private notify(): void { /* … */ }
}
```

We need to build a fake that meets the mentioned needs.

<aside class="margin-note">Fake instance</aside>

The simplest way to create a fake is an object literal `{…}` with methods:

```typescript
const currentCount = 123;
const fakeCounterService = {
  getCount() {
    return of(currentCount);
  },
  increment() {},
  decrement() {},
  reset() {},
};
```

`getCount` returns a fixed value from a constant named `currentCount`. We will use the constant later to check whether the Component uses the value correctly.

This fake is far from perfect, but already a viable replacement for a `CounterService` instance. It walks like the original and talks like the original. The methods are empty or return fixed data.

<aside class="margin-note">Type equivalence</aside>

The fake implementation above happens to have the same shape as the original. As discussed, it is of utter importance that the fake remains up to date with the original.

The equivalence is not yet enforced by TypeScript. We want TypeScript to check whether the fake properly replicates the original. The first attempt would be to add a type declaration:

<div class="erroneous" markdown="1">
```typescript
// Error!
const fakeCounterService: CounterService = {
  getCount() {
    return of(currentCount);
  },
  increment() {},
  decrement() {},
  reset() {},
};
```
</div>


Unfortunately, this does not work. TypeScript complains that private methods and properties are missing:

`Type '{ getCount(): Observable<number>; increment(): void; decrement(): void; reset(): void; }' is missing the following properties from type 'CounterService': count, subject, notify`

That is correct. But we cannot add private members to an object literal, nor should we.

<aside class="margin-note">Pick public members</aside>

Luckily, we can use a TypeScript trick to fix this problem. Using [Pick](https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys) and [keyof](https://www.typescriptlang.org/docs/handbook/advanced-types.html#index-types), we create a derived type that only contains the public members:

```typescript
const fakeCounterService:
  Pick<CounterService, keyof CounterService> = {
  getCount() {
    return of(currentCount);
  },
  increment() {},
  decrement() {},
  reset() {},
};
```

<aside class="margin-note">Keep fake in sync</aside>

When the `CounterService` changes its public API, the dependent `ServiceCounterComponent` needs to be adapted. Likewise, the `fakeCounterService` needs to reflect the change. The type declaration reminds you to update the fake. It prevents the fake to get out of sync with the original.

<aside class="margin-note">Fake what is necessary</aside>

`ServiceCounterComponent` calls all existing public `CounterService` methods, so we have added them to the fake.

If the code under test does not use the full API, the fake does not need to replicate the full API either. Only declare those methods and properties the code under test actually uses.

For example, if the code under test only calls `getCount`, just provide this method. Make sure to add a type declaration that picks the method from the original type:

```typescript
const fakeCounterService: Pick<CounterService, 'getCount'> = {
  getCount() {
    return of(currentCount);
  },
};
```

`Pick` and other [mapped types](https://www.typescriptlang.org/docs/handbook/advanced-types.html#mapped-types) help to bind the fake to the original type in a way that TypeScript can check the equivalence.

<aside class="margin-note">Spy on methods</aside>

A plain object with methods is an easy way to create a fake instance. The spec needs to verify that the methods have been called with the right parameters.

[Jasmine spies](../faking-dependencies/#faking-functions-with-jasmine-spies) are suitable for this job. A first approach fills the fake with standalone spies:

```typescript
const fakeCounterService:
  Pick<CounterService, keyof CounterService> = {
  getCount:
    jasmine.createSpy('getCount').and.returnValue(of(currentCount)),
  increment: jasmine.createSpy('increment'),
  decrement: jasmine.createSpy('decrement'),
  reset: jasmine.createSpy('reset'),
};
```

<aside class="margin-note" markdown="1">
  `createSpyObj`
</aside>

This is fine, but overly verbose. Jasmine provides a handy helper function for creating an object with multiple spy methods, `createSpyObj`. It expects a descriptive name and an object with method names and return values:

```typescript
const fakeCounterService = jasmine.createSpyObj<CounterService>(
  'CounterService',
  {
    getCount: of(currentCount),
    increment: undefined,
    decrement: undefined,
    reset: undefined,
  }
);
```

The code above creates an object with four methods, all of them being spies. They return the given values: `getCount` returns an `Observable<number>`. The other methods return `undefined`.

<aside class="margin-note">Type equivalence</aside>

`createSpyObj` accepts a [TypeScript type variable](https://www.typescriptlang.org/docs/handbook/generics.html) to declare the type of the created object. We pass `CounterService` between angle brackets so TypeScript checks that the fake matches the original.

Let us put our fake to work. In the *Arrange* phase, the fake is created and injected into the testing Module.

```typescript
describe('ServiceCounterComponent: unit test', () => {
  const currentCount = 123;

  let component: ServiceCounterComponent;
  let fixture: ComponentFixture<ServiceCounterComponent>;
  // Declare shared variable
  let fakeCounterService: CounterService;

  beforeEach(async () => {
    // Create fake
    fakeCounterService = jasmine.createSpyObj<CounterService>(
      'CounterService',
      {
        getCount: of(currentCount),
        increment: undefined,
        decrement: undefined,
        reset: undefined,
      }
    );

    await TestBed.configureTestingModule({
      declarations: [ServiceCounterComponent],
      // Use fake instead of original
      providers: [
        { provide: CounterService, useValue: fakeCounterService }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceCounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /* … */
});
```

There is a new pattern in the `providers` sections of the testing Module:

```typescript
providers: [
  { provide: CounterService, useValue: fakeCounterService }
]
```

<aside class="margin-note">Provide fake instead</aside>

This is the crucial moment where we tell Angular: For the `CounterService` dependency, use the value `fakeCounterService` instead. This is how we replace the original with a fake.

Normally, Angular instantiates and injects a `CounterService` instance whenever a Component, Service, etc. asks for the `CounterService`. By using `{ provide: …, useValue: … }`, we skip the instantiation and directly provide the value to inject.

The *Arrange* phase is complete now, let us write the actual specs.

The *Act* phase is the same as in the other counter Component tests: We click on buttons and fill out form fields.

<aside class="margin-note">Verify spies</aside>

In the *Assert* phase, we need to verify that the Service methods have been called. Thanks to `jasmine.createSpyObj`, all methods of `fakeCounterService` are spies. We use `expect` together with an appropriate matcher like `toHaveBeenCalled`, `toHaveBeenCalledWith`, etc.

```typescript
expect(fakeCounterService.getCount).toHaveBeenCalled();
```

Applied to all specs, the test suite looks like this:

```typescript
describe('ServiceCounterComponent: unit test', () => {
  const currentCount = 123;

  let component: ServiceCounterComponent;
  let fixture: ComponentFixture<ServiceCounterComponent>;
  // Declare shared variable
  let fakeCounterService: CounterService;

  beforeEach(async () => {
    // Create fake
    fakeCounterService = jasmine.createSpyObj<CounterService>(
      'CounterService',
      {
        getCount: of(currentCount),
        increment: undefined,
        decrement: undefined,
        reset: undefined,
      }
    );

    await TestBed.configureTestingModule({
      declarations: [ServiceCounterComponent],
      // Use fake instead of original
      providers: [
        { provide: CounterService, useValue: fakeCounterService }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceCounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the count', () => {
    expectText(fixture, 'count', String(currentCount));
    expect(fakeCounterService.getCount).toHaveBeenCalled();
  });

  it('increments the count', () => {
    click(fixture, 'increment-button');
    expect(fakeCounterService.increment).toHaveBeenCalled();
  });

  it('decrements the count', () => {
    click(fixture, 'decrement-button');
    expect(fakeCounterService.decrement).toHaveBeenCalled();
  });

  it('resets the count', () => {
    const newCount = 456;
    setFieldValue(fixture, 'reset-input', String(newCount));
    click(fixture, 'reset-button');
    expect(fakeCounterService.reset).toHaveBeenCalledWith(newCount);
  });
});
```

<div class="book-sources" markdown="1">
- [ServiceCounterComponent: implementation and test code](https://github.com/9elements/angular-workshop/tree/main/src/app/components/service-counter)
- [Angular guide: Dependency providers](https://angular.io/guide/dependency-injection-providers)
</div>

## Fake Service with minimal logic

The specs above check whether user interaction calls the Service methods. They do not check whether the Component re-renders the new count after having called the Service.

`ServiceCounter`’s `getCount` method returns an `Observable<number>` and pushes a new value through the Observable whenever the count changes. The spec `it('shows the count', …)` has proven that the Component obtained the count from the Service and renders it.

In addition, we will check that the Component updates when new values are pushed. This is not strictly necessary in our simple `ServiceCounterComponent` and `CounterService` example. But it is important in more complex interactions between a Component and a Service.

<aside class="margin-note">Component update</aside>

The fake `getCount` method returns `of(currentCount)`, an Observable with the fixed value 123. The Observable completes immediately and never pushes another value. We need to change that behavior in order to demonstrate the Component update.

The fake `CounterService`, devoid of logic so far, needs to gain some logic. `getCount` needs to return an Observable that emits new values when `increment`, `decrement` and `reset` are called.

<aside class="margin-note" markdown="1">
  `BehaviorSubject`
</aside>

Instead of a fixed Observable, we use a `BehaviorSubject`, just like in the original `CounterService` implementation. The `BehaviorSubject` has a `next` method for pushing new values.

We declare a variable `fakeCount$` in the scope of the test suite and assign a `BehaviorSubject` in the first `beforeEach` block:

```typescript
describe('ServiceCounterComponent: unit test with minimal Service logic', () => {
  /* … */
  let fakeCount$: BehaviorSubject<number>;

  beforeEach(async () => {
    fakeCount$ = new BehaviorSubject(0);
    /* … */
  });

  /* … */
});
```

Then we change the `fakeCounterService` so the methods push new values through `fakeCount$`.

```typescript
const newCount = 123;
/* … */
fakeCounterService = {
  getCount(): Observable<number> {
    return fakeCount$;
  },
  increment(): void {
    fakeCount$.next(1);
  },
  decrement(): void {
    fakeCount$.next(-1);
  },
  reset(): void {
    fakeCount$.next(Number(newCount));
  },
};
```

The fake above is an object with plain methods. We are not using `createSpyObj` any longer because it does not allow fake method implementations.

<aside class="margin-note">Spy on methods</aside>

We have lost the Jasmine spies and need to bring them back. There are several ways to wrap the methods in spies. For simplicity, we install spies on all methods using `spyOn`:

```typescript
spyOn(fakeCounterService, 'getCount').and.callThrough();
spyOn(fakeCounterService, 'increment').and.callThrough();
spyOn(fakeCounterService, 'decrement').and.callThrough();
spyOn(fakeCounterService, 'reset').and.callThrough();
```

Remember to add `.and.callThrough()` so the underlying fake methods are called.

Now our fake Service sends new counts to the Component. We can reintroduce the checks for the Component output:

```typescript
fixture.detectChanges();
expectText(fixture, 'count', '…');
```

Assembling all parts, the full `ServiceCounterComponent` unit test:

```typescript
describe('ServiceCounterComponent: unit test with minimal Service logic', () => {
  const newCount = 456;

  let component: ServiceCounterComponent;
  let fixture: ComponentFixture<ServiceCounterComponent>;

  let fakeCount$: BehaviorSubject<number>;
  let fakeCounterService: Pick<CounterService, keyof CounterService>;

  beforeEach(async () => {
    fakeCount$ = new BehaviorSubject(0);

    fakeCounterService = {
      getCount(): Observable<number> {
        return fakeCount$;
      },
      increment(): void {
        fakeCount$.next(1);
      },
      decrement(): void {
        fakeCount$.next(-1);
      },
      reset(): void {
        fakeCount$.next(Number(newCount));
      },
    };
    spyOn(fakeCounterService, 'getCount').and.callThrough();
    spyOn(fakeCounterService, 'increment').and.callThrough();
    spyOn(fakeCounterService, 'decrement').and.callThrough();
    spyOn(fakeCounterService, 'reset').and.callThrough();

    await TestBed.configureTestingModule({
      declarations: [ServiceCounterComponent],
      providers: [
        { provide: CounterService, useValue: fakeCounterService }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceCounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the start count', () => {
    expectText(fixture, 'count', '0');
    expect(fakeCounterService.getCount).toHaveBeenCalled();
  });

  it('increments the count', () => {
    click(fixture, 'increment-button');
    fakeCount$.next(1);
    fixture.detectChanges();

    expectText(fixture, 'count', '1');
    expect(fakeCounterService.increment).toHaveBeenCalled();
  });

  it('decrements the count', () => {
    click(fixture, 'decrement-button');
    fakeCount$.next(-1);
    fixture.detectChanges();

    expectText(fixture, 'count', '-1');
    expect(fakeCounterService.decrement).toHaveBeenCalled();
  });

  it('resets the count', () => {
    setFieldValue(fixture, 'reset-input', newCount);
    click(fixture, 'reset-button');
    fixture.detectChanges();

    expectText(fixture, 'count', newCount);
    expect(fakeCounterService.reset).toHaveBeenCalledWith(newCount);
  });
});
```

Again, this example is intentionally verbose. The fake re-implements a large part of the original logic. This is because the original `CounterService` has little logic itself.

In reality, Services are more complex and Components process the data they receive from the Services. Then, the effort of faking essential logic is worthwhile.

<div class="book-sources" markdown="1">
- [ServiceCounterComponent: unit test](https://github.com/9elements/angular-workshop/blob/main/src/app/components/service-counter/service-counter.component.spec.ts)
</div>

## Faking Services: Summary

Creating fake Service dependencies and verifying their usage is one of the most challenging problems when testing Angular applications. This guide can only catch a glimpse on the subject.

<aside class="margin-note">Testable Services</aside>

Faking Services requires effort and steady practice. The more unit tests you write, the more experience you gain. More importantly, the practice teaches you to write *simple Services that are easy to fake*: Services with a clear API and an obvious purpose.


Unfortunately, there are no best practices when it comes to faking Services. You will find plenty of approaches online that have their strengths and weaknesses. The associated unit tests have different degrees of accuracy and completeness.

Arguing about the “right” way of faking a Service is pointless. You need to decide on a faking method that suits the Service on a case-by-case basis.

<aside class="margin-note">Guidelines</aside>

There are two guidelines that may help you:

1. Is the test valuable? Does it cover the important interaction between Component and Service? Decide whether to test the interaction superficially or in-depth.
2. Whichever approach you choose, make sure to meet the [basic requirements](../faking-dependencies/#faking-dependencies):

   1. Equivalence of fake and original: The fake must have a type derived from the original.
   2. Effective faking: the original stays untouched.

<p id="next-chapter-link"><a href="../testing-complex-forms/#testing-complex-forms">Testing complex forms</a></p>
