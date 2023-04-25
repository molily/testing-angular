---
layout: chapter
title: Faking dependencies (Mocking)
description: How to mock dependencies to test Components and Services in isolation
---

# Faking dependencies

<aside class="learning-objectives" markdown="1">
Learning objectives

- Testing a code unit in isolation
- Replacing dependencies with fakes
- Rules for creating fakes to avoid pitfalls
- Using Jasmine spies to fake functions and methods
</aside>

When testing a piece of code, you need to decide between an [integration test](../testing-principles/#integration-tests) and a [unit test](../testing-principles/#unit-tests). To recap, the integration test includes (“integrates”) the dependencies. In contrast, the unit test replaces the dependencies with fakes in order to isolate the code under test.

<aside class="margin-note">Also known as mocking</aside>

These replacements are also called *test doubles*, *stubs* or *mocks*. Replacing a dependency is called *stubbing* or *mocking*.

Since these terms are used inconsistently and their difference is subtle, **this guide uses the term “fake” and “faking”** for any dependency substitution.

<aside class="margin-note">Faking safely</aside>

Creating and injecting fake dependencies is essential for unit tests. This technique is double-edged – powerful and dangerous at the same time. Since we will create many fakes throughout this guide, we need to set up **rules for faking dependencies** to apply the technique safely.

## Equivalence of fake and original

A fake implementation must have the same shape as the original. If the dependency is a function, the fake must have the same signature, meaning the same parameters and the same return value. If the dependency is an object, the fake must have the same public API, meaning the same public methods and properties.

<aside class="margin-note">Replaceability</aside>

The fake does not need to be complete, but sufficient enough to act as a replacement. The fake needs to be **equivalent to the original** as far as the code under test is concerned, not fully equal to the original.

Imagine a fake building on a movie set. The outer shape needs to be indistinguishable from an original building. But behind the authentic facade, there is only a wooden scaffold. The building is an empty shell.

The biggest danger of creating a fake is that it does not properly mimic the original. Even if the fake resembles the original at the time of writing the code, it might easily get out of sync later when the original is changed.

When the original dependency changes its public API, dependent code needs to be adapted. Also, the fake needs to be aligned. When the fake is outdated, the unit test becomes a fantasy world where everything magically works. The test passes but in fact the code under test is broken.

<aside class="margin-note">Keep fake in sync</aside>

How can we ensure that the fake is up-to-date with the original? How can we ensure the equivalence of original and fake in the long run and prevent any possible divergence?

We can use TypeScript to **enforce that the fake has a matching type**. The fake needs to be strictly typed. The fake’s type needs to be a subset of the original’s type.

<aside class="margin-note">Type equivalence</aside>

Then, TypeScript assures the equivalence. The compiler reminds us to update the implementation and the fake. The TypeScript code simply does not compile if we forget that. We will learn how to declare matching types in the upcoming examples.

## Effective faking

The original dependency code has side effects that need to be suppressed during testing. The fake needs to *effectively* prevent the original code from being executed. Strange errors may happen if a mix of fake and original code is executed.

<aside class="margin-note">Do not mix fake and original</aside>

In some faking approaches, the fake inherits from the original. Only those properties and methods are overwritten that are currently used by the code under test.

This is dangerous since we may forget to overwrite methods. When the code under test changes, the test may accidentally call original methods of the dependency.

This guide will present thorough faking techniques that do not allow a slip. They imitate the original code while shielding the original from calls.

## Faking functions with Jasmine spies

Jasmine provides simple yet powerful patterns to create fake implementations. The most basic pattern is the **Jasmine spy** for replacing a function dependency.

<aside class="margin-note">Call record</aside>

In its simplest form, a spy is a function that records its calls. For each call, it records the function parameters. Using this record, we later assert that the spy has been called with particular input values.

For example, we declare in a spec: “Expect that the spy has been called two times with the values `mickey` and `minnie`, respectively.”

Like every other function, a spy can have a meaningful return value. In the simple case, this is a fixed value. The spy will always return the same value, regardless of the input parameters. In a more complex case, the return value originates from an underlying fake function.

<aside class="margin-note" markdown="1">
  `createSpy`
</aside>

A standalone spy is created by calling `jasmine.createSpy`:

```typescript
const spy = jasmine.createSpy('name');
```

`createSpy` expects one parameter, an optional name. It is recommended to pass a name that describes the original. The name will be used in error messages when you make expectations against the spy.

Assume we have class `TodoService` responsible for fetching a to-do list from the server. The class uses the [Fetch API](https://developer.mozilla.org/de/docs/Web/API/Fetch_API) to make an HTTP request. (This is a plain TypeScript example. It is uncommon to use `fetch` directly in an Angular app.)

```typescript
class TodoService {
  constructor(
    // Bind `fetch` to `window` to ensure that `window` is the `this` context
    private fetch = window.fetch.bind(window)
  ) {}

  public async getTodos(): Promise<string[]> {
    const response = await this.fetch('/todos');
    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status} ${response.statusText}`
      );
    }
    return await response.json();
  }
}
```

<aside class="margin-note">Inject fake</aside>

The `TodoService` uses the **constructor injection** pattern. The `fetch` dependency can be injected via an optional constructor parameter. In production code, this parameter is empty and defaults to the original `window.fetch`. In the test, a fake dependency is passed to the constructor.

The `fetch` parameter, whether original or fake, is saved as an instance property `this.fetch`. Eventually, the public method `getTodos` uses it to make an HTTP request.

In our unit test, we do not want the Service to make any HTTP requests. We pass in a Jasmine spy as replacement for `window.fetch`.

```typescript
// Fake todos and response object
const todos = [
  'shop groceries',
  'mow the lawn',
  'take the cat to the vet'
];
const okResponse = new Response(JSON.stringify(todos), {
  status: 200,
  statusText: 'OK',
});

describe('TodoService', () => {
  it('gets the to-dos', async () => {
    // Arrange
    const fetchSpy = jasmine.createSpy('fetch')
      .and.returnValue(okResponse);
    const todoService = new TodoService(fetchSpy);

    // Act
    const actualTodos = await todoService.getTodos();

    // Assert
    expect(actualTodos).toEqual(todos);
    expect(fetchSpy).toHaveBeenCalledWith('/todos');
  });
});
```

There is a lot to unpack in this example. Let us start with the fake data before the `describe` block:

```typescript
const todos = [
  'shop groceries',
  'mow the lawn',
  'take the cat to the vet'
];
const okResponse = new Response(JSON.stringify(todos), {
  status: 200,
  statusText: 'OK',
});
```

First, we define the fake data we want the `fetch` spy to return. Essentially, this is an array of strings.

<aside class="margin-note">Fake response</aside>

The original `fetch` function returns a `Response` object. We create one using the built-in `Response` constructor. The original server response is a string before it is parsed as JSON. So we need to serialize the array into a string before passing it to the `Response` constructor. (These `fetch` details are not relevant to grasp the spy example.)

Then, we declare a test suite using `describe`:

```typescript
describe('TodoService', () => {
  /* … */
});
```

The suite contains one spec that tests the `getTodos` method:

```typescript
it('gets the to-dos', async () => {
  /* … */
});
```

The spec starts with *Arrange* code:

```typescript
// Arrange
const fetchSpy = jasmine.createSpy('fetch')
  .and.returnValue(okResponse);
const todoService = new TodoService(fetchSpy);
```

Here, we create a spy. With `.and.returnValue(…)`, we set a fixed return value: the successful response.

<aside class="margin-note">Inject spy</aside>

We also create an instance of `TodoService`, the class under test. We pass the spy into the constructor. This is a form of manual dependency injection.

In the *Act* phase, we call the method under test:

```typescript
const actualTodos = await todoService.getTodos();
```

`getTodos` returns a Promise. We use an `async` function together with `await` to access the return value easily. Jasmine deals with async functions just fine and waits for them to complete.

In the *Assert* phase, we create two expectations:

```typescript
expect(actualTodos).toEqual(todos);
expect(fetchSpy).toHaveBeenCalledWith('/todos');
```

<aside class="margin-note">Data processing</aside>

First, we verify the return value. We compare the actual data (`actualTodos`) with the fake data the spy returns (`todos`). If they are equal, we have proven that `getTodos` parsed the response as JSON and returned the result. (Since there is no other way `getTodos` could access the fake data, we can deduce that the spy has been called.)

<aside class="margin-note">Verify call record</aside>

Second, we verify that the `fetch` spy has been called *with the correct parameter*, the API endpoint URL. Jasmine offers several matchers for making expectations on spies. The example uses `toHaveBeenCalledWith` to assert that the spy has been called with the parameter `'/todos'`.

Both expectations are necessary to guarantee that `getTodos` works correctly.

<aside class="margin-note">Happy and unhappy paths</aside>

After having written the first spec for `getTodos`, we need to ask ourselves: Does the test fully cover its behavior? We have tested the success case, also called *happy path*, but the error case, also called *unhappy path*, is yet to be tested. In particular, this error handling code:

```typescript
if (!response.ok) {
  throw new Error(
    `HTTP error: ${response.status} ${response.statusText}`
  );
}
```

When the server response is not “ok”, we throw an error. “Ok” means the HTTP response status code is 200-299. Examples of “not ok” are “403 Forbidden”, “404 Not Found” and “500 Internal Server Error”. Throwing an error rejects the Promise so the caller of `getTodos` knows that fetching the to-dos failed.

The fake `okResponse` mimics the success case. For the error case, we need to define another fake `Response`. Let us call it `errorResponse` with the notorious HTTP status 404 Not Found:

```typescript
const errorResponse = new Response('Not Found', {
  status: 404,
  statusText: 'Not Found',
});
```

Assuming the server does not return JSON in the error case, the response body is simply the string `'Not Found'`.

Now we add a second spec for the error case:

```typescript
describe('TodoService', () => {
  /* … */
  it('handles an HTTP error when getting the to-dos', async () => {
    // Arrange
    const fetchSpy = jasmine.createSpy('fetch')
      .and.returnValue(errorResponse);
    const todoService = new TodoService(fetchSpy);

    // Act
    let error;
    try {
      await todoService.getTodos();
    } catch (e) {
      error = e;
    }

    // Assert
    expect(error).toEqual(new Error('HTTP error: 404 Not Found'));
    expect(fetchSpy).toHaveBeenCalledWith('/todos');
  });
});
```

In the *Arrange* phase, we inject a spy that returns the error response.

<aside class="margin-note">Catching errors</aside>

In the *Act* phase, we call the method under test but anticipate that it throws an error. In Jasmine, there are several ways to test whether a Promise has been rejected with an error. The example above wraps the `getTodos` call in a `try/catch` statement and saves the error. Most likely, this is how implementation code would handle the error.

In the *Assert* phase, we make two expectations again. Instead of verifying the return value, we make sure the caught error is an `Error` instance with a useful error message. Finally, we verify that the spy has been called with the right value, just like in the spec for the success case.

Again, this is a plain TypeScript example to illustrate the usage of spies. Usually, an Angular Service does not use `fetch` directly but uses `HttpClient` instead. We will get to know testing this later (see [Testing a Service that sends HTTP requests](../testing-services/#testing-a-service-that-sends-http-requests)).

<div class="book-sources" markdown="1">
- [TodoService: Implementation and test code](https://github.com/9elements/angular-workshop/blob/main/src/app/services/todos-service.spec.ts)
- [Jasmine reference: Spies](https://jasmine.github.io/api/edge/Spy.html)
</div>

## Spying on existing methods

We have used `jasmine.createSpy('name')` to create a standalone spy and have injected it into the constructor. Explicit constructor injection is straight-forward and used extensively in Angular code.

<aside class="margin-note">Spy on object methods</aside>

Sometimes, there is already an object whose method we need to spy on. This is especially helpful if the code uses global methods from the browser environment, like `window.fetch` in the example above.

For this purpose, we can use the `spyOn` method:

```typescript
spyOn(window, 'fetch');
```

<aside class="margin-note">Overwrite and restore</aside>

This installs a spy on the global `fetch` method. Under the hood, Jasmine saves the original `window.fetch` function for later and overwrites `window.fetch` with a spy. Once the spec is completed, Jasmine automatically restores the original function.

`spyOn` returns the created spy, enabling us to set a return value, like we have learned above.

```typescript
spyOn(window, 'fetch')
  .and.returnValue(okResponse);
```

We can create a version of `TodoService` that does not rely on construction injection, but uses `fetch` directly:

```typescript
class TodoService {
  public async getTodos(): Promise<string[]> {
    const response = await fetch('/todos');
    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status} ${response.statusText}`
      );
    }
    return await response.json();
  }
}
```

The test suite then uses `spyOn` to catch all calls to `window.fetch`:

```typescript
// Fake todos and response object
const todos = [
  'shop groceries',
  'mow the lawn',
  'take the cat to the vet'
];
const okResponse = new Response(JSON.stringify(todos), {
  status: 200,
  statusText: 'OK',
});

describe('TodoService', () => {
  it('gets the to-dos', async () => {
    // Arrange
    spyOn(window, 'fetch')
      .and.returnValue(okResponse);
    const todoService = new TodoService();

    // Act
    const actualTodos = await todoService.getTodos();

    // Assert
    expect(actualTodos).toEqual(todos);
    expect(window.fetch).toHaveBeenCalledWith('/todos');
  });
});
```

Not much has changed here. We spy on `fetch` and make it return `okResponse`. Since `window.fetch` is overwritten with a spy, we make the expectation against it to verify that it has been called.

Creating standalone spies and spying on existing methods are not mutually exclusive. Both will be used frequently when testing Angular applications, and both work well with dependencies injected into the constructor.

<div class="book-sources" markdown="1">
- [Jasmine reference: spyOn](https://jasmine.github.io/api/edge/global.html#spyOn)
</div>

<p id="next-chapter-link"><a href="../debugging-tests/#debugging-tests">Debugging tests</a></p>
