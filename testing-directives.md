---
layout: chapter
title: Testing Directives
description: How to write automated tests for Attribute and Structural Directives
---

# Testing Directives

<aside class="learning-objectives" markdown="1">
Learning objectives

- Testing the effect of an Attribute Directive
- Testing complex Structural Directives with Inputs and templates
- Providing a host Component for testing Attribute and Structural Directives
</aside>

Angular beginners quickly encounter four core concepts: Modules, Components, Services and Pipes. A lesser known core concept are Directives. Without knowing, even beginners are using Directives, because Directives are everywhere.

In Angular, there are three types of Directives:

1. A **Component** is a Directive with a template. A Component typically uses an element type selector, like `app-counter`. Angular then looks for `app-counter` elements and renders the Component template into these host elements.
2. An **Attribute Directive** adds logic to an existing host element in the DOM. Examples for built-in Attribute Directives are `NgClass` and `NgStyle`.
3. A **Structural Directive** alters the structure of the DOM, meaning it adds and removes elements programmatically. Examples for built-in Structural Directives are `NgIf`, `NgFor` and `NgSwitch`.

We have already tested Components. We have yet to test the two other types of Directives.

## Testing Attribute Directives

The name Attribute Directive comes from the attribute selector, for example `[ngModel]`. An Attribute Directive does not have a template and cannot alter the DOM structure.

We have already mentioned the built-in Attribute Directives `NgClass` and `NgStyle`. In addition, both Template-driven and Reactive Forms rely heavily on Attribute Directives: `NgForm`, `NgModel`, `FormGroupDirective`, `FormControlName`, etc.

<aside class="margin-note">Styling logic</aside>

Attributes Directives are often used for changing the style of an element, either directly with inline styles or indirectly with classes.

Most styling logic can be implemented using CSS alone, no JavaScript code is necessary. But sometimes JavaScript is required to set inline styles or add classes programmatically.

### ThresholdWarningDirective

None of our [example applications](../example-applications/#example-applications) contain an Attribute Directive, so we are introducing and testing the **`ThresholdWarningDirective`**.

This Directive applies to `<input type="number">` elements. It toggles a class if the picked number exceeds a given threshold. If the number is higher than the threshold, the field should be marked visually.

Note that numbers above the threshold are valid input. The `ThresholdWarningDirective` does not add a form control validator. We merely want to warn the user so they check the input twice.

<div class="book-sources" markdown="1">
- [ThresholdWarningDirective: Source code](https://github.com/molily/threshold-warning-directive/blob/main/src/app/threshold-warning.directive.ts)
- [ThresholdWarningDirective: Run the app](https://molily.github.io/threshold-warning-directive/)
</div>

<button class="load-iframe">
See the ThresholdWarningDirective in action
</button>

<script type="text/x-template">
<p class="responsive-iframe">
<iframe src="https://molily.github.io/threshold-warning-directive/" class="responsive-iframe__iframe"></iframe>
</p>
</script>

Enter a number greater than 10 to see the effect.

This is the Directive’s code:

```typescript
import {
  Directive, ElementRef, HostBinding, HostListener, Input
} from '@angular/core';

@Directive({
  selector: '[appThresholdWarning]',
})
export class ThresholdWarningDirective {
  @Input()
  public appThresholdWarning: number | null = null;

  @HostBinding('class.overThreshold')
  public overThreshold = false;

  @HostListener('input')
  public inputHandler(): void {
    this.overThreshold =
      this.appThresholdWarning !== null &&
      this.elementRef.nativeElement.valueAsNumber > this.appThresholdWarning;
  }

  constructor(private elementRef: ElementRef<HTMLInputElement>) {}
}
```

This is how we apply the Directive to an element:

```typescript
<input type="number" [appThresholdWarning]="10" />
```

This means: If the user enters a number that is greater than 10, mark the field with a visual warning.

One bit is missing: the styles for the visual warning.

```css
input[type='number'].overThreshold {
  background-color: #fe9;
}
```

Before we write the test for the Directive, let us walk through the implementation parts.

<aside class="margin-note">Input of the same name</aside>

The `ThresholdWarningDirective` is applied with an attribute binding `[appThresholdWarning]="…"`. It receives the attribute value as an Input of the same name. This is how the threshold is configured.

```typescript
@Input()
public appThresholdWarning: number | null = null;
```

<aside class="margin-note" markdown="1">
  `input` event
</aside>

Using `HostListener`, the Directive listens for `input` event on the host element. When the user changes the field value, the `inputHandler` method is called.

The `inputHandler` gets the field value and checks whether it is over the threshold. The result is stored in the `overThreshold` boolean property.

```typescript
@HostListener('input')
public inputHandler(): void {
  this.overThreshold =
    this.appThresholdWarning !== null &&
    this.elementRef.nativeElement.valueAsNumber > this.appThresholdWarning;
}
```

<aside class="margin-note">Read value</aside>

To access the host element, we use the `ElementRef` dependency. `ElementRef` is a wrapper around the host element’s DOM node. `this.elementRef.nativeElement` yields the `input` element’s DOM node. `valueAsNumber` contains the input value as a number.

<aside class="margin-note">Toggle class</aside>

Last but not least, the `overThreshold` property is bound to a class of the same name using `HostBinding`. This is how the class is toggled.

```typescript
@HostBinding('class.overThreshold')
public overThreshold = false;
```

### ThresholdWarningDirective test

Now that we understand what is going on, we need to replicate the workflow in our test.

<aside class="margin-note">Host Component</aside>

First of all, Attribute and Structural Directives need an existing host element they are applied to. When testing these Directives, we use a **host Component** that renders the host element. For example, the `ThresholdWarningDirective` needs an `<input type="number">` host element.

```typescript
@Component({
  template: `
    <input type="number"
      [appThresholdWarning]="10" />
  `
})
class HostComponent {}
```

We are going to render this Component. We need a standard [Component test setup](../testing-components/#configuring-the-testing-module) using the `TestBed`.

```typescript
describe('ThresholdWarningDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ThresholdWarningDirective, HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  /* … */
});
```

When configuring the testing Module, we declare both the Directive under test and the host Component. Just like in a Component test, we render the Component and obtain a `ComponentFixture`.

<aside class="margin-note">Find input element</aside>

In the following specs, we need to access the input element. We use the standard approach: a `data-testid` attribute and the `findEl` [testing helper](../testing-components/#testing-helpers).

For convenience, we pick the input element in the `beforeEach` block. We save it in a shared variable named `input`.

```typescript
@Component({
  template: `
    <input type="number"
      [appThresholdWarning]="10"
      data-testid="input" />
  `
})
class HostComponent {}

describe('ThresholdWarningDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ThresholdWarningDirective, HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    input = findEl(fixture, 'input').nativeElement;
  });

  /* … */
});
```

<aside class="margin-note">Check class</aside>

The first spec ensures that the Directive does nothing when the user has not touched the input. Using the element’s [classList](https://developer.mozilla.org/en-US/docs/Web/API/Element/classList), we expect the class `overThreshold` to be absent.

```typescript
it('does not set the class initially', () => {
  expect(input.classList.contains('overThreshold')).toBe(false);
});
```

The next spec enters a number over the threshold. To simulate the user input, we use our handy testing helper `setFieldValue`. Then, the spec expects the class to be present.

```typescript
it('adds the class if the number is over the threshold', () => {
  setFieldValue(fixture, 'input', '11');
  fixture.detectChanges();
  expect(input.classList.contains('overThreshold')).toBe(true);
});
```

`setFieldValue` triggers a fake `input` event. This triggers the Directive’s event handler. `11` is greater than the threshold `10`, so the class is added. We still need to call `detectChanges` so the DOM is updated.

The last spec makes sure that the threshold is still considered as a safe value. No warning should be shown.

```typescript
it('removes the class if the number is at the threshold', () => {
  setFieldValue(fixture, 'input', '10');
  fixture.detectChanges();
  expect(input.classList.contains('overThreshold')).toBe(false);
});
```

This is it! Testing the `ThresholdWarningDirective` is like testing a Component. The difference is that the Component serves as a host for the Directive.

The full spec for the `ThresholdWarningDirective` looks like this:

```typescript
import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { findEl, setFieldValue } from './spec-helpers/element.spec-helper';
import { ThresholdWarningDirective } from './threshold-warning.directive';

@Component({
  template: `
    <input type="number"
      [appThresholdWarning]="10"
      data-testid="input" />
  `
})
class HostComponent {}

describe('ThresholdWarningDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ThresholdWarningDirective, HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    input = findEl(fixture, 'input').nativeElement;
  });

  it('does not set the class initially', () => {
    expect(input.classList.contains('overThreshold')).toBe(false);
  });

  it('adds the class if the number is over the threshold', () => {
    setFieldValue(fixture, 'input', '11');
    fixture.detectChanges();
    expect(input.classList.contains('overThreshold')).toBe(true);
  });

  it('removes the class if the number is at the threshold', () => {
    setFieldValue(fixture, 'input', '10');
    fixture.detectChanges();
    expect(input.classList.contains('overThreshold')).toBe(false);
  });
});
```

<div class="book-sources" markdown="1">
- [ThresholdWarningDirective: implementation code](https://github.com/molily/threshold-warning-directive/blob/main/src/app/threshold-warning.directive.ts )
- [ThresholdWarningDirective: test code](https://github.com/molily/threshold-warning-directive/blob/main/src/app/threshold-warning.directive.spec.ts)
</div>

## Testing Structural Directives

A Structural Directive does not have a template like a Component, but operates on an internal `ng-template`. The Directive renders the template into the DOM programmatically, passing context data to the template.

<aside class="margin-note">Render template programmatically</aside>

The prime examples emonstrate what Structural Directives are capable of:

- The `NgIf` Directive decides whether the template is rendered or not.
- The `NgFor` Directive walks over a list of items and renders the template repeatedly for each item.

A Structural Directive uses an attribute selector, like `[ngIf]`. The attribute is applied to a host element with the special asterisk syntax, for example `*ngIf`. Internally, this is translated to `<ng-template [ngIf]="…"> … </ng-template>`.

This guide assumes that you roughly understand how Structural Directives work and how the microsyntax translates to Directive Inputs. Please refer to the [comprehensive official guide on Structural Directives](https://angular.io/guide/structural-directives).

### PaginateDirective

We are introducing and testing the `PaginateDirective`, a complex Structural Directive.

<aside class="margin-note" markdown="1">
  `NgFor` with Pagination
</aside>

`PaginateDirective` works similar to `NgFor`, but does not render all list items at once. It spreads the items over pages, usually called **pagination**.

Per default, only ten items are rendered. The user can turn the pages by clicking on “next” or “previous” buttons.

<div class="book-sources" markdown="1">
- [PaginateDirective: Source code](https://github.com/molily/paginate-directive/blob/main/src/app/paginate.directive.ts)
- [PaginateDirective: Run the app](https://molily.github.io/paginate-directive/)
</div>

<button class="load-iframe">
See the PaginateDirective in action
</button>

<script type="text/x-template">
<p class="responsive-iframe">
<iframe src="https://molily.github.io/paginate-directive/" class="responsive-iframe__iframe"></iframe>
</p>
</script>

Before writing the test, we need to understand the outer structure of `PaginateDirective` first.

The simplest use of the Directive looks like this:

```html
<ul>
  <li *appPaginate="let item of items">
    {% raw %}{{ item }}{% endraw %}
  </li>
</ul>
```

This is similar to the `NgFor` directive. Assuming that `items` is an array of numbers (`[1, 2, 3, …]`), the example above renders the first 10 numbers in the array.

The asterisk syntax `*appPaginate` and the so-called *microsyntax* `let item of items` is *syntactic sugar*. This is a shorter and nicer way to write something complex. Internally, Angular translates the code to the following:

```html
<ng-template appPaginate let-item [appPaginateOf]="items">
  <li>
    {% raw %}{{ item }}{% endraw %}
  </li>
</ng-template>
```

There is an `ng-template` with an attribute `appPaginate` and an attribute binding `appPaginateOf`. Also there is a template input variable called `item`.

<aside class="margin-note">Render template for each item</aside>

As mentioned, a Structural Directive does not have its own template, but operates on an `ng-template` and renders it programmatically. Our `PaginateDirective` works with the `ng-template` shown above. The Directive renders the template for each item on the current page.

Now that we have seen Angular’s internal representation, we can understand the structure of the `PaginateDirective` class:

```typescript
@Directive({
  selector: '[appPaginate]',
})
export class PaginateDirective<T> implements OnChanges {
  @Input()
  public appPaginateOf: T[] = [];

  /* … */
}
```

The Directive uses the `[appPaginate]` attribute selector and has an Input called `appPaginateOf`. By writing the microsyntax `*appPaginate="let item of items"`, we actually set the `appPaginateOf` Input to the value `items`.

<aside class="margin-note">Directive Inputs</aside>

The `PaginateDirective` has a configuration option named `perPage`. It specifies how many items are visible per page.

Per default, there are ten items on a page. To change it, we set `perPage: …` in the microsyntax:

```html
<ul>
  <li *appPaginate="let item of items; perPage: 5">
    {% raw %}{{ item }}{% endraw %}
  </li>
</ul>
```

This translates to:

```html
<ng-template
  appPaginate
  let-item
  [appPaginateOf]="items"
  [appPaginatePerPage]="5">
  <li>
    {% raw %}{{ item }}{% endraw %}
  </li>
</ng-template>
```

`perPage` translates to an Input named `appPaginatePerPage` in the Directive’s code:

```typescript
@Directive({
  selector: '[appPaginate]',
})
export class PaginateDirective<T> implements OnChanges {
  @Input()
  public appPaginateOf: T[] = [];

  @Input()
  public appPaginatePerPage = 10;

  /* … */
}
```

This is how built-in Structural Directives like `NgIf` and `NgFor` work as well.

Now it gets more complicated. Since we want to paginate the items, we need user controls to turn the pages – in addition to rendering the items.

Again, a Structural Directive lacks a template. `PaginateDirective` cannot render the “next” and “previous” buttons itself. And to remain flexible, it should not render specific markup. The Component that uses the Directive should decide how the controls look.

<aside class="margin-note">Pass another template</aside>

We solve this by passing the controls as a template to the Directive. In particular, we pass a reference to a separate `ng-template`. This will be the second template the Directive operates on.

This is how the controls template could look like:

```html
<ng-template
  #controls
  let-previousPage="previousPage"
  let-page="page"
  let-pages="pages"
  let-nextPage="nextPage"
>
  <button (click)="previousPage()">
    Previous page
  </button>
  {% raw %}{{ page }} / {{ pages }}{% endraw %}
  <button (click)="nextPage()">
    Next page
  </button>
</ng-template>
```

`#controls` sets a [template reference variable](https://angular.io/guide/template-reference-variables). This means we can further reference the template by the name `controls`.

<aside class="margin-note">Context object</aside>

The Directive renders the controls template with a *context* object that implements the following TypeScript interface:

```typescript
interface ControlsContext {
  page: number;
  pages: number;
  previousPage(): void;
  nextPage(): void;
}
```

`page` is the current page number. `pages` is the total number of pages. `previousPage` and `nextPage` are functions for turning the pages.

<aside class="margin-note">Use properties from context</aside>

The `ng-template` takes these properties from the context and saves them in local variables of the same name:

```
let-previousPage="previousPage"
let-page="page"
let-pages="pages"
let-nextPage="nextPage"
```

This means: Take the context property `previousPage` and make it available in the template under the name `previousPage`. And so on.

The content of the template is rather simple. It renders two buttons for the page turning, using the functions as click handlers. It outputs the current page number and the number of total pages.

```html
<button (click)="previousPage()">
  Previous page
</button>
{% raw %}{{ page }} / {{ pages }}{% endraw %}
<button (click)="nextPage()">
  Next page
</button>
```

Last but not least, we pass the template to the `PaginateDirective` using the microsyntax:

```html
<ul>
  <li *appPaginate="let item of items; perPage: 5; controls: controls">
    {% raw %}{{ item }}{% endraw %}
  </li>
</ul>
```

This translates to:

```html
<ng-template
  appPaginate
  let-item
  [appPaginateOf]="items"
  [appPaginatePerPage]="5"
  [appPaginateControls]="controls">
  <li>
    {% raw %}{{ item }}{% endraw %}
  </li>
</ng-template>
```

`controls: …` in the microsyntax translates to an Input named `appPaginateControls`. This concludes the Directive‘s outer structure:

```typescript
@Directive({
  selector: '[appPaginate]',
})
export class PaginateDirective<T> implements OnChanges {
  @Input()
  public appPaginateOf: T[] = [];

  @Input()
  public appPaginatePerPage = 10;

  @Input()
  public appPaginateControls?: TemplateRef<ControlsContext>;

  /* … */
}
```

The inner workings of the `PaginateDirective` are not relevant for testing, so we will not discuss them in detail here. Please refer to the Angular guide [Write a structural directive](https://angular.io/guide/structural-directives#creating-a-structural-directive) for a general explanation.

<div class="book-sources" markdown="1">
- [PaginateDirective: implementation code](https://github.com/molily/paginate-directive/blob/main/src/app/paginate.directive.ts)
</div>

### PaginateDirective test

We have explored all features of `PaginateDirective` and are now ready to test them!

<aside class="margin-note">Host Component</aside>

First, we need a host Component that applies the Structural Directive under test. We let it render a list of ten numbers, three numbers on each page.

```typescript
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

@Component({
  template: `
    <ul>
      <li
        *appPaginate="let item of items; perPage: 3"
        data-testid="item"
      >
        {% raw %}{{ item }}{% endraw %}
      </li>
    </ul>
  `,
})
class HostComponent {
  public items = items;
}
```

<aside class="margin-note">Controls template</aside>

Since we also want to test the custom controls feature, we need to pass a controls template. We will use the simple controls discussed above.

```typescript
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

@Component({
  template: `
    <ul>
      <li
        *appPaginate="let item of items; perPage: 3; controls: controls"
        data-testid="item"
      >
        {% raw %}{{ item }}{% endraw %}
      </li>
    </ul>
    <ng-template
      #controls
      let-previousPage="previousPage"
      let-page="page"
      let-pages="pages"
      let-nextPage="nextPage"
    >
      <button
        (click)="previousPage()"
        data-testid="previousPage">
        Previous page
      </button>
      <span data-testid="page">{% raw %}{{ page }}{% endraw %}</span>
      /
      <span data-testid="pages">{% raw %}{{ pages }}{% endraw %}</span>
      <button
        (click)="nextPage()"
        data-testid="nextPage">
        Next page
      </button>
    </ng-template>
  `,
})
class HostComponent {
  public items = items;
}
```

The template code already contains `data-testid` attributes. This is how we find and examine the elements in the test (see [Querying the DOM with test ids](../testing-components/#querying-the-dom-with-test-ids)).

This is quite a setup, but after all, we want to test the `PaginateDirective` under realistic conditions.

The test suite configures a testing Module, declares both the `HostComponent` and the `PaginateDirective` and renders the `HostComponent`:

```typescript
describe('PaginateDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaginateDirective, HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  /* … */
});
```

This is a standard Component test setup – nothing special yet.

The first spec verifies that the Directive renders the items on the first page, in our case the numbers 1, 2 and 3.

We have marked the item element with `data-testid="item"`. We use the [`findEls` test helper](https://github.com/9elements/angular-workshop/blob/main/src/app/spec-helpers/element.spec-helper.ts) to find all elements with said test id.

<aside class="margin-note">Expect rendered items</aside>

We expect to find three items. Then we examine the text content of each item and expect that it matches the item in the number list, respectively.

```typescript
it('renders the items of the first page', () => {
  const els = findEls(fixture, 'item');
  expect(els.length).toBe(3);

  expect(els[0].nativeElement.textContent.trim()).toBe('1');
  expect(els[1].nativeElement.textContent.trim()).toBe('2');
  expect(els[2].nativeElement.textContent.trim()).toBe('3');
});
```

Already, the expectations are repetitive and hard to read. So we introduce a little helper function.

```typescript
function expectItems(
  elements: DebugElement[],
  expectedItems: number[],
): void {
  elements.forEach((element, index) => {
    const actualText = element.nativeElement.textContent.trim();
    expect(actualText).toBe(String(expectedItems[index]));
  });
}
```

This lets us rewrite the spec so it is easier to grasp:

```typescript
it('renders the items of the first page', () => {
  const els = findEls(fixture, 'item');
  expect(els.length).toBe(3);
  expectItems(els, [1, 2, 3]);
});
```

<aside class="margin-note">Check controls</aside>

The next spec proves that the controls template is rendered passing the current page and the total number of pages.

The elements have have a `data-testid="page"` and `data-testid="pages"`, respectively. We use the [`expectText` testing helper](../testing-components/#testing-helpers) to check their text content.

```typescript
it('renders the current page and total pages', () => {
  expectText(fixture, 'page', '1');
  expectText(fixture, 'pages', '4');
});
```

Three more specs deal with the controls for turning pages. Let us start with the “next” button.

```typescript
it('shows the next page', () => {
  click(fixture, 'nextPage');
  fixture.detectChanges();

  const els = findEls(fixture, 'item');
  expect(els.length).toBe(3);
  expectItems(els, [4, 5, 6]);
});
```

<aside class="margin-note">Turn pages</aside>

We simulate a click on the “next” button using the `click` testing helper. Then we start Angular’s change detection so the Component together with the Directive are re-rendered.

Finally, we verify that the Directive has rendered the next three items, the numbers 4, 5 and 6.

The spec for the “previous” button looks similar. First, we jump to the second page, then back to the first page.

```typescript
it('shows the previous page', () => {
  click(fixture, 'nextPage');
  click(fixture, 'previousPage');
  fixture.detectChanges();

  const els = findEls(fixture, 'item');
  expect(els.length).toBe(3);
  expectItems(els, [1, 2, 3]);
});
```

<aside class="margin-note">Stress test</aside>

We have now covered the Directive’s important behavior. Time for testing edge cases! Does the Directive behave correctly if we click on the “previous” button on the first page and the “next” button on the last page?

```typescript
it('checks the pages bounds', () => {
  click(fixture, 'nextPage'); // -> 2
  click(fixture, 'nextPage'); // -> 3
  click(fixture, 'nextPage'); // -> 4
  click(fixture, 'nextPage'); // -> 4
  click(fixture, 'previousPage'); // -> 3
  click(fixture, 'previousPage'); // -> 2
  click(fixture, 'previousPage'); // -> 1
  click(fixture, 'previousPage'); // -> 1
  fixture.detectChanges();

  // Expect that the first page is visible again
  const els = findEls(fixture, 'item');
  expect(els.length).toBe(3);
  expectItems(els, [1, 2, 3]);
});
```

By clicking on the buttons, we jump forward to the last page and backward to the first page again.

This is it! Here is the full test code:

```typescript
import { Component, DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  findEls,
  expectText,
  click,
} from './spec-helpers/element.spec-helper';
import { PaginateDirective } from './paginate.directive';

const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

@Component({
  template: `
    <ul>
      <li
        *appPaginate="let item of items; perPage: 3; controls: controls"
        data-testid="item"
      >
        {% raw %}{{ item }}{% endraw %}
      </li>
    </ul>
    <ng-template
      #controls
      let-previousPage="previousPage"
      let-page="page"
      let-pages="pages"
      let-nextPage="nextPage"
    >
      <button (click)="previousPage()" data-testid="previousPage">
        Previous page
      </button>
      <span data-testid="page">{% raw %}{{ page }}{% endraw %}</span>
      /
      <span data-testid="pages">{% raw %}{{ pages }}{% endraw %}</span>
      <button (click)="nextPage()" data-testid="nextPage">
        Next page
      </button>
    </ng-template>
  `,
})
class HostComponent {
  public items = items;
}

function expectItems(
  elements: DebugElement[],
  expectedItems: number[],
): void {
  elements.forEach((element, index) => {
    const actualText = element.nativeElement.textContent.trim();
    expect(actualText).toBe(String(expectedItems[index]));
  });
}

describe('PaginateDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaginateDirective, HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders the items of the first page', () => {
    const els = findEls(fixture, 'item');
    expect(els.length).toBe(3);
    expectItems(els, [1, 2, 3]);
  });

  it('renders the current page and total pages', () => {
    expectText(fixture, 'page', '1');
    expectText(fixture, 'pages', '4');
  });

  it('shows the next page', () => {
    click(fixture, 'nextPage');
    fixture.detectChanges();

    const els = findEls(fixture, 'item');
    expect(els.length).toBe(3);
    expectItems(els, [4, 5, 6]);
  });

  it('shows the previous page', () => {
    click(fixture, 'nextPage');
    click(fixture, 'previousPage');
    fixture.detectChanges();

    const els = findEls(fixture, 'item');
    expect(els.length).toBe(3);
    expectItems(els, [1, 2, 3]);
  });

  it('checks the pages bounds', () => {
    click(fixture, 'nextPage'); // -> 2
    click(fixture, 'nextPage'); // -> 3
    click(fixture, 'nextPage'); // -> 4
    click(fixture, 'previousPage'); // -> 3
    click(fixture, 'previousPage'); // -> 2
    click(fixture, 'previousPage'); // -> 1
    fixture.detectChanges();

    // Expect that the first page is visible again
    const els = findEls(fixture, 'item');
    expect(els.length).toBe(3);
    expectItems(els, [1, 2, 3]);
  });
});
```

`PaginateDirective` is a complex Structural Directive that requires a complex test setup. Once we have created a suitable host Component, we can test it using our familiar testing helpers. The fact that the logic resides in the Directive is not relevant for the specs.

<div class="book-sources" markdown="1">
- [PaginateDirective: implementation code](https://github.com/molily/paginate-directive/blob/main/src/app/paginate.directive.ts)
- [PaginateDirective: test code](https://github.com/molily/paginate-directive/blob/main/src/app/paginate.directive.spec.ts)
</div>

<p id="next-chapter-link"><a href="../testing-modules/#testing-modules">Testing Modules</a></p>
