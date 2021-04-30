---
layout: testing-angular-chapter
title: "End-to-end testing – Testing Angular"
description: "How do we take advantage of Angular’s testability?"
keywords: JavaScript, Angular, testing, automated tests, test automation, unit tests, integration tests, end-to-end tests
twitter_card: summary_large_image
twitter_image: /img/testing-angular/flying-probe-2-1-2085-cwebp-q80.webp
og_image: /img/testing-angular/flying-probe-1200-ogimage-85.jpg
---

# End-to-end testing

We have successfully written unit and integration tests using Karma, Jasmine and Angular’s own testing tools. These precise tests give confidence that a single application part – like a Component or Service - or a group of connected parts work as intended.

<aside class="margin-note">User perspective</aside>

Karma and Jasmine tests take a technical perspective. They focus on the front-end JavaScript code alone and run it in a controlled and isolated test environment. What is really important though is whether the whole application works **for the user**.

The most effective and reliable way to ensure a working application is *manual testing*: A dedicated software tester walks through the application feature by feature, case by case according to a test plan.

Manual tests are slow, labor-intensive and cannot be repeated often. They are unspecific from a developer perspective: If the test fails, we cannot easily pin down which part of the application is responsible or which code change causes the regression.

We need automated tests that take the user’s perspective. This is what **end-to-end (E2E) tests** do.

## Strengths of end-to-end tests

As discussed in [distribution of testing efforts](../testing-principles/#distribution-of-testing-efforts), all types of automated tests have pros and cons. Unit and integration tests are fast and reliable, but do not guarantee a working application. End-to-end test are slow and often fail incorrectly, but they assess the fitness of the application as a whole.

<aside class="margin-note">Real conditions</aside>

When all parts of the application come together, a new type of bugs appears. Often these bugs have to do with timing and order of events, like network latency and race conditions.

The unit and integration tests we wrote worked with a fake back-end. We send fake HTTP requests and respond with fake data. We made an effort to keep the originals and fakes on par.

<aside class="margin-note">Front-end and back-end</aside>

It is much harder to keep the front-end code in sync with the actual API endpoints and responses from the back-end. Even if the front-end and the back-end share type information about the transferred data, there will be mismatches.

It is the goal of end-to-end tests to catch these bugs that cannot be caught by other automated tests.

## Deployment for end-to-end tests

End-to-end tests require a testing environment that closely resembles the production environment. You need to deploy the full application, including the front-end and the relevant back-end parts. For that purpose, back-end frameworks typically support configurations for different environments, like development, testing and production.

<aside class="margin-note">Deterministic environment</aside>

The database needs to be filled with pre-fabricated fake data. With each run of the end-to-end tests, you need to reset the database to a defined initial state.

The back-end services need to answer requests with deterministic responses. Third-party dependencies need to be set up so they return realistic data but do not compromise production data.

Since this guide is not about DevOps, we will not go into details here and focus on writing end-to-end tests.

## How end-to-end tests work

An end-to-end test tries to mimic how a user interacts with the application. Typically, the test engine launches an ordinary browser and controls it remotely.

<aside class="margin-note">Simulate user actions</aside>

Once the browser is started, the end-to-end test navigates to the application’s URL, reads the page content and makes keyboard and pointer input. For example, the test fills out a form and clicks on the submit button.

Just like unit and integration tests, the end-to-end test then makes expectations: Does the page include the right content? Did the URL change? This way, whole features and user interfaces are examined.

## End-to-end testing frameworks

Frameworks for end-to-end tests allow navigating to URLs, simulating user input and inspecting the page content. Apart from that, they have little in common. The test syntax and the way the tests are run differ widely.

There are two categories of end-to-end testing frameworks: Those that use WebDriver and those that do not.

<aside class="margin-note">Browser automation</aside>

The **WebDriver protocol** defines a way to control a browser remotely with a set of commands. It originates from the Selenium browser automation project and is now developed at the World Wide Web Consortium (W3C).

All common browsers support the WebDriver protocol and can be controlled remotely. The most important WebDriver commands are:

- Navigate to a given URL
- Find one or more elements in the DOM
- Get information about a found element:
  - Get an element attribute or property
  - Get the element’s text content
- Click on an element
- Send keyboard input to a form field
- Execute arbitrary JavaScript code

WebDriver is a key technology most end-to-end testing frameworks depend on. The main benefit of WebDriver is that tests can be run in different browsers, even simultaneously.

WebDriver is a high-level, generic, HTTP-based protocol. It connects the test running on one machine with a browser possibly running on another machine. The level of control over the browser is limited.

<aside class="margin-note">Flexibility vs. reliability</aside>

Not all frameworks build on WebDriver. Some frameworks integrate more directly into the browser. This makes them more reliable, less complex, but also less flexible since they only support few browsers.

In this guide, we will learn about two frameworks, one of each category:

- *Protractor*, which is based on WebDriver,
- *Cypress*, which does not use WebDriver.

<div class="book-sources" markdown="1">
- [WebDriver protocol](https://www.w3.org/TR/webdriver/)
- [Protractor: Official web site](http://www.protractortest.org/)
- [Cypress: Official web site](https://www.cypress.io/)
</div>

## Introducing Protractor

Protractor is an end-to-end testing framework based on WebDriver, made for Angular applications.

<aside class="margin-note">Well-integrated</aside>

Protractor is an official Angular project and also originates from Google. In a project created with the Angular CLI, Protractor is already installed as the default end-to-end testing framework.

Just like the unit and integration tests we have written, Protractor uses Jasmine for test suites and specs. If you are familiar with Jasmine, you quickly get into writing Protractor tests.

Protractor integrates well with an Angular app under test. Protractor waits for Angular to update the page before continuing with the next WebDriver command. This feature seeks to make testing Angular applications more robust.

<aside class="margin-note">Not recommended</aside>

Despite all these benefits, **this guide does not recommend using Protractor for new projects**. Why so?

First of all, Protractor is practically unmaintained. The future of the project is unclear. It seems to have lost the Google backing.

Second, the project underwent fundamental changes that curtail its usability.

Protractor has a feature called *WebDriver control flow*. While WebDriver commands are in fact asynchronous, this feature allows you to write tests as if they were synchronous.

The control flow implementation has lead to inconsistencies and bugs. The underlying WebDriverJS library removed the feature, so Protractor deprecated it as well. Today, Protractor recommends to embrace the asynchronous nature of end-to-end tests.

<aside class="margin-note">Asynchronous commands</aside>

All Protractor commands return Promises. You are advised to use `async` / `await` to wait for a command to finish. But most Protractor examples, tutorials and the default configuration still propagate the control flow.

Declaring the control flow obsolete was inevitable, but eliminated a useful feature. Protractor’s contenders, namely Cypress and WebDriver.io, still have such a feature.

If you disable the control flow, you practically need to disable the “wait for Angular” feature as well. This means both key Protractor features have lapsed.

Protractor is a solid project, but today there is no compelling reason to choose Protractor over its competitors.

<aside class="margin-note">Tested with Protractor</aside>

If you are looking for Protractor examples, have a look at the Protractor end-to-end tests for the Counter and Flickr search. They are not explained in this guide though.

<div class="book-sources" markdown="1">
- [Counter: End-to-end tests with Protractor](https://github.com/9elements/angular-workshop/tree/main/e2e)
- [Flickr search: End-to-end tests with Protractor](https://github.com/9elements/angular-flickr-search/tree/main/e2e)
- [Protractor: The WebDriver Control Flow](https://www.protractortest.org/#/control-flow)
- [Protractor: async/await](https://www.protractortest.org/#/async-await)
</div>

## Introducing Cypress

Cypress is an end-to-end testing framework that is not based on WebDriver. There are no Angular-specific features. Any web site can be tested with Cypress.

<aside class="margin-note">Reproducible tests</aside>

WebDriver-based testing solutions are flexible and powerful but turned out to be slow and unreliable. Cypress aims to improve both the developing experience and the reliability of end-to-end tests.

Cypress employs a fundamentally different architecture. A Node.js application starts the browser. The browser is not controlled remotely, but the tests run directly in the browser, supported by a browser plugin.

The test runner provides a powerful user interface for inspecting and debugging tests right in the browser.

<aside class="margin-note">Test runner</aside>

Cypress is the product of one company, Cypress.io, Inc. The test runner we are going to use is open source and free of charge.

The company generates revenue with an additional paid service: The Cypress dashboard manages test runs recorded in a continuous integration environment. You do not have to subscribe to this service to write and run Cypress tests.

<aside class="margin-note">Trade-offs</aside>

From our perspective, Cypress has several drawbacks.

- Cypress requires some initial setup. While Cypress works well with Angular applications, it is not pre-installed like Protractor.
- In place of Jasmine, Cypress uses the Mocha and Chai libraries for writing tests. While both serve the same purpose, you have to learn the subtle differences. If you use Jasmine for unit and integration tests, there will be an inconsistency in your tests.
- At the time of writing, Cypress only supports Firefox as well as Chromium-based browsers like Google Chrome and Microsoft Edge. It does not support Safari, legacy Edge or even Internet Explorer.

Cypress is not simply better than WebDriver-based frameworks. It tries to solve their problems by narrowing the scope and making trade-offs.

<aside class="margin-note">Recommended</aside>

That being said, this guide **recommends to use Cypress for testing Angular applications**. Cypress is well-maintained and well-documented. With Cypress, you can write valuable end-to-end tests with little effort.

In case you do need a WebDriver-based framework, have a look at Webdriver.io instead.

<div class="book-sources" markdown="1">
- [Cypress: Trade-offs](https://docs.cypress.io/guides/references/trade-offs.html)
- [Cypress: Key differences](https://docs.cypress.io/guides/overview/key-differences.html)
- [Webdriver.io](https://webdriver.io/)
</div>

## Installing Cypress

An easy way to add Cypress to an existing Angular CLI project is the [Cypress Angular Schematic](https://github.com/briebug/cypress-schematic).

In your Angular project directory, run this shell command:

```
ng add @briebug/cypress-schematic
```

This command does three important things:

1. Add Cypress and auxiliary npm packages to package.json.
2. Create a sub-directory named `cypress` with a scaffold for your tests.
3. Change the `angular.json` configuration file to add `ng run` commands.

The output looks like this:

```
Installing packages for tooling via npm.
Installed packages for tooling via npm.
? Would you like to remove Protractor from the project? No
CREATE cypress.json (48 bytes)
CREATE cypress/tsconfig.json (89 bytes)
CREATE cypress/integration/spec.ts (158 bytes)
CREATE cypress/plugins/cy-ts-preprocessor.js (425 bytes)
CREATE cypress/plugins/index.js (158 bytes)
CREATE cypress/support/commands.ts (1378 bytes)
CREATE cypress/support/index.ts (651 bytes)
UPDATE package.json (1396 bytes)
UPDATE angular.json (4378 bytes)
✔ Packages installed successfully.
```

The schematic asks if you would like to remove Protractor from the project.

- If you opt for “Yes”, the Protractor directory `e2e` is removed and the `ng e2e` command will start Cypress instead.
- If you opt for “No”, the `e2e` directory will remain untouched.

If you are unsure, just answer “No” so you can revive the Protractor tests at any time if you feel the need.

## Writing an end-to-end test with Cypress

In the project directory, you will find a sub-directory called `cypress`. It contains:

- A `tsconfig.json` TypeScript configuration file for all `.ts` files in the directory,
- a `support` directory for custom commands,
- a `plugin` directory for Cypress plugins and
- an `integration` directory for the actual end-to-end tests.

The test files in `integration` are TypeScript files with the extension `.ts`.

The tests itself are structured with the test framework **Mocha**. The assertions (also called expectations) are written using **Chai**.

Mocha and Chai is a popular combination. They roughly do the same as Jasmine, but are much more flexible and rich in features.

<aside class="margin-note">Test suites</aside>

If you have written unit tests with Jasmine before, the Mocha structure will be familiar to you. A test file contains one or more suites declared with `describe('…', () => { /* … */})`. Typically, one file contains one `describe` block, possible with nested `describe` blocks.

Inside `describe`, the blocks `beforeEach`, `afterEach`, `beforeAll`, `afterAll` and `it` can be used similar to Jasmine tests.

This brings us to the following end-to-end test structure:

```typescript
describe('… Feature description …', () => {
  beforeEach(() => {
    // Navigate to the page
  });

  it('… User interaction description …', () => {
    // Interact with the page
    // Assert something about the page content
  });
});
```

## Testing the counter Component

Step by step, we are going to write end-to-end tests for the counter example application.

<div class="book-sources" markdown="1">
- [Counter Component: Source code](https://github.com/9elements/angular-workshop)
- [Counter Component: Run the app](https://9elements.github.io/angular-workshop/)
</div>

<button class="load-iframe">
See the counter Component app in action
</button>

<script type="text/x-template">
<p class="responsive-iframe">
<iframe src="https://9elements.github.io/angular-workshop/" class="responsive-iframe__iframe"></iframe>
</p>
</script>

As a start, let us write a minimal test that checks the document title. In the project directory, we create a file called `cypress/integration/counter.ts`. It looks like this:

```typescript
describe('Counter', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200');
  });

  it('has the correct title', () => {
    cy.title().should('equal', 'Angular Workshop: Counters');
  });
});
```

<aside class="margin-note">Commands</aside>

Cypress commands are methods of the `cy` namespace object. Here, we are using two commands, `visit` and `title`.

`cy.visit` orders the browser to visit the given URL. For now, we use the full URL of the development server.

Later, we are going to set a `baseUrl` in the Cypress configuration so we can use paths like `/`. Then, Cypress will append the path to the `baseUrl`.

<aside class="margin-note">Chainers</aside>

`cy.title` returns the page title. To be specific, it returns a Cypress **Chainer** that wraps a string. A Chainer is an asynchronous wrapper around values, mostly DOM elements but also other values.

<aside class="margin-note">Assertions</aside>

The Chainer has a `should` method for creating an assertion. Cypress relays the call to the Chai library to verify the assertion.

```typescript
cy.title().should('equal', 'Angular Workshop: Counters');
```

We pass two parameters, `'equal'` and the expected title string. `equal` creates an assertion that the subject value (the page title) equals to the given value (`'Angular Workshop: Counters'`). `equal` uses the familiar `===` comparison.

This `should` style of assertions is different from Jasmine expectations, like `expect(…).toBe(…)`. Confusingly, Chai supports three different assertion styles: `should`, `assert`, but also `expect`. In Cypress, you will typically use the `should` method on Chainers and `expect` on other values.

<div class="book-sources" markdown="1">
- [Cypress API reference: cy.visit](https://docs.cypress.io/api/commands/visit.html)
- [Cypress API reference: cy.title](https://docs.cypress.io/api/commands/title.html)
- [Cypress API reference: cy.visit](https://docs.cypress.io/guides/references/assertions.html)
- [Chai API reference: should style assertions](https://www.chaijs.com/api/bdd/)
- [Chai API reference: equal](https://www.chaijs.com/api/bdd/#method_equal)
</div>

## Running the Cypress tests

Save the minimal test from the last chapter as `cypress/integration/counter.ts`.

Cypress has two shell commands to run the end-to-end tests:

<aside class="margin-note">Test runner</aside>

1. **`npx cypress run` – Non-interactive test runner**. Runs the tests in a “headless” browser. This means the browser window is not visible.

   The tests are run once, then the browser is closed and the shell command finishes. You can see the test results in the shell output.

   This command is typically used in a continuous integration environment.

2. **`npx cypress open` – Interactive test runner**. Opens a window where you can select which tests to run and which browser to use. The browser window is visible and it remains visible after completion.

   You can see the test results the browser window. If you make changes on the test files, Cypress automatically re-runs the tests.

   This command is typically used in the development environment.

<aside class="margin-note">Serve and run tests</aside>

The Cypress schematic we have installed wraps these commands so they integrate with Angular.

- `ng run $project-name$:cypress-run` – Starts an Angular development server (`ng serve`), then calls `npx cypress run`.
- `ng run $project-name$:cypress-open` – Starts an Angular development server (`ng serve`), then calls `npx cypress open`.

`$project-name$` is a placeholder. Insert the name of the respective Angular project. This is typically the same as the directory name. If not, it can be found in `angular.json` in the `projects` object.

For example, the Counter example has the project name `angular-workshop`. Therefore, the commands are `ng run angular-workshop:cypress-run` and `ng run angular-workshop:cypress-open`.

To run our first Counter end-to-end test, run:

```
ng run angular-workshop:cypress-open
```

<aside class="margin-note">Launch window</aside>

This will open the test runner:

<a href="/img/testing-angular/cypress-open.png">
  <img src="/img/testing-angular/cypress-open.png" alt="Interactive Cypress test runner" class="image-max-full" loading="lazy">
</a>

In the main window pane, all tests are listed. To run a single test, just click on it. To run all, click the “Run all specs”.

On the top-right, you can select the browser. Chrome, Firefox and Edge will appear in the list given you have installed them on your machine.

This graphical user interface is an Electron application, a framework based on Chromium, the open source foundation of the Chrome browser. You can always run your tests in Electron since it ships with Cypress.

<aside class="margin-note">In-browser runner</aside>

Suppose you run the tests in Chrome, the in-browser test runner looks like this:

<a href="/img/testing-angular/cypress-browser.png">
  <img src="/img/testing-angular/cypress-browser.png" alt="Cypress test runner in the browser" class="image-max-full" loading="lazy">
</a>

On the left side, the specs are listed. On the right side, the web page under test is seen.

<aside class="margin-note">Spec log</aside>

By clicking on a spec name, you can see all commands and assertions in the spec.

<a href="/img/testing-angular/cypress-test-runner-tests.png">
  <img src="/img/testing-angular/cypress-test-runner-tests.png" alt="Opened Cypress spec with commands" class="image-max-full" loading="lazy">
</a>

You can watch Cypress running the specs command by command. This is especially useful when a spec fails. Let us break the spec on purpose to see Cypress’ output.

```typescript
cy.title().should('equal', 'Fluffy Golden Retrievers');
```

<a href="/img/testing-angular/cypress-spec-failed.png">
  <img src="/img/testing-angular/cypress-spec-failed.png" alt="Failed spec in Cypress: Time out retrying: expected 'Angular Workshop: Counters' to equal 'Fluffy Golden Retrievers'. Error in counter.ts" class="image-max-full" loading="lazy">
</a>

Cypress provides a helpful error message, pointing to the assertion that failed. You can click on “Open in IDE” to jump to the spec in your code editor.

<aside class="margin-note">Time travel</aside>

A unique feature of the in-browser test runner is the ability to see the state of the page at a certain point in time. Cypress creates DOM snapshot when a command is run or an assertion verified.

By hovering over a command or assertion, you can travel back in time. The page on the right side then reflects the page when the command or assertion was processed.

<div class="book-sources" markdown="1">
- [Cypress documentation: The Test Runner](https://docs.cypress.io/guides/core-concepts/test-runner.html)
</div>

## Asynchronous tests

Every Cypress command takes some time to execute. But from the spec point of view, the execution happens instantly.

<aside class="margin-note">Declarative code</aside>

In fact, Cypress commands are merely declarative. The execution happens asynchronously. By calling `cy.visit` and `cy.title`, we add commands to a queue. The queue is processed later.

As a consequence, we do not need to wait for the result of `cy.visit`. Cypress automatically waits for the page to load before proceeding with the next command.

For the same reason, `cy.title` does not immediately return a string, but a Chainer that allows more declarations.

In the Jasmine unit and integration tests we wrote, we had to manage time ourselves. When dealing with asynchronous commands and values, we had to use `async` / `await`, `fakeAsync` and other means explicitly.

This is not necessary when writing Cypress tests. The Cypress API is designed for expressiveness and readability. Cypress hides the fact that all commands take time.

## Automatic retries and waiting

A key feature of Cypress is that it retries certain commands and assertions.

For example, Cypress queries the document title and compares it with the expected title. If the title does not match instantly, Cypress will retry the `cy.title` command and the `should` assertion for four seconds. When the timeout is reached, the spec fails.

<aside class="margin-note">Wait automatically</aside>

Other commands are not retried, but have a built-in waiting logic. For example, we are going to use Cypress’ `click` method to click on an element.

Cypress automatically waits for four seconds for the element to be clickable. Cypress scrolls the element into view and checks if it is visible and not disabled. After several other checks, the Cypress performs the click.

The retry and waiting timeout can be configured for all tests or individual commands.

<aside class="margin-note">Retry specs</aside>

If a spec fails despite these retries and waiting, Cypress can be configured to retry the whole spec. This is the last resort if a particular spec produces inconsistent results.

These features makes end-to-end tests more reliable, but also easier to write. In other frameworks, you have to wait manually and there is no automatic retry of commands, assertions or specs.

<div class="book-sources" markdown="1">
- [Cypress introduction: Commands are asynchronous](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress.html#Commands-Are-Asynchronous)
- [Cypress documentation: Interacting with Elements](https://docs.cypress.io/guides/core-concepts/interacting-with-elements.html)
- [Cypress documentation: Retry-ability](https://docs.cypress.io/guides/core-concepts/retry-ability.html)
- [Cypress documentation: Test Retries](https://docs.cypress.io/guides/guides/test-retries.html)
</div>

## Testing the counter increment

In our first Cypress test, we have checked the page title successfully. Let us test the counter’s increment feature.

The test needs to perform the following steps:

1. Navigate to /
2. Find the element with the current count and read its text content
3. Expect that the text is “5”, since this is the start count for the first counter
4. Find the increment button and click it
5. Find the element with the current count and read its text content (again)
6. Expect that the text now reads “6”

We already now how to navigate to an address with `cy.visit('http://localhost:4200')`.

Cypress supports a `baseUrl` configuration option so we do not have to hard-code and repeat the full URL. We set `baseUrl` to `'http://localhost:4200'` so we can simply write `cy.visit('/')`.

The `baseUrl` setting allows you to run the tests against different versions of the application, for example development, staging and production.

<aside class="margin-note">Base URL</aside>

Edit the Cypress configuration file `cypress.json` in the Angular project directory. Add a property `baseUrl` and set it to the development server URL:

```javascript
{
  "baseUrl": "http://localhost:4200",
  /* … */
}
```

From now on, Cypress will expand the URL passed to `cy.visit` to a full URL using the `baseUrl`. The `baseUrl` configuration option can still be overridden on the command line if necessary.

## Finding elements

The next step is to find an element in the current page. Cypress provides several ways to find elements. We are going to use the `cy.get` method to find an element by CSS selector.

```typescript
cy.get('.example')
```

`cy.get` returns a Chainer, an asynchronous wrapper around the found elements with useful methods.

Just like with unit and integration test, the immediate question is: Which way to find an element should we use? By id, name, class or by other means?

<aside class="margin-note">Find by test id</aside>

As discussed in [querying the DOM with test ids](../testing-components/#querying-the-dom-with-test-ids), this guide recommends to mark elements with **test ids**.

These are data attributes like `data-testid="example"`. In the test, we use a corresponding attribute selector to find the elements, for example:

```typescript
cy.get('[data-testid="example"]')
```

<aside class="margin-note">Find by type</aside>

Test ids are recommended, but other ways to find elements are still useful in some cases. For example, you might want to check the presence and the content of an `h1` element. This element has a special meaning and you should not find it with by arbitrary test id.

The benefit of a test id is that it can be used on any element. Using a test id means ignoring the element type (like `h1`) and other attributes. The test does not fail if those change.

But if there is a reason for this particular element type or attribute, your test should verify the usage.

<div class="book-sources" markdown="1">
- [Cypress API reference: cy.get](https://docs.cypress.io/api/commands/get.html)
- [Cypress Best Practices: Selecting Elements](https://docs.cypress.io/guides/references/best-practices.html#Selecting-Elements)
</div>

## Interacting with elements

To test the counter Component, we want to verify that the start count for the first counter is “5”. The current count lives in an element with the test id `count`. So the element finder is:

```typescript
cy.get('[data-testid="count"]')
```

<aside class="margin-note">Presence and content</aside>

The `cy.get` command already has an assertion built-in: It expects to find at least one element. Otherwise, the test fails.

Next, we check the element’s text content to verify the start count. Again, we use the `should` method to create an assertion.

```typescript
cy.get('[data-testid="count"]').should('have.text', '5');
```

The `have.text` assertion compares the text content with the given string.

We did it! We have found an element and checked its content.

<aside class="margin-note">Click</aside>

Now let us increment the count. We find and click on the increment button (test id `increment-button`). Cypress offers the `cy.click` method for this purpose.

```typescript
cy.get('[data-testid="increment-button"]').click();
```

The Angular code under test handles the click event. Finally, we verify that the visible count has increased by one. We repeat the `should('have.text', …)` command, but expect a higher number.

The test suite now looks like this:

```typescript
describe('Counter', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it.only('has the correct title', () => {
    cy.title().should('equal', 'Angular Workshop: Counters');
  });

  it('increments the count', () => {
    cy.get('[data-testid="count"]').should('have.text', '5');
    cy.get('[data-testid="increment-button"]').click();
    cy.get('[data-testid="count"]').should('have.text', '6');
  });
});
```

The next feature we need to test is the decrement button. The spec works similar to the increment spec. It clicks on the decrement button (test id `decrement-button`) and checks that the count has decreased.

```typescript
it('decrements the count', () => {
  cy.get('[data-testid="decrement-button"]').click();
  cy.get('[data-testid="count"]').should('have.text', '4');
});
```

Last but not least, we test the reset feature. The user can enter a new count into a form field (test id `reset-input`) and click on the reset button (test id `reset-button`) to set the new count.

<aside class="margin-note">Fill out form</aside>

The Cypress Chainer has a generic method for sending keys to an element that is keyboard-interactable: `type`.

To enter text into the form field, we pass a string to the `type` method.

```typescript
cy.get('[data-testid="reset-input"]').type('123');
```

Next, we click on the reset button and finally expect the change.

```typescript
it('resets the count', () => {
  cy.get('[data-testid="reset-input"]').type('123');
  cy.get('[data-testid="reset-button"]').click();
  cy.get('[data-testid="count"]').should('have.text', '123');
});
```

This is full test suite:

```typescript
describe('Counter', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('has the correct title', () => {
    cy.title().should('equal', 'Angular Workshop: Counters');
  });

  it('increments the count', () => {
    cy.get('[data-testid="count"]').should('have.text', '5');
    cy.get('[data-testid="increment-button"]').click();
    cy.get('[data-testid="count"]').should('have.text', '6');
  });

  it('decrements the count', () => {
    cy.get('[data-testid="decrement-button"]').click();
    cy.get('[data-testid="count"]').should('have.text', '4');
  });

  it('resets the count', () => {
    cy.get('[data-testid="reset-input"]').type('123');
    cy.get('[data-testid="reset-button"]').click();
    cy.get('[data-testid="count"]').should('have.text', '123');
  });
});
```

On the start page of the counter project, there are in fact nine counters instance. The `cy.get` command therefore returns nine elements instead of one.

<aside class="margin-note">First match</aside>

Commands like `type` and `click` can only operate on one element, so we need to reduce the element list to the first result. This is achieved by Cypress’ `first` command inserted in the chain.

```typescript
it('increments the count', () => {
  cy.get('[data-testid="count"]').first().should('have.text', '5');
  cy.get('[data-testid="increment-button"]').first().click();
  cy.get('[data-testid="count"]').first().should('have.text', '6');
});
```

This also applies to the other specs. If the element under test only appears once, the `first` command is not necessary, of course.

All counter features are now tested. In the next chapters, we will refactor the code to improve its readability and maintainability.

<div class="book-sources" markdown="1">
- [Counter E2E test code](https://github.com/9elements/angular-workshop/blob/main/cypress/integration/counter.ts)
- [Cypress API reference: click](https://docs.cypress.io/api/commands/click.html)
- [Cypress API reference: type](https://docs.cypress.io/api/commands/type.html)
- [Cypress API reference: first](https://docs.cypress.io/api/commands/first.html)
- [Cypress FAQ: How do I get an element’s text contents?](https://docs.cypress.io/faq/questions/using-cypress-faq.html#How-do-I-get-an-element%E2%80%99s-text-contents)
</div>

## Custom Cypress commands

The test we wrote is quite repetitive. The pattern `cy.get('[data-testid="…"]')` is repeated over and over.

The first improvement is to write a helper that hides this detail. We have already written two similar functions as [unit testing helpers](../testing-components/#testing-helpers), `findEl` and `findEls`.

<aside class="margin-note">Find by test id</aside>

The easiest way to create a Cypress helper for finding elements is a function.

```typescript
function findEl(testId: string): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`[data-testid="${testId}"]`);
}
```

This would allow us to write `findEl('count')` instead of `cy.get('[data-testid="count"]')`.

<aside class="margin-note">Custom commands</aside>

This works fine, but we opt for a another way. Cypress supports adding **custom commands** to the `cy` namespace. We are going to add the command `byTestId` so we can write `cy.byTestId('count')`.

Custom commands are placed in `cypress/support/commands.ts` created by the Angular schematic. Using `Cypress.Commands.add`, we add our own command as a method of `cy`. The first parameter is the command name, the second is the implementation as a function.

<aside class="margin-note" markdown="1">
  `cy.byTestId`
</aside>

The simplest version looks like this:

```typescript
Cypress.Commands.add(
  'byTestId',
  (id: string) =>
    cy.get(`[data-testid="${id}"]`)
);
```

Now we can write `cy.byTestId('count')`. We can still fall back to `cy.get` if we want to find an element by other means.

`cy.byTestId` should have the same flexibility as the generic `cy.get`. So we add the second `options` parameter as well. We borrow the function signature from the official `cy.get` typings.

```typescript
Cypress.Commands.add(
  'byTestId',
  // Borrow the signature from cy.get
  <E extends Node = HTMLElement>(
    id: string,
    options?: Partial<
      Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow
    >,
  ): Cypress.Chainable<JQuery<E>> =>
    cy.get(`[data-testid="${id}"]`, options),
);
```

You do not have to understand the type definitions in detail. They simply make sure that you can pass the same `options` to `cy.byTestId` that you can pass to `cy.get`.

Save `commands.ts`, then edit `cypress/support/index.ts` and activate the line that imports `command.ts`.

```typescript
import './commands';
```

For proper type checking, we need to tell the TypeScript compiler that we have extended the `cy` namespace. We create the file `cypress/support/index.d.ts` and paste the following type definition:

```typescript
// Types for custom commands
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Get one or more DOM elements by test id.
     *
     * @param id The test id
     * @param options The same options as cy.get
     */
    byTestId<E extends Node = HTMLElement>(
      id: string,
      options?: Partial<
        Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow
      >,
    ): Cypress.Chainable<JQuery<E>>;
  }
}
```

This is it! We now have a strictly typed command `cy.byTestId`. Using the command, we can declutter the test.

```typescript
describe('Counter (with helpers)', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('has the correct title', () => {
    cy.title().should('equal', 'Angular Workshop: Counters');
  });

  it('increments the count', () => {
    cy.byTestId('count').first().should('have.text', '5');
    cy.byTestId('increment-button').first().click();
    cy.byTestId('count').first().should('have.text', '6');
  });

  it('decrements the count', () => {
    cy.byTestId('decrement-button').first().click();
    cy.byTestId('count').first().should('have.text', '4');
  });

  it('resets the count', () => {
    cy.byTestId('reset-input').first().type('123');
    cy.byTestId('reset-button').first().click();
    cy.byTestId('count').first().should('have.text', '123');
  });
});
```

Keep in mind that all these `first` calls are only necessary since there are multiple counters on the example page under test. If there is only one element with the given test id on the page, you do not need them.

<div class="book-sources" markdown="1">
- [Counter E2E test with helpers](https://github.com/9elements/angular-workshop/blob/main/cypress/integration/counter-helpers.ts)
- [Full code: commands.ts](https://github.com/9elements/angular-workshop/blob/main/cypress/support/commands.ts)
- [Full code: index.d.ts](https://github.com/9elements/angular-workshop/blob/main/cypress/support/index.d.ts)
- [Cypress documentation: Custom commands](https://docs.cypress.io/api/cypress-api/custom-commands.html)
- [Cypress documentation: Types for custom commands](https://docs.cypress.io/guides/tooling/typescript-support.html#Types-for-custom-commands)
</div>

## Testing the Flickr search

We have learned the basics of Cypress by testing the counter app. Let us delve into end-to-end testing with Cypress by testing a more complex app, the Flickr search.

<div class="book-sources" markdown="1">
- [Flickr photo search: Source code](https://github.com/9elements/angular-flickr-search)
- [Flickr photo search: Run the app](https://9elements.github.io/angular-flickr-search/)
</div>

<button class="load-iframe">
See the Flickr photo search in action
</button>

<script type="text/x-template">
<p class="responsive-iframe">
<iframe src="https://9elements.github.io/angular-flickr-search/" class="responsive-iframe__iframe"></iframe>
</p>
</script>

Before writing any code, let us make a plan what the end-to-end test needs to do:

1. Navigate to /
2. Find the search input field and enter a search term, e.g. “flower”
3. Find the submit button and click on it
4. Expect photo item links to flickr.com to appear
5. Click on a photo item
6. Expect the full photo details to appear

<aside class="margin-note">Nondeterministic API</aside>

The application under test queries a third-party API with production data. The test searches for “flower” and with each test run, Flickr returns potentially different results.

There are two ways to deal with this dependency during testing:

- Test against the real Flickr API
- Fake the Flickr API and return a fixed response

If we test against the real Flickr API, we cannot be specific in our expectations due to changing search results. We can only test the search results and the full photo superficially. We merely know that the clicked photo has “flower” in its title or tags.

<aside class="margin-note">Real vs. fake API</aside>

This has pros and cons. Testing against the real Flickr API makes the test realistic, but less reliable. If the Flickr API has a short hiccup, the test fails although there is no bug in our code.

Running the test against a fake API allows us to inspect the application deeply. Did the application render the photos the API returned? Are the photo details shown correctly?

Keep in mind that unit, integration and end-to-end tests complement each other. The Flickr search is also tested extensively using unit and integration tests.

Each type of test should do what it does best. The unit tests already put the different photo Components through their paces. The end-to-end test does not need to achieve that level of detail.

With Cypress, both type of tests are possible. For a start, we will test against the real Flickr API. Then, we will fake the API.

### Testing the search form

We create a file called `cypress/integration/flickr-search.ts`. We start with a test suite.

```typescript
describe('Flickr search', () => {
  const SEARCH_TERM = 'flower';

  beforeEach(() => {
    cy.visit('/');
  });

  it('searches for a term', () => {
    /* … */
  });
});
```

We instruct the browser to enter “flower” into the search field (test id `search-term-input`). Then we click on the submit button (test id `submit-search`).

```typescript
it('searches for a term', () => {
  cy.byTestId('search-term-input')
    .first()
    .clear()
    .type(SEARCH_TERM);
  cy.byTestId('submit-search').first().click();
  /* … */
});
```

<aside class="margin-note">Clear, then type</aside>

The `type` command does not overwrite the form value with a new value, but sends keyboard input, key by key.

Before entering “flower”, we need to clear the field since it already has a pre-filled value. Otherwise we would append “flower” to the existing value. We use Cypress’ `clear` method for that purpose.

Clicking on the submit button starts the search. When the Flickr API has responded, we expect the search results to be appear.

<aside class="margin-note">Expect search results</aside>

A search result consists of a link (`a` element, test id `photo-item-link`) and an image (`img` element, test id `photo-item-image`).

We expect 15 links to appear since this is amount of results requested from Flickr.

```typescript
cy.byTestId('photo-item-link')
  .should('have.length', 15)
```

By writing `should('have.length', 15)`, we assert that there are 15 elements.

Each link needs to have an `href` containing `https://www.flickr.com/photos/`. We cannot check for an exact URL since results are the dynamic. But we know that all Flickr photo URLs have the same structure.

There is no direct Chai assertion for checking that each link in the list has an `href` attribute containing `https://www.flickr.com/photos/`. We need to check each link in the list individually.

The Chainer has an `each` method to call a function for each element. This works similar to JavaScript’s `forEach` array method.

```typescript
cy.byTestId('photo-item-link')
  .should('have.length', 15)
  .each((link) => {
    /* Check the link */
  });
```

Cypress has three surprises for us.

<aside class="margin-note">Synchronous jQuery object</aside>

1. `link` is a synchronous value. Inside the `each` callback, we are in synchronous JavaScript land. (We could do asynchronous operations here, but there is no need.)

2. `link` has the type `JQuery<HTMLElement>`. This is an element wrapped with the popular jQuery library. Cypress chose jQuery because many JavaScript developers are already familiar with it. To read the `href` attribute, we use `link.attr('href')`.

3. We cannot use Cypress’ `should` method since it only exists on Cypress Chainers. But we are dealing with a jQuery object here. We have to use a standard Chai assertion – `expect` or `assert` style. We use `expect` together with `to.contain`.

This brings us to:

```typescript
cy.byTestId('photo-item-link')
  .should('have.length', 15)
  .each((link) => {
    expect(link.attr('href')).to.contain(
      'https://www.flickr.com/photos/'
    );
  });
```

The test now looks like this:

```typescript
describe('Flickr search', () => {
  const SEARCH_TERM = 'flower';

  beforeEach(() => {
    cy.visit('/');
  });

  it('searches for a term', () => {
    cy.byTestId('search-term-input')
      .first()
      .clear()
      .type(SEARCH_TERM);
    cy.byTestId('submit-search').first().click();

    cy.byTestId('photo-item-link')
      .should('have.length', 15)
      .each((link) => {
        expect(link.attr('href')).to.contain(
          'https://www.flickr.com/photos/'
        );
      });
    cy.byTestId('photo-item-image').should('have.length', 15);
  });
});
```

To start the tests, we run the shell command:

```
ng run flickr-search:cypress-open
```

This opens the test runner where we can click on the test `flickr-search.ts` to run it.

Alternatively, you can start the development server (`ng serve`) in one shell and the test runner (`npx cypress open`) in a second shell.

<div class="book-sources" markdown="1">
- [Flickr search E2E test code](https://github.com/9elements/angular-flickr-search/blob/main/cypress/integration/flickr-search.ts)
- [Cypress API reference: clear](https://docs.cypress.io/api/commands/clear.html)
- [Cypress API reference: each](https://docs.cypress.io/api/commands/each.html)
- [jQuery API reference: attr](https://api.jquery.com/attr/)
- [Chai API reference: include (contain)](https://www.chaijs.com/api/bdd/#method_include)
</div>

### Testing the full photo

When the user clicks on a link in the result list, the click event is caught and the full photo details are shown next to the list. (If the user clicks with the control/command key pressed or right-clicks, they can follow the link to flickr.com.)

In the end-to-end test, we add a spec to verify this behavior.

```typescript
it('shows the full photo', () => {
  /* … */
});
```

First, it searches for “flower”, just like the spec before.

```typescript
cy.byTestId('search-term-input').first().clear().type(SEARCH_TERM);
cy.byTestId('submit-search').first().click();
```

Then we find all photo item links, but not to inspect them, but to click on the first on:

```typescript
cy.byTestId('photo-item-link').first().click();
```

The click lets the photo details appear. As mentioned above, we cannot check for a specific title, a specific photo URL or specific tags. The clicked photo might be a different one with each test run.

Since we have searched for “flower”, the term is either in the photo title or tags. We check the text content of the wrapper element with the test id `full-photo`.

```typescript
cy.byTestId('full-photo').should('contain', SEARCH_TERM);
```

<aside class="margin-note">Contain vs. have&#xA0;text</aside>

The `contain` assertion checks whether the given string is somewhere in the element’s text content. (In contrast, the `have.text` assertion checks whether the content equals the given string. It does not allow additional content.)

Next, we check that a title and some tags are present and not empty.

```typescript
cy.byTestId('full-photo-title').should('not.have.text', '');
cy.byTestId('full-photo-tags').should('not.have.text', '');
```

The image itself needs to be present. We cannot check the `src` attribute in detail.

```typescript
cy.byTestId('full-photo-image').should('exist');
```

The spec now looks like this:

```typescript
it('shows the full photo', () => {
  cy.byTestId('search-term-input').first().clear().type(SEARCH_TERM);
  cy.byTestId('submit-search').first().click();

  cy.byTestId('photo-item-link').first().click();
  cy.byTestId('full-photo').should('contain', SEARCH_TERM);
  cy.byTestId('full-photo-title').should('not.have.text', '');
  cy.byTestId('full-photo-tags').should('not.have.text', '');
  cy.byTestId('full-photo-image').should('exist');
});
```

The assertions `contain`, `text` and `exist` are defined by Chai-jQuery, an assertion library for checking jQuery element lists.

Congratulations, we have successfully tested the Flickr search! This example demonstrates several Cypress commands and assertions. We also caught a glimpse of Cypress internals.

<div class="book-sources" markdown="1">
- [Flickr search E2E test code](https://github.com/9elements/angular-flickr-search/blob/main/cypress/integration/flickr-search.ts)
- [Cypress documentation: Chai-jQuery assertions](https://docs.cypress.io/guides/references/assertions.html#Chai-jQuery)
</div>

## Page objects

The Flickr search end-to-end test we have written is fully functional. We can improve the code further to increase clarity and maintainability.

We introduce a design pattern called **page object**. A design pattern is a proven code structure, a best practice to solve a common problem.

<aside class="margin-note">High-level interactions</aside>

A page object represents the web page that is scrutinized by an end-to-end test. The page object provides a high-level interface for interacting with the page.

So far, we have written low-level end-to-end tests. They find individual elements by hard-coded test id, check their content and click on them. This is fine for small tests.

But if the page logic is complex and there are diverse cases to test, the test becomes an unmanageable pile of low-level instructions. It is hard to find the gist of these tests and they are hard to change.

A page object organizes numerous low-level instructions into a few high-level interactions. What are the high-level interactions in the Flickr search app?

1. Search photos using a search term
2. Read the photo list and interact with the items
3. Read the photo details

Where possible, we group these interactions into methods of the page object.

<aside class="margin-note">Plain class</aside>

A page object is merely an abstract pattern – the exact implementation is up to you. Typically, the page object is declared as a class that is instantiated when the test starts.

Let us call the class `FlickrSearch` and save it in a separate file, `cypress/pages/flickr-search.page.ts`. The directory `pages` is reserved for page objects, and the `.page.ts` suffix marks the page object.

```typescript
export class FlickrSearch {
  public visit(): void {
    cy.visit('/');
  }
}
```

The class has a `visit` method that opens the page that the page object represents.

In the test, we import the class and create an instance in a `beforeEach` block.

```typescript
import { FlickrSearch } from '../pages/flickr-search.page';

describe('Flickr search (with page object)', () => {
  const SEARCH_TERM = 'flower';

  let page: FlickrSearch;

  beforeEach(() => {
    page = new FlickrSearch();
    page.visit();
  });

  /* … */
});
```

The `FlickrSearch` instance is stored in a variable declared in the `describe` scope. This way, all specs can access the page object.

<aside class="margin-note">Search</aside>

Let us implement the first high-level interaction on the page object: searching for photos. We move the relevant code from the test into a method of the page object.

```typescript
public searchFor(term: string): void {
  cy.byTestId('search-term-input').first().clear().type(term);
  cy.byTestId('submit-search').first().click();
}
```

The `searchFor` method expects a search term and performs all necessary steps.

<aside class="margin-note">Element queries</aside>

Other high-level interactions, like reading the photo list and the photo details, cannot be translated into page object methods. But we can move the test ids and element queries to the page object.

```typescript
public photoItemLinks(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.byTestId('photo-item-link');
}

public photoItemImages(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.byTestId('photo-item-image');
}

public fullPhoto(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.byTestId('full-photo');
}

public fullPhotoTitle(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.byTestId('full-photo-title');
}

public fullPhotoTags(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.byTestId('full-photo-tags');
}

public fullPhotoImage(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.byTestId('full-photo-image');
}
```

These methods return element Chainers.

Next, we rewrite the end-to-end test to use the page object methods.

```typescript
import { FlickrSearch } from '../pages/flickr-search.page';

describe('Flickr search (with page object)', () => {
  const SEARCH_TERM = 'flower';

  let page: FlickrSearch;

  beforeEach(() => {
    page = new FlickrSearch();
    page.visit();
  });

  it('searches for a term', () => {
    page.searchFor(SEARCH_TERM);
    page
      .photoItemLinks()
      .should('have.length', 15)
      .each((link) => {
        expect(link.attr('href')).to.contain(
          'https://www.flickr.com/photos/'
        );
      });
    page.photoItemImages().should('have.length', 15);
  });

  it('shows the full photo', () => {
    page.searchFor(SEARCH_TERM);
    page.photoItemLinks().first().click();
    page.fullPhoto().should('contain', SEARCH_TERM);
    page.fullPhotoTitle().should('not.have.text', '');
    page.fullPhotoTags().should('not.have.text', '');
    page.fullPhotoImage().should('exist');
  });
});
```

For the Flickr search above, a page object is probably too much of a good thing. Still the example demonstrates the key ideas of page objects:

- Identify repetitive high-level interactions and map them to methods of the page object.
- Move the finding of elements into the page object. The test ids, tag names, etc. used for finding should live in a central place.

  When the markup of a page under test changes, the page object needs an update, but the test should remain unchanged.
- Leave all assertions (`should` and `expect`) in the specs. Do not move them to the page object.

<aside class="margin-note">High-level tests</aside>

When writing end-to-end tests, you get lost in technical details quickly: finding elements, clicking them, filling out form fields, checking fields values and text content. But end-to-end tests should not revolve around these low-level details. They should describe the user journey on a high level.

The goal of this refactoring is not brevity. Using page objects does not necessarily lead to less code. The purpose of page objects is to separate low-level details – like finding elements by test ids – from the high-level user journey through the application. This makes the specs easier to read and the easier to maintain.

You can use the page object pattern when you feel the need to tidy up complex, repetitive tests. Once you are familiar with the pattern, it also helps you to avoid writing such tests in the first place.

<div class="book-sources" markdown="1">
- [Flickr search E2E test with page object](https://github.com/9elements/angular-flickr-search/blob/main/cypress/integration/flickr-search-with-po.ts)
- [Flickr search page object](https://github.com/9elements/angular-flickr-search/blob/main/cypress/pages/flickr-search.page.ts)
</div>

## Faking the Flickr API

The end-to-end test we wrote for the Flickr search uses the live Flickr API. As discussed, this makes the test realistic.

The test provides confidence that the application works hand in hand with the third-party API. But it makes the test slower and only allows unspecific assertions.

<aside class="margin-note">Intercept XMLHttpRequest</aside>

With Cypress, we can uncouple the dependency. Cypress allows us to intercept HTTP requests and respond with fake data.

The requests have to originate from JavaScript using XMLHttpRequest. Luckily, this is what Angular’s HTTP module (`@angular/common/http`) uses under the hood.

First of all, we need to set up the fake data. We have already created fake photo objects for the [`FlickrService` unit test](../testing-services/#testing-a-service-that-sends-http-requests). For simplicity, we just import them:

```typescript
import {
  photo1,
  photo1Link,
  photos,
  searchTerm,
} from '../../src/app/spec-helpers/photo.spec-helper';
```

Next, we need the URL of the request we want to intercept. This is a long string with numerous query parameters like the search term.

```typescript
const encodedSearchTerm = encodeURIComponent(searchTerm);
const expectedUrl = `https://www.flickr.com/services/rest/?tags=${encodedSearchTerm}&method=flickr.photos.search&format=json&nojsoncallback=1&tag_mode=all&media=photos&per_page=15&extras=tags,date_taken,owner_name,url_q,url_m&api_key=XYZ`;
```

Using the fake photos, we create a fake response object that mimics the relevant part of the Flickr response.

```typescript
const flickrResponse = {
  photos: {
    photo: photos,
  },
};
```

Now we instruct Cypress to intercept the Flickr API request and answer it with fake data. This setup happens in the test’s `beforeEach` block.

<aside class="margin-note">Fake server with route</aside>

First, we call `cy.server` to enable the interception of XMLHttpRequests. Second, we call `cy.route` to register a route for the Flickr API URL.

```typescript
beforeEach(() => {
  cy.visit('/');

  cy.server();
  cy.route({
    url: expectedUrl,
    response: flickrResponse,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  }).as('flickrSearchRequest');
});
```

`cy.route` can be called in different ways. Here, we pass a configuration object. We want to match a GET request with the given URL. (GET is the default method, we do not have to pass `method: 'GET'` explicitly.)

<aside class="margin-note">Response and headers</aside>

The `response` property specifies the fake response Cypress should send. Since the request to Flickr is a cross-origin, we also need to set the `Access-Control-Allow-Origin: *` header so Angular at the origin `http://localhost:4200` is allowed to read the response from the origin `https://www.flickr.com/`.

Finally, we give the request a name by calling `.as('flickrSearchRequest')`. This makes it possible to refer to the request later using the `@flickrSearchRequest` alias.

After this change, Cypress catches the request to Flickr and handles it by itself. The original Flickr API is not reached.

The existing, rather generic specs still pass. Before we make them more specific, we need to verify that Cypress found a match and intercepted the HTTP request. Because if it did not, the test would still pass.

<aside class="margin-note">Wait for request</aside>

We can achieve this by explicitly waiting for the request after starting the search.

```typescript
it('searches for a term', () => {
  cy.byTestId('search-term-input').first().clear().type(searchTerm);
  cy.byTestId('submit-search').first().click();

  cy.wait('@flickrSearchRequest');

  /* … */
});
```

`cy.wait('@flickrSearchRequest')` tells Cypress to wait for an XMLHttpRequest that matches the specified criteria. `@flickrSearchRequest` refers to the route we have defined above.

If Cypress does not find a matching request until a timeout, the test fails. If Cypress caught the request,
we know that the Angular application received the photos specified in the `photos` array.

<aside class="margin-note">Deterministic fake API</aside>

Let us write specific assertions that compare the photos in the result list to those in the `photos` array.

```typescript
cy.byTestId('photo-item-link')
  .should('have.length', 2)
  .each((link, index) => {
    expect(link.attr('href')).to.equal(
      `https://www.flickr.com/photos/${photos[index].owner}/${photos[index].id}`,
    );
  });
cy.byTestId('photo-item-image')
  .should('have.length', 2)
  .each((image, index) => {
    expect(image.attr('src')).to.equal(photos[index].url_q);
  });
```

We do the same for the other spec.

```typescript
it('shows the full photo', () => {
  cy.byTestId('search-term-input').first().clear().type(searchTerm);
  cy.byTestId('submit-search').first().click();

  cy.wait('@flickrSearchRequest');

  cy.byTestId('photo-item-link').first().click();
  cy.byTestId('full-photo').should('contain', searchTerm);
  cy.byTestId('full-photo-title').should('have.text', photo1.title);
  cy.byTestId('full-photo-tags').should('have.text', photo1.tags);
  cy.byTestId('full-photo-image').should('have.attr', 'src', photo1.url_m);
  cy.byTestId('full-photo-link').should('have.attr', 'href', photo1Link);
});
```

The spec ensures that the application under test outputs the data from the Flickr API. The `have.text` checks an element’s text content, whereas `have.attr` checks the `src` and `href` attributes.

We are done! Our end-to-end test fakes an API request in order to inspect the application deeply.

<aside class="margin-note">Intercept all requests</aside>

In the case of the Flickr search, we have intercepted an HTTP request to a third-party API. But Cypress allows to fake any request, including those to your own HTTP APIs.

The `cy.server` and `cy.route` commands only support intercepting XMLHttpRequest. In addition, Cypress has a new command named `cy.intercept` for intercepting all kinds of requests. Plus, `intercept` is easier to use and more powerful.

In the Flickr search repository, you will find the same test with `cy.server` / `cy.route` as well as with `cy.intercept` for comparison.

<div class="book-sources" markdown="1">
- [Flickr search E2E test with cy.server and cy.route](https://github.com/9elements/angular-flickr-search/blob/main/cypress/integration/flickr-search-stub-network.ts)
- [Flickr search E2E test with cy.intercept](https://github.com/9elements/angular-flickr-search/blob/main/cypress/integration/flickr-search-stub-network-intercept.ts)
- [Photo spec helper](https://github.com/9elements/angular-flickr-search/blob/main/src/app/spec-helpers/photo.spec-helper.ts)
- [Cypress documentation: Network Requests](https://docs.cypress.io/guides/guides/network-requests.html)
- [Cypress API reference: server](https://docs.cypress.io/api/commands/server.html)
- [Cypress API reference: route](https://docs.cypress.io/api/commands/route.html)
- [Cypress API reference: wait](https://docs.cypress.io/api/commands/wait.html)
- [Cypress API reference: intercept](https://docs.cypress.io/api/commands/intercept.html)
</div>

## End-to-end testing: Summary

End-to-end tests used to be expensive while the outcome was poor. It was hard to write tests that pass reliably when the application is working correctly. This time could not be invested in writing useful tests that uncover bugs and regressions.

For years, Protractor was the end-to-end testing framework most Angular developers relied on. With Cypress, a framework arose that sets new standards. Compared to Protractor, Cypress excels in developer experience and cost-effectiveness.

<aside class="margin-note">Protractor and Cypress examples</aside>

While this guide recommends to start with Cypress, WebDriver-based frameworks are still useful if you need to test a broad range of browsers. For all Cypress tests in this guide, you will find equivalent Protractor tests in the example repositories.

Even with Cypress, end-to-end tests are much more complex and error-prone than unit and integration tests with Jasmine and Karma. Then again, end-to-end tests are highly effective to test a feature under realistic circumstances.

<div class="book-sources" markdown="1">
- [Counter: Cypress tests](https://github.com/9elements/angular-workshop/tree/main/cypress)
- [Counter: Protractor tests](https://github.com/9elements/angular-workshop/tree/main/e2e)
- [Flickr search: Cypress tests](https://github.com/9elements/angular-flickr-search/tree/main/cypress)
- [Flickr search: Protractor tests](https://github.com/9elements/angular-flickr-search/tree/main/e2e)
</div>

<p id="next-chapter-link"><a href="../summary/#summary">Summary</a></p>
