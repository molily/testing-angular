---
layout: chapter
title: Testing standalone Components
description: How test Angular standalone Components
---

# Testing standalone Components

A distinctive feature of the Angular framework is that applications are structured in Modules. Many other popular JavaScript framework like React or Vue are centered around components and do not have the concept of modules. While other frameworks have ways to inject dependencies, they do not feature a built-in, mandatory way to formally declare and inject dependencies.

Angular encourages to bundle connected parts of the application into a Module: Routes point to Components, Components call Services, Component templates use Pipes and Directives. Typically, a base route like `/users/`, loads a Module dynamically, and routes like `/users/new` point to Components declared in this Module.

This approach is catered to large, fast-growing enterprise applications with many developers. Such applications need a scalable structure from the beginning on. Thanks to Modules, the intersections inside of the large application are well-defined: If one Module needs to reuse a piece of code, it needs to import another Module. The other Module needs to export the code explicitly.

Thereby, a large application is broken down into small applications that communicate over stable public APIs. This prevents thousand parts being entangled with each other like a hairball.

However, Angular's Module approach has several drawbacks.

First of all, the existence and complexity of Modules poses a challenge for people getting started with Angular. A simple “Hello, World” output needs much boilerplate code. A newly-created Angular application starts with an `AppModule` that needs to be bootstrapped. It needs to import predefined Angular Modules, declare Components and bootstrap a Component.

In contrast, in frameworks that are centered around components, beginners merely need to create a component and render it into a container element. These basic concepts will take them very far.

For advanced Angular developers, Modules are no less challenging: What is the best way to split an application into Modules? How do we reuse code effectively and share it across Modules? Should large Modules represent application features? Should small Modules encapsulate a particular data and user interface logic?

Modules serve many purposes. Application parts are bundled into Modules for several reasons. In large Angular applications, the proper division into Modules and managing their dependencies is the top architectural issue.

Over the years, the Angular community identified common bad practices and developed better strategies. Among these were <em>Single Component Angular Modules</em> (SCAM), a way to declare dependencies on the lowest possible level. Such self-contained Components are easier to share, to integrate and to reason about. It turned out that they are also easier to test and such integration tests are more reliable.

The Angular core team adapted these ideas and introduced <em>standalone Components</em> as well as standalone Directives and Pipes with Angular 14.

Prior to Angular 14, Components, Directives and Pipes could not be used directly, but had to be part of a Module. For example, if Component A from Module X wants to use Component B from Module Y, Module X needs to import Module Y. Since Angular 14, this indirection becomes unnecessary. Component A can directly import Component B.

Standalone Components, Directives and Pipes need to declare their dependencies directly. More precisely, they have a fully-capable dependency injector. For example, the metadata of a `HelloWorldComponent` may look like this:

```typescript
@Component({
	standalone: true,
	selector: 'app-hello-world',
	template: 'Hello, World!'
	imports: [
		/* Modules, other standalone Components, Directives and Pipes */
	],
	providers: [
		/* Services and other dependency Providers */
	],
	viewProviders: [
		/* Services and other dependency Providers */
	],

})
class HelloWorldComponent {
	constructor(/* Receive dependencies */) {}
}
```

[Links]

Testing standalone Components

In the version 14.0 of Angular, standalone Components are in developer preview. The Angular team has not developed tools for testing standalone Components in particular, but may do so in the future. For now, testing standalone Components resembles testing normal components.

Luckily, testing standalone Components works the same as testing normal Components, with a few significant differences.

The [ServiceCounterComponent](https://github.com/9elements/angular-workshop/tree/main/src/app/components/service-counter) depends on the `CounterService` that stores the counter value. The chapter [Testing Components depending on Services](/testing-components-depending-on-services/) describes how to write a unit or integration test for this Component.

We have learned how to test normal, Module-dependent Components: [Configuring the testing Module](/testing-components/#configuring-the-testing-module), declaring the Component under test. When writing an test for a Component with Service dependencies, we also provide either the original Services or fakes.

The setup for the [`ServiceCounterComponent`](https://github.com/9elements/angular-workshop/tree/main/src/app/components/service-counter) integration test looks like this:

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
```

Standalone counter Component depending on a Service

The `ServiceCounterComponent` is a good candidate for a standalone Component since it implements a defined feature and encloses the necessary dependencies. So we are going to create and test a `StandaloneServiceCounterComponent`. Its features are exactly the same as the Module-dependent counterpart.

The standalone version has two important code difference: In the `@Component` decorator, it is marked as standalone and imports Angular’s `CommonModule`.

```typescript
@Component({
  standalone: true,
  selector: 'app-standalone-service-counter',
  imports: [CommonModule],
  templateUrl: './standalone-service-counter.component.html',
  styleUrls: ['./standalone-service-counter.component.css'],
})
export class StandaloneServiceCounterComponent {
  /* … */
}
```

Now let us adapt the `StandaloneCounterComponent` spec. There is one crucial difference when configuring the testing Module: standalone Components cannot be *declared* in a Module, they need to be *imported* into a Module. This rule applies to implementation code as well as the testing Module.

So we list the Component in `imports`, not in `declarations`:

```typescript
await TestBed.configureTestingModule({
  import: [StandaloneCounterComponent],
}).compileComponents();
```

Integration test

The Component under test depends on the `CounterService`. With the setup above, we are writing an integration test that run against the real `CounterService`. This is the preferred way to test standalone Components since they are supposed to self-contained [black boxes](/testing-principles/#black-box-vs-white-box-testing).

A standalone Component may use additional Services, Pipes and child Components. Both from the usage and the testing perspective, these are just implementation details. What is relevant to the test is the public Component API and the observed DOM output.

Apart from the different test setup, `StandaloneCounterComponent` integration test is identical to that of `CounterComponent`.

[Links]

Faking dependencies

While an integration test is a natural fit for a standalone Component, sometimes we need to alter its behavior by faking a dependency.

For example, when the standalone Component sends HTTP requests by means of a Service, we might want to replace this particular Service with a fake that returns predefined responses. The test may still integrate all other dependencies that do not disturb the test, slow it down or make it less reliable.

Luckily, faking a Service dependency of a standalone Component works the same than that [faking a Service dependency of a Module-dependent Component](/testing-components-depending-on-services/#faking-service-dependencies). We create a fake object whose methods return deterministic values and provide the fake instead of the original.

In the `ServiceCounterComponent` test, the testing Module setup looks like this:

```typescript
await TestBed.configureTestingModule({
  declarations: [ServiceCounterComponent],
  // Use fake instead of original
  providers: [
    { provide: CounterService, useValue: fakeCounterService }
  ],
}).compileComponents();
```

For the `StandaloneServiceCounterComponent`, we can do the same. As said, we need to import the standalone Component instead of declaring it.

```typescript
await TestBed.configureTestingModule({
  imports: [StandaloneServiceCounterComponent],
  // Use fake instead of original
  providers: [
    { provide: CounterService, useValue: fakeCounterService }
  ],
}).compileComponents();
```

How should the Service fake look like in this case? For the normal `ServiceCounterComponent`, we explored two options:

1. Create a fake object with Jasmine spies using `jasmine.createSpyObj`. Use the spies to verify that the Component calls certain Service methods.
2. Provide a fake object with minimal logic, wrapped in Jasmine spies. Test that the component actually uses the data from the Service.

For testing standalone Components, we adapt and improve the second way. The reason for faking the Service contained by a standalone Component is to suppress certain side effects, like HTTP requests. It is not our goal to test the communication with the Service in detail. Given the Service is an integral part of the standalone Component, we should not treat it as a separate, reusable entity.

This means we can simplify the spec. We do not need to verify directly that the Component calls certain Service methods. We get rid of the Jasmine spies. We do test that the Component processes the data returned by the Service.

The spec scaffold then reads:

```typescript
describe('StandaloneServiceCounterComponent: fake Service', () => {
  const newCount = 456;

  let fixture: ComponentFixture<StandaloneServiceCounterComponent>;

  let fakeCount$: BehaviorSubject<number>;
  let fakeCounterService: Pick<CounterService, keyof CounterService>;

  beforeEach(async () => {
    fakeCount$ = new BehaviorSubject(0);

    fakeCounterService = {
      getCount() {
        return fakeCount$;
      },
      increment() {
        fakeCount$.next(1);
      },
      decrement() {
        fakeCount$.next(-1);
      },
      reset() {
        fakeCount$.next(Number(newCount));
      },
    };

    await TestBed.configureTestingModule({
      imports: [StandaloneServiceCounterComponent],
      providers: [{ provide: CounterService, useValue: fakeCounterService }],
    }).compileComponents();

    fixture = TestBed.createComponent(StandaloneServiceCounterComponent);
    fixture.detectChanges();
  });

  /* … */
});
```

`fakeCounterService` is a minimal re-implementation. Original and fake are very similar since the simple example Service does little. In reality, the Service may fetch data via HTTP or use other external APIs. Notice that we do not install Jasmine spiecs on the `fakeCounterService`’s methods.

The specs itself resembles the `ServiceCounterComponent` specs we used as a starting point. Without Jasmine spies, there are none to verify. So we simplify to specs to:

```typescript
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
  setFieldValue(fixture, 'reset-input', String(newCount));
  click(fixture, 'reset-button');
  fixture.detectChanges();

  expectText(fixture, 'count', String(newCount));
});

it('does not reset if the value is not a number', () => {
  const value = 'not a number';
  setFieldValue(fixture, 'reset-input', value);
  click(fixture, 'reset-button');

  expectText(fixture, 'count', '0');
});
```

xxx

[Links]
