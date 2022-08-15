---
layout: chapter
title: Testing Components with Spectator
description: How to use the Spectator testing library for testing Angular Components
---

# Testing Components with Spectator

<aside class="learning-objectives" markdown="1">
Learning objectives

- Simplifying Component tests with the Spectator library
- Using the unified Spectator interface
- Interacting with the Component and the rendered DOM
- Dispatching synthetic DOM events to simulate user input
- Using Spectator and ng-mocks to fake child Components and Services
</aside>

We have used Angular’s testing tools to set up modules, render Components, query the DOM and more. These tools are `TestBed`, `ComponentFixture` and `DebugElement`, also `HttpClientTestingModule` and `RouterTestingModule`.

<aside class="margin-note">Structural weaknesses</aside>

The built-in tools are fairly low-level and unopinionated. They have several drawbacks:

- `TestBed` requires a large amount of boilerplate code to set up a common Component or Service test.
- `DebugElement` lacks essential features and is a “leaky” abstraction. You are forced to work with the wrapped native DOM element for common tasks.
- There are no default solutions for faking Components and Service dependencies safely.
- The tests itself get verbose and repetitive. You have to establish testing conventions and write helpers yourself.

We have already used small [element testing helpers](../testing-components/#testing-helpers). They solve isolated problems in order to write more consistent and compact specs.

If you write hundreds or thousands of specs, you will find that these helper functions do not suffice. They do not address the above-mentioned structural problems.

<aside class="margin-note">Unified testing API</aside>

**[Spectator](https://github.com/ngneat/spectator)** is an opinionated library for testing Angular applications. Technically, it sits on top of `TestBed`, `ComponentFixture` and `DebugElement`. But the main idea is to unify all these APIs in one consistent, powerful and user-friendly interface – the `Spectator` object.

Spectator simplifies testing Components, Services, Directives, Pipes, routing and HTTP communication. Spectator’s strength are Component tests with Inputs, Outputs, children, event handling, Service dependencies and more.

For [faking child Components](../testing-components-with-children/#faking-a-child-component-with-ng-mocks), Spectator resorts to the ng-mocks library just like we did.

This guide cannot introduce all Spectator features, but we will discuss the basics of Component testing using Spectator.

Both [example applications](../example-applications/#example-applications) are tested with our element helpers and also with Spectator. The former specs use the suffix `.spec.ts`, while the latter use the suffix `.spectator.spec.ts`. This way, you can compare the tests side-by-side.

In this chapter, we will discuss testing the Flickr search with Spectator.

## Component with an Input

Let us start with the [`FullPhotoComponent`](https://github.com/9elements/angular-flickr-search/tree/main/src/app/components/full-photo) because it is a [presentational Component](../testing-components-with-children/#testing-components-with-children), a leaf in the Component tree. It expects a `Photo` object as Input and renders an image as well as the photo metadata. No Outputs, no children, no Service dependencies.

The [`FullPhotoComponent` suite with our helpers](https://github.com/9elements/angular-flickr-search/blob/main/src/app/components/full-photo/full-photo.component.spec.ts) looks like this:

```typescript
describe('FullPhotoComponent', () => {
  let component: FullPhotoComponent;
  let fixture: ComponentFixture<FullPhotoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FullPhotoComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FullPhotoComponent);
    component = fixture.componentInstance;
    component.photo = photo1;
    fixture.detectChanges();
  });

  it('renders the photo information', () => {
    expectText(fixture, 'full-photo-title', photo1.title);

    const img = findEl(fixture, 'full-photo-image');
    expect(img.properties.src).toBe(photo1.url_m);
    expect(img.properties.alt).toBe(photo1.title);

    expectText(fixture, 'full-photo-ownername', photo1.ownername);
    expectText(fixture, 'full-photo-datetaken', photo1.datetaken);
    expectText(fixture, 'full-photo-tags', photo1.tags);

    const link = findEl(fixture, 'full-photo-link');
    expect(link.properties.href).toBe(photo1Link);
    expect(link.nativeElement.textContent.trim()).toBe(photo1Link);
  });
});
```

This suite already benefits from `expectText` and `findEl`, but it is still using the leaky `DebugElement` abstraction.

<aside class="margin-note">Component factory</aside>

When using Spectator, the Module configuration and the Component creation looks different. In the scope of the test suite, we create a **Component factory**:

```typescript
import { createComponentFactory } from '@ngneat/spectator';

describe('FullPhotoComponent with spectator', () => {
  /* … */

  const createComponent = createComponentFactory({
    component: FullPhotoComponent,
    shallow: true,
  });

  /* … */
});
```

`createComponentFactory` expects a configuration object. `component: FullPhotoComponent` specifies the Component under test. `shallow: true` means we want [shallow, not deep rendering](../testing-components-with-children/#shallow-vs-deep-rendering). It does not make a difference for `FullPhotoComponent` though since it has no children.

The configuration object may include more options for the testing Module, as we will see later.

Internally, `createComponentFactory` creates a `beforeEach` block that calls `TestBed.configureTestingModule` and `TestBed.compileComponents`, just like we did manually.

`createComponentFactory` returns a factory function for creating a `FullPhotoComponent`. We save that function in the `createComponent` constant.

<aside class="margin-note">Create Component</aside>

The next step is to add a `beforeEach` block that creates the Component instance. `createComponent` again takes an options object. To set the `photo` Input property, we pass `props: { photo: photo1 }`.

```typescript
import { createComponentFactory, Spectator } from '@ngneat/spectator';

describe('FullPhotoComponent with spectator', () => {
  let spectator: Spectator<FullPhotoComponent>;

  const createComponent = createComponentFactory({
    component: FullPhotoComponent,
    shallow: true,
  });

  beforeEach(() => {
    spectator = createComponent({ props: { photo: photo1 } });
  });

  /* … */
});
```

<aside class="margin-note">Spectator</aside>

`createComponent` returns a `Spectator` object. This is the powerful interface we are going to use in the specs.

The spec `it('renders the photo information', /* … */)` repeats three essential tasks several times:

1. Find an element by test id
2. Check its text content
3. Check its attribute value

First, the spec finds the element with the test id `full-photo-title` and expects it to contain the photo’s title.

With Spectator, it reads:

```typescript
expect(
  spectator.query(byTestId('full-photo-title'))
).toHaveText(photo1.title);
```

<aside class="margin-note" markdown="1">
  `spectator.query`
</aside>

The central `spectator.query` method finds an element in the DOM. This guide recommends to [find elements by test ids](../testing-components/#querying-the-dom-with-test-ids) (`data-testid` attributes).

Spectator supports test ids out of the box, so we write:

```typescript
spectator.query(byTestId('full-photo-title'))
```

`spectator.query` returns a native DOM element or `null` in case no match was found. Note that it does not return a `DebugElement`.

When using Spectator, you work directly with DOM element objects. What seems cumbersome at first glance, in fact lifts the burden of the leaky `DebugElement` abstraction.

<aside class="margin-note">Jasmine matchers</aside>

Spectator makes it easy to work with plain DOM elements. Several matchers are added to Jasmine to create expectations on an element.

For checking an element’s text content, Spectator provides the `toHaveText` matcher. This leads us to the following expectation:

```typescript
expect(
  spectator.query(byTestId('full-photo-title'))
).toHaveText(photo1.title);
```

This code is equivalent to our `expectText` helper, but more idiomatic and fluent to read.

Next, we need to verify that the Component renders the full photo using an `img` element.

```typescript
const img = spectator.query(byTestId('full-photo-image'));
expect(img).toHaveAttribute('src', photo1.url_m);
expect(img).toHaveAttribute('alt', photo1.title);
```

Here, we find the element with the test id `full-photo-image` to check its `src` and `alt` attributes. We use Spectator’s matcher `toHaveAttribute` for this purpose.

The rest of the spec finds more elements to inspect their contents and attributes.

The full test suite using Spectator (only imports from Spectator are shown):

```typescript
import {
  byTestId, createComponentFactory, Spectator
} from '@ngneat/spectator';

describe('FullPhotoComponent with spectator', () => {
  let spectator: Spectator<FullPhotoComponent>;

  const createComponent = createComponentFactory({
    component: FullPhotoComponent,
    shallow: true,
  });

  beforeEach(() => {
    spectator = createComponent({ props: { photo: photo1 } });
  });

  it('renders the photo information', () => {
    expect(
      spectator.query(byTestId('full-photo-title'))
    ).toHaveText(photo1.title);

    const img = spectator.query(byTestId('full-photo-image'));
    expect(img).toHaveAttribute('src', photo1.url_m);
    expect(img).toHaveAttribute('alt', photo1.title);

    expect(
      spectator.query(byTestId('full-photo-ownername'))
    ).toHaveText(photo1.ownername);
    expect(
      spectator.query(byTestId('full-photo-datetaken'))
    ).toHaveText(photo1.datetaken);
    expect(
      spectator.query(byTestId('full-photo-tags'))
    ).toHaveText(photo1.tags);

    const link = spectator.query(byTestId('full-photo-link'));
    expect(link).toHaveAttribute('href', photo1Link);
    expect(link).toHaveText(photo1Link);
  });
});
```

Compared to the version with custom testing helpers, the Spectator version is not necessarily shorter. But it works on a *consistent abstraction level*.

Instead of a wild mix of `TestBed`, `ComponentFixture`, `DebugElement` plus helper functions, there is the `createComponentFactory` function and one `Spectator` instance.

Spectator avoids wrapping DOM elements, but offers convenient Jasmine matchers for common DOM expectations.

<div class="book-sources" markdown="1">
- [FullPhotoComponent: implementation code and the two tests](https://github.com/9elements/angular-flickr-search/tree/main/src/app/components/full-photo)
- [Spectator: Queries](https://github.com/ngneat/spectator#queries)
- [Spectator: Custom matchers](https://github.com/ngneat/spectator#custom-matchers)
</div>

## Component with children and Service dependency

Spectator really shines when testing [container Components](../testing-components-with-children/#testing-components-with-children). These are Components with children and Service dependencies.

In the Flickr search, the topmost [`FlickrSearchComponent`](https://github.com/9elements/angular-flickr-search/tree/main/src/app/components/flickr-search) calls the `FlickrService` and holds the state. It orchestrates three other Components, passes down the state and listens for Outputs.

The `FlickrSearchComponent` template:

```html
<app-search-form (search)="handleSearch($event)"></app-search-form>

<div class="photo-list-and-full-photo">
  <app-photo-list
    [title]="searchTerm"
    [photos]="photos"
    (focusPhoto)="handleFocusPhoto($event)"
    class="photo-list"
  ></app-photo-list>

  <app-full-photo
    *ngIf="currentPhoto"
    [photo]="currentPhoto"
    class="full-photo"
    data-testid="full-photo"
  ></app-full-photo>
</div>
```

The `FlickrSearchComponent` class:

```typescript
@Component({
  selector: 'app-flickr-search',
  templateUrl: './flickr-search.component.html',
  styleUrls: ['./flickr-search.component.css'],
})
export class FlickrSearchComponent {
  public searchTerm = '';
  public photos: Photo[] = [];
  public currentPhoto: Photo | null = null;

  constructor(private flickrService: FlickrService) {}

  public handleSearch(searchTerm: string): void {
    this.flickrService.searchPublicPhotos(searchTerm).subscribe(
      (photos) => {
        this.searchTerm = searchTerm;
        this.photos = photos;
        this.currentPhoto = null;
      }
    );
  }

  public handleFocusPhoto(photo: Photo): void {
    this.currentPhoto = photo;
  }
}
```

<aside class="margin-note">Child Components</aside>

Since this is the Component where all things come together, there is much to test.

1. Initially, the `SearchFormComponent` and the `PhotoListComponent` are rendered, not the `FullPhotoComponent`. The photo list is empty.
2. When the `SearchFormComponent` emits the `search` Output, the `FlickrService` is called with the search term.
3. The search term and the photo list are passed down to the `PhotoListComponent` via Inputs.
4. When the `PhotoListComponent` emits the `focusPhoto` Output, the `FullPhotoComponent` is rendered. The selected photo is passed down via Input.

<aside class="margin-note">Without Spectator</aside>

The [`FlickrSearchComponent` test suite with our helpers](https://github.com/9elements/angular-flickr-search/blob/main/src/app/components/flickr-search/flickr-search.component.spec.ts) looks like this:

```typescript
describe('FlickrSearchComponent', () => {
  let fixture: ComponentFixture<FlickrSearchComponent>;
  let component: FlickrSearchComponent;
  let fakeFlickrService: Pick<FlickrService, keyof FlickrService>;

  let searchForm: DebugElement;
  let photoList: DebugElement;

  beforeEach(async () => {
    fakeFlickrService = {
      searchPublicPhotos: jasmine
        .createSpy('searchPublicPhotos')
        .and.returnValue(of(photos)),
    };

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [FlickrSearchComponent],
      providers: [
        { provide: FlickrService, useValue: fakeFlickrService }
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FlickrSearchComponent);
    component = fixture.debugElement.componentInstance;
    fixture.detectChanges();

    searchForm = findComponent(fixture, 'app-search-form');
    photoList = findComponent(fixture, 'app-photo-list');
  });

  it('renders the search form and the photo list, not the full photo', () => {
    expect(searchForm).toBeTruthy();
    expect(photoList).toBeTruthy();
    expect(photoList.properties.title).toBe('');
    expect(photoList.properties.photos).toEqual([]);

    expect(() => {
      findComponent(fixture, 'app-full-photo');
    }).toThrow();
  });

  it('searches and passes the resulting photos to the photo list', () => {
    const searchTerm = 'beautiful flowers';
    searchForm.triggerEventHandler('search', searchTerm);
    fixture.detectChanges();

    expect(fakeFlickrService.searchPublicPhotos).toHaveBeenCalledWith(searchTerm);
    expect(photoList.properties.title).toBe(searchTerm);
    expect(photoList.properties.photos).toBe(photos);
  });

  it('renders the full photo when a photo is focussed', () => {
    expect(() => {
      findComponent(fixture, 'app-full-photo');
    }).toThrow();

    photoList.triggerEventHandler('focusPhoto', photo1);

    fixture.detectChanges();

    const fullPhoto = findComponent(fixture, 'app-full-photo');
    expect(fullPhoto.properties.photo).toBe(photo1);
  });
});
```

Without going too much into detail, a few notes:

- We use [shallow rendering](../testing-components-with-children/#shallow-vs-deep-rendering). The child Components are not declared and only empty shell elements are rendered (`app-search-form`, `app-photo-list` and `app-full-photo`). This lets us check their presence, their Inputs and Outputs.
- We use our `findComponent` testing helper to find the child elements.
- To check the Input values, we use the `properties` of `DebugElement`s.
- To simulate that an Output emits, we use `triggerEventListener` on `DebugElement`s.
- We provide our own fake `FlickrService`. It contains one Jasmine spy that returns a Observable with a fixed list of photos.

  ```typescript
  fakeFlickrService = {
    searchPublicPhotos: jasmine
      .createSpy('searchPublicPhotos')
      .and.returnValue(of(photos)),
  };
  ```

<aside class="margin-note">With Spectator</aside>

Rewriting this suite with Spectator brings two major changes:

1. We replace the child Components with fakes created by [ng-mocks](../testing-components-with-children/#faking-a-child-component-with-ng-mocks). The fake Components mimic the originals regarding their Inputs and Outputs, but they do not render anything. We will work with these Component instances instead of operating on `DebugElement`s.
2. We use Spectator to create the fake `FlickrService`.

The test suite setup:

```typescript
import {
  createComponentFactory, mockProvider, Spectator
} from '@ngneat/spectator';

describe('FlickrSearchComponent with spectator', () => {
  /* … */

  const createComponent = createComponentFactory({
    component: FlickrSearchComponent,
    shallow: true,
    declarations: [
      MockComponents(
        SearchFormComponent, PhotoListComponent, FullPhotoComponent
      ),
    ],
    providers: [mockProvider(FlickrService)],
  });

  /* … */
});
```

Again, we use Spectator’s `createComponentFactory`. This time, we replace the child Components with fakes created by ng-mocks’ `MockComponents` function.

<aside class="margin-note" markdown="1">
  `mockProvider`
</aside>

Then we use Spectator’s `mockProvider` function to create a fake `FlickrService`. Under the hood, this works roughly the same as our manual `fakeFlickrService`. It creates an object that resembles the original, but the methods are replaced with Jasmine spies.

In a `beforeEach` block, the Component is created.

```typescript
import {
  createComponentFactory, mockProvider, Spectator
} from '@ngneat/spectator';

describe('FlickrSearchComponent with spectator', () => {
  let spectator: Spectator<FlickrSearchComponent>;

  let searchForm: SearchFormComponent | null;
  let photoList: PhotoListComponent | null;
  let fullPhoto: FullPhotoComponent | null;

  const createComponent = createComponentFactory(/* … */);

  beforeEach(() => {
    spectator = createComponent();

    spectator.inject(FlickrService).searchPublicPhotos.and.returnValue(of(photos));

    searchForm = spectator.query(SearchFormComponent);
    photoList = spectator.query(PhotoListComponent);
    fullPhoto = spectator.query(FullPhotoComponent);
  });

  /* … */
});
```

`spectator.inject` is the equivalent of `TestBed.inject`. We get hold of the `FlickrService` fake instance and configure the `searchPublicPhotos` spy to return fixed data.

<aside class="margin-note">Find children</aside>

`spectator.query` not only finds elements in the DOM, but also child Components and other nested Directives. We find the three child Components and save them in variables since they will be used in all specs.

Note that `searchForm`, `photoList` and `fullPhoto` are typed as Component instances, not `DebugElement`s. This is accurate because the fakes have the same public interfaces, the same Inputs and Output.

Due to the [equivalence of fake and original](../faking-dependencies/#equivalence-of-fake-and-original), we can access Inputs with the pattern `componentInstance.input`. And we let an Output emit with the pattern `componentInstance.output.emit(…)`.

The first spec checks the initial state:

```typescript
it('renders the search form and the photo list, not the full photo', () => {
  if (!(searchForm && photoList)) {
    throw new Error('searchForm or photoList not found');
  }
  expect(photoList.title).toBe('');
  expect(photoList.photos).toEqual([]);
  expect(fullPhoto).not.toExist();
});
```

`spectator.query(PhotoListComponent)` either returns the Component instance or `null` if there is no such nested Component. Hence, the `photoList` variable is typed as `PhotoListComponent | null`.

<aside class="margin-note">Manual type guard</aside>

Unfortunately, `expect` is not a [TypeScript type guard](https://www.typescriptlang.org/docs/handbook/advanced-types.html). Jasmine expectations cannot narrow down the type from `PhotoListComponent | null` to `PhotoListComponent`.

We cannot call `expect(photoList).not.toBe(null)` and continue with `expect(photoList.title).toBe('')`. The first expectation throws an error in the `null` case, but TypeScript does not know this. TypeScript still assumes the type `PhotoListComponent | null`, so it would complain about `photoList.title`.

This is why we manually throw an error when `photoList` is `null`. TypeScript infers that the type must be `PhotoListComponent` in the rest of the spec.

In contrast, our `findComponent` helper function throws an exception directly if no match was found, failing the test early. To verify that a child Component is absent, we had to expect this exception:

```typescript
expect(() => {
  findComponent(fixture, 'app-full-photo');
}).toThrow();`.
```

The Spectator spec goes on and uses `expect(fullPhoto).not.toExist()`, which is equivalent to `expect(fullPhoto).toBe(null)`. The Jasmine matcher `toExist` comes from Spectator.

<aside class="margin-note">Test search</aside>

The second spec covers the search:

```typescript
it('searches and passes the resulting photos to the photo list', () => {
  if (!(searchForm && photoList)) {
    throw new Error('searchForm or photoList not found');
  }
  const searchTerm = 'beautiful flowers';
  searchForm.search.emit(searchTerm);

  spectator.detectChanges();

  const flickrService = spectator.inject(FlickrService);
  expect(flickrService.searchPublicPhotos).toHaveBeenCalledWith(searchTerm);
  expect(photoList.title).toBe(searchTerm);
  expect(photoList.photos).toBe(photos);
});
```

When the `SearchFormComponent` emits a search term, we expect that the `FlickrService` has been called. In addition, we expect that the search term and the photo list from Service are passed to the `PhotoListComponent`.

`spectator.detectChanges()` is just Spectator’s shortcut to `fixture.detectChanges()`.

<aside class="margin-note">Test focus photo</aside>

The last spec focusses a photo:

```typescript
it('renders the full photo when a photo is focussed', () => {
  expect(fullPhoto).not.toExist();

  if (!photoList) {
    throw new Error('photoList not found');
  }
  photoList.focusPhoto.emit(photo1);

  spectator.detectChanges();

  fullPhoto = spectator.query(FullPhotoComponent);
  if (!fullPhoto) {
    throw new Error('fullPhoto not found');
  }
  expect(fullPhoto.photo).toBe(photo1);
});
```

Again, the main difference is that we directly work with Inputs and Outputs.

<div class="book-sources" markdown="1">
- [FlickrSearchComponent: implementation code and the two tests](https://github.com/9elements/angular-flickr-search/tree/main/src/app/components/flickr-search)
- [ng-mocks: How to mock a component](https://github.com/help-me-mom/ng-mocks#how-to-create-a-mock-component)
- [Spectator: Mocking providers](https://github.com/ngneat/spectator#mocking-providers)
</div>

## Event handling with Spectator

Most Components handle input events like mouse clicks, keypresses or form field changes. To simulate them, we have used the `triggerEventHandler` method on `DebugElement`s. This method does not actually simulate DOM events, it merely calls the event handlers registered by `(click)="handler($event)"` and the like.

`triggerEventHandler` requires you to create an event object that becomes `$event` in the template. For this reason, we have introduced the `click` and `makeClickEvent` helpers.

<aside class="margin-note">Synthetic events</aside>

Spectator takes a different approach: It dispatches synthetic DOM events. This makes the test more realistic. Synthetic events can bubble up in the DOM tree like real events. Spectator creates the event objects for you while you can configure the details.

<aside class="margin-note" markdown="1">
  `spectator.click`
</aside>

To perform a simple click, we use `spectator.click` and pass the target element or a `byTestId` selector. An example from the [PhotoItemComponent test](https://github.com/9elements/angular-flickr-search/blob/main/src/app/components/photo-item/photo-item.component.spectator.spec.ts):

```typescript
describe('PhotoItemComponent with spectator', () => {
  /* … */

  it('focusses a photo on click', () => {
    let photo: Photo | undefined;

    spectator.component.focusPhoto.subscribe((otherPhoto: Photo) => {
      photo = otherPhoto;
    });

    spectator.click(byTestId('photo-item-link'));

    expect(photo).toBe(photo1);
  });

  /* … */
});
```

Another common task is to simulate form field input. So far, we have used the [`setFieldValue` helper](../testing-components/#filling-out-forms) for this purpose.

<aside class="margin-note">
  <p><code>spectator.&#x200b;typeInElement</code></p>
</aside>

Spectator has an equivalent method named `spectator.typeInElement`. It is used by the [SearchFormComponent test](https://github.com/9elements/angular-flickr-search/blob/main/src/app/components/search-form/search-form.component.spectator.spec.ts):

```typescript
describe('SearchFormComponent with spectator', () => {
  /* … */

  it('starts a search', () => {
    let actualSearchTerm: string | undefined;

    spectator.component.search.subscribe((otherSearchTerm: string) => {
      actualSearchTerm = otherSearchTerm;
    });

    spectator.typeInElement(searchTerm, byTestId('search-term-input'));

    spectator.dispatchFakeEvent(byTestId('form'), 'submit');

    expect(actualSearchTerm).toBe(searchTerm);
  });
});
```

<aside class="margin-note" markdown="1">
  Dispatch `ngSubmit`
</aside>

The spec simulates typing the search term into the search field. Then it simulates an `ngSubmit` event at the `form` element. We use the generic method `spectator.dispatchFakeEvent` for this end.

Spectator offers many more convenient shortcuts for triggering events. The Flickr search Spectator tests just use the most common ones.

<div class="book-sources" markdown="1">
- [PhotoItemComponent: implementation code and the two tests](https://github.com/9elements/angular-flickr-search/tree/main/src/app/components/photo-item)
- [SearchFormComponent: implementation code and the two tests](https://github.com/9elements/angular-flickr-search/tree/main/src/app/components/search-form)
- [Spectator: Events API](https://github.com/ngneat/spectator#events-api)
</div>

## Spectator: Summary

Spectator is a mature library that addresses the practical needs of Angular developers. It offers solutions for common Angular testing problems. The examples above presented only a few of Spectator’s features.

Test code should be both concise and easy to understand. Spectator provides an expressive, high-level language for writing Angular tests. Spectator makes simple tasks simple without losing any power.

Spectator’s success underlines that the standard Angular testing tools are cumbersome and inconsistent. Alternative concepts are both necessary and beneficial.

Once you are familiar with the standard tools, you should try out alternatives like Spectator and ng-mocks. Then decide whether you stick with isolated testing helpers or switch to more comprehensive testing libraries.

<div class="book-sources" markdown="1">
- [Spectator project site](https://github.com/ngneat/spectator)
- [ng-mocks project site](https://github.com/help-me-mom/ng-mocks)
</div>

<p id="next-chapter-link"><a href="../testing-services/#testing-services">Testing Services</a></p>
