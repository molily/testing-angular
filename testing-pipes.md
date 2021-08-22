---
layout: chapter
title: Testing Pipes
description: How to test simple and complex, pure and impure Angular Pipes
---

# Testing Pipes

<aside class="learning-objectives" markdown="1">
Learning objectives

- Verifying the output of synchronous, pure Pipes
- Testing asynchronous, impure Pipes that load data from a Service
</aside>

An Angular Pipe is a special function that is called from a Component template. Its purpose is to transform a value: You pass a value to the Pipe, the Pipe computes a new value and returns it.

The name Pipe originates from the vertical bar “\|” that sits between the value and the Pipe’s name. The concept as well as the “\|” syntax originate from Unix pipes and Unix shells.

In this example, the value from `user.birthday` is transformed by the `date` Pipe:

```
{% raw %}{{ user.birthday | date }}{% endraw %}
```

<aside class="margin-note">Formatting</aside>

Pipes are often used for internationalization, including translation of labels and messages, formatting of dates, times and various numbers. In these cases, the Pipe input value should not be shown to the user. The output value is user-readable.

Examples for built-in Pipes are `DatePipe`, `CurrencyPipe` and `DecimalPipe`. They format dates, amounts of money and numbers, respectively, according to the localization settings. Another well-known Pipe is the `AsyncPipe` which unwraps an Observable or Promise.

<aside class="margin-note">Pure Pipes</aside>

Most Pipes are *pure*, meaning they merely take a value and compute a new value. They do not have *side effects*: They do not change the input value and they do not change the state of other application parts. Like pure functions, pure Pipes are relatively easy to test.

## GreetPipe

Let us study the structure of a Pipe first to find ways to test it. In essence, a Pipe is class with a public `transform` method. Here is a simple Pipe that expects a name and greets the user.

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'greet' })
export class GreetPipe implements PipeTransform {
  transform(name: string): string {
    return `Hello, ${name}!`;
  }
}
```

In a Component template, we transform a value using the Pipe:

```
{% raw %}{{ 'Julie' | greet }}{% endraw %}
```

The `GreetPipe` take the string `'Julie'` and computes a new string, `'Hello, Julie!'`.

<aside class="margin-note">Simple vs. complex setup</aside>

There are two important ways to test a Pipe:

1. Create an instance of the Pipe class manually. Then call the `transform` method.

   This way is fast and straight-forward. It requires minimal setup.

2. Set up a `TestBed`. Render a host Component that uses the Pipe. Then check the text content in the DOM.

   This way closely mimics how the Pipe is used in practice. It also tests the name of the Pipe, as declared in the `@Pipe()` decorator.

Both ways allow to test Pipes that depend on Services. Either we provide the original dependencies, writing an integration test. Or we provide fake dependencies, writing a unit test.

## GreetPipe test

The `GreetPipe` does not have any dependencies. We opt for the first way and write a unit test that examines the single instance.

First, we create a Jasmine test suite. In a `beforeEach` block, we create an instance of `GreetPipe`. In the specs, we scrutinize the `transform` method.

```typescript
describe('GreetPipe', () => {
  let greetPipe: GreetPipe;

  beforeEach(() => {
    greetPipe = new GreetPipe();
  });

  it('says Hello', () => {
    expect(greetPipe.transform('Julie')).toBe('Hello, Julie!');
  });
});
```

We call the `transform` method with the string `'Julie'` and expect the output `'Hello, Julie!'`.

This is everything that needs to be tested in the `GreetPipe` example. If the `transform` method contains more logic that needs to be tested, we add more specs that call the method with different input.

## Testing Pipes with dependencies

Many Pipes depend on local settings, including the user interface language, date and number formatting rules, as well as the selected country, region or currency.

We are introducing and testing the `TranslatePipe`, a complex Pipe with a Service dependency.

<div class="book-sources" markdown="1">
- [TranslatePipe: Source code](https://github.com/molily/translate-pipe)
- [TranslatePipe: Run the app](https://molily.github.io/translate-pipe/)
</div>

<button class="load-iframe">
See the TranslatePipe in action
</button>

<script type="text/x-template">
<p class="responsive-iframe">
<iframe src="https://molily.github.io/translate-pipe/" class="responsive-iframe__iframe"></iframe>
</p>
</script>

The example application lets you change the user interface language during runtime. A popular solution for this task is the [ngx-translate](https://github.com/ngx-translate/core) library. For the purpose of this guide, we will adopt ngx-translate’s proven approach but implement and test the code ourselves.

### TranslateService

The current language is stored in the `TranslateService`. This Service also loads and holds the translations for the current language.

The translations are stored in a map of keys and translation strings. For example, the key `greeting` translates to “Hello!” if the current language is English.

The `TranslateService` looks like this:

```typescript
import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';

export interface Translations {
  [key: string]: string;
}

@Injectable()
export class TranslateService {
  /** The current language */
  private currentLang = 'en';

  /** Translations for the current language */
  private translations: Translations | null = null;

  /** Emits when the language change */
  public onTranslationChange = new EventEmitter<Translations>();

  constructor(private http: HttpClient) {
    this.loadTranslations(this.currentLang);
  }

  /** Changes the language */
  public use(language: string): void {
    this.currentLang = language;
    this.loadTranslations(language);
  }

  /** Translates a key asynchronously */
  public get(key: string): Observable<string> {
    if (this.translations) {
      return of(this.translations[key]);
    }
    return this.onTranslationChange.pipe(
      take(1),
      map((translations) => translations[key])
    );
  }

  /** Loads the translations for the given language */
  private loadTranslations(language: string): void {
    this.translations = null;
    this.http
      .get<Translations>(`assets/${language}.json`)
      .subscribe((translations) => {
        this.translations = translations;
        this.onTranslationChange.emit(translations);
      });
  }
}
```

This is what the Service provides:

1. `use` method: Set the current language and load the translations as JSON via HTTP.
2. `get` method: Get the translation for a key.
3. `onTranslationChange` `EventEmitter`: Observing changes on the translations as a result of `use`.

In the example project, the `AppComponent` depends on the `TranslateService`. On creation, the Service loads the English translations. The `AppComponent` renders a select field allowing the user to change the language.

<div class="book-sources" markdown="1">
- [TranslateService: implementation code](https://github.com/molily/translate-pipe/blob/main/src/app/translate.service.ts)
- [TranslateService: test code](https://github.com/molily/translate-pipe/blob/main/src/app/translate.service.spec.ts)
</div>

### TranslatePipe

To show a translated label, a Component could call the Service’s `get` method manually for each translation key. Instead, we introduce the `TranslatePipe` to do the heavy lifting. It lets us write:

```
{% raw %}{{ 'greeting' | translate }}{% endraw %}
```

This translates the key `'greeting'`.

Here is the code:

```typescript
import {
  ChangeDetectorRef,
  OnDestroy,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { TranslateService } from './translate.service';

@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private lastKey: string | null = null;
  private translation: string | null = null;

  private onTranslationChangeSubscription: Subscription;
  private getSubscription: Subscription | null = null;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private translateService: TranslateService
  ) {
    this.onTranslationChangeSubscription =
      this.translateService.onTranslationChange.subscribe(
        () => {
          if (this.lastKey) {
            this.getTranslation(this.lastKey);
          }
        }
      );
  }

  public transform(key: string): string | null {
    if (key !== this.lastKey) {
      this.lastKey = key;
      this.getTranslation(key);
    }
    return this.translation;
  }

  private getTranslation(key: string): void {
    this.getSubscription?.unsubscribe();
    this.getSubscription = this.translateService
      .get(key)
      .subscribe((translation) => {
        this.translation = translation;
        this.changeDetectorRef.markForCheck();
        this.getSubscription = null;
      });
  }

  public ngOnDestroy(): void {
    this.onTranslationChangeSubscription.unsubscribe();
    this.getSubscription?.unsubscribe();
  }
}
```

<aside class="margin-note">Async translation</aside>

The `TranslatePipe` is *impure* because the translations are loaded asynchronously. When called the first time, the `transform` method cannot return the correct translation synchronously. It calls the `TranslateService`’s `get` method which returns an Observable.

<aside class="margin-note">Trigger change detection</aside>

Once the translation is loaded, the `TranslatePipe` saves it and notifies the Angular change detector. In particular, it marks the corresponding view as changed by calling [`ChangeDetectorRef`’s `markForCheck`](https://angular.io/api/core/ChangeDetectorRef#markForCheck) method.

In turn, Angular re-evaluates every expression that uses the Pipe, like `'greeting' | translate`, and calls the `transform` method again. Finally, `transform` returns the right translation synchronously.

<aside class="margin-note">Translation changes</aside>

The same process happens when the user changes the language and new translations are loaded. The Pipe subscribes to `TranslateService`’s `onTranslationChange` and calls the `TranslateService` again to get the new translation.

<div class="book-sources" markdown="1">
- [TranslatePipe: implementation code](https://github.com/molily/translate-pipe/blob/main/src/app/translate.pipe.ts)
- [Angular API reference: ChangeDetectorRef](https://angular.io/api/core/ChangeDetectorRef)
</div>

### TranslatePipe test

Now let us test the `TranslatePipe`! We can either write a test that integrates the `TranslateService` dependency. Or we write a unit test that replaces the dependency with a fake.

`TranslateService` performs HTTP requests to load the translations. We should avoid these side effects when testing `TranslatePipe`. So let us fake the Service to write a unit test.

```typescript
let translateService: Pick<
  TranslateService, 'onTranslationChange' | 'get'
>;
/* … */
translateService = {
  onTranslationChange: new EventEmitter<Translations>(),
  get(key: string): Observable<string> {
    return of(`Translation for ${key}`);
  },
};
```

The fake is a partial implementation of the original. The `TranslatePipe` under test only needs the `onTranslationChange` property and the `get` method. The latter returns a fake translation including the key so we can test that the key was passed correctly.

<aside class="margin-note">Host Component</aside>

Now we need to decide whether to test the Pipe directly or within a host Component. Neither solution is significantly easier or more robust. You will find both solutions in the example project. In this guide, we will discuss the solution with `TestBed` and host Component.

Let us start with the host Component:

```typescript
const key1 = 'key1';
const key2 = 'key2';

@Component({
  template: '{% raw %}{{ key | translate }}{% endraw %}',
})
class HostComponent {
  public key = key1;
}
```

This Component uses the `TranslatePipe` to translate its `key` property. Per default, it is set to `key1`. There is also a second constant `key2` for testing the key change later.

Let us set up the test suite:

```typescript
describe('TranslatePipe: with TestBed and HostComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let translateService: Pick<
    TranslateService, 'onTranslationChange' | 'get'
  >;

  beforeEach(async () => {
    translateService = {
      onTranslationChange: new EventEmitter<Translations>(),
      get(key: string): Observable<string> {
        return of(`Translation for ${key}`);
      },
    };

    await TestBed.configureTestingModule({
      declarations: [TranslatePipe, HostComponent],
      providers: [
        { provide: TranslateService, useValue: translateService }
      ],
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);
    fixture = TestBed.createComponent(HostComponent);
  });

  /* … */
});
```

In the testing Module, we declare the Pipe under test and the `HostComponent`. For the `TranslateService`, we provide a fake object instead. Just like in a Component test, we create the Component and examine the rendered DOM.

<aside class="margin-note">Sync and async translation</aside>

What needs to be tested? We need to check that `{% raw %}{{ key | translate }}{% endraw %}` evaluates to `Translation for key1`. There are two cases that need to be tested though:

1. The translations are already loaded. The Pipe’s `transform` method returns the correct translation synchronously. The Observable returned by `TranslateService`’s `get` emits the translation and completes immediately.
2. The translations are pending. `transform` returns `null` (or an outdated translation). The Observable completes at any time later. Then, the change detection is triggered, `transform` is called the second time and returns the correct translation.

In the test, we write specs for both scenarios:

```typescript
it('translates the key, sync service response', /* … */);
it('translates the key, async service response', /* … */);
```

Let us start with the first case. The spec is straight-forward.

```typescript
it('translates the key, sync service response', () => {
  fixture.detectChanges();
  expectContent(fixture, 'Translation for key1');
});
```

Remember, the `TranslateService` fake returns an Observable created with `of`.

```typescript
return of(`Translation for ${key}`);
```

This Observable emits one value and completes immediately. This mimics the case in which the Service has already loaded the translations.

We merely need to call `detectChanges`. Angular calls the Pipe’s `transform` method, which calls `TranslateService`’s `get`. The Observable emits the translation right away and `transform` passes it through.

Finally, we use the [`expectContent` Component helper](https://github.com/molily/translate-pipe/blob/main/src/app/spec-helpers/element.spec-helper.ts) to test the DOM output.

<aside class="margin-note">Simulate delay</aside>

Testing the second case is trickier because the Observable needs to emit asynchronously. There are numerous ways to achieve this. We will use the [RxJS `delay` operator](https://rxjs.dev/api/operators/delay) for simplicity.

At the same time, we are writing an asynchronous spec. That is, Jasmine needs to wait for the Observable and the expectations before the spec is finished.

<aside class="margin-note" markdown="1">
  `fakeAsync` and `tick`
</aside>

Again, there are several ways how to accomplish this. We are going to use Angular’s `fakeAsync` and `tick` functions. We have introduced them when [testing a form with async validators](../testing-complex-forms/#successful-form-submission).

A quick recap: `fakeAsync` freezes time and prevents asynchronous tasks from being executed. The `tick` function then simulates the passage of time, executing the scheduled tasks.

`fakeAsync` wraps the function passed to `it`:

```typescript
it('translates the key, async service response', fakeAsync(() => {
  /* … */
});
```

Next, we need to change the `TranslateService`’s `get` method to make it asynchronous.

```typescript
it('translates the key, async service response', fakeAsync(() => {
  translateService.get = (key) =>
    of(`Async translation for ${key}`).pipe(delay(100));
  /* … */
});
```

<aside class="margin-note">Delay Observable</aside>

We still use `of`, but we delay the output by 100 milliseconds. The exact number does not matter as long as there is *some* delay greater or equal 1.

Now, we can call `detectChanges` for the first time.

```typescript
it('translates the key, async service response', fakeAsync(() => {
  translateService.get = (key) =>
    of(`Async translation for ${key}`).pipe(delay(100));
  fixture.detectChanges();
  /* … */
});
```

The Pipe’s `transform` method is called for the first time and returns `null` since the Observable does not emit a value immediately.

So we expect that the output is empty:

```typescript
it('translates the key, async service response', fakeAsync(() => {
  translateService.get = (key) =>
    of(`Async translation for ${key}`).pipe(delay(100));
  fixture.detectChanges();
  expectContent(fixture, '');
  /* … */
});
```

<aside class="margin-note">Let time pass</aside>

Here comes the interesting part. We want the Observable to emit a value now. We simulate the passage of 100 milliseconds with `tick(100)`.

```typescript
it('translates the key, async service response', fakeAsync(() => {
  translateService.get = (key) =>
    of(`Async translation for ${key}`).pipe(delay(100));
  fixture.detectChanges();
  expectContent(fixture, '');

  tick(100);
  /* … */
});
```

This causes the Observable to emit the translation and complete. The Pipe receives the translation and saves it.

To see a change in the DOM, we start a second change detection. The Pipe’s `transform` method is called for the second time and returns the correct translation.

```typescript
it('translates the key, async service response', fakeAsync(() => {
  translateService.get = (key) =>
    of(`Async translation for ${key}`).pipe(delay(100));
  fixture.detectChanges();
  expectContent(fixture, '');

  tick(100);
  fixture.detectChanges();
  expectContent(fixture, 'Async translation for key1');
}));
```

Testing these details may seem pedantic at first. But the logic in `TranslatePipe` exists for a reason.

There are two specs left to write:

```typescript
it('translates a changed key', /* … */);
it('updates on translation change', /* … */);
```

The `TranslatePipe` receives the translation asynchronously and stores both the key and the translation. When Angular calls `transform` with the *same key* again, the Pipe returns the translation synchronously. Since the Pipe is marked as *impure*, Angular does not cache the `transform` result.

<aside class="margin-note">Different key</aside>

When `translate` is called with a *different key*, the Pipe needs to fetch the new translation. We simulate this case by changing the `HostComponent`’s `key` property from `key1` to `key2`.

```typescript
it('translates a changed key', () => {
  fixture.detectChanges();
  fixture.componentInstance.key = key2;
  fixture.detectChanges();
  expectContent(fixture, 'Translation for key2');
});
```

After a change detection, the DOM contains the updated translation for `key2`.

<aside class="margin-note">Translation change</aside>

Last but no least, the Pipe needs to fetch a new translation from the `TranslateService` when the user changes the language and new translations have been loaded. For this purpose, the Pipe subscribes to the Service’s `onTranslationChange` emitter.

Our `TranslateService` fake supports `onTranslationChange` as well, hence we call the `emit` method to simulate a translation change. Before, we let the Service return a different translation in order to see a change in the DOM.

```typescript
it('updates on translation change', () => {
  fixture.detectChanges();
  translateService.get = (key) =>
    of(`New translation for ${key}`);
  translateService.onTranslationChange.emit({});
  fixture.detectChanges();
  expectContent(fixture, 'New translation for key1');
});
```

We made it! Writing these specs is challenging without doubt.

`TranslateService` and `TranslatePipe` are non-trivial examples with a proven API. The original classes from ngx-translate are more powerful. If you look for a robust and flexible solution, you should use the ngx-translate library directly.

<div class="book-sources" markdown="1">
- [TranslatePipe: test code](https://github.com/molily/translate-pipe/blob/main/src/app/translate.pipe.spec.ts)
- [Angular API reference: fakeAsync](https://angular.io/api/core/testing/fakeAsync)
- [Angular API reference: tick](https://angular.io/api/core/testing/tick)
- [RxJS: delay operator](https://rxjs.dev/api/operators/delay)
- [ngx-translate](https://github.com/ngx-translate/core)
</div>


<p id="next-chapter-link"><a href="../testing-directives/#testing-directives">Testing Directives</a></p>
