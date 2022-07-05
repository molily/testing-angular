---
layout: chapter
title: Testing standalone Components
description: How test Angular standalone Components
---

# Testing standalone Components

A distinctive feature of the Angular framework is that Angular applications are structured into Modules. Many other popular JavaScript framework like React or Vue are centered around components and do not have the concept of modules. While other frameworks have ways to inject dependencies, they do not feature a built-in, mandatory way to formally declare and inject dependencies.

Angular encourages to bundle connected parts of the application into a Module: Routes point to Components, Components call Services, Component templates use Pipes and Directives. Typically, a base route like `/users/`, loads the Module dynamically, and routes like `/users/new` point to Components declared in the Module.

This approach is catered to large, fast-growing enterprise applications with many developers. Such applications need a scalable structure from the beginning on. Thanks to Modules, the intersections inside of the large application are well-defined: If one Module needs to reuse a piece of code, it needs to import another Module. The other Module needs to export the code explicitly.

Thereby, the large application is broken down into small applications that communicate over stable public APIs. This prevents thousand parts being entangled with each other like a hairball.

However, Angular's Module approach has several drawbacks.

First of all, the existence and complexity of Modules poses a challenge for people getting started with Angular. A simple “Hello, World” output needs much boilerplate code. A newly-created Angular application starts with an `AppModule` that needs to be bootstrapped. It needs to import predefined Angular Modules and declare Components.

In contrast, in frameworks that are centered around components, beginners need to create a component and render it into a container element. These basic concepts will take them very far.

For advanced Angular developers, Modules are no less challenging: What is the best way to split an application into Modules? How do we reuse code effectively and share it across Modules? Should large Modules represent application features? Should small Modules encapsulate a particular data and user interface logic?

Modules serve many purposes. Application parts are bundled into Modules for several reasons. In large applications, the proper division into Modules and managing their dependencies is the top architectural issue.

Over the years, the Angular community identified common bad practices and developed better strategies. Among these were <em>Single Component Angular Modules</em>, a way to declare dependencies on the lowest possible level. It turned out that such Components are not only easier to test, but such integration tests are also more reliable.

The Angular core team adapted this idea and introduced <em>standalone Components</em> as well as standalone Directives and Pipes with Angular 14.

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

Testing standalone Components

In the version 14.0.x of Angular, standalone Components are in developer preview. The Angular team has not developed tools for testing standalone Components in particular, but may do so in the future. For now, testing standalone Components resembles testing normal components.

Luckily, testing standalone Components works the same as testing normal Components, with a few significant differences.

We have learned how to test normal, Module-dependent Components: [Configuring the testing Module](/testing-components/#configuring-the-testing-module), declaring the Component under test. The test setup for the `CounterComponent` example looks like this:

```typescript
describe('CounterComponent', () => {
  let component: CounterComponent;
  let fixture: ComponentFixture<CounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CounterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    /* … */
    fixture.detectChanges();
  });

  /* … */
});
```

Standalone counter Component depending on a Service

The [ServiceCounterComponent](https://github.com/9elements/angular-workshop/tree/main/src/app/components) depends on the `CounterService` that stores the counter value. The chapter [Testing Components depending on Services](/testing-components-depending-on-services/) describes how to write a unit or integration test for this Component.

The `ServiceCounterComponent` is a good candidate for a standalone Component since it implements a defined feature and encloses the necessary dependencies. So we are going to create and test a standalone version of it. The features of the new `StandaloneServiceCounterComponent` are exactly the same as the normal, Module-dependent counterpart.

The standalone version has only one important code difference: it is marked as standalone in the Component decorator.

```typescript
@Component({
  standalone: true,
  selector: 'app-standalone-counter',
  templateUrl: './standalone-counter.component.html',
  styleUrls: ['./standalone-counter.component.css'],
})
export class StandaloneCounterComponent implements OnChanges {
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

The rest of the `StandaloneCounterComponent` spec is identical to the spec of `CounterComponent`.

This exercise was relatively easy because the `StandaloneCounterComponent` does not have any dependencies. It provides no immediately benefits to mark it as standalone.

